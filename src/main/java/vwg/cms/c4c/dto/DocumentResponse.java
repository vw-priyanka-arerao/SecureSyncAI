package vwg.cms.c4c.dto;

import java.time.Instant;
import java.util.List;
import vwg.cms.c4c.model.DocumentStatus;

public record DocumentResponse(
        Long id,
        String documentKey,
        String title,
        String category,
        String ownerUsername,
        DocumentStatus status,
        Integer currentVersion,
        String assignedReviewer,
        Instant nextReviewAt,
        Integer reviewCycleDays,
        String latestSummary,
        Double latestValidationScore,
        boolean deleted,
        Instant deletedAt,
        String deletedBy,
        Instant createdAt,
        Instant updatedAt,
        List<DocumentVersionResponse> versions,
        List<ApprovalResponse> approvals
) {
}

