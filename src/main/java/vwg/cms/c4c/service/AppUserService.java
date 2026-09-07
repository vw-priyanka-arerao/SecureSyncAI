package vwg.cms.c4c.service;

import java.util.List;
import java.util.Comparator;
import java.util.Locale;
import java.util.Collection;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import vwg.cms.c4c.dto.UserProfileResponse;
import vwg.cms.c4c.entity.AppUser;
import vwg.cms.c4c.exception.ResourceNotFoundException;
import vwg.cms.c4c.model.Role;
import vwg.cms.c4c.repository.AppUserRepository;

@Service
@RequiredArgsConstructor
public class AppUserService implements UserDetailsService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = getRequiredUser(username);
        return new User(
                user.getUsername(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }

    public AppUser getRequiredUser(String username) {
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    public String resolveActorUsername(Authentication authentication) {
        String username = authentication.getName();
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            String email = jwtAuthenticationToken.getToken().getClaimAsString("email");
            String displayName = jwtAuthenticationToken.getToken().getClaimAsString("name");
            Role role = roleFromAuthorities(jwtAuthenticationToken.getAuthorities());
            provisionExternalUserIfMissing(username, email, displayName, role);
        } else {
            getRequiredUser(username);
        }
        return username;
    }

    private void provisionExternalUserIfMissing(String username, String email, String displayName, Role role) {
        if (appUserRepository.existsByUsername(username)) {
            return;
        }
        String normalizedEmail = (email == null || email.isBlank())
                ? username + "@external.local"
                : email;
        String normalizedDisplayName = (displayName == null || displayName.isBlank())
                ? username
                : displayName;
        appUserRepository.save(AppUser.builder()
                .username(username)
                .displayName(normalizedDisplayName)
                .email(buildUniqueEmail(normalizedEmail, username))
                .role(role)
                .password(passwordEncoder.encode("ExternalUser@" + username))
                .build());
    }

    private String buildUniqueEmail(String email, String username) {
        if (appUserRepository.findAll().stream().noneMatch(user -> user.getEmail().equalsIgnoreCase(email))) {
            return email;
        }
        return username + "+external@securesync.local";
    }

    private Role roleFromAuthorities(Collection<? extends GrantedAuthority> authorities) {
        List<String> values = authorities.stream().map(GrantedAuthority::getAuthority).toList();
        if (values.stream().anyMatch(value -> value.equals("ROLE_ADMIN") || value.equals("ROLE_ISMS_ADMIN"))) {
            return Role.ADMIN;
        }
        if (values.stream().anyMatch(value -> value.equals("ROLE_PD_HEAD") || value.equals("ROLE_PDHEAD") || value.equals("ROLE_ISMS_PD_HEAD"))) {
            return Role.PD_HEAD;
        }
        if (values.stream().anyMatch(value -> value.equals("ROLE_SDM") || value.equals("ROLE_ISMS_SDM"))) {
            return Role.SDM;
        }
        if (values.stream().anyMatch(value -> value.equals("ROLE_AUDITOR") || value.equals("ROLE_ISMS_AUDITOR"))) {
            return Role.AUDITOR;
        }
        return Role.EMPLOYEE;
    }

    public void ensureUserExists(String username) {
        if (username != null && !appUserRepository.existsByUsername(username)) {
            throw new ResourceNotFoundException("User not found: " + username);
        }
    }

    public boolean isAdmin(AppUser user) {
        return user.getRole() == Role.ADMIN;
    }

    public boolean isReviewer(AppUser user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.SDM || user.getRole() == Role.PD_HEAD;
    }

    public boolean canViewAllDocuments(AppUser user) {
        return user.getRole() != Role.EMPLOYEE;
    }

    public String findDefaultReviewerUsername() {
        return appUserRepository.findFirstByRole(Role.PD_HEAD)
                .or(() -> appUserRepository.findFirstByRole(Role.SDM))
                .or(() -> appUserRepository.findFirstByRole(Role.ADMIN))
                .map(AppUser::getUsername)
                .orElseThrow(() -> new ResourceNotFoundException("No reviewer user is configured"));
    }

    public UserProfileResponse toProfile(AppUser user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public List<UserProfileResponse> listUsers(boolean reviewersOnly) {
        return appUserRepository.findAll().stream()
                .filter(user -> !reviewersOnly || isReviewer(user))
                .sorted(Comparator.comparing(AppUser::getDisplayName))
                .map(this::toProfile)
                .toList();
    }

    public AppUser buildDemoUser(String username, String displayName, String email, Role role, String encodedPassword) {
        return AppUser.builder()
                .username(username)
                .displayName(displayName)
                .email(email)
                .role(role)
                .password(encodedPassword)
                .build();
    }
}

