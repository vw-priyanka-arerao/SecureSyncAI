package vwg.cms.c4c.dto;

import java.time.Instant;
import vwg.cms.c4c.model.ApprovalAction;

public record ApprovalResponse(
        Long id,
        ApprovalAction action,
        String actorUsername,
        String remarks,
        Instant createdAt
) {
}
