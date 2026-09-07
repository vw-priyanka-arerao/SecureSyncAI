package vwg.cms.c4c.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateVersionRequest(
        @NotBlank String content,
        @Size(max = 1000) String changeSummary
) {
}

