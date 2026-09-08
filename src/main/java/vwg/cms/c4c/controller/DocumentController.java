package vwg.cms.c4c.controller;

import jakarta.validation.Valid;
import java.io.IOException;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.sax.BodyContentHandler;
import org.xml.sax.SAXException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vwg.cms.c4c.dto.AiAnalysisResponse;
import vwg.cms.c4c.dto.CreateDocumentRequest;
import vwg.cms.c4c.dto.CreateVersionRequest;
import vwg.cms.c4c.dto.DocumentResponse;
import vwg.cms.c4c.dto.ReviewDecisionRequest;
import vwg.cms.c4c.dto.StartReviewRequest;
import vwg.cms.c4c.dto.SubmitDocumentRequest;
import vwg.cms.c4c.exception.BadRequestException;
import vwg.cms.c4c.service.AppUserService;
import vwg.cms.c4c.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private static final Set<String> ALLOWED_TEXT_EXTENSIONS = Set.of(
            ".pdf", ".docx", ".xls", ".xlsx"
    );

    private final DocumentService documentService;
    private final AppUserService appUserService;

    @PostMapping
    public DocumentResponse createDocument(@Valid @RequestBody CreateDocumentRequest request, Authentication authentication) {
        return documentService.createDocument(request, appUserService.resolveActorUsername(authentication));
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public DocumentResponse uploadDocument(
            @RequestParam String title,
            @RequestParam String category,
            @RequestParam(required = false) String ownerUsername,
            @RequestParam(required = false) String reviewerUsername,
            @RequestParam(required = false) String changeSummary,
            @RequestParam(required = false) Integer reviewCycleDays,
            @RequestParam(required = false) Instant nextReviewAt,
            @RequestParam MultipartFile file,
            Authentication authentication
    ) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file must not be empty");
        }
        if (file.getSize() > 1024 * 1024) {
            throw new BadRequestException("Uploaded file exceeds the 1 MB MVP limit");
        }
        String filename = file.getOriginalFilename();
        String extension = filename == null || !filename.contains(".")
                ? ""
                : filename.substring(filename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        if (!ALLOWED_TEXT_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(
                    "Unsupported file type. Please upload a text file with one of these extensions: "
                            + String.join(", ", ALLOWED_TEXT_EXTENSIONS) + "."
            );
        }
        try {
            String content = extractContent(file).trim();
            if (content.isBlank()) {
                throw new BadRequestException("The uploaded file contains no readable text. Please choose a document with readable content.");
            }
            CreateDocumentRequest request = new CreateDocumentRequest(
                    title,
                    category,
                    ownerUsername,
                    reviewerUsername,
                    content,
                    changeSummary,
                    reviewCycleDays,
                    nextReviewAt
            );
            return documentService.createDocument(request, appUserService.resolveActorUsername(authentication));
        } catch (IOException | TikaException | SAXException exception) {
            throw new BadRequestException("Unable to extract readable content from the uploaded file. Please check the file and try again.");
        }
    }

    private String extractContent(MultipartFile file) throws IOException, TikaException, SAXException {
        BodyContentHandler handler = new BodyContentHandler(-1);
        new AutoDetectParser().parse(file.getInputStream(), handler, new Metadata());
        return handler.toString().replaceFirst("^\\uFEFF", "");
    }

    @GetMapping
    public List<DocumentResponse> listDocuments(
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            Authentication authentication
    ) {
        return documentService.listDocuments(appUserService.resolveActorUsername(authentication), includeDeleted);
    }

    @GetMapping("/{id}")
    public DocumentResponse getDocument(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            Authentication authentication
    ) {
        return documentService.getDocument(id, appUserService.resolveActorUsername(authentication), includeDeleted);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id, Authentication authentication) {
        documentService.deleteDocument(id, appUserService.resolveActorUsername(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<Void> archiveDocument(@PathVariable Long id, Authentication authentication) {
        documentService.deleteDocument(id, appUserService.resolveActorUsername(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public DocumentResponse restoreDocument(@PathVariable Long id, Authentication authentication) {
        return documentService.restoreDocument(id, appUserService.resolveActorUsername(authentication));
    }

    @PostMapping("/{id}/submit")
    public DocumentResponse submitDocument(
            @PathVariable Long id,
            @Valid @RequestBody SubmitDocumentRequest request,
            Authentication authentication
    ) {
        return documentService.submitDocument(id, request, appUserService.resolveActorUsername(authentication));
    }

    @PostMapping("/{id}/start-review")
    public DocumentResponse startReview(
            @PathVariable Long id,
            @Valid @RequestBody StartReviewRequest request,
            Authentication authentication
    ) {
        return documentService.startReview(id, request, appUserService.resolveActorUsername(authentication));
    }

    @PostMapping("/{id}/review")
    public DocumentResponse reviewDocument(
            @PathVariable Long id,
            @Valid @RequestBody ReviewDecisionRequest request,
            Authentication authentication
    ) {
        return documentService.reviewDocument(id, request, appUserService.resolveActorUsername(authentication));
    }

    @PostMapping("/{id}/versions")
    public DocumentResponse createVersion(
            @PathVariable Long id,
            @Valid @RequestBody CreateVersionRequest request,
            Authentication authentication
    ) {
        return documentService.createVersion(id, request, appUserService.resolveActorUsername(authentication));
    }

    @GetMapping("/{id}/ai-analysis")
    public AiAnalysisResponse analyzeDocument(@PathVariable Long id, Authentication authentication) {
        return documentService.analyzeDocument(id, appUserService.resolveActorUsername(authentication));
    }
}
