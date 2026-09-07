package vwg.cms.c4c.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vwg.cms.c4c.entity.DocumentVersion;

public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Long> {

    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(Long documentId);

    long countByDocumentId(Long documentId);

}

