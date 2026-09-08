package vwg.cms.c4c.dto;

import java.time.Instant;

public record DocumentVersionResponse(
        Long id,
        Integer versionNumber,
        String changeSummary,
        String createdBy,
        String checksum,
        Instant createdAt,
        String content
) {
}
