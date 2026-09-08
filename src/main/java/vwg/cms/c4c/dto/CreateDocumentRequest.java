package vwg.cms.c4c.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CreateDocumentRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 80) String category,
        @Size(max = 80) String ownerUsername,
        @Size(max = 80) String reviewerUsername,
        @NotBlank String content,
        @Size(max = 1000) String changeSummary,
        @Positive Integer reviewCycleDays,
        Instant nextReviewAt
) {
}

