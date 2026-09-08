package vwg.cms.c4c.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "distribution_lists")
@Getter
@Setter
@NoArgsConstructor
public class DistributionList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "distribution_list_members", joinColumns = @JoinColumn(name = "distribution_list_id"))
    @Column(name = "member_email", nullable = false, length = 120)
    private Set<String> memberEmails = new LinkedHashSet<>();

    @Column(nullable = false, length = 80)
    private String createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}