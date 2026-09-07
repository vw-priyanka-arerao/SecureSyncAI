package vwg.cms.c4c.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vwg.cms.c4c.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    List<AuditLog> findTop20ByOrderByCreatedAtDesc();
}

