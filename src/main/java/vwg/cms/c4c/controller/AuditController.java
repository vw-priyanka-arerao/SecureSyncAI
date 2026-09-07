package vwg.cms.c4c.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.AuditLogResponse;
import vwg.cms.c4c.service.AuditService;
import vwg.cms.c4c.service.AppUserService;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final AppUserService appUserService;

    @GetMapping
    public List<AuditLogResponse> list(
            @RequestParam(required = false) Long documentId,
            Authentication authentication
    ) {
        appUserService.resolveActorUsername(authentication);
        return documentId == null
                ? auditService.listRecent()
                : auditService.listForEntity("DOCUMENT", documentId);
    }
}

