# PROTA — Database Migration, Backup & Disaster Recovery Runbook

**Document Target**: PostgreSQL 16+ / 18.x  
**Migration Manager**: Flyway 11 / 12  
**ORM Validation**: Hibernate (`ddl-auto: validate`)  
**Operating System**: Windows / PowerShell Compatible Runbook

---

## 1. Important Deployment Philosophy & Choices

When deploying Prota to production, you have **two fundamentally different deployment choices**:

### Choice A: Fresh Production Database (Recommended for New Deployments)
- You provision a fresh, empty PostgreSQL database on Render.
- When the Spring Boot application starts up for the first time, Flyway automatically discovers all unapplied migrations (`V1`, `V2`, `V3`, `V4`), creates the `flyway_schema_history` table, executes the migrations transactionally, and initializes a clean schema with zero initial user records.
- **Data Safety**: No historical or development test data is imported. Cleanest and zero risk of corrupting test artifacts into production.

### Choice B: Migrating Existing Local / Development Data to Production
- If the owner specifically wishes to migrate existing development user accounts, meal histories, or customized foods to the production database:
- You must create a verified logical dump using `pg_dump`, verify row counts and integrity, and restore into the separate production database.

> [!CAUTION]
> **CRITICAL SAFETY RULES**:
> 1. Never run `DROP`, `TRUNCATE`, or destructive queries against the production database.
> 2. Never modify an existing, already-applied Flyway migration file (`V1` through `V4`). Schema alterations must always be implemented as new versioned files (e.g. `V5__...sql`).
> 3. Always maintain a dated, verified backup before any maintenance window.

---

## 2. Step 1: Identify Current Local Database

To inspect your local PostgreSQL instance and confirm table structure and record counts:

```powershell
# Set local PostgreSQL connection variables
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "admin"
$env:PGDATABASE = "prota"

# Verify PostgreSQL connection and list current tables
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -c "\dt"

# Check applied Flyway migration history
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -c "SELECT installed_rank, version, description, type, script, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;"
```

---

## 3. Step 2: Create a Verified Backup Using `pg_dump`

Use `pg_dump` with the custom directory or binary format (`-Fc`), which includes schema definitions, data, and compression, and allows selective or complete restore via `pg_restore`:

```powershell
# Create backup destination directory
$backupDir = "D:\PROJECTS\Prota\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$backupFile = "$backupDir\prota_backup_$timestamp.dump"

Write-Host "Creating backup: $backupFile" -ForegroundColor Cyan

# Execute pg_dump
& 'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe' `
    -h localhost `
    -p 5432 `
    -U postgres `
    -d prota `
    -F c `
    -b `
    -v `
    -f $backupFile

# Verify backup file size and integrity
if (Test-Path $backupFile) {
    $fileSize = (Get-Item $backupFile).Length
    Write-Host "Backup completed successfully! Size: $fileSize bytes" -ForegroundColor Green
    
    # Verify backup contents table of contents
    & 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' -l $backupFile | Select-Object -First 20
} else {
    Write-Error "Backup creation failed!"
}
```

---

## 4. Step 3: Provision a Separate Production Database

In the **Render Dashboard**:
1. Click **New +** > **PostgreSQL**.
2. Name: `prota-prod-db`.
3. Database: `prota`.
4. User: `prota_user`.
5. Copy the **External Connection String** (for local CLI access if migrating data) and **Internal Connection String** (for Render backend web service access).

---

## 5. Step 4: Restoring Data to Production (Optional)

> [!WARNING]
> Only perform this step if you have explicitly chosen **Choice B (Data Migration)**. For a fresh deployment, skip this step and let Flyway initialize tables on application startup.

```powershell
# Set target production database variables (from Render External Connection details)
$env:PROD_HOST = "dpg-xxxx-a.oregon-postgres.render.com"
$env:PROD_PORT = "5432"
$env:PROD_USER = "prota_user"
$env:PROD_DB   = "prota"
$env:PGPASSWORD = "[YOUR_RENDER_EXTERNAL_DB_PASSWORD]"

# Restore into production database
& 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' `
    -h $env:PROD_HOST `
    -p $env:PROD_PORT `
    -U $env:PROD_USER `
    -d $env:PROD_DB `
    -v `
    --no-owner `
    --no-privileges `
    $backupFile
```

---

## 6. Step 5: Verify Restored Record Counts & Integrity

Run this verification script to ensure row counts and referential constraints are completely aligned:

```powershell
$verifyScript = @"
SELECT 'users' AS table_name, count(*) AS row_count FROM users
UNION ALL
SELECT 'user_settings', count(*) FROM user_settings
UNION ALL
SELECT 'daily_logs', count(*) FROM daily_logs
UNION ALL
SELECT 'food_entries', count(*) FROM food_entries
UNION ALL
SELECT 'saved_foods', count(*) FROM saved_foods
UNION ALL
SELECT 'water_entries', count(*) FROM water_entries
UNION ALL
SELECT 'weight_entries', count(*) FROM weight_entries
UNION ALL
SELECT 'ai_food_estimates', count(*) FROM ai_food_estimates
UNION ALL
SELECT 'diet_plans', count(*) FROM diet_plans
UNION ALL
SELECT 'workout_plans', count(*) FROM workout_plans;
"@

# Run against database
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
    -h $env:PROD_HOST `
    -p $env:PROD_PORT `
    -U $env:PROD_USER `
    -d $env:PROD_DB `
    -c $verifyScript
```

---

## 7. Step 6: Flyway Migration History & Conflict Resolution

### Inspecting Flyway State
Flyway records each migration's checksum, execution duration, and success flag in `flyway_schema_history`.
Before starting the backend, you can inspect the table:
```sql
SELECT installed_rank, version, description, execution_time, success 
FROM flyway_schema_history 
ORDER BY installed_rank;
```

### Safe Recovery from a Failed Migration
If a migration fails due to a network interruption or invalid SQL statement:
1. The transaction will roll back automatically for DDL-compliant operations.
2. In `flyway_schema_history`, the migration will be marked with `success = false`.
3. To recover safely:
   - Identify the exact error in Render build logs.
   - Fix the underlying syntax or constraint issue.
   - Delete the failed history row (if necessary) via:
     ```sql
     DELETE FROM flyway_schema_history WHERE version = 'X' AND success = false;
     ```
   - Do **NOT** modify already successful migrations (`V1` through `V4`).

---

## 8. Step 7: Rollback & Recovery Strategy

If a newly deployed release fails or encounters unexpected errors in production:

1. **Immediate Service Rollback on Render**:
   - In the Render Dashboard, navigate to **Web Service > Deploys**.
   - Click on the previous working deploy and click **Rollback to this deploy**.
   - Render will immediately spin up the previous container version with zero delay.
2. **Database State Preservation**:
   - Since Prota migrations are strictly additive (adding new tables/columns like `V2`, `V3`, `V4` rather than dropping or renaming existing ones), rolling back the application code to a prior commit does not break backwards database compatibility.
   - If a point-in-time database restoration is necessary:
     ```powershell
     & 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' `
         -h $env:PROD_HOST -p $env:PROD_PORT -U $env:PROD_USER -d $env:PROD_DB `
         --clean --if-exists `
         $backupFile
     ```
3. **Local Database Preservation**:
   - The original local PostgreSQL database on `localhost:5432` remains untouched and intact throughout this process.
