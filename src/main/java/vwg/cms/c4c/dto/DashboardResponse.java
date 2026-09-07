package vwg.cms.c4c.dto;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        long totalDocuments,
        long draftDocuments,
        long submittedDocuments,
        long underReviewDocuments,
        long approvedDocuments,
        long rejectedDocuments,
        long unreadNotifications,
        long overdueNotifications,
        Map<String, Long> documentsByCategory,
        List<DocumentResponse> recentDocuments,
        List<ApprovalResponse> recentApprovals
) {
}
