# Database

PostgreSQL 16 is the application's database. The initial users table is
defined in `backend/sql/001_users.sql`; applied migration filenames are tracked
in `schema_migrations`.

## Ownership and access

- The backend is the only application layer that connects to PostgreSQL.
- Scope every event read, update, and delete by the authenticated user's
  internal UUID (`req.dbUserId`).
- Use parameterized SQL (`$1`, `$2`, etc.); never interpolate user input into
  SQL text.
- Keep SQL in the database layer and business rules in services.

## Target schema

The following is the planned initial schema, not a record of already-applied
migrations:

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_valid_time_range CHECK (ends_at > starts_at)
);

CREATE INDEX events_user_starts_at_idx ON events (user_id, starts_at);
```

`backend/sql/002_connections.sql` adds the connection-status table used by the
Descope Google Calendar connection endpoints:

```sql
CREATE TABLE connections (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('calendar')),
  status text NOT NULL CHECK (status IN ('connected', 'disconnected', 'pending')),
  PRIMARY KEY (user_id, provider)
);
```

This table contains status metadata only. Descope retains OAuth credentials.

`users.auth_user_id` is the validated Descope subject (`sub`); `users.id` is
an internal UUID for database relationships. SQL uses `snake_case`; TypeScript
API objects use `camelCase`. Map database rows to application/API types in
the database or service boundary rather than exposing raw rows.

All stored instants use `timestamptz` and UTC. API timestamps are ISO 8601
strings. Convert to a user's local timezone only for display.

## Migration rules

- Store ordered SQL migrations in `backend/sql/`.
- Use sequential, descriptive filenames such as
  `001_users.sql`.
- Treat migrations as append-only once applied. Correct mistakes with a new
  migration rather than editing a migration that may have run elsewhere.
- Keep each migration focused. The runner applies each migration
  transactionally.
- Review destructive changes and data-loss implications before applying them.
- `backend/src/db/migrate.ts` tracks applied filenames in `schema_migrations`.
  Run pending migrations with `npm run migrate` from `backend/`.

## Naming and query conventions

- Tables and columns: `snake_case`; TypeScript variables/properties:
  `camelCase`.
- Primary keys: `id`; ownership foreign keys: `user_id`.
- Foreign keys, check constraints, indexes, and unique constraints should
  have descriptive names.
- Use explicit columns in queries rather than `SELECT *`.
- Bind all external values as query parameters.
- Use transactions for multi-statement writes that must succeed or fail as a
  unit.
- Use the shared `pg.Pool`; do not create a pool per request.

## Local database

`docker-compose.yml` runs `postgres:16-alpine` and maps host port `5442` to
container port `5432`. The local database is named `agentic_calendar_app_db`.
Credentials in the compose file are for local development only and must not be
reused as production secrets.
