package vwg.cms.c4c.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vwg.cms.c4c.dto.MarkNotificationReadRequest;
import vwg.cms.c4c.dto.NotificationResponse;
import vwg.cms.c4c.exception.ForbiddenOperationException;
import vwg.cms.c4c.service.AppUserService;
import vwg.cms.c4c.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AppUserService appUserService;

    @GetMapping
    public List<NotificationResponse> list(Authentication authentication) {
        return notificationService.listForUser(appUserService.resolveActorUsername(authentication));
    }

    @GetMapping("/overdue/count")
    public Map<String, Long> overdueCount(Authentication authentication) {
        String username = appUserService.resolveActorUsername(authentication);
        return Map.of("overdue", notificationService.overdueCount(username));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse markRead(
            @PathVariable Long id,
            @Valid @RequestBody MarkNotificationReadRequest request,
            Authentication authentication
    ) {
        return notificationService.markRead(id, request.read(), appUserService.resolveActorUsername(authentication));
    }

    @PostMapping("/reminders/run")
    public Map<String, Integer> runReminders(Authentication authentication) {
        String username = appUserService.resolveActorUsername(authentication);
        if (!appUserService.isAdmin(appUserService.getRequiredUser(username))) {
            throw new ForbiddenOperationException("Only admin users can trigger reminders");
        }
        return Map.of("sent", notificationService.sendOverdueReviewReminders());
    }
}

