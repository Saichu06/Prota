# PROTA — Production Environment Variables Reference

**Application Target**: Prota (Frontend on Vercel, Backend on Render, Database on Neon PostgreSQL)  
**Database Provider**: Neon PostgreSQL (Free Tier)  
**Security Level**: Confidential Configuration Reference

---

## 1. Backend Environment Variables (Render Web Service)

These variables must be configured in the **Render Dashboard** under **Environment** for your Web Service.

| Variable Name | Required? | Example Value | Description & Sensitivity |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Yes** | `prod` | Activates `application-prod.yml` (disables SQL logging, enables reverse-proxy header forwarding, enables secure cookies). |
| `PORT` | Auto | `10000` | Injected automatically by Render. The backend binds to `${PORT:8080}`. |
| `DB_URL` | **Yes** | `jdbc:postgresql://ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require` | **Sensitive**. Neon PostgreSQL JDBC connection string. Must start with `jdbc:postgresql://` and include `?sslmode=require`. |
| `DB_USERNAME` | **Yes** | `neondb_owner` | **Sensitive**. Neon database user (default is often `neondb_owner` or a role you create). |
| `DB_PASSWORD` | **Yes** | `[YOUR_NEON_PASSWORD]` | **Secret**. Neon database password. |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://your-prota-app.vercel.app` | Comma-separated list of trusted frontend origins. Never use `*` when credentials are enabled. |
| `COOKIE_SECURE` | **Yes** | `true` | Enforces the `Secure` flag on `PROTASESSIONID` cookies. Mandatory for HTTPS production. |
| `COOKIE_SAME_SITE` | Optional | `lax` (or `none`) | Cookie SameSite attribute. Use `lax` when using Vercel rewrites (same-origin). Use `none` if using direct cross-origin requests. |
| `SESSION_TIMEOUT` | Optional | `24h` | Session expiration duration (e.g. `24h`, `7d`). Default: `24h`. |
| `GEMINI_API_KEY` | **Yes** | `AIzaSy...` | **Secret**. Google Gemini API key. Stored strictly server-side. Never exposed in frontend or client code. |
| `GEMINI_MODEL` | Optional | `gemini-3.5-flash-lite` | Gemini model name. Default: `gemini-3.5-flash-lite`. |
| `GEMINI_BASE_URL` | Optional | `https://generativelanguage.googleapis.com/v1beta` | Base URL for Google Generative Language API endpoint. |
| `GEMINI_TIMEOUT_SECONDS` | Optional | `25` | HTTP read timeout for AI requests in seconds. Default: `25`. |
| `GEMINI_MAX_OUTPUT_TOKENS` | Optional | `2048` | Max output token limit for AI completions. Default: `2048`. |

---

## 2. Neon Connection Details & SSL Architecture

### A. SSL Requirement (`?sslmode=require`)
Neon strictly requires TLS/SSL encryption. The JDBC connection URL **must** include `?sslmode=require`:
```
jdbc:postgresql://ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### B. Direct Connection vs Pooled Connection Endpoint
In the Neon Console connection dialog, you will see two endpoint options:

1. **Direct Connection (Recommended for Prota & Spring Boot)**:
   - Hostname format: `ep-xxxx.region.aws.neon.tech` (no `-pooler` in the host).
   - **Why use Direct for Prota**:
     - Spring Boot already maintains its own client-side connection pool via **HikariCP** inside the Render instance (configured for 10 connections).
     - **Flyway Database Migrations** require session-level transactional advisory locks (`pg_advisory_lock`). In a transaction-pooling proxy (PgBouncer), advisory locks can fail or cross connection boundaries.
     - The Direct connection ensures 100% reliable Flyway startup migrations and full JPA transactional semantics.

2. **Pooled Connection (PgBouncer - Optional)**:
   - Hostname format: `ep-xxxx-pooler.region.aws.neon.tech` (contains `-pooler`).
   - **When to use**: Primarily intended for serverless environments (e.g., AWS Lambda, Vercel Serverless Functions) with hundreds of short-lived connections. Not recommended as the primary connection for Spring Boot applications managing Flyway migrations.

### C. Neon Free Tier Behavior & Limits
- **Storage Limit**: 0.5 GB per project. Prota's relational data dictionary is highly efficient (text and numeric logs), which easily fits thousands of days of user meals within free tier boundaries.
- **Compute Auto-Suspend**: Neon compute auto-suspends after 5 minutes of zero traffic to conserve compute hours.
- **Cold Starts**: When traffic arrives after suspension, Neon automatically wakes up in ~1-2 seconds. Prota's backend HikariCP configuration uses `connection-timeout: 20000` (20 seconds), `max-lifetime: 600000` (10 minutes), and `keepalive-time: 120000` (2 minutes) to seamlessly handle cold starts without connection timeouts.

---

## 3. Frontend Environment Variables (Vercel Project)

These variables are configured in the **Vercel Dashboard** under **Project Settings > Environment Variables**.

| Variable Name | Required? | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Depends on mode | `/api/v1` *(Mode A)*<br>`https://prota-backend.onrender.com/api/v1` *(Mode B)* | Base URL for REST API client. If using **Mode A (Vercel Rewrites)**, set to `/api/v1` or omit (it defaults to `/api/v1`). If using **Mode B (Direct Cross-Origin)**, set to the full Render backend URL including `/api/v1`. |

> [!WARNING]
> **CRITICAL SECRET RULE**:
> Never set `GEMINI_API_KEY`, `DB_URL`, `DB_PASSWORD`, or any other backend secrets in Vercel environment variables!
> Any variable prefixed with `VITE_` is baked into the public browser JavaScript bundle at build time and is visible to anyone inspecting network traffic or page source.

---

## 4. Render Dashboard Copy-Paste Quick Reference

When setting up your Web Service on Render:

```properties
SPRING_PROFILES_ACTIVE=prod
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
CORS_ALLOWED_ORIGINS=https://your-prota-app.vercel.app
DB_URL=jdbc:postgresql://ep-your-endpoint-id.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_USERNAME=your_neon_user
DB_PASSWORD=your_neon_password
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```
