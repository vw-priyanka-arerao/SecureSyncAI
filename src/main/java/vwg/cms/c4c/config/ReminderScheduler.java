package vwg.cms.c4c.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vwg.cms.c4c.service.NotificationService;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${app.notifications.reminder-scan-ms:900000}")
    public void runReminderSweep() {
        int sent = notificationService.sendOverdueReviewReminders();
        if (sent > 0) {
            log.info("Sent {} overdue review reminder(s)", sent);
        }
    }
}

