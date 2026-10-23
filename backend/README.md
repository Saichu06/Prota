# Prota — Backend Foundation

Backend service for **Prota**, a modern protein and nutrition tracking application. Built with Spring Boot, Spring Data JPA, Spring Security, Flyway, and PostgreSQL.

## Prerequisites

- **Java JDK**: 25+ (verified with Oracle JDK 26)
- **Build Tool**: Apache Maven 3.10+ (use bundled `./mvnw` / `mvnw.cmd`)
- **Database**: PostgreSQL 15+ (verified with PostgreSQL 18.4)

## Architecture & Technology Stack

- **Framework**: Spring Boot 4.1.1, Spring Framework 7.0.9
- **Database Migrations**: Flyway 12.4.0 (authoritative schema manager)
- **Persistence**: Spring Data JPA & Hibernate ORM 7.4.5 (DDL mode: `validate`)
- **Security**: Spring Security (stateless, conservative defaults, minimal public health endpoint)
- **Monitoring**: Spring Boot Actuator (`/api/v1/actuator/health`)
- **Driver**: PostgreSQL JDBC Driver 42.7.13

## Environment Variables

Copy `.env.example` to `.env` or set these environment variables in your environment:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://localhost:5432/prota` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `admin` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `dev` |
| `PORT` | HTTP server port | `8080` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |

> [!NOTE]
> Spring Boot does not read `.env` files automatically. Export environment variables in your shell, define them in your IDE run configuration, or supply them as system properties:
> ```powershell
> $env:DB_URL="jdbc:postgresql://localhost:5432/prota"
> $env:DB_USERNAME="postgres"
> $env:DB_PASSWORD="your_password"
> ```

## Database Setup & Migrations

1. Ensure PostgreSQL is running on port `5432`:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5432
   ```

2. Ensure the `prota` database exists:
   ```sql
   CREATE DATABASE prota;
   ```

3. Flyway migrations are located in `src/main/resources/db/migration/`:
   - `V1__create_initial_schema.sql`: Authoritative definition of the 12 approved tables, composite foreign keys for cross-user prevention, check constraints, and indexes.

4. Hibernate is strictly configured with `ddl-auto: validate` to ensure JPA entities never mutate the database schema independently.

## Running the Application

### Development Mode

Run via the Maven wrapper:
```powershell
.\mvnw.cmd spring-boot:run
```

The application runs with context path `/api/v1`:
- Health check: `http://localhost:8080/api/v1/actuator/health`

## Running Tests

Execute the automated test suite:
```powershell
.\mvnw.cmd test
```

### Verified Automated Tests:
- `DatabaseSchemaAndConstraintTests`:
  - Exactly 12 approved tables present in PostgreSQL.
  - Unique normalized email and case-insensitive uniqueness.
  - Unique `(user_id, log_date)` on daily logs.
  - Check constraints rejecting negative protein, negative calories, negative quantity, invalid weight (> 700 kg or <= 0), and excessive water (> 20000 ml).
  - Cross-user composite foreign keys rejecting cross-tenant references between users and daily logs/saved foods.
  - Historical preservation via `ON DELETE SET NULL (saved_food_id)` when saved food templates are deleted.
- `SecurityAndActuatorTests`:
  - Actuator health endpoint is publicly accessible without credentials.
  - Sensitive Actuator endpoints (`/actuator/beans`) require authentication.
  - Application business endpoints (`/daily-logs/*`, `/food-entries`, `/users/me`) require authentication.
  - CORS preflight options headers match configured origins.

## Troubleshooting

1. **Database connection failure (`Connection refused` or `password authentication failed`)**:
   Verify PostgreSQL service is running and credentials in `DB_USERNAME` / `DB_PASSWORD` match your local PostgreSQL server.
2. **Schema validation error (`SchemaManagementException`)**:
   Verify that Flyway migration `V1__create_initial_schema.sql` was applied cleanly and no manual column alterations exist out-of-sync with JPA entities.
3. **Google GenAI / Gemini client instantiation error**:
   Google GenAI starter is disabled via `spring.autoconfigure.exclude` until the Gemini integration milestone is explicitly implemented.
