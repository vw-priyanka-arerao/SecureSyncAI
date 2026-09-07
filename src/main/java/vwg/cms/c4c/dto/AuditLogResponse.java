package vwg.cms.c4c.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        String entityType,
        Long entityId,
        String action,
        String actorUsername,
        String details,
        Instant createdAt
) {
}

