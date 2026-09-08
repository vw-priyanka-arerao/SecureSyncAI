package vwg.cms.c4c;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import vwg.cms.c4c.entity.Notification;
import vwg.cms.c4c.model.NotificationType;
import vwg.cms.c4c.repository.NotificationRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

@SpringBootTest
@AutoConfigureMockMvc
class SecureSyncAiApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void shouldExecuteFullDocumentLifecycle() throws Exception {
        String createPayload = """
                {
                  "title": "Access Control Policy",
                  "category": "Policy",
                  "reviewerUsername": "sdm1",
                  "content": "This policy defines scope, owner, review, approval, control and compliance requirements for access authorization.",
                  "changeSummary": "Initial upload"
                }
                """;

        MvcResult createResult = mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        JsonNode createdDocument = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long documentId = createdDocument.get("id").asLong();

        mockMvc.perform(post("/api/documents/{id}/submit", documentId)
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerUsername\":\"sdm1\",\"remarks\":\"Ready for review\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        mockMvc.perform(post("/api/documents/{id}/start-review", documentId)
                        .with(httpBasic("sdm1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remarks\":\"Starting review\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));

        mockMvc.perform(post("/api/documents/{id}/review", documentId)
                        .with(httpBasic("sdm1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true,\"remarks\":\"Compliant and approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/documents/{id}/versions", documentId)
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Updated scope owner review approval control compliance policy with expanded authorization evidence.\",\"changeSummary\":\"Annual refresh\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.currentVersion").value(2));

        mockMvc.perform(get("/api/documents/{id}/ai-analysis", documentId)
                        .with(httpBasic("employee1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.validationScore").isNumber())
                .andExpect(jsonPath("$.generatedSummary").exists());

        mockMvc.perform(get("/api/dashboard")
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDocuments").value(greaterThanOrEqualTo(1)));

        MvcResult auditResult = mockMvc.perform(get("/api/audit-logs").param("documentId", String.valueOf(documentId))
                        .with(httpBasic("auditor1", "Password1!")))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode auditLogs = objectMapper.readTree(auditResult.getResponse().getContentAsString());
        assertThat(auditLogs).hasSizeGreaterThanOrEqualTo(4);

        mockMvc.perform(get("/api/notifications")
                        .with(httpBasic("employee1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].message").exists());
    }

    @Test
    void auditorCannotApproveDocuments() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Risk Register",
                                  "category": "Risk",
                                  "reviewerUsername": "sdm1",
                                  "content": "Risk mitigation scope owner review approval control statement."
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        long documentId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/documents/{id}/submit", documentId)
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerUsername\":\"sdm1\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/documents/{id}/review", documentId)
                        .with(httpBasic("auditor1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true,\"remarks\":\"Trying to approve\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldListReviewerUsersAndUploadTextDocument() throws Exception {
        MvcResult usersResult = mockMvc.perform(get("/api/users").param("reviewersOnly", "true")
                        .with(httpBasic("employee1", "Password1!")))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode users = objectMapper.readTree(usersResult.getResponse().getContentAsString());
        assertThat(users).hasSize(3);
        assertThat(StreamSupport.stream(users.spliterator(), false)
                .map(node -> node.get("username").asText())
                .toList())
                .containsExactlyInAnyOrder("sdm1", "pdhead1", "admin1");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "control-policy.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "Scope owner review approval control compliance evidence".getBytes()
        );

        mockMvc.perform(multipart("/api/documents/upload")
                        .file(file)
                        .param("title", "Control Policy Upload")
                        .param("category", "Policy")
                        .param("reviewerUsername", "pdhead1")
                        .param("changeSummary", "Uploaded from file")
                        .with(httpBasic("employee1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Control Policy Upload"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.versions[0].content").value("Scope owner review approval control compliance evidence"));
    }

    @Test
    void adminCanSoftDeleteAndRestoreDocument() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Deletion Candidate",
                                  "category": "Policy",
                                  "reviewerUsername": "sdm1",
                                  "content": "Scope owner review approval control baseline for deletion scenario."
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        long documentId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/documents/{id}/archive", documentId)
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .param("includeDeleted", "true")
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(true));

        mockMvc.perform(post("/api/documents/{id}/restore", documentId)
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(false));

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(false));
    }

    @Test
    void nonAdminCannotDeleteDocument() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Protected Doc",
                                  "category": "Policy",
                                  "reviewerUsername": "sdm1",
                                  "content": "Scope owner review approval control baseline for forbidden delete scenario."
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        long documentId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/documents/{id}/archive", documentId)
                        .with(httpBasic("employee1", "Password1!")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanTriggerOverdueReminderSweep() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Reminder Candidate",
                                  "category": "Policy",
                                  "reviewerUsername": "sdm1",
                                  "content": "Scope owner review approval control compliance reminder scenario."
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        long documentId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/documents/{id}/submit", documentId)
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerUsername\":\"sdm1\"}"))
                .andExpect(status().isOk());

        Notification reviewRequest = notificationRepository.findByUsernameOrderByCreatedAtDesc("sdm1").stream()
                .filter(notification -> notification.getType() == NotificationType.REVIEW_REQUEST)
                .findFirst()
                .orElseThrow();
        reviewRequest.setDueAt(Instant.now().minusSeconds(3600));
        notificationRepository.save(reviewRequest);

        mockMvc.perform(post("/api/notifications/reminders/run")
                        .with(httpBasic("admin1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sent").value(greaterThanOrEqualTo(1)));

        mockMvc.perform(get("/api/notifications")
                        .with(httpBasic("sdm1", "Password1!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("REMINDER"));
    }

    @Test
    void chatbotSearchRespectsRoleBasedVisibility() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Employee Access Matrix",
                                  "category": "Policy",
                                  "content": "Access matrix for employee systems scope owner review approval control.",
                                  "changeSummary": "Employee owned"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/documents")
                        .with(httpBasic("admin1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "SDM Privileged Baseline",
                                  "category": "Policy",
                                  "ownerUsername": "sdm1",
                                  "content": "Privileged baseline for SOC with keyword zeta-compliance-anchor.",
                                  "changeSummary": "Admin seeded"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/chatbot/query")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"access matrix\",\"maxResults\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMatches").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.matches[0].ownerUsername").value("employee1"));

        mockMvc.perform(post("/api/chatbot/query")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"zeta-compliance-anchor\",\"maxResults\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMatches").value(0));

        mockMvc.perform(post("/api/chatbot/query")
                        .with(httpBasic("admin1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"zeta-compliance-anchor\",\"maxResults\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMatches").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.matches[0].ownerUsername").value("sdm1"));
    }

    @Test
    void chatbotCanFindLatestPasswordPolicyAndDocumentsExpiringThisMonth() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Password Policy 2025",
                                  "category": "Policy",
                                  "content": "Password policy baseline with scope owner review approval control.",
                                  "reviewCycleDays": 30,
                                  "nextReviewAt": "2026-09-10T00:00:00Z"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/documents")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Password Policy 2026",
                                  "category": "Policy",
                                  "content": "Latest password policy standard with scope owner review approval control compliance.",
                                  "reviewCycleDays": 30,
                                  "nextReviewAt": "2026-09-18T00:00:00Z"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/chatbot/query")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Show me the latest Password Policy.\",\"maxResults\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matches[0].title").value("Password Policy 2026"));

        mockMvc.perform(post("/api/chatbot/query")
                        .with(httpBasic("employee1", "Password1!"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Which ISMS documents expire this month?\",\"maxResults\":10}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMatches").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.matches[0].nextReviewAt").exists());
    }
}
