package vwg.cms.c4c.service;

import java.time.Instant;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vwg.cms.c4c.dto.NotificationResponse;
import vwg.cms.c4c.entity.Notification;
import vwg.cms.c4c.exception.ForbiddenOperationException;
import vwg.cms.c4c.exception.ResourceNotFoundException;
import vwg.cms.c4c.model.NotificationType;
import vwg.cms.c4c.repository.NotificationRepository;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final DocumentMapper documentMapper;

    @Value("${app.notifications.reminder-resend-hours:24}")
    private long reminderResendHours;

    @Transactional
    public void notifyUser(String username, NotificationType type, String message, Long relatedDocumentId, Instant dueAt) {
        notificationRepository.save(Notification.builder()
                .username(username)
                .type(type)
                .message(message)
                .relatedDocumentId(relatedDocumentId)
                .dueAt(dueAt)
                .reminderCount(0)
                .readFlag(false)
                .build());
    }

    @Transactional
    public int sendOverdueReviewReminders() {
        Instant now = Instant.now();
        List<Notification> overdueReviewRequests = notificationRepository
                .findByTypeAndReadFlagFalseAndDueAtBeforeOrderByDueAtAsc(NotificationType.REVIEW_REQUEST, now);
        int sent = 0;
        for (Notification reviewRequest : overdueReviewRequests) {
            if (!isEligibleForReminder(reviewRequest, now)) {
                continue;
            }
            Duration overdueBy = Duration.between(reviewRequest.getDueAt(), now);
            String reminderMessage = "Reminder: " + reviewRequest.getMessage()
                    + " Overdue by " + Math.max(1, overdueBy.toHours()) + " hour(s).";
            notificationRepository.save(Notification.builder()
                    .username(reviewRequest.getUsername())
                    .type(NotificationType.REMINDER)
                    .message(reminderMessage)
                    .relatedDocumentId(reviewRequest.getRelatedDocumentId())
                    .dueAt(reviewRequest.getDueAt())
                    .reminderCount(0)
                    .readFlag(false)
                    .build());
            reviewRequest.setReminderCount(reviewRequest.getReminderCount() + 1);
            reviewRequest.setLastRemindedAt(now);
            notificationRepository.save(reviewRequest);
            sent++;
        }
        return sent;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(String username) {
        return notificationRepository.findByUsernameOrderByCreatedAtDesc(username).stream()
                .map(documentMapper::toNotificationResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId, boolean read, String username) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!notification.getUsername().equals(username)) {
            throw new ForbiddenOperationException("You can only update your own notifications");
        }
        notification.setReadFlag(read);
        return documentMapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public long unreadCount(String username) {
        return notificationRepository.countByUsernameAndReadFlagFalse(username);
    }

    @Transactional(readOnly = true)
    public long overdueCount(String username) {
        return notificationRepository.countByUsernameAndReadFlagFalseAndDueAtBefore(username, Instant.now());
    }

    private boolean isEligibleForReminder(Notification notification, Instant now) {
        if (notification.getDueAt() == null || !notification.getDueAt().isBefore(now)) {
            return false;
        }
        Instant threshold = now.minus(Duration.ofHours(Math.max(1, reminderResendHours)));
        return notification.getLastRemindedAt() == null || notification.getLastRemindedAt().isBefore(threshold);
    }
}

