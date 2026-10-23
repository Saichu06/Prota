# Prota Frontend — Mobile-First Client Application

**Prota** is a high-performance, mobile-first protein and nutrition tracking client built with React 19, TypeScript, Vite, and Tailwind CSS v4.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or higher (tested on Node v24)
- **npm**: `v10.x` or higher
- **Backend API**: Running Spring Boot server at `http://localhost:8080/api/v1` (with PostgreSQL configured and migrations applied)

---

## 2. Installation & Quick Start

```bash
# Navigate to the frontend directory
cd frontend

# Install project dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will be accessible at:
```text
http://localhost:5173
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api/v1` | Base URL for API requests. In local development, the Vite proxy directs `/api/v1` to `http://localhost:8080/api/v1` to prevent cross-origin issues with HTTP-only cookies. |

---

## 4. Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local dev server with HMR on port 5173. |
| `npm run build` | `tsc -b && vite build` | Type-checks via TypeScript and produces optimized production bundle in `dist/`. |
| `npm run lint` | `oxlint` | Runs fast Oxlint linter across TypeScript and React code. |
| `npm test` | `vitest run` | Runs unit test suite covering validation, API client, theme, and auth guards. |
| `npm run preview` | `vite preview` | Previews the production build locally. |

---

## 5. Architecture & Project Structure

```text
frontend/src/
├── app/
│   ├── App.tsx                     # Main application entry with providers & router
│   ├── router.tsx                  # React Router v7 route definitions
│   ├── guards/
│   │   ├── ProtectedRoute.tsx      # Guard ensuring active session before rendering
│   │   └── PublicOnlyRoute.tsx     # Guard preventing logged-in users from accessing auth screens
│   └── providers/
│       ├── AuthContext.ts          # AuthContext definition
│       ├── AuthProvider.tsx         # Centralized session & user state management
│       ├── ThemeContext.ts         # ThemeContext definition (light, dark, system)
│       ├── ThemeProvider.tsx        # DOM theme application and server synchronization
│       ├── ToastContext.ts         # ToastContext definition
│       └── ToastProvider.tsx        # Toast notifications provider
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            # Responsive application shell
│   │   ├── Sidebar.tsx             # Desktop persistent navigation sidebar
│   │   ├── TopHeader.tsx           # Responsive header with page titles & avatar
│   │   └── BottomNav.tsx           # Mobile sticky bottom navigation bar
│   └── ui/
│       ├── Button.tsx              # Reusable button with variants and loading spinners
│       ├── Input.tsx               # Accessible input with icons and validation errors
│       ├── PasswordInput.tsx       # Password field with keyboard/screen-reader visibility toggle
│       ├── Card.tsx                # Card container with title and action slots
│       ├── Badge.tsx               # Status badge component
│       ├── LoadingSpinner.tsx      # SVG progress ring spinner
│       └── ThemeToggle.tsx         # Accessible 3-mode theme selector
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── AuthCard.tsx        # Brand card wrapper for auth pages
│   │   └── pages/
│   │       ├── LoginPage.tsx       # Login screen with inline validation & error handling
│   │       └── RegisterPage.tsx    # Registration screen with password confirmation & strength checks
│   ├── dashboard/                  # Dashboard module (functional shell with Phase 3B placeholder)
│   ├── placeholder/
│   │   └── PlaceholderPage.tsx     # Shared informative placeholder for upcoming modules
│   ├── profile/
│   │   └── pages/
│   │       └── ProfilePage.tsx     # Profile page with read-only email & editable full name
│   └── settings/
│       └── pages/
│           └── SettingsPage.tsx    # Nutritional goals (protein, calories, water) & preferences
├── hooks/
│   ├── useAuth.ts                  # Hook for auth context
│   ├── useTheme.ts                 # Hook for theme context
│   └── useToast.ts                 # Hook for toast notifications
├── lib/
│   ├── api-client.ts               # Fetch client with credentials, CSRF auto-injection, RFC 9457 parsing
│   ├── csrf.ts                     # CSRF cookie extraction and token fetch fallback
│   └── date-utils.ts               # Date, time, and timezone utilities
├── styles/
│   ├── globals.css                 # Base styles and Tailwind imports
│   └── theme.css                   # Semantic CSS design tokens for light and dark modes
├── types/
│   └── api.ts                      # TypeScript DTOs matching backend Spring Boot API
└── __tests__/
    ├── validation.test.ts          # Registration, login, profile, settings validation tests
    ├── api-client.test.ts          # ApiError parsing and CSRF cookie tests
    ├── theme.test.ts               # Theme resolution and persistence tests
    └── auth-guards.test.ts         # Protected route and public-only route logic tests
```

---

## 6. Authentication & CSRF Integration

- **Session Management**: Session state is managed by the Spring Boot backend using HTTP-only cookies (`PROTASESSIONID`, `SameSite=Lax`). Passwords, raw credentials, and session tokens are **never** stored in `localStorage` or `sessionStorage`.
- **CSRF Protection**:
  - The client automatically extracts the `XSRF-TOKEN` cookie from `document.cookie`.
  - For state-mutating requests (`POST`, `PATCH`, `PUT`, `DELETE`), `api-client.ts` automatically attaches the `X-XSRF-TOKEN` header.
  - If the cookie is not present initially, `ensureCsrfToken()` fetches it transparently from `/api/v1/auth/csrf`.
- **Session Bootstrap**: On application startup, `AuthProvider` calls `GET /api/v1/auth/me`. If authenticated, it concurrently fetches user profile (`/api/v1/users/me`) and user settings (`/api/v1/settings`).
- **Session Expiration**: Any `401 Unauthorized` received by `api-client.ts` or during navigation automatically resets client session state and redirects to `/login`.
- **RFC 9457 Problem Details**: Errors from the backend are parsed as `ApiError`, exposing HTTP status, error codes, and field-level validation messages for inline UI display.

---

## 7. Known Limitations & Phase 3B Scope

- **Food Logging & Analytics**: Food logging (`/log`), historical trends (`/history`), and detailed nutrition analytics (`/analytics`) are slated for Phase 3B. In this phase, informative placeholders are presented in the responsive navigation shell without fabricated mock data.
- **Email Verification**: User email is currently read-only on the profile page, pending implementation of email verification flows in a future phase.
