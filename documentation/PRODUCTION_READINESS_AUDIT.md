# PROTA — Production Readiness & Architecture Audit

**Document Version**: 1.0.0  
**Audit Date**: October 24, 2026  
**Auditor**: Senior Full-Stack, Spring Boot Security & DevOps Engineering Team  
**Application Target**: Prota AI-Powered Protein & Nutrition Tracking Application  
**Target Infrastructure**:
- **Frontend**: Vercel (Vite SPA + React 19 + TypeScript + Tailwind CSS v4)
- **Backend**: Render Web Service (Java 25/26 + Spring Boot 4.1.1 + Spring AI + Embedded Tomcat)
- **Database**: Managed PostgreSQL (18.x compatible)
- **AI Integration**: Google Gemini API via Backend-Only Integration (`gemini-3.5-flash-lite`)

---

## 1. Executive Summary & Verdict

The Prota application codebase is exceptionally well-structured, follows domain-driven modular boundaries, enforces defensive relational integrity with composite foreign keys, and has comprehensive automated test suites (90 frontend tests passing, 70 backend integration tests passing).

Before this audit, the application was running in local development mode. To achieve full production-readiness for **Vercel** and **Render**, the following key modifications were completed:
1. **Frontend Production Build & Routing**: Configured `frontend/vercel.json` with clean Single Page Application (SPA) fallback routing (`/((?!api/).*)` to `/index.html`), blocking accidental rewrites of `/api/*` endpoints to HTML. Added production cache headers and browser security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
2. **Build Hardening**: Updated `frontend/vite.config.ts` to explicitly disable production source maps (`sourcemap: false`), preventing leakage of source comments and internal logic.
3. **Backend Production Profile**: Created `backend/src/main/resources/application-prod.yml` enabling reverse-proxy header forwarding (`server.forward-headers-strategy: framework`) so HTTPS termination at Render/Vercel is correctly recognized by Spring Security.
4. **Cookie Security**: Made cookie `SameSite` and `Secure` attributes environment-configurable (`COOKIE_SECURE`, `COOKIE_SAME_SITE`) while defaulting `secure: true` in production.
5. **Zero Secret Exposure**: Verified that `.env`, `.env.local`, and `apikey.txt` are strictly untracked in Git via `.gitignore`. No API keys or database passwords exist in frontend source code.

**Production Deployment Status**: **READY FOR DEPLOYMENT** (pending owner provisioning of Render Web Service, Managed PostgreSQL, and Vercel Project).

---

## 2. Technical Stack & Environment Audit

| Component | Specification / Version in Codebase | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Java Runtime** | Java 26.0.1 (Oracle SE) / Java 25 compatibility (`<java.version>25</java.version>`) | `java -version`, `javac -version` | **Verified** |
| **Spring Boot** | 4.1.1 (Spring Framework 7.0.9) | `pom.xml` | **Verified** |
| **Build Tool (Backend)** | Apache Maven 3.10.0 (via `mvnw.cmd` wrapper) | `mvnw.cmd -v` | **Verified** |
| **Artifact JAR** | `backend/target/prota-0.0.1-SNAPSHOT.jar` (87 MB Fat JAR) | `mvnw.cmd package -DskipTests` | **Verified (Built)** |
| **Node.js Runtime** | Node.js v24.16.0 | `node -v` | **Verified** |
| **Package Manager** | npm 11.13.0 | `npm -v` | **Verified** |
| **Frontend Framework** | React 19.3.1 + TypeScript 6.0.3 + Vite 8.3.4 | `frontend/package.json` | **Verified** |
| **Frontend Styling** | Tailwind CSS v4.3.3 (`@tailwindcss/vite`) | `frontend/package.json` | **Verified** |
| **Database Engine** | PostgreSQL 18.x (tested against local 18.4) | `psql`, `DatabaseSchemaAndConstraintTests` | **Verified** |
| **Migration Framework**| Flyway Core 11 / 12.4.0 (`spring-boot-starter-flyway`) | 4 versioned migration files | **Verified** |
| **AI Integration** | Google Gemini API (`gemini-3.5-flash-lite`) via `RestClient` | `GeminiClient.java` | **Verified** |

---

## 3. Directory Layout & Repository Structure

```
d:\PROJECTS\Prota
├── .gitignore                      # Root gitignore ignoring .env, apikey.txt, logs, build artifacts
├── assets/                         # Static media assets (logo, videos, ignored apikey.txt)
├── database/                       # Database documentation and schema specifications
│   └── README.md
├── documentation/                  # Architecture specs, diagrams, and deployment manuals
│   ├── BACKEND.md                  # Comprehensive backend reference
│   ├── architecutre.png            # Visual architecture flow
│   ├── auth and flow.png           # Auth & session lifecycle diagram
│   └── er.pdf                      # Complete entity-relationship diagram
├── backend/                        # Spring Boot REST API
│   ├── mvnw / mvnw.cmd             # Maven wrapper scripts
│   ├── pom.xml                     # Maven build configuration
│   ├── .env.example                # Template of backend environment variables
│   ├── src/main/java/com/prota/    # Java source code
│   │   ├── ai/                     # Gemini client & AI context grounding services
│   │   ├── config/                 # CORS properties & Jackson config
│   │   ├── controller/             # 14 REST API controllers
│   │   ├── dto/                    # Request/Response data transfer objects
│   │   ├── entity/                 # JPA domain entities
│   │   ├── exception/              # Global exception handler & custom exceptions
│   │   ├── repo/                   # Spring Data JPA repositories
│   │   ├── security/               # Spring Security, session, CSRF, and user principal
│   │   └── service/                # Core domain business logic
│   ├── src/main/resources/         # Configuration & Flyway migrations
│   │   ├── application.yml         # Base configuration
│   │   ├── application-dev.yml     # Local development profile
│   │   ├── application-prod.yml    # Production profile (Render deployment)
│   │   └── db/migration/           # Flyway migrations V1 through V4
│   └── src/test/java/com/prota/    # 12 automated test suites (70 unit & integration tests)
└── frontend/                       # Vite + React SPA
    ├── package.json                # Frontend dependencies and scripts
    ├── vite.config.ts              # Vite configuration (proxy, test, build options)
    ├── vercel.json                 # Vercel deployment & SPA fallback rewrite rules
    ├── index.html                  # HTML entry point with modern font preconnects
    ├── .env.example                # Frontend environment template
    ├── public/                     # Public assets & video files
    │   └── videos/                 # Product demo videos & editorial blog media
    └── src/                        # TypeScript React application
        ├── app/                    # Router (`router.tsx`), guards, and providers
        ├── components/             # Reusable UI primitives, headers, footers, shell
        ├── features/               # Domain feature modules (dashboard, log, auth, etc.)
        ├── lib/                    # API client (`api-client.ts`), CSRF (`csrf.ts`), date utils
        └── __tests__/              # 19 Vitest test suites (90 automated tests)
```

---

## 4. Architecture & Security Assessment

### 4.1 REST API Context Path & Endpoints
- **Context Path**: All backend REST API endpoints run under `/api/v1`.
- **Public Endpoints**:
  - `GET /api/v1/actuator/health` (Render health check)
  - `POST /api/v1/auth/register` (User registration)
  - `POST /api/v1/auth/login` (User login)
  - `POST /api/v1/auth/logout` (Session invalidation)
  - `GET /api/v1/auth/csrf` (CSRF token extraction)
  - `GET /api/v1/users/avatar/{fileName}` (Public user profile images)
- **Protected Endpoints**:
  - `/api/v1/users/me`, `/api/v1/settings`
  - `/api/v1/daily-logs`, `/api/v1/food-entries`, `/api/v1/saved-foods`
  - `/api/v1/water`, `/api/v1/weight`
  - `/api/v1/ai/estimate`, `/api/v1/ai/chat`
  - `/api/v1/addons/diet-plan`, `/api/v1/addons/workout-plan`, `/api/v1/addons/improve-progress`
  - `/api/v1/reports/preview`, `/api/v1/reports/pdf`, `/api/v1/reports/csv`
  - `/api/v1/actuator/**` (all non-health actuator endpoints require authentication)

### 4.2 Authentication, Session, and CSRF Protection
- **Session Cookie**: `PROTASESSIONID`
  - `http-only: true` (prevents JavaScript access, mitigating XSS token extraction)
  - `secure: true` in production (`COOKIE_SECURE=true`)
  - `path: /`
  - `same-site: lax` (standard for same-origin or reverse-proxy architectures)
  - Session Fixation: Spring Security rotates session ID on authentication (`changeSessionId()`).
- **CSRF Protection**:
  - Implemented using `CookieCsrfTokenRepository.withHttpOnlyFalse()` with cookie path `/`.
  - Frontend `api-client.ts` automatically retrieves the `XSRF-TOKEN` cookie (or requests it via `/auth/csrf`) and attaches it as `X-XSRF-TOKEN` on all state-changing HTTP requests (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Auth endpoints (`/auth/login`, `/auth/register`, `/auth/logout`) are exempted from CSRF validation to allow frictionless initial handshake.

### 4.3 CORS & Cross-Origin Mechanics
- **Configuration**: Managed by `CorsProperties.java` loaded from `app.cors.*` in YAML.
- **Allowed Origins**: Configured via `CORS_ALLOWED_ORIGINS` (e.g. `https://prota.vercel.app,http://localhost:5173`).
- **Credentials**: `allow-credentials: true`.
- **Wildcard Safety**: The backend **never** combines `allow-credentials: true` with wildcard `*` origins. Explicit origins are strictly required.

### 4.4 Database Integrity & Flyway Migrations
- **Flyway Ownership**: Flyway owns the schema lifecycle (`spring.flyway.enabled: true`, `baseline-on-migrate: true`, `validate-on-migrate: true`).
- **Hibernate Mode**: `spring.jpa.hibernate.ddl-auto: validate`. Hibernate is strictly prohibited from mutating or creating tables at runtime.
- **Applied Migrations**:
  1. `V1__create_initial_schema.sql` (12 core tables: `users`, `user_settings`, `daily_logs`, `food_entries`, `saved_foods`, `water_entries`, `weight_entries`, `ai_food_estimates`, `reminder_settings`, `push_subscriptions`, `notification_events`, `refresh_tokens`).
  2. `V2__add_profile_picture_to_users.sql` (adds `profile_picture_url` to `users`).
  3. `V3__create_diet_plans_table.sql` (adds `diet_plans` table for AI diet generator).
  4. `V4__create_workout_plans_table.sql` (adds `workout_plans` table for AI workout generator).
- **Cross-Tenant Data Isolation**: Multi-tenant data integrity is enforced via composite keys (`user_id, id`) and composite foreign keys on child tables (`food_entries -> (user_id, daily_log_id)`). Even if an application bug omitted a user filter, the database rejects cross-user references.

### 4.5 AI Integration (Gemini API)
- **Model**: `gemini-3.5-flash-lite` (configurable via `GEMINI_MODEL`).
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- **API Key Handling**: Key is stored **exclusively** on the backend server (`GEMINI_API_KEY`). It is never passed to Vite or exposed in client bundles.
- **Resilience & Fallbacks**:
  - Request timeouts: 25 seconds (`gemini.timeout-seconds`).
  - Graceful degradation: If `GEMINI_API_KEY` is missing or the provider returns 5xx/timeout, `WorkoutPlanService`, `DietPlanService`, and `ProgressImprovementService` fall back to deterministic, validated domain algorithms without crashing.
  - User Confirmation: AI meal estimations produce pending records (`AiFoodEstimate`). Nutritional numbers are editable and require explicit user submission before being persisted into daily nutrition totals.

---

## 5. Deployment Architecture: Two Supported Modes

### Mode A: Vercel Proxy / Rewrites (Recommended)
- **Concept**: Vercel acts as both the SPA host and edge reverse proxy. Requests to `https://prota.vercel.app/api/v1/*` are proxied to Render `https://prota-backend.onrender.com/api/v1/*`.
- **Advantages**:
  1. **Same-Origin Cookies**: To the client browser, everything is `https://prota.vercel.app`.
  2. **Zero Third-Party Cookie Blocking**: Safari ITP and modern privacy browsers do not block or partition the `PROTASESSIONID` cookie.
  3. **Simplified CSRF**: `XSRF-TOKEN` cookie is set directly on the frontend domain.
  4. **Simple Frontend Configuration**: `VITE_API_BASE_URL` remains `/api/v1` (default).

### Mode B: Direct Cross-Origin
- **Concept**: The frontend runs at `https://prota.vercel.app`, and directly communicates with Render at `https://prota-backend.onrender.com/api/v1` via cross-origin fetch (`credentials: 'include'`).
- **Requirements**:
  1. `VITE_API_BASE_URL=https://prota-backend.onrender.com/api/v1` on Vercel.
  2. `CORS_ALLOWED_ORIGINS=https://prota.vercel.app` on Render.
  3. `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none` on Render.
- **Trade-off**: Requires `SameSite=None`, which some privacy-focused browsers may restrict unless third-party cookies are permitted.

---

## 6. Identified Risks & Remediation Plan

| Risk Item | Impact | Severity | Resolution / Status in Place |
| :--- | :--- | :---: | :--- |
| **Ephemeral Render Storage for Avatars** | Render free/standard web services replace local filesystem on every redeploy. Avatars saved in `uploads/avatars` will be reset on redeployment. | **Medium** | Path traversal protection already implemented in `UserService.java`. Documented attachment of Render Persistent Disk or future S3/Cloudinary object store migration in Phase 8. |
| **PostgreSQL Port & Protocol Scheme** | Render provides `postgresql://` connection strings, but JDBC requires `jdbc:postgresql://`. | **Medium** | Spring configuration uses `DB_URL` with fallback to `DATABASE_URL`. Deployment guide explicitly provides the JDBC format. |
| **Direct Route Refresh (404)** | Reloading `/dashboard` on Vercel without SPA rewrite causes HTTP 404. | **High** | Fixed by creating `frontend/vercel.json` with `/((?!api/).*)` rewrite to `/index.html`. |
| **Source Map Secret Leakage** | Client source maps could expose developer comments or internal endpoints. | **Low** | Fixed by configuring `build.sourcemap = false` in `vite.config.ts`. |
| **Cross-Origin Cookie Dropping** | Browsers dropping `PROTASESSIONID` over cross-domain HTTPS. | **High** | Provided `application-prod.yml` with `forward-headers-strategy: framework` and documented Vercel Proxy architecture. |
