# Prota — Database Architecture & Schema Management

This directory documents the PostgreSQL database design, data dictionary, integrity constraints, and schema migration strategy for **Prota**.

## Authoritative Schema Ownership

- **Migration Tool**: Flyway 12.4.0
- **Migration Location**: `backend/src/main/resources/db/migration/`
- **Initial Migration**: `V1__create_initial_schema.sql`
- **Rule**: Flyway is the sole authoritative schema manager. Hibernate runs in `ddl-auto: validate` mode and is never permitted to mutate or generate tables.

## Exactly 12 Approved Tables

| # | Table | Description | Key Constraints & Integrity Rules |
| :- | :--- | :--- | :--- |
| 1 | `users` | Account identity and authentication credentials | UUID PK, Unique email (`LOWER(email)` index), status enum check |
| 2 | `user_settings` | Current user goals and display preferences | One-to-one with `users` (`user_id` PK & FK), positive protein check, valid unit/theme/tz |
| 3 | `daily_logs` | Calendar-day record preserving immutable goal snapshots | Unique `(user_id, log_date)`, snapshot positive goals |
| 4 | `food_entries` | Logged meals and nutrition intake events | Composite FK `(user_id, daily_log_id)` preventing cross-user leakage, non-negative nutrition |
| 5 | `saved_foods` | Reusable food templates & custom nutrition items | Composite uniqueness `(user_id, id)`, positive serving quantities |
| 6 | `water_entries` | Discrete water intake events | FK to `users`, positive `amount_ml` (<= 20,000 ml) |
| 7 | `weight_entries` | Periodic body weight measurements | Stored canonically in kilograms (`NUMERIC(7,3)`), positive check (<= 700 kg) |
| 8 | `ai_food_estimates`| AI multimodal meal estimations awaiting confirmation | JSONB payload, status enum, never automatically counted into totals |
| 9 | `reminder_settings`| Scheduled user reminders (protein, water, weight) | Unique `(user_id, reminder_type)`, JSONB scheduled times, quiet hours |
| 10 | `push_subscriptions`| Web push notification subscription endpoints | Unique `endpoint`, p256dh and auth keys |
| 11 | `notification_events`| Outbox queue for scheduled notification dispatches | Unique `deduplication_key`, status enum, retry attempt count |
| 12 | `refresh_tokens` | Rotating cryptographic refresh token hashes | Unique `token_hash`, family UUID for reuse detection, expiry instant |

## Cross-User Integrity Enforcement

To prevent cross-tenant data corruption at the database level:
- `daily_logs`, `saved_foods`, and `ai_food_estimates` expose a composite candidate key `(user_id, id)`.
- `food_entries` enforces composite foreign keys:
  - `FOREIGN KEY (user_id, daily_log_id) REFERENCES daily_logs(user_id, id) ON DELETE CASCADE`
  - `FOREIGN KEY (user_id, saved_food_id) REFERENCES saved_foods(user_id, id) ON DELETE SET NULL (saved_food_id)`
  - `FOREIGN KEY (user_id, ai_estimate_id) REFERENCES ai_food_estimates(user_id, id) ON DELETE SET NULL (ai_estimate_id)`

This mathematically prevents User A from logging meals into User B's daily log or referencing User B's templates, even in the event of an application-layer bug.

## Historical Integrity & Deletion Rules

- **Deleting a Food Entry**: Removes only that specific entry; the daily log and its goal snapshot remain intact.
- **Deleting a Saved Food Template**: Uses `ON DELETE SET NULL (saved_food_id)` on `food_entries`, ensuring historical food entries retain their full nutritional values and name snapshot.
- **Deleting a User Account**: Cascades to all child records owned by that user.

## Resetting a Disposable Development Database

To reset your local development database cleanly:

```powershell
$env:PGPASSWORD="admin"
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -d prota -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Then rerun the backend tests to re-apply the Flyway migration:
```powershell
cd ../backend
.\mvnw.cmd test
```

## References

- Visual Entity-Relationship Diagram: `../documentation/er.pdf`
- Architecture Documentation & REST Contract: `../documentation/Prota — Architecture Documentation.pdf`
