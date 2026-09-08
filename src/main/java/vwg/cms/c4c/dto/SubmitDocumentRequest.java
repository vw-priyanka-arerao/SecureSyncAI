package vwg.cms.c4c.dto;

import jakarta.validation.constraints.Size;

public record SubmitDocumentRequest(
        @Size(max = 80) String reviewerUsername,
        @Size(max = 1000) String remarks
) {
}

