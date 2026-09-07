# SecureSync AI – ISMS SmartFlow MVP

SecureSync AI is a runnable full-stack MVP for centralized ISMS document management. It combines controlled document workflows, auditability, reminder tracking, and AI-assisted search in one role-aware application.

## Highlights

- Spring Boot backend with Java 21
- React + Material UI frontend in `frontend/`
- Role-based access with demo Basic Auth users
- Optional Azure AD-compatible OAuth2 JWT support
- ISMS workflow: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED/REJECTED`
- Version history, checksum tracking, and audit logs
- Notification inbox with overdue review reminder sweeps
- Admin archive/restore for soft-deleted documents
- Review-cycle and next-review metadata for expiry tracking
- Floating `Ask AI` assistant launcher for role-aware document search
- Swagger UI, H2 demo database support, PostgreSQL profile, and Docker Compose

## Feature matrix

| Area | Included in MVP | Notes |
| --- | --- | --- |
| Authentication | Yes | HTTP Basic for demo users, optional OAuth2 JWT bearer mode |
| Role-based access | Yes | `EMPLOYEE`, `SDM`, `PD_HEAD`, `ADMIN`, `AUDITOR` |
| Document creation | Yes | JSON entry and text-file upload |
| Workflow approvals | Yes | Submit, start review, approve, reject |
| Versioning | Yes | Change summary and checksum tracking |
| AI analysis | Yes | Heuristic compliance-assist endpoint |
| AI search assistant | Yes | Floating `Ask AI` launcher on dashboard |
| Notifications | Yes | Read/unread state and reminder sweeps |
| Audit logs | Yes | Filterable evidence trail by document |
| Soft delete / restore | Yes | Admin archive and restore flow |
| PostgreSQL runtime profile | Yes | Via Spring profile and environment variables |
| Docker Compose | Yes | Backend + frontend local container run |

## Architecture overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                      │
│  Dashboard • Documents • Notifications • Audit • Ask AI   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / JSON / Multipart
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Spring Boot REST API                    │
│ Auth • Documents • Dashboard • Notifications • Audit • AI │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
      │  Services   │  │  Security   │  │  Scheduler   │
      │ Workflow AI │  │ Basic/OAuth │  │ Reminders    │
      └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
             │                │                │
             └──────────┬─────┴────────────────┘
                        ▼
               ┌──────────────────┐
               │ JPA + Flyway DB  │
               │  H2 / PostgreSQL │
               └──────────────────┘
```

### Main backend building blocks

- Controllers:
  - `AuthController`
  - `UserController`
  - `DocumentController`
  - `DashboardController`
  - `NotificationController`
  - `AuditController`
  - `ChatbotController`
- Core services:
  - document workflow and versioning
  - AI analysis and role-aware document search
  - dashboard aggregation
  - notifications and review reminders
  - audit logging
  - application user lookup and role handling
- Data layer:
  - Spring Data JPA repositories
  - Flyway-managed schema migrations
  - H2 for demos and PostgreSQL for deployment

## Current feature set

### Authentication and access control

- HTTP Basic login for seeded demo users
- Bearer token mode for Azure AD-style JWT access tokens
- Frontend login toggle between:
  - `Basic (Demo)`
  - `Bearer Token`
- Role-aware document access for:
  - `EMPLOYEE`
  - `SDM`
  - `PD_HEAD`
  - `ADMIN`
  - `AUDITOR`

### Dashboard

- Live summary cards for:
  - total documents
  - draft documents
  - submitted documents
  - under-review documents
  - approved documents
  - unread alerts
  - overdue reminders
- Documents-by-category breakdown
- Recent documents feed
- Recent approval activity feed
- Floating bottom-right `Ask AI` launcher with modern assistant-style UI

### Ask AI assistant

- Compact floating launcher instead of a large inline chatbot section
- Robot icon branding is consistently shown before `Ask AI` labels in the launcher panel and trigger
- Role-aware document search after login
- Smart prompt examples such as:
  - `Show me the latest Password Policy.`
  - `Which ISMS documents expire this month?`
- Expiry-style questions are interpreted using `nextReviewAt`
- Result list includes:
  - title
  - owner
  - relevance score
  - updated date
  - next review date
  - snippet preview
- Clicking a result opens the related document details

### Document management

- Create documents using JSON content entry
- Create documents from uploaded text files
- Supported upload types include:
  - `.txt`
  - `.md`
  - `.csv`
  - `.json`
  - `.xml`
  - `.yaml`
  - `.yml`
  - `.log`
- Optional owner assignment for admins
- Reviewer selection from the user directory
- Review cycle in days
- Optional next review date
- Document detail drawer for workflow actions and inspection

### Workflow and compliance tracking

- Submission flow from author to reviewer
- Review start action for approvers
- Approve or reject with remarks
- Version creation with change summaries
- Heuristic AI analysis endpoint with:
  - confidence
  - detected controls
  - compliance coverage indicators

### Notifications and reminders

- Notification inbox for reminders and workflow updates
- Read/unread toggling
- Overdue highlighting in the UI
- Manual reminder sweep action in the frontend
- Scheduled overdue reminder processing in the backend

### Audit and admin features

- Audit trail view with optional document ID filtering
- Document archive via soft delete
- Admin restore for archived documents
- Optional archived document visibility toggle for admins

## Demo users

All demo users use the same password:

- Password: `Password1!`

Users:

- `employee1` – Employee
- `sdm1` – SDM
- `pdhead1` – PD Head
- `admin1` – Admin
- `auditor1` – Auditor

## Tech stack

### Backend

- Spring Boot `3.5.16`
- Spring Web
- Spring Data JPA
- Spring Security
- Spring OAuth2 Resource Server
- Spring Validation
- Spring Actuator
- Flyway
- H2
- PostgreSQL driver
- SpringDoc OpenAPI

### Frontend

- React `18`
- Vite
- Material UI `6`
- MUI Icons

## Project structure

- Backend application: repository root
- Frontend application: `frontend/`
- Flyway migrations: `src/main/resources/db/migration/`
- OAuth2 profile config: `src/main/resources/application-oauth2.yml`
- Main application config: `src/main/resources/application.yml`

## Prerequisites

- Java `21`
- Maven
- Node.js and npm
- Optional: Docker / Docker Compose

## Run locally

### 1) Start the backend

```bash
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI'
mvn spring-boot:run
```

### 2) Start the backend in OAuth2 JWT mode (optional)

```bash
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI'
export OAUTH2_ISSUER_URI='https://login.microsoftonline.com/<tenant-id>/v2.0'
export OAUTH2_PRINCIPAL_CLAIM='preferred_username'
export OAUTH2_ROLE_ADMIN='ISMS_ADMIN,ADMIN'
export OAUTH2_ROLE_PD_HEAD='ISMS_PD_HEAD,PD_HEAD'
export OAUTH2_ROLE_SDM='ISMS_SDM,SDM'
export OAUTH2_ROLE_AUDITOR='ISMS_AUDITOR,AUDITOR'
export OAUTH2_ROLE_EMPLOYEE='ISMS_EMPLOYEE,EMPLOYEE'
mvn spring-boot:run -Dspring-boot.run.profiles=oauth2
```

In OAuth2 mode, Basic Auth remains available for local/demo use, while JWT bearer tokens are accepted in parallel.

### 3) Start the frontend

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI/frontend'
npm install
npm run dev
```

If needed, the frontend uses `VITE_API_BASE_URL` and defaults to `http://localhost:8080`.

## Application URLs

- Frontend: `http://localhost:5173`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- H2 Console: `http://localhost:8080/h2-console`
- Health: `http://localhost:8080/actuator/health`

## Screenshots

Add your latest UI images here when ready.

- [Login](docs/screenshots/login.png)
- [Dashboard](docs/screenshots/dashboard.png)
- [Documents](docs/screenshots/documents.png)
- [Ask AI assistant](docs/screenshots/ask-ai.png)
- [Notifications](docs/screenshots/notifications.png)
- [Audit trail](docs/screenshots/audit.png)

## Typical user flow

1. Sign in using `Basic (Demo)` or `Bearer Token`
2. Open the `Documents` page and create a new ISMS document
3. Optionally upload a supported text file instead of manual content entry
4. Assign a reviewer or allow auto-assignment
5. Set review cycle / next review date if required
6. Submit the document for review
7. Reviewer starts review and approves or rejects the document
8. Review history, reminders, and audit evidence in the related pages
9. Use the floating `Ask AI` launcher on the dashboard to search role-visible documents

## Example API flow

```bash
curl -u employee1:Password1! -H 'Content-Type: application/json' \
  -d '{"title":"Access Control Policy","category":"Policy","reviewerUsername":"sdm1","content":"This document defines scope, owner, review, approval, control and compliance obligations."}' \
  http://localhost:8080/api/documents

curl -u employee1:Password1! -F title='Uploaded Control Standard' -F category='Policy' \
  -F reviewerUsername='pdhead1' -F changeSummary='Uploaded from file' \
  -F file=@./sample-policy.txt \
  http://localhost:8080/api/documents/upload

curl -u employee1:Password1! -H 'Content-Type: application/json' \
  -d '{"reviewerUsername":"sdm1","remarks":"Ready for review"}' \
  http://localhost:8080/api/documents/1/submit

curl -u sdm1:Password1! -H 'Content-Type: application/json' \
  -d '{"remarks":"Starting review"}' \
  http://localhost:8080/api/documents/1/start-review

curl -u sdm1:Password1! -H 'Content-Type: application/json' \
  -d '{"approved":true,"remarks":"Approved for release"}' \
  http://localhost:8080/api/documents/1/review

curl -u admin1:Password1! -H 'Content-Type: application/json' \
  -d '{"query":"Which ISMS documents expire this month?","maxResults":5}' \
  http://localhost:8080/api/chatbot/query
```

## API summary

### Authentication and users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Return the currently authenticated user |
| `GET` | `/api/users?reviewersOnly=false` | List users for owner/reviewer selection |

### Documents and workflow

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/documents` | List documents, optionally including deleted items |
| `GET` | `/api/documents/{id}` | Load a single document with its detail view data |
| `POST` | `/api/documents` | Create a document from JSON content |
| `POST` | `/api/documents/upload` | Create a document from multipart text-file upload |
| `POST` | `/api/documents/{id}/submit` | Submit a draft into review workflow |
| `POST` | `/api/documents/{id}/start-review` | Start the reviewer workflow stage |
| `POST` | `/api/documents/{id}/review` | Approve or reject a document |
| `POST` | `/api/documents/{id}/versions` | Create a new document version |
| `GET` | `/api/documents/{id}/ai-analysis` | Return heuristic compliance analysis |
| `DELETE` | `/api/documents/{id}` | Soft-delete a document |
| `POST` | `/api/documents/{id}/archive` | Archive fallback endpoint |
| `POST` | `/api/documents/{id}/restore` | Restore an archived document |

### Dashboard, AI, notifications, and audit

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Return role-aware dashboard metrics and summaries |
| `POST` | `/api/chatbot/query` | Query the `Ask AI` assistant for role-scoped document search |
| `GET` | `/api/notifications` | List notifications for the signed-in user |
| `GET` | `/api/notifications/overdue/count` | Return overdue reminder count |
| `POST` | `/api/notifications/{id}/read` | Mark a notification as read or unread |
| `POST` | `/api/notifications/reminders/run` | Trigger reminder sweep processing |
| `GET` | `/api/audit-logs` | List audit logs, optionally filtered by `documentId` |

### Operational endpoints

| Path | Purpose |
| --- | --- |
| `/swagger-ui.html` | Interactive API documentation |
| `/v3/api-docs` | OpenAPI schema |
| `/actuator/health` | Health endpoint |
| `/h2-console` | H2 database console for demo profile |

## Run tests

### Backend tests

```bash
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI'
mvn test
```

### Frontend production build

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI/frontend'
npm run build
```

## Run with Docker Compose

```bash
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI'
docker compose up --build
```

Docker Compose exposes:

- backend on `http://localhost:8080`
- frontend on `http://localhost:5173`

## Deployment notes

For PostgreSQL, run with the `postgres` profile and provide:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

```bash
cd '/Users/u7nj73b/IdeaProjects/SecureSync AI'
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Additional notes:

- Schema lifecycle is managed by Flyway migrations in `src/main/resources/db/migration`
- JPA runs in `ddl-auto: validate` mode to catch schema drift
- JWT integration coverage is available in `src/test/java/vwg/cms/c4c/OAuth2SecurityIntegrationTests.java`

## Latest UI updates

- The dashboard AI experience has been updated from a plain chatbot section to a modern floating `Ask AI` launcher
- The launcher uses a compact assistant-style entry point with a polished visual treatment
- Opening the launcher reveals a focused AI panel for role-aware document queries
- `Ask AI` labels now use consistent robot icon styling with shared UI tokens in `frontend/src/styles/askAiIconStyles.js`
- Repeated icon + text patterns were refactored into reusable component `frontend/src/components/AskAiLabel.jsx`

## Next recommended steps

1. Move file content storage from DB text fields to Azure Blob Storage.
2. Add email and Microsoft Teams notification adapters.
3. Add pagination, filters, and broader search across document views.
4. Add stricter Azure AD role/group mapping into application roles.
5. Replace the heuristic AI layer with policy-aware LLM validation and summarization.

