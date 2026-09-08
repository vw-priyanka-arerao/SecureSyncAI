package vwg.cms.c4c.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vwg.cms.c4c.dto.AuditLogResponse;
import vwg.cms.c4c.entity.AuditLog;
import vwg.cms.c4c.repository.AuditLogRepository;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String entityType, Long entityId, String action, String actorUsername, String details) {
        auditLogRepository.save(AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .actorUsername(actorUsername)
                .details(details)
                .build());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> listRecent() {
        return auditLogRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> listForEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId).stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getActorUsername(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}

