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
session-aware frontend routing, a PostgreSQL connection/health check, and a
sign-in experience are present; calendar integration, application APIs,
agent workflows, chat persistence, and MCP capabilities are not implemented.

```
Browser (Next.js)
   | 1. Sign in via Descope flow -> session JWT
   | 2. HTTPS + Authorization: Bearer <JWT>
   v
Express API (Node.js)
   |-- auth middleware: validate JWT with Descope -> req.userId
   |-- REST routes -> services -> PostgreSQL
   '-- /chat route -> Mastra agent -> tools -> services -> PostgreSQL
```

## 2. Components

### Frontend (`frontend/`)

- Next.js App Router. The product experience will include Google Calendar
  connection, meeting management, and an AI chat interface.
- Descope `AuthProvider` manages the application session. Client route checks
  improve navigation but do not replace backend authorization.
- Holds presentation and UI state. Calendar and agent operations go through
  the backend.

### Backend (`backend/`)

```
src/
  index.ts          app bootstrap, listen
  config.ts         env loading + Zod validation
  middleware/       auth.ts (Descope), error-handler.ts
  routes/           events.ts, chat.ts, health.ts
  services/         event-service.ts (business logic, shared with agent tools)
  db/               client.ts (pg Pool), migrations/*.sql, queries
  agent/            Mastra agent, tools, and working memory
  integrations/     Google Calendar operations via Descope Connections
  mcp/              Descope MCP server integration and external tools
```

### Database (PostgreSQL via `docker-compose.yml`)

Single instance, one app database. Migrations are plain ordered `.sql` files in `backend/src/db/migrations/` **(draft)**.

### Auth (Descope)

- Descope hosts the login flow and issues the session JWT.
- Frontend: `@descope/nextjs-sdk` (session, user, route protection).
- Backend: `@descope/node-sdk` `validateSession(token)` -> user id from the `sub` claim.
- The Descope user id (`sub`) is the owner key in our tables. No password handling in our code.
- Google Calendar authorization will use Descope Connections. The connection
  flow, token lifecycle, and required scopes still need implementation.

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
  id          text primary key,         -- Descope user id (sub)
  email       text,
  created_at  timestamptz default now()
);

events (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references users(id) on delete cascade,
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

Users are upserted on first authenticated request.

## 4. API contract (draft)

All routes except `/health` require a valid Bearer token. Errors use `{ "error": { "code": string, "message": string } }`.

| Method | Path                  | Purpose                                         |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | `/health`             | Liveness check                                  |
| GET    | `/api/events?from&to` | List the user's events in a range               |
| POST   | `/api/events`         | Create an event                                 |
| PATCH  | `/api/events/:id`     | Update an event                                 |
| DELETE | `/api/events/:id`     | Delete an event                                 |
| POST   | `/api/chat`           | Send a message to the agent (streamed response) |

## 5. Key decisions

1. **Backend owns auth and data.** The frontend never talks to the database.
2. **No ORM.** Raw parameterized SQL via `pg`, kept in the db layer.
3. **One service layer** serves both REST routes and agent tools, so rules live in one place.
4. **UTC everywhere** in storage and transport. Convert to local time only in the UI.
5. **Zod at every boundary**: HTTP input, env, agent tool schemas.

## 6. Local development

1. `docker compose up -d` starts PostgreSQL.
2. Create `backend/.env` and `frontend/.env.local` (see `AGENTS.md` for variables).
3. Run migrations, then `npm run dev` in `backend/` and `frontend/`.

## 7. Open questions

- Google Calendar scopes, supported calendars, conflict handling, and
  synchronization/error behavior.
- Conversation schema, retention/deletion policy, and separation of persisted
  chat history from Mastra working memory.
- Which LLM provider and model for the agent?
- Meeting mutation confirmation policy, especially for cancellations and
  ambiguous natural-language requests.
- Google Meet and email invitation provider behavior and required permissions.
- MCP transport, external client authorization, tool permissions, and
  revocation lifecycle.
- Migration runner and production deployment model.

## 8. Related documentation

- [API contract](./api-contract.md)
- [Database schema and migration conventions](./database.md)
- [Authentication flow](./auth.md)
- [Backend best practices](./backend-best-practices.md)
- [Frontend best practices](./nextjs-best-practices.md)
- [Frontend performance](./nextjs-performance.md)
- [UI guidelines](./ui-guidelines.md)
- [Roadmap](./roadmap.md)
- [Architecture decisions](./decisions.md)
