package vwg.cms.c4c.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vwg.cms.c4c.dto.AiAnalysisResponse;
import vwg.cms.c4c.dto.ApprovalResponse;
import vwg.cms.c4c.dto.CreateDocumentRequest;
import vwg.cms.c4c.dto.CreateVersionRequest;
import vwg.cms.c4c.dto.DocumentResponse;
import vwg.cms.c4c.dto.ReviewDecisionRequest;
import vwg.cms.c4c.dto.StartReviewRequest;
import vwg.cms.c4c.dto.SubmitDocumentRequest;
import vwg.cms.c4c.entity.AppUser;
import vwg.cms.c4c.entity.Approval;
import vwg.cms.c4c.entity.Document;
import vwg.cms.c4c.entity.DocumentVersion;
import vwg.cms.c4c.exception.ConflictException;
import vwg.cms.c4c.exception.ForbiddenOperationException;
import vwg.cms.c4c.exception.BadRequestException;
import vwg.cms.c4c.exception.ResourceNotFoundException;
import vwg.cms.c4c.model.ApprovalAction;
import vwg.cms.c4c.model.DocumentStatus;
import vwg.cms.c4c.model.NotificationType;
import vwg.cms.c4c.repository.ApprovalRepository;
import vwg.cms.c4c.repository.DocumentRepository;
import vwg.cms.c4c.repository.DocumentVersionRepository;
import vwg.cms.c4c.util.HashUtils;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final ApprovalRepository approvalRepository;
    private final AppUserService appUserService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final AiAssistService aiAssistService;
    private final DocumentMapper documentMapper;

    @Value("${app.notifications.review-reminder-hours:24}")
    private long reviewReminderHours;

    @Transactional
    public DocumentResponse createDocument(CreateDocumentRequest request, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        String ownerUsername = request.ownerUsername() == null || request.ownerUsername().isBlank()
                ? actorUsername
                : request.ownerUsername();
        appUserService.ensureUserExists(ownerUsername);
        if (!ownerUsername.equals(actorUsername) && !appUserService.isAdmin(actor)) {
            throw new ForbiddenOperationException("Only admins can create documents for other owners");
        }
        String reviewerUsername = normalizeReviewer(request.reviewerUsername());
        AiAnalysisResponse analysis = aiAssistService.analyze(null, request.title(), request.category(), request.content());
        int reviewCycleDays = normalizeReviewCycleDays(request.reviewCycleDays());
        Document document = Document.builder()
                .documentKey(UUID.randomUUID().toString())
                .title(request.title())
                .category(request.category())
                .ownerUsername(ownerUsername)
                .status(DocumentStatus.DRAFT)
                .currentVersion(1)
                .assignedReviewer(reviewerUsername)
                .reviewCycleDays(reviewCycleDays)
                .nextReviewAt(resolveNextReviewAt(request.nextReviewAt(), reviewCycleDays))
                .latestSummary(analysis.generatedSummary())
                .latestValidationScore(analysis.validationScore())
                .build();
        Document savedDocument = documentRepository.save(document);
        DocumentVersion version = DocumentVersion.builder()
                .document(savedDocument)
                .versionNumber(1)
                .content(request.content())
                .changeSummary(defaultSummary(request.changeSummary(), "Initial draft created"))
                .createdBy(actorUsername)
                .checksum(HashUtils.sha256(request.content()))
                .build();
        documentVersionRepository.save(version);
        createApproval(savedDocument, ApprovalAction.CREATED, actorUsername, request.changeSummary());
        auditService.log("DOCUMENT", savedDocument.getId(), "DOCUMENT_CREATED", actorUsername,
                "Created document '" + savedDocument.getTitle() + "' in DRAFT state");
        notificationService.notifyUser(ownerUsername, NotificationType.DOCUMENT_CREATED,
                "Document '" + savedDocument.getTitle() + "' was created in draft mode.", savedDocument.getId(), null);
        if (reviewerUsername != null) {
            notificationService.notifyUser(reviewerUsername, NotificationType.REVIEW_REQUEST,
                    "Document '" + savedDocument.getTitle() + "' is assigned to you for review.",
                    savedDocument.getId(), reviewDueAt());
        }
        return getDocument(savedDocument.getId(), actorUsername);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(String actorUsername) {
        return listDocuments(actorUsername, false);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(String actorUsername, boolean includeDeleted) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        List<Document> documents = appUserService.canViewAllDocuments(actor)
                ? (includeDeleted && appUserService.isAdmin(actor)
                    ? documentRepository.findAll().stream()
                    : documentRepository.findAllByDeletedFalseOrderByUpdatedAtDesc().stream())
                    .sorted(Comparator.comparing(Document::getUpdatedAt).reversed())
                    .toList()
                : (includeDeleted
                    ? documentRepository.findAllByOwnerUsernameOrderByUpdatedAtDesc(actorUsername)
                    : documentRepository.findAllByOwnerUsernameAndDeletedFalseOrderByUpdatedAtDesc(actorUsername));
        return documents.stream()
                .map(documentMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(Long id, String actorUsername) {
        return getDocument(id, actorUsername, false);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(Long id, String actorUsername, boolean includeDeleted) {
        Document document = getAccessibleDocument(id, actorUsername, includeDeleted);
        return documentMapper.toDetail(
                document,
                documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(id),
                approvalRepository.findByDocumentIdOrderByCreatedAtDesc(id)
        );
    }

    @Transactional
    public DocumentResponse submitDocument(Long id, SubmitDocumentRequest request, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        Document document = getRequiredActiveDocument(id);
        ensureOwnerOrAdmin(actor, document);
        if (!(document.getStatus() == DocumentStatus.DRAFT || document.getStatus() == DocumentStatus.REJECTED)) {
            throw new ConflictException("Only draft or rejected documents can be submitted");
        }
        String reviewerUsername = normalizeReviewer(request.reviewerUsername());
        if (reviewerUsername == null) {
            reviewerUsername = document.getAssignedReviewer() != null
                    ? document.getAssignedReviewer()
                    : appUserService.findDefaultReviewerUsername();
        }
        document.setAssignedReviewer(reviewerUsername);
        document.setStatus(DocumentStatus.SUBMITTED);
        createApproval(document, ApprovalAction.SUBMITTED, actorUsername, request.remarks());
        auditService.log("DOCUMENT", document.getId(), "DOCUMENT_SUBMITTED", actorUsername,
                "Submitted document to reviewer " + reviewerUsername);
        notificationService.notifyUser(reviewerUsername, NotificationType.REVIEW_REQUEST,
                "Document '" + document.getTitle() + "' has been submitted for your review.",
                document.getId(), reviewDueAt());
        notificationService.notifyUser(document.getOwnerUsername(), NotificationType.SYSTEM,
                "Document '" + document.getTitle() + "' was submitted for review.", document.getId(), null);
        return getDocument(id, actorUsername);
    }

    @Transactional
    public DocumentResponse startReview(Long id, StartReviewRequest request, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        ensureReviewer(actor);
        Document document = getRequiredActiveDocument(id);
        if (document.getStatus() != DocumentStatus.SUBMITTED) {
            throw new ConflictException("Only submitted documents can move to under review");
        }
        String reviewerUsername = normalizeReviewer(request.reviewerUsername());
        if (reviewerUsername == null) {
            reviewerUsername = actorUsername;
        }
        appUserService.ensureUserExists(reviewerUsername);
        document.setAssignedReviewer(reviewerUsername);
        document.setStatus(DocumentStatus.UNDER_REVIEW);
        createApproval(document, ApprovalAction.REVIEW_STARTED, actorUsername, request.remarks());
        auditService.log("DOCUMENT", document.getId(), "REVIEW_STARTED", actorUsername,
                "Review started by " + reviewerUsername);
        notificationService.notifyUser(document.getOwnerUsername(), NotificationType.SYSTEM,
                "Document '" + document.getTitle() + "' moved to UNDER_REVIEW.", document.getId(), null);
        return getDocument(id, actorUsername);
    }

    @Transactional
    public DocumentResponse reviewDocument(Long id, ReviewDecisionRequest request, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        ensureReviewer(actor);
        Document document = getRequiredActiveDocument(id);
        if (!(document.getStatus() == DocumentStatus.SUBMITTED || document.getStatus() == DocumentStatus.UNDER_REVIEW)) {
            throw new ConflictException("Only submitted or under review documents can be approved or rejected");
        }
        if (document.getAssignedReviewer() != null
                && !document.getAssignedReviewer().equals(actorUsername)
                && actor.getRole() != vwg.cms.c4c.model.Role.ADMIN
                && actor.getRole() != vwg.cms.c4c.model.Role.PD_HEAD) {
            throw new ForbiddenOperationException("Only the assigned reviewer, admin, or PD Head can close the review");
        }
        document.setStatus(Boolean.TRUE.equals(request.approved()) ? DocumentStatus.APPROVED : DocumentStatus.REJECTED);
        document.setAssignedReviewer(actorUsername);
        if (Boolean.TRUE.equals(request.approved())) {
            document.setNextReviewAt(Instant.now().plusSeconds(document.getReviewCycleDays().longValue() * 24L * 3600L));
        }
        ApprovalAction action = Boolean.TRUE.equals(request.approved()) ? ApprovalAction.APPROVED : ApprovalAction.REJECTED;
        createApproval(document, action, actorUsername, request.remarks());
        auditService.log("DOCUMENT", document.getId(), action.name(), actorUsername,
                "Document marked as " + document.getStatus());
        notificationService.notifyUser(document.getOwnerUsername(), NotificationType.APPROVAL_RESULT,
                "Document '" + document.getTitle() + "' was " + document.getStatus().name().toLowerCase() + ".",
                document.getId(), null);
        return getDocument(id, actorUsername);
    }

    @Transactional
    public DocumentResponse createVersion(Long id, CreateVersionRequest request, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        Document document = getRequiredActiveDocument(id);
        ensureOwnerOrAdmin(actor, document);
        List<DocumentVersion> existingVersions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(id);
        if (!existingVersions.isEmpty() && HashUtils.sha256(request.content()).equals(existingVersions.getFirst().getChecksum())) {
            throw new ConflictException("New version content matches the latest version");
        }
        int nextVersion = document.getCurrentVersion() + 1;
        AiAnalysisResponse analysis = aiAssistService.analyze(document, request.content());
        document.setCurrentVersion(nextVersion);
        document.setStatus(DocumentStatus.DRAFT);
        document.setAssignedReviewer(null);
        document.setLatestSummary(analysis.generatedSummary());
        document.setLatestValidationScore(analysis.validationScore());
        DocumentVersion version = DocumentVersion.builder()
                .document(document)
                .versionNumber(nextVersion)
                .content(request.content())
                .changeSummary(defaultSummary(request.changeSummary(), "Version " + nextVersion + " created"))
                .createdBy(actorUsername)
                .checksum(HashUtils.sha256(request.content()))
                .build();
        documentVersionRepository.save(version);
        createApproval(document, ApprovalAction.VERSION_CREATED, actorUsername, request.changeSummary());
        auditService.log("DOCUMENT", document.getId(), "VERSION_CREATED", actorUsername,
                "Created version " + nextVersion + " and reset workflow to DRAFT");
        notificationService.notifyUser(document.getOwnerUsername(), NotificationType.DOCUMENT_CREATED,
                "Document '" + document.getTitle() + "' now has version " + nextVersion + ".",
                document.getId(), null);
        return getDocument(id, actorUsername);
    }

    @Transactional(readOnly = true)
    public AiAnalysisResponse analyzeDocument(Long id, String actorUsername) {
        Document document = getAccessibleDocument(id, actorUsername, false);
        DocumentVersion latestVersion = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(id).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No version found for document " + id));
        return aiAssistService.analyze(document, latestVersion.getContent());
    }

    @Transactional
    public void deleteDocument(Long id, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        if (!appUserService.isAdmin(actor)) {
            throw new ForbiddenOperationException("Only admin users can delete documents");
        }
        Document document = getRequiredDocument(id);
        if (document.isDeleted()) {
            return;
        }
        String title = document.getTitle();
        document.setDeleted(true);
        document.setDeletedAt(Instant.now());
        document.setDeletedBy(actorUsername);
        auditService.log("DOCUMENT", id, "DOCUMENT_DELETED", actorUsername,
                "Soft deleted document '" + title + "'");
    }

    @Transactional
    public DocumentResponse restoreDocument(Long id, String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        if (!appUserService.isAdmin(actor)) {
            throw new ForbiddenOperationException("Only admin users can restore documents");
        }
        Document document = getRequiredDocument(id);
        document.setDeleted(false);
        document.setDeletedAt(null);
        document.setDeletedBy(null);
        auditService.log("DOCUMENT", id, "DOCUMENT_RESTORED", actorUsername,
                "Restored document '" + document.getTitle() + "'");
        return getDocument(id, actorUsername, true);
    }

    @Transactional(readOnly = true)
    public List<ApprovalResponse> recentApprovals() {
        return approvalRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(documentMapper::toApprovalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> recentDocumentsFor(String actorUsername, int limit) {
        return listDocuments(actorUsername).stream().limit(limit).toList();
    }

    private Document getAccessibleDocument(Long id, String actorUsername, boolean includeDeleted) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        Document document = getRequiredDocument(id);
        if (document.isDeleted() && !includeDeleted) {
            throw new ResourceNotFoundException("Document not found: " + id);
        }
        if (document.isDeleted() && includeDeleted && !appUserService.isAdmin(actor)) {
            throw new ForbiddenOperationException("Only admin users can access deleted documents");
        }
        if (!appUserService.canViewAllDocuments(actor) && !document.getOwnerUsername().equals(actorUsername)) {
            throw new ForbiddenOperationException("You are not allowed to access this document");
        }
        return document;
    }

    private Document getRequiredDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
    }

    private Document getRequiredActiveDocument(Long id) {
        Document document = getRequiredDocument(id);
        if (document.isDeleted()) {
            throw new ResourceNotFoundException("Document not found: " + id);
        }
        return document;
    }

    private void ensureOwnerOrAdmin(AppUser actor, Document document) {
        if (!document.getOwnerUsername().equals(actor.getUsername()) && !appUserService.isAdmin(actor)) {
            throw new ForbiddenOperationException("Only the document owner or an admin can do this");
        }
    }

    private void ensureReviewer(AppUser actor) {
        if (!appUserService.isReviewer(actor)) {
            throw new ForbiddenOperationException("Only SDM, PD Head, or Admin users can review documents");
        }
    }

    private String normalizeReviewer(String reviewerUsername) {
        if (reviewerUsername == null || reviewerUsername.isBlank()) {
            return null;
        }
        appUserService.ensureUserExists(reviewerUsername);
        return reviewerUsername;
    }

    private String defaultSummary(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private Instant reviewDueAt() {
        return Instant.now().plusSeconds(Math.max(1, reviewReminderHours) * 3600L);
    }

    private int normalizeReviewCycleDays(Integer reviewCycleDays) {
        if (reviewCycleDays == null) {
            return 365;
        }
        if (reviewCycleDays < 1) {
            throw new BadRequestException("Review cycle days must be positive");
        }
        return reviewCycleDays;
    }

    private Instant resolveNextReviewAt(Instant nextReviewAt, int reviewCycleDays) {
        if (nextReviewAt != null) {
            return nextReviewAt;
        }
        return Instant.now().plusSeconds(reviewCycleDays * 24L * 3600L);
    }

    private void createApproval(Document document, ApprovalAction action, String actorUsername, String remarks) {
        approvalRepository.save(Approval.builder()
                .document(document)
                .action(action)
                .actorUsername(actorUsername)
                .remarks(remarks)
                .build());
    }
}

