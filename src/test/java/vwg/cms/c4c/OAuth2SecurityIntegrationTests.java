package vwg.cms.c4c;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "app.security.oauth2.enabled=true",
        "spring.security.oauth2.resourceserver.jwt.issuer-uri=https://issuer.example.invalid",
        "app.security.oauth2.role-mapping.admin=ISMS_ADMIN",
        "app.security.oauth2.role-mapping.sdm=ISMS_SDM",
        "app.security.oauth2.role-mapping.pd-head=ISMS_PD_HEAD",
        "app.security.oauth2.role-mapping.auditor=ISMS_AUDITOR",
        "app.security.oauth2.role-mapping.employee=ISMS_EMPLOYEE"
})
@ActiveProfiles("test")
@AutoConfigureMockMvc
class OAuth2SecurityIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtDecoder jwtDecoder;

    @Test
    void shouldMapAdminRoleFromJwtAndProvisionProfile() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token-admin")
                .header("alg", "none")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(900))
                .subject("aad-admin-user")
                .claim("preferred_username", "aad.admin@securesync.local")
                .claim("email", "aad.admin@securesync.local")
                .claim("name", "AAD Admin")
                .claim("roles", List.of("ISMS_ADMIN"))
                .build();
        when(jwtDecoder.decode(anyString())).thenReturn(jwt);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer token-admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("aad.admin@securesync.local"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void shouldMapSdmRoleFromGroupClaim() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token-sdm")
                .header("alg", "none")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(900))
                .subject("aad-sdm-user")
                .claim("preferred_username", "aad.sdm@securesync.local")
                .claim("email", "aad.sdm@securesync.local")
                .claim("name", "AAD SDM")
                .claim("groups", List.of("ISMS_SDM"))
                .build();
        when(jwtDecoder.decode(anyString())).thenReturn(jwt);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer token-sdm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("aad.sdm@securesync.local"))
                .andExpect(jsonPath("$.role").value("SDM"));
    }
}

