# PROTA — Database Migration, Backup & Disaster Recovery Runbook

**Document Target**: Neon PostgreSQL (Free Tier) & Local Development Database  
**Migration Manager**: Flyway 11 / 12  
**ORM Validation**: Hibernate (`ddl-auto: validate`)  
**Operating System**: Windows / PowerShell Compatible Runbook

---

## 1. Important Deployment Philosophy & Choices

When deploying Prota to production on Neon, you have **two fundamentally different deployment choices**:

### Choice A: Fresh Production Database on Neon (Recommended)
- You create a fresh, empty project/database on Neon (e.g. `neondb`).
- When the Spring Boot application starts up on Render for the first time, Flyway automatically discovers all unapplied migrations (`V1`, `V2`, `V3`, `V4`), creates the `flyway_schema_history` table, executes the migrations transactionally, and initializes a clean schema with zero initial user records.
- **Data Safety**: No historical or development test data is imported. Cleanest and zero risk of corrupting test artifacts into production.

### Choice B: Migrating Existing Local Development Data to Neon
- If the owner specifically wishes to migrate existing development user accounts, meal histories, or customized foods to the production Neon database:
- You must create a verified logical dump using `pg_dump`, verify row counts and integrity, and restore into the separate Neon database over SSL.

> [!CAUTION]
> **CRITICAL SAFETY RULES**:
> 1. Never run `DROP`, `TRUNCATE`, or destructive queries against the production database or local database.
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

## 4. Step 3: Backing Up from Neon (Production Backup)

To take a regular backup directly from Neon PostgreSQL to your local machine:

```powershell
# Set Neon production connection variables (from Neon console)
$env:NEON_HOST = "ep-xxxx.us-east-2.aws.neon.tech"
$env:NEON_USER = "neondb_owner"
$env:NEON_DB   = "neondb"
$env:PGPASSWORD = "[YOUR_NEON_PASSWORD]"
$env:PGSSLMODE = "require"

$neonBackupFile = "$backupDir\neon_prota_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

& 'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe' `
    -h $env:NEON_HOST `
    -p 5432 `
    -U $env:NEON_USER `
    -d $env:NEON_DB `
    -F c `
    -b `
    -v `
    -f $neonBackupFile
```

---

## 5. Step 4: Restoring Local Data to Neon (Optional)

> [!WARNING]
> Only perform this step if you have explicitly chosen **Choice B (Data Migration)**. For a fresh deployment, skip this step and let Flyway initialize tables on application startup.

```powershell
# Set target Neon production database variables
$env:NEON_HOST = "ep-xxxx.us-east-2.aws.neon.tech"
$env:NEON_PORT = "5432"
$env:NEON_USER = "neondb_owner"
$env:NEON_DB   = "neondb"
$env:PGPASSWORD = "[YOUR_NEON_PASSWORD]"
$env:PGSSLMODE  = "require"

# Restore into Neon production database over SSL
& 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' `
    -h $env:NEON_HOST `
    -p $env:NEON_PORT `
    -U $env:NEON_USER `
    -d $env:NEON_DB `
    -v `
    --no-owner `
    --no-privileges `
    $backupFile
```

---

## 6. Step 5: Verify Restored Record Counts & Integrity

Run this verification query against Neon to confirm row counts:

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

# Run against Neon over SSL
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
    -h $env:NEON_HOST `
    -p 5432 `
    -U $env:NEON_USER `
    -d $env:NEON_DB `
    -c $verifyScript
```

---

## 7. Step 6: Flyway Migration History on Neon

### Inspecting Flyway State on Neon
Flyway records each migration's checksum, execution duration, and success flag in `flyway_schema_history`.
```sql
SELECT installed_rank, version, description, execution_time, success 
FROM flyway_schema_history 
ORDER BY installed_rank;
```

### Safe Recovery from a Failed Migration
If a migration fails due to a syntax issue or transient network interruption:
1. The transaction rolls back automatically for DDL-compliant operations.
2. In `flyway_schema_history`, the migration will be marked with `success = false`.
3. To recover safely:
   - Identify the exact error in Render build logs.
   - Clean up the failed migration row:
     ```sql
     DELETE FROM flyway_schema_history WHERE version = 'X' AND success = false;
     ```
   - Re-deploy. Do **NOT** modify already applied migrations (`V1` through `V4`).

---

## 8. Step 7: Neon Native Point-in-Time Recovery & Branching

One of Neon's primary benefits is **instant point-in-time recovery and zero-copy branching**:

1. **Instant Rollback / Recovery Branching**:
   - In the **Neon Console**, select your project and navigate to **Branches**.
   - You can create a new branch from any exact timestamp (point in time) before an incident occurred.
   - You can point your Render Web Service to the newly branched connection string in seconds.
2. **Local Database Safety**:
   - Your local PostgreSQL database on `localhost:5432` remains completely isolated, untouched, and unexposed throughout this process.
