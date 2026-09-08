package vwg.cms.c4c.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vwg.cms.c4c.entity.DistributionList;

public interface DistributionListRepository extends JpaRepository<DistributionList, Long> {
    Optional<DistributionList> findByEmailIgnoreCase(String email);
    boolean existsByNameIgnoreCase(String name);
}