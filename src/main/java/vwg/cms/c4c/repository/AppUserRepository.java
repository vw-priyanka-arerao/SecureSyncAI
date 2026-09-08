package vwg.cms.c4c.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vwg.cms.c4c.entity.AppUser;
import vwg.cms.c4c.model.Role;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    Optional<AppUser> findFirstByRole(Role role);
}

