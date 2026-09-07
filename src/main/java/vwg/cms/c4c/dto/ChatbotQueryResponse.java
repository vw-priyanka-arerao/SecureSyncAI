package vwg.cms.c4c.dto;

import java.util.List;

public record ChatbotQueryResponse(
        String query,
        String answer,
        int totalMatches,
        List<ChatbotDocumentMatchResponse> matches
) {
}

