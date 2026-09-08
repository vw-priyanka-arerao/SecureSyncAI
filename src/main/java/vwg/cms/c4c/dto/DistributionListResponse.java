package vwg.cms.c4c.dto;

import java.time.Instant;
import java.util.Set;

public record DistributionListResponse(Long id, String name, String email, Set<String> memberEmails, String createdBy, Instant createdAt) {
}