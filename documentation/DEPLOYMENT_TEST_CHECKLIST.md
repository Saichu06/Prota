# PROTA — Production Deployment Test & Verification Checklist

**Document Target**: Verification and QA Certification for Prota Deployment  
**Status**: Pre-Flight Verified & Test-Passed  

---

## 1. Automated Test Suites Execution Record

The following automated test suites were **actually executed** in the environment and recorded the following verified results:

### Frontend Test Suite (Vitest + Testing Library)
- **Execution Command**: `npm test` in `frontend` directory.
- **Results**: **19 test files passed, 90 tests passed, 0 failed, 0 skipped**.
- **Coverage Highlights**:
  - `validation.test.ts`: Form validations, non-negative nutritional numbers (10 tests).
  - `auth-guards.test.ts`: Route guards, unauthenticated redirection, public-only redirects (5 tests).
  - `api-client.test.ts`: Credentials handling (`include`), CSRF token attachment (`X-XSRF-TOKEN`), error mapping (5 tests).
  - `router-check.test.ts` & `router-mount.test.tsx`: Route mounting, deep-link navigation (2 tests).
  - `shell-and-dashboard.test.tsx`: Sidebar navigation, TopHeader, notifications, theme cycling (7 tests).
  - `food-log-and-analytics.test.tsx`: Food log meals grouping (Breakfast, Lunch, Dinner, Snack), manual entry validation (5 tests).
  - `dashboard-date-and-theme.test.tsx`: Calendar navigation semantics, date selector (8 tests).
  - `ai-assistant.test.tsx`: AI assistant UI, gracefully handling unconfigured Gemini service (4 tests).
  - `phase6a-diet-planner.test.tsx`: Diet planner multi-step wizard, goal validation (4 tests).
  - `phase6b-workout-planner.test.tsx`: Workout planner step flow, split types (2 tests).
  - `phase6c-improve-progress.test.tsx`: Improve progress recommendations, graceful provider outage fallback (6 tests).
  - `reports.test.tsx`: Report previewing, PDF generation trigger, CSV export (4 tests).
  - `blogs.test.tsx`: Editorial blogs, category filtering, search, slug detail views (8 tests).
  - `register-wizard.test.tsx`: Registration wizard, password visibility toggle (4 tests).
  - `profile-picture.test.tsx`: Avatar upload fallback, initials badge (3 tests).

### Backend Test Suite (JUnit 5 + Spring Boot Test + MockMvc)
- **Execution Command**: `./mvnw.cmd test` in `backend` directory.
- **Results**: **12 test classes passed, 70 tests passed, 0 failed, 0 skipped**.
- **Coverage Highlights**:
  - `SecurityAndActuatorTests`: Actuator `/actuator/health` public access, `/actuator/beans` security protection, 401 unauthenticated response, CORS preflight header validation (4 tests).
  - `DatabaseSchemaAndConstraintTests`: Direct PostgreSQL constraint enforcement, unique keys, foreign keys, positive checks, composite cascade integrity (12 tests).
  - `Phase2AAuthAndProfileTests`: User registration, BCrypt password verification, session fixation (`changeSessionId`), login, CSRF enforcement, profile update, settings update (10 tests).
  - `Phase3CNutritionAndAnalyticsTests`: Food logging, goal calculation, daily rollups, streak tracking, water intake, body weight entries (13 tests).
  - `Phase4AiIntegrationTests`: Gemini client error handling, quota exceeded, provider timeout, grounding context assembly (6 tests).
  - `Phase5AiFoodLoggingTests`: AI food estimation lifecycle, status transition (`PENDING` to `CONFIRMED`), non-automatic tallying until user confirmation (7 tests).
  - `Phase6ADietPlannerTests`: Diet plan creation, goal calories/macros calculation, JSONB persistence (4 tests).
  - `Phase6BWorkoutPlannerTests`: Workout plan generation, split generation, fallback to deterministic generator when API key unconfigured (6 tests).
  - `Phase6CImproveProgressTests`: Progress improvement recommendations, historical log analysis, provider outage fallback (6 tests).
  - `Phase7ReportTests`: Memory-streamed PDF generation, CSV generation, data export formatting (7 tests).
  - `AvatarAndCalendarIntegrationTests`: Avatar upload validation, file resolution, calendar month view aggregation (3 tests).
  - `ProtaApplicationTests`: Spring Boot context load (1 test).

---

## 2. Production Build Verification Record

| Artifact | Build Command | Execution Result |
| :--- | :--- | :--- |
| **Frontend Production Bundle** | `npm run build` | **PASSED** in 1.49s. Output: `frontend/dist/` (HTML 1.51 kB, CSS 144.52 kB, JS 854.64 kB). No source maps emitted. |
| **Backend Executable JAR** | `./mvnw.cmd package -DskipTests` | **PASSED** in 13.58s. Output: `backend/target/prota-0.0.1-SNAPSHOT.jar` (87.0 MB Fat JAR with embedded Tomcat). |

---

## 3. Manual Pre-Flight & Post-Deployment Checklist

Use this checklist during and immediately after deploying to Vercel and Render:

### Phase A: Infrastructure Provisioning
- [ ] Render Managed PostgreSQL created in target region (e.g., `Frankfurt` or `Oregon`).
- [ ] Database credentials copied (`Internal Database URL`, `Host`, `Username`, `Password`).
- [ ] Render Web Service created from `backend` directory.
- [ ] Health Check path set to `/api/v1/actuator/health`.
- [ ] Environment variables configured on Render (`SPRING_PROFILES_ACTIVE=prod`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `GEMINI_API_KEY`).
- [ ] Initial backend deployment successfully starts and logs `Started ProtaApplication`.

### Phase B: Frontend Vercel Deployment
- [ ] Vercel project created from `frontend` directory with preset `Vite`.
- [ ] Vercel Rewrites configured in `frontend/vercel.json` pointing to Render backend (Mode A) OR `VITE_API_BASE_URL` configured (Mode B).
- [ ] Vercel deployment completes successfully.
- [ ] Vercel production domain (e.g. `https://prota.vercel.app`) added to `CORS_ALLOWED_ORIGINS` in Render.

### Phase C: Live Application Smoke Testing
- [ ] **Public Landing Page**: Navigate to `https://prota.vercel.app`. Verify hero, demo videos, and visual styling load smoothly.
- [ ] **Editorial Blogs**: Navigate to `/blogs` and click on a story (e.g. `/blogs/protein-synthesis-sleep`). Verify deep-link works and browser refresh does not 404.
- [ ] **Registration Flow**: Register a new user account with email and password. Verify redirected to dashboard with `PROTASESSIONID` cookie set.
- [ ] **CSRF Verification**: Inspect Network tab on registration/login. Confirm `X-XSRF-TOKEN` header is attached to `POST /api/v1/...`.
- [ ] **Food Logging**: Add a custom food entry (e.g. 200g Greek Yogurt, 20g Protein, 120 kcal). Verify totals update immediately on Dashboard.
- [ ] **Water & Weight Logging**: Log 500 ml water and a weight entry. Verify cards update.
- [ ] **AI Assistant**: Open Prota Assistant (`/assistant`). Send a message (e.g., "What are high-protein snacks under 200 calories?"). Verify response streams or returns cleanly.
- [ ] **AI Add-Ons**: Test AI Diet Planner (`/addons/diet-plan`) and AI Workout Planner (`/addons/workout-plan`). Verify plans generate and persist.
- [ ] **Reports Download**: Navigate to `/reports` and click "Download PDF Report". Verify browser downloads the file with proper nutrition formatting.
- [ ] **Logout & Session Termination**: Click user avatar > Logout. Verify session cookie is invalidated and private routes redirect to `/login`.
