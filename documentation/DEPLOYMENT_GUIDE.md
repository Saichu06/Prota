# PROTA — Complete Production Deployment Guide

**Target Application**: Prota AI-Powered Protein & Nutrition Tracking Application  
**Target Infrastructure**:
- **Frontend**: Vercel (Vite + React 19 + TypeScript + Tailwind CSS)
- **Backend**: Render Web Service using **Docker** (Multi-Stage JDK 25 / JRE 25)
- **Database**: Neon PostgreSQL (Free Tier)
- **AI Integration**: Google Gemini API via Backend Integration

---

## 1. Pre-Deployment Checklist

Before deploying, ensure you have:
1. A [GitHub](https://github.com) account containing the `Prota` repository.
2. A [Neon](https://neon.tech) account (Free Tier).
3. A [Render](https://render.com) account.
4. A [Vercel](https://vercel.com) account.
5. A Google Gemini API key from [Google AI Studio](https://aistudio.google.com).
6. Local builds verified:
   - Frontend: `npm run build` passes with zero errors.
   - Backend: `./mvnw.cmd test` and `./mvnw.cmd package -DskipTests` pass cleanly.

---

## 2. Step 1: Provision Neon PostgreSQL (Free Tier)

### In the Neon Console:
1. Log in to [Neon Console](https://console.neon.tech) and click **Create Project**.
2. Configure project settings:
   - **Project Name**: `prota`
   - **PostgreSQL Version**: 16 or 17 (Recommended).
   - **Region**: Choose the AWS region closest to your planned Render Web Service location (e.g. `US East (Ohio)` / `us-east-2` or `Europe (Frankfurt)` / `eu-central-1`). Keeping Render and Neon in geographic proximity minimizes database latency.
   - **Database Name**: Default is `neondb` (or customize to `prota`).
3. Click **Create Project**.
4. In the **Connection Details** modal / dashboard:
   - In the connection language dropdown, select **Java** or **JDBC**.
   - Note the **Host**, **Database**, **Username**, and **Password**.
   - Ensure the connection toggle is set to **Direct Connection** (the hostname should look like `ep-xxxx.region.aws.neon.tech`, **not** containing `-pooler`).

> [!IMPORTANT]
> **JDBC URL and SSL Requirement**:
> Neon strictly mandates TLS/SSL encryption. Ensure the JDBC URL ends with `?sslmode=require`:
> ```
> jdbc:postgresql://ep-your-endpoint-id.region.aws.neon.tech/neondb?sslmode=require
> ```

### Direct Endpoint vs Pooled Endpoint (`-pooler`):
- **Use the Direct Endpoint** (`ep-xxxx.region.aws.neon.tech`): Spring Boot on Render already maintains an internal connection pool via HikariCP. More importantly, **Flyway schema migrations require session-level transactional advisory locks**, which require a direct connection and can fail over transaction-pooled proxies (PgBouncer).
- **Pooled Endpoint** (`ep-xxxx-pooler...`): Only intended for serverless functions (like AWS Lambda). Not recommended for Spring Boot + Flyway.

### Neon Free Tier Limits & Auto-Suspend:
- **Storage**: 0.5 GB per project.
- **Compute Auto-Suspend**: Inactivity for 5 minutes puts compute into auto-suspend to conserve hours.
- **Cold Starts**: Neon wakes up in ~1-2 seconds. Prota's HikariCP pool is configured with `connection-timeout: 20000` (20s) and `keepalive-time: 120000` (2m) to seamlessly accommodate auto-suspend wake-ups.

---

## 3. Step 2: Deploy Backend Docker Web Service on Render

Prota includes a production-ready, multi-stage Dockerfile located at [`backend/Dockerfile`](file:///d:/PROJECTS/Prota/backend/Dockerfile). It builds with Eclipse Temurin JDK 25 and executes as a non-root user on a lightweight JRE 25 image.

### In the Render Dashboard:
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository: `Prota`.
3. Fill in the service details:
   - **Name**: `prota-backend` (will give you e.g. `https://prota-backend.onrender.com`)
   - **Region**: Same region as your Neon database (e.g. `Ohio (US East)` or `Frankfurt (EU Central)`).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` *(Relative to the `backend` Root Directory)*
   - **Health Check Path**: `/api/v1/actuator/health`

*(Note: When using the Docker runtime on Render with Root Directory set to `backend`, Render will automatically discover `backend/Dockerfile` and `backend/.dockerignore`).*

### Environment Variables:
Under **Environment**, click **Add Environment Variable** for each:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Loads `application-prod.yml` |
| `DB_URL` | `jdbc:postgresql://ep-xxxx.region.aws.neon.tech/neondb?sslmode=require` | Direct endpoint with `?sslmode=require` |
| `DB_USERNAME` | `neondb_owner` (or your user) | From Neon connection details |
| `DB_PASSWORD` | `[YOUR_NEON_PASSWORD]` | From Neon connection details |
| `CORS_ALLOWED_ORIGINS` | `https://your-prota-app.vercel.app` | Will update after Vercel deployment |
| `COOKIE_SECURE` | `true` | Required for HTTPS production |
| `COOKIE_SAME_SITE` | `lax` | Use `lax` with Vercel rewrites, `none` for direct cross-origin |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Production model |

*(Note: Render automatically injects `PORT=10000`. The Dockerfile `ENTRYPOINT` passes `-Dserver.port=${PORT:-8080}` to bind dynamically).*

4. Click **Deploy Web Service**.
5. Inspect the deploy logs:
   - Stage 1 compiles the application using the Maven wrapper.
   - Stage 2 copies the 87 MB executable JAR into the lightweight JRE 25 container.
   - The container runs as the unprivileged user `prota`.
   - Flyway executes migrations `V1`, `V2`, `V3`, and `V4` on Neon.
   - Health check `/api/v1/actuator/health` returns HTTP 200 `{"status":"UP"}`.

---

## 4. Step 3: Deploy Frontend on Vercel

You can choose between **Mode A (Vercel Rewrites Proxy - Highly Recommended)** or **Mode B (Direct Cross-Origin)**.

### Mode A: Vercel Rewrites Proxy (Recommended)
This mode eliminates third-party cookie blocking (Safari ITP / Chrome restrictions) by proxying `/api/*` through Vercel's edge network directly to Render.

1. In your repository, open [frontend/vercel.json](file:///d:/PROJECTS/Prota/frontend/vercel.json).
2. The file is pre-configured with a placeholder URL:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "cleanUrls": true,
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-XSS-Protection", "value": "1; mode=block" },
           { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
           { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
         ]
       },
       {
         "source": "/assets/(.*)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
         ]
       },
       {
         "source": "/videos/(.*)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }
         ]
       }
     ],
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://YOUR_RENDER_BACKEND_URL.onrender.com/api/:path*"
       },
       {
         "source": "/((?!api/).*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Once your Render Web Service is created, replace `https://YOUR_RENDER_BACKEND_URL.onrender.com` with your actual Render service URL (e.g. `https://prota-backend.onrender.com`).
4. Commit and push the updated `vercel.json` to GitHub.

### Deploying on Vercel:
1. Log in to **Vercel** and click **Add New...** > **Project**.
2. Select your `Prota` GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Environment Variables:
   - For **Mode A**: Leave empty or set `VITE_API_BASE_URL=/api/v1` (defaults to `/api/v1`).
   - For **Mode B**: Set `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api/v1`.
5. Click **Deploy**.
6. Once deployed, Vercel will provide your live URL (e.g. `https://prota.vercel.app`).

---

## 5. Step 4: Finalize CORS Configuration

1. In the **Render Dashboard**, open your `prota-backend` service.
2. Go to **Environment**.
3. Update `CORS_ALLOWED_ORIGINS` with your actual Vercel production domain:
   ```properties
   CORS_ALLOWED_ORIGINS=https://prota.vercel.app
   ```
   *(If you also have a custom domain e.g. `https://prota.app`, comma-separate: `https://prota.vercel.app,https://prota.app`).*
4. Save Changes (Render will trigger a zero-downtime redeployment).

---

## 6. Verification & Smoke Testing (PowerShell)

Run these PowerShell commands to verify your deployed endpoints:

### 1. Verify Health Endpoint
```powershell
Invoke-RestMethod -Uri "https://prota-backend.onrender.com/api/v1/actuator/health" -Method Get
# Expected output: @{status=UP; ...}
```

### 2. Verify CSRF Handshake
```powershell
$csrf = Invoke-RestMethod -Uri "https://prota-backend.onrender.com/api/v1/auth/csrf" -Method Get
$csrf | Format-List
# Expected: token, headerName = X-XSRF-TOKEN, parameterName = _csrf
```

### 3. Verify CORS Preflight
```powershell
$headers = @{
    "Origin" = "https://prota.vercel.app"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type,x-xsrf-token"
}
$response = Invoke-WebRequest -Uri "https://prota-backend.onrender.com/api/v1/auth/login" -Method Options -Headers $headers
$response.Headers["Access-Control-Allow-Origin"]
# Expected output: https://prota.vercel.app
```

---

## 7. Troubleshooting Common Deployment Issues

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **Container OOM Killed (Exit code 137)** | Default heap exceeded container RAM limit. | The Dockerfile automatically uses `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0` to constrain heap memory to 75% of the Render plan limit. |
| **Connection refused / SSL error to Neon** | Missing `?sslmode=require` in `DB_URL`. | Ensure `DB_URL` includes `?sslmode=require`. |
| **Flyway fails with advisory lock error** | Pooled endpoint (`-pooler`) was used instead of Direct. | Change `DB_URL` host to the Direct connection endpoint (remove `-pooler` from the hostname). |
| **Cold start timeout on first request** | Neon auto-suspend was active and timeout too short. | HikariCP `connection-timeout` is configured to 20s (20000ms), giving Neon ample time (~2s) to wake up. |
| **HTTP 401 on every authenticated request** | Session cookie is blocked or missing. | Ensure `credentials: 'include'` is active (configured in `api-client.ts`). In Mode A (Vercel rewrites), verify the rewrite rule points to your Render backend. In Mode B, ensure `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`. |
| **HTTP 403 Forbidden with Invalid CSRF Token** | CSRF token was not attached or mismatch occurred. | Verify `X-XSRF-TOKEN` header is being sent. In Mode A, `getCookie('XSRF-TOKEN')` reads the cookie natively. If cookies are partitioned, `ensureCsrfToken` fetches it via `/auth/csrf`. |
| **CORS error in browser console** | Origin mismatch. | Add the exact frontend origin (including `https://` and without trailing slash) to `CORS_ALLOWED_ORIGINS` in Render. |
| **Vercel returns 404 on direct page reload** | Missing SPA rewrite rule. | Ensure `frontend/vercel.json` is present with rewrite `/((?!api/).*)` to `/index.html`. |

---

## 8. Uploaded Avatar Persistence on Render

### Current Behavior & Ephemeral Storage
Prota stores user-uploaded avatars in the local directory `uploads/avatars/` relative to the backend working directory (handled in `UserService.java`). In Docker containers on Render, the filesystem is ephemeral unless mounted to a persistent volume; redeployments or container restarts recreate the filesystem, resetting files stored in `/app/uploads/avatars/`.

### Safest Persistence Options:
1. **Render Persistent Disk (No Code Changes Required)**:
   - In Render Web Service settings, navigate to **Disks** and click **Add Disk**.
   - **Name**: `prota-uploads`
   - **Mount Path**: `/app/uploads`
   - **Size**: 1 GB.
   - Because the Dockerfile creates and chowns `/app/uploads/avatars` to `prota:prota`, mounting a Render Disk at `/app/uploads` keeps all avatars persistent across container rebuilds, scaling events, and server reboots without introducing any external vendor SDKs or changing storage code.
2. **Graceful Fallback on Ephemeral / Free Tier**:
   - If running without a Persistent Disk, the frontend application already includes built-in fallback behavior: when a profile photo is absent or returns 404, the UI seamlessly displays the user's initials (via `getInitials(user.fullName)`).
   - In `UserService.java`, `getAvatarResource()` safely throws `ResourceNotFoundException("Avatar not found")`, returning a clean HTTP 404 error rather than crashing or exposing internal server errors.
