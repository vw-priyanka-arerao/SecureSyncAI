package vwg.cms.c4c.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vwg.cms.c4c.entity.Document;
import vwg.cms.c4c.model.DocumentStatus;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByOwnerUsernameOrderByUpdatedAtDesc(String ownerUsername);

    List<Document> findAllByOwnerUsernameAndDeletedFalseOrderByUpdatedAtDesc(String ownerUsername);

    List<Document> findAllByDeletedFalseOrderByUpdatedAtDesc();

    long countByStatus(DocumentStatus status);

    @Query("select d.category, count(d) from Document d where d.deleted = false group by d.category order by count(d) desc")
    List<Object[]> countByCategory();
}

