package vwg.cms.c4c.service;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vwg.cms.c4c.dto.ChatbotDocumentMatchResponse;
import vwg.cms.c4c.dto.ChatbotQueryRequest;
import vwg.cms.c4c.dto.ChatbotQueryResponse;
import vwg.cms.c4c.dto.DocumentResponse;
import vwg.cms.c4c.entity.DocumentVersion;
import vwg.cms.c4c.repository.DocumentVersionRepository;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final DocumentService documentService;
    private final DocumentVersionRepository documentVersionRepository;

    @Transactional(readOnly = true)
    public ChatbotQueryResponse search(String actorUsername, ChatbotQueryRequest request) {
        String query = request.query().trim();
        String normalizedQuery = query.toLowerCase(Locale.ROOT);
        int maxResults = request.maxResults() == null ? 5 : request.maxResults();
        QueryIntent intent = parseIntent(normalizedQuery);

        List<DocumentResponse> visibleDocuments = documentService.listDocuments(actorUsername, false);
        List<ScoredMatch> scoredMatches = new ArrayList<>();
        for (DocumentResponse document : visibleDocuments) {
            if (!matchesIntentScope(document, intent)) {
                continue;
            }
            String title = safe(document.title());
            String category = safe(document.category());
            String summary = safe(document.latestSummary());
            String content = latestContent(document.id());

            int score = scoreMatch(intent, title, category, summary, content, document);
            if (score <= 0) {
                continue;
            }
            String snippetSource = content.isBlank() ? summary : content;
            scoredMatches.add(new ScoredMatch(
                    document.id(),
                    document.title(),
                    document.category(),
                    document.ownerUsername(),
                    document.status(),
                    document.nextReviewAt(),
                    document.updatedAt(),
                    score,
                    buildSnippet(snippetSource, normalizedQuery)
            ));
        }

        List<ChatbotDocumentMatchResponse> matches = scoredMatches.stream()
                .sorted(Comparator.comparingInt(ScoredMatch::score).reversed()
                        .thenComparing(ScoredMatch::updatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(maxResults)
                .map(match -> new ChatbotDocumentMatchResponse(
                        match.id(),
                        match.title(),
                        match.category(),
                        match.ownerUsername(),
                        match.status(),
                        match.nextReviewAt(),
                        match.updatedAt(),
                        match.score(),
                        match.snippet()
                ))
                .toList();

        return new ChatbotQueryResponse(query, buildAnswer(actorUsername, intent, scoredMatches.size(), matches), scoredMatches.size(), matches);
    }

    private String buildAnswer(String actorUsername, QueryIntent intent, int totalMatches, List<ChatbotDocumentMatchResponse> matches) {
        if (matches.isEmpty()) {
            if (intent.expiringThisMonth()) {
                return "I could not find any documents expiring this month in your permitted scope.";
            }
            return "I could not find matching documents in your permitted scope. Try broader keywords like policy, risk, access, or control.";
        }
        ChatbotDocumentMatchResponse top = matches.getFirst();
        if (intent.expiringThisMonth()) {
            return "I found " + totalMatches + " document(s) in your permitted scope with a review/expiry date this month. Earliest match is '"
                    + top.title() + "' due on " + top.nextReviewAt() + ".";
        }
        if (intent.latestFirst()) {
            return "I found " + totalMatches + " matching document(s). The latest match is '"
                    + top.title() + "', updated on " + top.updatedAt() + ", and results remain role-filtered for " + actorUsername + ".";
        }
        return "I found " + totalMatches + " matching document(s) you are allowed to access. Top result is '"
                + top.title() + "' (" + top.status() + ") owned by " + top.ownerUsername()
                + ". Results are role-filtered for " + actorUsername + ".";
    }

    private int scoreMatch(QueryIntent intent, String title, String category, String summary, String content, DocumentResponse document) {
        String normalizedQuery = intent.normalizedQuery();
        int score = 0;
        score += containsBoost(title, normalizedQuery, 45);
        score += containsBoost(category, normalizedQuery, 25);
        score += containsBoost(summary, normalizedQuery, 20);
        score += containsBoost(content, normalizedQuery, 35);
        for (String token : intent.tokens()) {
            if (token.length() < 3) {
                continue;
            }
            score += containsBoost(title, token, 8);
            score += containsBoost(summary, token, 6);
            score += containsBoost(content, token, 6);
            score += containsBoost(category, token, 10);
        }
        if (intent.latestFirst()) {
            score += recencyBoost(document.updatedAt());
        }
        if (intent.expiringThisMonth() && document.nextReviewAt() != null) {
            score += 30;
        }
        return Math.min(score, 100);
    }

    private boolean matchesIntentScope(DocumentResponse document, QueryIntent intent) {
        if (!intent.expiringThisMonth()) {
            return true;
        }
        if (document.nextReviewAt() == null) {
            return false;
        }
        YearMonth month = YearMonth.now(ZoneOffset.UTC);
        YearMonth reviewMonth = YearMonth.from(document.nextReviewAt().atZone(ZoneOffset.UTC));
        return month.equals(reviewMonth);
    }

    private int containsBoost(String value, String token, int boost) {
        return value.toLowerCase(Locale.ROOT).contains(token) ? boost : 0;
    }

    private String latestContent(Long documentId) {
        List<DocumentVersion> versions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
        if (versions.isEmpty()) {
            return "";
        }
        return safe(versions.getFirst().getContent());
    }

    private String buildSnippet(String text, String normalizedQuery) {
        if (text.isBlank()) {
            return "No content snippet available.";
        }
        String compact = text.replaceAll("\\s+", " ").trim();
        String lower = compact.toLowerCase(Locale.ROOT);
        int index = lower.indexOf(normalizedQuery);
        if (index < 0) {
            for (String token : normalizedQuery.split("\\s+")) {
                index = lower.indexOf(token);
                if (index >= 0) {
                    break;
                }
            }
        }
        if (index < 0) {
            return compact.length() <= 180 ? compact : compact.substring(0, 177) + "...";
        }
        int start = Math.max(0, index - 50);
        int end = Math.min(compact.length(), index + 130);
        String snippet = compact.substring(start, end);
        if (start > 0) {
            snippet = "..." + snippet;
        }
        if (end < compact.length()) {
            snippet = snippet + "...";
        }
        return snippet;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private int recencyBoost(Instant updatedAt) {
        if (updatedAt == null) {
            return 0;
        }
        long ageDays = Math.max(0, (Instant.now().getEpochSecond() - updatedAt.getEpochSecond()) / (24L * 3600L));
        return (int) Math.max(0, 20 - ageDays);
    }

    private QueryIntent parseIntent(String normalizedQuery) {
        boolean latestFirst = normalizedQuery.contains("latest")
                || normalizedQuery.contains("newest")
                || normalizedQuery.contains("recent");
        boolean expiringThisMonth = (normalizedQuery.contains("expire") || normalizedQuery.contains("expiry") || normalizedQuery.contains("expiring")
                || normalizedQuery.contains("review due") || normalizedQuery.contains("due"))
                && normalizedQuery.contains("month");
        Set<String> stopWords = new HashSet<>(Arrays.asList(
                "show", "me", "the", "latest", "newest", "recent", "which", "isms", "documents", "document",
                "expire", "expiry", "expiring", "this", "month", "due", "review", "please", "find"
        ));
        List<String> tokens = Arrays.stream(normalizedQuery.replaceAll("[^a-z0-9\\s-]", " ").split("\\s+"))
                .filter(token -> !token.isBlank())
                .filter(token -> !stopWords.contains(token))
                .toList();
        return new QueryIntent(normalizedQuery, latestFirst, expiringThisMonth, tokens);
    }

    private record ScoredMatch(
            Long id,
            String title,
            String category,
            String ownerUsername,
            vwg.cms.c4c.model.DocumentStatus status,
            Instant nextReviewAt,
            Instant updatedAt,
            int score,
            String snippet
    ) {
    }

    private record QueryIntent(
            String normalizedQuery,
            boolean latestFirst,
            boolean expiringThisMonth,
            List<String> tokens
    ) {
    }
}

