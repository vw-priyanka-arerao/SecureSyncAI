package vwg.cms.c4c.service;

import java.util.List;
import org.springframework.stereotype.Component;
import vwg.cms.c4c.dto.ApprovalResponse;
import vwg.cms.c4c.dto.DocumentResponse;
import vwg.cms.c4c.dto.DocumentVersionResponse;
import vwg.cms.c4c.dto.NotificationResponse;
import vwg.cms.c4c.entity.Approval;
import vwg.cms.c4c.entity.Document;
import vwg.cms.c4c.entity.DocumentVersion;
import vwg.cms.c4c.entity.Notification;

@Component
public class DocumentMapper {

    public DocumentResponse toSummary(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getDocumentKey(),
                document.getTitle(),
                document.getCategory(),
                document.getOwnerUsername(),
                null,
                document.getStatus(),
                document.getCurrentVersion(),
                document.getAssignedReviewer(),
                document.getNextReviewAt(),
                document.getReviewCycleDays(),
                document.getLatestSummary(),
                document.getLatestValidationScore(),
                document.isDeleted(),
                document.getDeletedAt(),
                document.getDeletedBy(),
                document.getCreatedAt(),
                document.getUpdatedAt(),
                List.of(),
                List.of()
        );
    }

    public DocumentResponse toDetail(Document document, List<DocumentVersion> versions, List<Approval> approvals) {
        return new DocumentResponse(
                document.getId(),
                document.getDocumentKey(),
                document.getTitle(),
                document.getCategory(),
                document.getOwnerUsername(),
                approvals.stream()
                    .filter(approval -> approval.getAction() == vwg.cms.c4c.model.ApprovalAction.CREATED)
                    .map(Approval::getActorUsername)
                    .findFirst()
                    .orElse(null),
                document.getStatus(),
                document.getCurrentVersion(),
                document.getAssignedReviewer(),
                document.getNextReviewAt(),
                document.getReviewCycleDays(),
                document.getLatestSummary(),
                document.getLatestValidationScore(),
                document.isDeleted(),
                document.getDeletedAt(),
                document.getDeletedBy(),
                document.getCreatedAt(),
                document.getUpdatedAt(),
                versions.stream().map(this::toVersionResponse).toList(),
                approvals.stream().map(this::toApprovalResponse).toList()
        );
    }

    public DocumentVersionResponse toVersionResponse(DocumentVersion version) {
        return new DocumentVersionResponse(
                version.getId(),
                version.getVersionNumber(),
                version.getChangeSummary(),
                version.getCreatedBy(),
                version.getChecksum(),
                version.getCreatedAt(),
                version.getContent()
        );
    }

    public ApprovalResponse toApprovalResponse(Approval approval) {
        return new ApprovalResponse(
                approval.getId(),
                approval.getAction(),
                approval.getActorUsername(),
                approval.getRemarks(),
                approval.getCreatedAt()
        );
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isReadFlag(),
                notification.getRelatedDocumentId(),
                notification.getDueAt(),
                notification.getCreatedAt()
        );
    }
}

