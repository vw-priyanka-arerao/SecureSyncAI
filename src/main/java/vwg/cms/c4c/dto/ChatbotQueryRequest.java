package vwg.cms.c4c.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ChatbotQueryRequest(
        @NotBlank(message = "Query must not be blank")
        String query,
        @Min(value = 1, message = "maxResults must be at least 1")
        @Max(value = 20, message = "maxResults must be at most 20")
        Integer maxResults
) {
}

