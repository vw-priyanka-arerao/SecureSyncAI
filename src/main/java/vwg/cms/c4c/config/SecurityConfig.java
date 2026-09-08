package vwg.cms.c4c.config;

import java.util.List;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Locale;
import java.util.Set;
import java.util.LinkedHashSet;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vwg.cms.c4c.service.AppUserService;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AppUserService appUserService;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Value("${app.security.oauth2.enabled:false}") boolean oauth2Enabled
    ) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated())
                .userDetailsService(appUserService)
                .httpBasic(Customizer.withDefaults());

        if (oauth2Enabled) {
            http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        }
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins
    ) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter scopesConverter = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setPrincipalClaimName(jwtPrincipalClaimName());
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<GrantedAuthority> authorities = new ArrayList<>(scopesConverter.convert(jwt));
            authorities.addAll(toRoleAuthorities(jwt.getClaimAsStringList("roles")));
            authorities.addAll(toRoleAuthorities(jwt.getClaimAsStringList("groups")));
            return authorities;
        });
        return converter;
    }

    @Value("${app.security.oauth2.principal-claim:preferred_username}")
    private String principalClaimName;

    @Value("${app.security.oauth2.role-mapping.employee:EMPLOYEE,ISMS_EMPLOYEE}")
    private List<String> employeeMappings;

    @Value("${app.security.oauth2.role-mapping.sdm:SDM,ISMS_SDM}")
    private List<String> sdmMappings;

    @Value("${app.security.oauth2.role-mapping.pd-head:PD_HEAD,PDHEAD,ISMS_PD_HEAD}")
    private List<String> pdHeadMappings;

    @Value("${app.security.oauth2.role-mapping.admin:ADMIN,ISMS_ADMIN}")
    private List<String> adminMappings;

    @Value("${app.security.oauth2.role-mapping.auditor:AUDITOR,ISMS_AUDITOR}")
    private List<String> auditorMappings;

    private String jwtPrincipalClaimName() {
        return principalClaimName;
    }

    private Collection<? extends GrantedAuthority> toRoleAuthorities(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        Set<String> normalizedValues = values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(this::normalize)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        List<GrantedAuthority> authorities = new ArrayList<>();
        appendIfMapped(authorities, normalizedValues, adminMappings, "ROLE_ADMIN");
        appendIfMapped(authorities, normalizedValues, pdHeadMappings, "ROLE_PD_HEAD");
        appendIfMapped(authorities, normalizedValues, sdmMappings, "ROLE_SDM");
        appendIfMapped(authorities, normalizedValues, auditorMappings, "ROLE_AUDITOR");
        appendIfMapped(authorities, normalizedValues, employeeMappings, "ROLE_EMPLOYEE");
        return authorities;
    }

    private void appendIfMapped(
            List<GrantedAuthority> authorities,
            Set<String> normalizedValues,
            List<String> mappings,
            String role
    ) {
        boolean mapped = mappings.stream()
                .map(this::normalize)
                .anyMatch(normalizedValues::contains);
        if (mapped) {
            authorities.add(new SimpleGrantedAuthority(role));
        }
    }

    private String normalize(String value) {
        return value.toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_')
                .trim();
    }
}

