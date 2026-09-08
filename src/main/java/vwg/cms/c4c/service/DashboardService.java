package vwg.cms.c4c.service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vwg.cms.c4c.dto.DashboardResponse;
import vwg.cms.c4c.dto.DocumentResponse;
import vwg.cms.c4c.entity.AppUser;
import vwg.cms.c4c.model.DocumentStatus;
import vwg.cms.c4c.repository.DocumentRepository;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppUserService appUserService;
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String actorUsername) {
        AppUser actor = appUserService.getRequiredUser(actorUsername);
        List<DocumentResponse> visibleDocuments = documentService.listDocuments(actorUsername);
        Map<DocumentStatus, Long> counts = new EnumMap<>(DocumentStatus.class);
        for (DocumentStatus status : DocumentStatus.values()) {
            counts.put(status, 0L);
        }
        visibleDocuments.forEach(document -> counts.compute(document.status(), (key, value) -> value + 1));
        Map<String, Long> byCategory = appUserService.canViewAllDocuments(actor)
                ? documentRepository.countByCategory().stream().collect(java.util.stream.Collectors.toMap(
                        row -> String.valueOf(row[0]),
                        row -> ((Number) row[1]).longValue(),
                        (left, right) -> left,
                        java.util.LinkedHashMap::new
                ))
                : visibleDocuments.stream().collect(java.util.stream.Collectors.groupingBy(
                        DocumentResponse::category,
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.counting()
                ));
        return new DashboardResponse(
                visibleDocuments.size(),
                counts.get(DocumentStatus.DRAFT),
                counts.get(DocumentStatus.SUBMITTED),
                counts.get(DocumentStatus.UNDER_REVIEW),
                counts.get(DocumentStatus.APPROVED),
                counts.get(DocumentStatus.REJECTED),
                notificationService.unreadCount(actorUsername),
                notificationService.overdueCount(actorUsername),
                byCategory,
                visibleDocuments.stream().limit(5).toList(),
                documentService.recentApprovals()
        );
    }
}
