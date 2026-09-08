package vwg.cms.c4c.dto;

import java.time.Instant;
import vwg.cms.c4c.model.NotificationType;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String message,
        boolean readFlag,
        Long relatedDocumentId,
        Instant dueAt,
        Instant createdAt
) {
}

