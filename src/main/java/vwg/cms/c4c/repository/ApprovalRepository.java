package vwg.cms.c4c.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vwg.cms.c4c.entity.Approval;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    List<Approval> findByDocumentIdOrderByCreatedAtDesc(Long documentId);

    List<Approval> findTop10ByOrderByCreatedAtDesc();

}

