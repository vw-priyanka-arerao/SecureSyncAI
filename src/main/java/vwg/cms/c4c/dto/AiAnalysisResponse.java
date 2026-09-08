package vwg.cms.c4c.dto;

import java.util.List;
import java.util.Map;
import java.time.Instant;

public record AiAnalysisResponse(
        Long documentId,
        String title,
        String generatedSummary,
        double validationScore,
        double confidenceScore,
        String model,
        Instant analyzedAt,
        List<String> detectedKeywords,
        List<String> missingKeywords,
        Map<String, Double> complianceCoverage,
        List<String> recommendations
) {
}

