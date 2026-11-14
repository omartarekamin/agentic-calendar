# Architecture

> Living document. Update it whenever a design decision changes. Items marked **(draft)** are proposals to confirm while building.

## 1. Overview

Agentic Calendar is a full-stack application for securely managing Google
Calendar meetings through natural-language conversations with an AI agent.
Users will be able to create, find, reschedule, and cancel meetings in chat,
with successful changes reflected in Google Calendar. The application is also
intended to support streamed responses, persistent conversations and agent
working memory, Google Meet links and email invitations, and MCP access for
external AI clients.

These are product goals, not a description of currently available features.
The current implementation is an early scaffold: Descope sign-in and
session-aware frontend routing, a PostgreSQL connection/health check, and
protected Google Calendar connection management through Descope Outbound Apps
are present. Calendar event synchronization, agent workflows, chat
persistence, and MCP capabilities are not implemented.

```
Browser (Next.js)
   | 1. Sign in via Descope flow -> session JWT
   | 2. HTTPS + Authorization: Bearer <JWT>
   v
Express API (Node.js)
   |-- auth middleware: validate JWT -> req.user, req.userId, req.dbUserId
   |-- REST routes -> services -> PostgreSQL
   '-- /chat route -> Mastra agent -> tools -> services -> PostgreSQL
```

## 2. Components

### Frontend (`frontend/`)

- Next.js App Router. The product experience will include Google Calendar
  connection, meeting management, and an AI chat interface.
- Descope `AuthProvider` manages the application session. Next.js Proxy
  redirects unauthenticated dashboard requests before rendering; frontend
  route protection does not replace backend authorization.
- Holds presentation and UI state. Calendar and agent operations go through
  the backend.

### Backend (`backend/`)

```
src/
  index.ts          app bootstrap, listen
  config/           descope.ts (server-side Descope client)
  middleware/       requireSession.ts (Descope), error-handler.ts
  routes/           connection.routes.ts, events.ts, chat.ts, health.ts
  services/         connection.service.ts, event-service.ts (shared with agent tools)
  db/               pool.ts, user.repository.ts, migrate.ts
  sql/              ordered SQL migrations
  agent/            Mastra agent, tools, and working memory
  integrations/     Google Calendar operations via Descope Outbound Apps
  mcp/              Descope MCP server integration and external tools
```

### Database (PostgreSQL via `docker-compose.yml`)

Single instance, one app database. Ordered SQL migrations are stored in
`backend/sql/` and run by `backend/src/db/migrate.ts`.

### Auth (Descope)

- Descope hosts the login flow and issues the session JWT.
- Frontend: `@descope/nextjs-sdk` (session, user, route protection).
- Backend: `@descope/node-sdk` `validateSession(token)` -> user id from the
  `sub` claim, provided to protected routes by `requireSession` middleware.
- The Descope user id (`sub`) is stored in `users.auth_user_id`; tables use
  their internal `users.id` UUID for foreign keys. No password handling in our
  code.
- Google Calendar authorization uses the configured Descope outbound
  application. The backend records a pending status and returns the app ID;
  the frontend starts consent with the Descope browser SDK and active session.
  The backend checks Descope for the user's token when status is refreshed.
  Calendar tokens remain in Descope.

### Agent (Mastra, not installed yet)

- The agent will support listing, creating, rescheduling, and cancelling
  meetings from natural-language requests.
- Tools call the shared service layer, never raw SQL, and receive the
  authenticated user identity from trusted request context, never from the
  model.
- Responses will stream to the frontend. Conversation history will persist in
  PostgreSQL, separately from agent working memory.
- Meeting operations will use the user's Google Calendar connection so
  successful updates are reflected in Google Calendar.
- Google Meet links and email invitations are intended meeting capabilities;
  their exact behavior and provider requirements remain to be specified.

### MCP (planned)

- The application will integrate with the Descope MCP server and expose
  calendar capabilities as MCP tools to external AI clients.
- Tool authorization must use the authenticated user's identity and Google
  Calendar connection. Transport details, client onboarding, and permission
  boundaries must be designed before implementation.

## 3. Data model (draft)

```sql
users (
  id          uuid primary key default gen_random_uuid(),
  auth_user_id text unique not null,    -- Descope user id (sub)
  email       text,
  created_at  timestamptz default now()
);

connections (
  user_id   uuid not null references users(id) on delete cascade,
  provider  text not null check (provider in ('calendar')),
  status    text not null check (status in ('connected', 'disconnected', 'pending')),
  primary key (user_id, provider)
);

events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null check (ends_at > starts_at),
  location    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index on events (user_id, starts_at);
```

The authentication middleware upserts a user by `auth_user_id` on each
protected request and exposes the internal users-table UUID as `req.dbUserId`.

## 4. API contract (draft)

All routes except `/health` require a valid Bearer token. Errors use `{ "error": { "code": string, "message": string } }`.

| Method | Path                                    | Purpose                                  |
| ------ | --------------------------------------- | ---------------------------------------- |
| GET    | `/health`                               | Liveness check                           |
| POST   | `/api/connections/connect`              | Start Google Calendar OAuth consent flow |
| GET    | `/api/connections/calendar-connection`  | Get stored calendar connection status    |
| POST   | `/api/connections/refresh-status`       | Refresh status from Descope tokens        |
| GET    | `/api/events?from&to`                   | List the user's events in a range         |
| POST   | `/api/events`                           | Create an event                           |
| PATCH  | `/api/events/:id`                       | Update an event                           |
| DELETE | `/api/events/:id`                       | Delete an event                           |
| POST   | `/api/chat`                             | Send a message to the agent (streamed)    |

## 5. Key decisions

1. **Backend owns auth and data.** The frontend never talks to the database.
2. **No ORM.** Raw parameterized SQL via `pg`, kept in the db layer.
3. **One service layer** serves both REST routes and agent tools, so rules live in one place.
4. **UTC everywhere** in storage and transport. Convert to local time only in the UI.
5. **Zod at every boundary**: HTTP input, env, agent tool schemas.

## 6. Local development

1. Create `backend/.env` and `frontend/.env.local` (see `AGENTS.md` for
   variables).
2. Run `docker compose up --build` from the repository root. This starts
   PostgreSQL, the backend, the frontend, and Adminer. The backend waits for
   PostgreSQL, applies pending migrations, and then starts its development
   server.
3. Open the frontend at `http://localhost:3000`, the API at
   `http://localhost:4000`, and Adminer at `http://localhost:8080`. PostgreSQL
   is available on host port `5442`.

The development services use `backend/Dockerfile.dev` and
`frontend/Dockerfile.dev`; source directories are mounted for hot reload.

## 7. Production containers

Copy `.env.example` to `.env`, replace every placeholder, and set
`APP_URL` and `NEXT_PUBLIC_API_URL` to the public frontend and backend origins.
`DATABASE_URL` must use `postgres` as its hostname so the backend can reach the
database on the Compose network. Keep the database password URL-safe or
percent-encode it in `DATABASE_URL`.

Build and start the production stack with
`docker compose -f docker-compose.prod.yml up --build -d`. It builds the
frontend and backend from their respective `Dockerfile.prod` files, runs
pending database migrations before starting the API, and keeps PostgreSQL
private to the Compose network. The frontend and backend are published on
ports `3000` and `4000`; Adminer is not included.

This Compose configuration is a production-mode container build, not a
complete public deployment recipe. TLS termination, a reverse proxy, external
secret management, backups, and hosting-specific operations still need to be
configured for the chosen deployment platform.

## 8. Open questions

- Google Calendar event scopes, supported calendars, conflict handling, and
  synchronization/error behavior.
- Conversation schema, retention/deletion policy, and separation of persisted
  chat history from Mastra working memory.
- Which LLM provider and model for the agent?
- Meeting mutation confirmation policy, especially for cancellations and
  ambiguous natural-language requests.
- Google Meet and email invitation provider behavior and required permissions.
- MCP transport, external client authorization, tool permissions, and
  revocation lifecycle.
- Production hosting platform and deployment operations, including TLS,
  secret management, and backup strategy.

## 9. Related documentation

- [API contract](./api-contract.md)
- [Database schema and migration conventions](./database.md)
- [Authentication flow](./auth.md)
- [Backend best practices](./backend-best-practices.md)
- [Frontend best practices](./nextjs-best-practices.md)
- [Frontend performance](./nextjs-performance.md)
- [UI guidelines](./ui-guidelines.md)
- [Roadmap](./roadmap.md)
- [Architecture decisions](./decisions.md)
