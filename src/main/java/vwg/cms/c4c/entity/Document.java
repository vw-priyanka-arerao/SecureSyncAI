package vwg.cms.c4c.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vwg.cms.c4c.model.DocumentStatus;

@Entity
@Table(name = "documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String documentKey;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 80)
    private String ownerUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DocumentStatus status;

    @Column(nullable = false)
    private Integer currentVersion;

    @Column(length = 80)
    private String assignedReviewer;

    private Instant nextReviewAt;

    @Column(nullable = false)
    private Integer reviewCycleDays;

    @Column(length = 2000)
    private String latestSummary;

    private Double latestValidationScore;

    @Column(nullable = false)
    private boolean deleted;

    private Instant deletedAt;

    @Column(length = 80)
    private String deletedBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        deleted = false;
        if (reviewCycleDays == null || reviewCycleDays < 1) {
            reviewCycleDays = 365;
        }
        if (nextReviewAt == null) {
            nextReviewAt = now.plusSeconds(reviewCycleDays.longValue() * 24L * 3600L);
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}

