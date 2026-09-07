package vwg.cms.c4c.dto;

import java.time.Instant;
import vwg.cms.c4c.model.DocumentStatus;

public record ChatbotDocumentMatchResponse(
        Long id,
        String title,
        String category,
        String ownerUsername,
        DocumentStatus status,
        Instant nextReviewAt,
        Instant updatedAt,
        int relevanceScore,
        String snippet
) {
}

