package vwg.cms.c4c.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import vwg.cms.c4c.dto.AiAnalysisResponse;
import vwg.cms.c4c.entity.Document;

@Service
public class AiAssistService {

    public AiAnalysisResponse analyze(Long documentId, String title, String category, String content) {
        String normalizedContent = content == null ? "" : content;
        String normalizedLower = normalizedContent.toLowerCase(Locale.ROOT);
        String summary = summarize(normalizedContent);
        List<String> expectedKeywords = expectedKeywords(category);
        List<String> detectedKeywords = expectedKeywords.stream()
                .filter(keyword -> normalizedLower.contains(keyword.toLowerCase(Locale.ROOT)))
                .toList();
        List<String> missingKeywords = expectedKeywords.stream()
                .filter(keyword -> !normalizedLower.contains(keyword.toLowerCase(Locale.ROOT)))
                .toList();
        double coverageRatio = expectedKeywords.isEmpty() ? 0 : (double) detectedKeywords.size() / expectedKeywords.size();
        double validationScore = Math.max(45.0, Math.min(100.0, 60.0 + (coverageRatio * 40.0)));
        Map<String, Double> complianceCoverage = buildComplianceCoverage(normalizedLower);
        double confidence = calculateConfidence(normalizedContent, detectedKeywords.size(), expectedKeywords.size());
        List<String> recommendations = buildRecommendations(missingKeywords, complianceCoverage, normalizedContent);
        return new AiAnalysisResponse(
                documentId,
                title,
                summary,
                validationScore,
                confidence,
                "heuristic-v2",
                Instant.now(),
                detectedKeywords,
                missingKeywords,
                complianceCoverage,
                recommendations
        );
    }

    public AiAnalysisResponse analyze(Document document, String content) {
        return analyze(document.getId(), document.getTitle(), document.getCategory(), content);
    }

    private String summarize(String content) {
        String normalized = content.replaceAll("\\s+", " ").trim();
        if (normalized.isBlank()) {
            return "No content available for analysis.";
        }
        String[] sentences = normalized.split("(?<=[.!?])\\s+");
        if (sentences.length == 1 && normalized.length() <= 260) {
            return normalized;
        }
        StringBuilder summary = new StringBuilder();
        for (String sentence : sentences) {
            if (summary.length() > 0) {
                summary.append(' ');
            }
            summary.append(sentence);
            if (summary.length() >= 260 || summary.chars().filter(ch -> ch == '.').count() >= 2) {
                break;
            }
        }
        String compact = summary.toString().trim();
        if (compact.length() <= 260) {
            return compact;
        }
        return compact.substring(0, 257) + "...";
    }

    private List<String> expectedKeywords(String category) {
        Set<String> keywords = new LinkedHashSet<>(List.of("scope", "owner", "review", "approval", "control"));
        String normalizedCategory = category == null ? "" : category.toLowerCase(Locale.ROOT);
        if (normalizedCategory.contains("policy")) {
            keywords.add("policy");
            keywords.add("compliance");
        }
        if (normalizedCategory.contains("risk")) {
            keywords.add("risk");
            keywords.add("mitigation");
        }
        if (normalizedCategory.contains("access")) {
            keywords.add("access");
            keywords.add("authorization");
        }
        return List.copyOf(keywords);
    }

    private Map<String, Double> buildComplianceCoverage(String content) {
        Map<String, List<String>> frameworks = new LinkedHashMap<>();
        frameworks.put("ISO27001-Document-Control", List.of("owner", "review", "approval", "version", "control"));
        frameworks.put("NIST-CSF-Govern", List.of("policy", "scope", "risk", "compliance", "audit"));
        frameworks.put("SOC2-Change-Management", List.of("change", "evidence", "authorization", "review", "control"));
        return frameworks.entrySet().stream().collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> {
                    long matched = entry.getValue().stream().filter(content::contains).count();
                    return Math.round(((double) matched / entry.getValue().size()) * 1000.0) / 10.0;
                },
                (left, right) -> left,
                LinkedHashMap::new
        ));
    }

    private double calculateConfidence(String content, int detectedCount, int expectedCount) {
        double lengthFactor = Math.min(1.0, content.length() / 1200.0);
        double keywordFactor = expectedCount == 0 ? 0 : (double) detectedCount / expectedCount;
        return Math.round((50.0 + (lengthFactor * 20.0) + (keywordFactor * 30.0)) * 10.0) / 10.0;
    }

    private List<String> buildRecommendations(List<String> missingKeywords, Map<String, Double> coverage, String content) {
        List<String> recommendations = new ArrayList<>();
        if (missingKeywords.isEmpty()) {
            recommendations.add("Baseline control keywords are present for this category.");
        } else {
            recommendations.add("Add missing control keywords: " + String.join(", ", missingKeywords));
        }
        coverage.forEach((framework, score) -> {
            if (score < 70.0) {
                recommendations.add("Strengthen " + framework + " coverage with explicit control statements and evidence references.");
            }
        });
        if (!content.toLowerCase(Locale.ROOT).contains("review cycle")) {
            recommendations.add("Document a review cycle (for example quarterly or annually) to improve audit readiness.");
        }
        recommendations.add("Use enterprise LLM validation (Azure OpenAI/private model) for deeper policy semantics in Phase 2.");
        return recommendations;
    }
}
