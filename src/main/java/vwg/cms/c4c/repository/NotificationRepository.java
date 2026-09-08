package vwg.cms.c4c.repository;

import java.util.List;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import vwg.cms.c4c.entity.Notification;
import vwg.cms.c4c.model.NotificationType;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUsernameOrderByCreatedAtDesc(String username);

    List<Notification> findByTypeAndReadFlagFalseAndDueAtBeforeOrderByDueAtAsc(NotificationType type, Instant dueAt);

    long countByUsernameAndReadFlagFalseAndDueAtBefore(String username, Instant dueAt);

    long countByUsernameAndReadFlagFalse(String username);

}

