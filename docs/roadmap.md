# Roadmap

Status snapshot: 2026-11-13. Update this document when work is completed,
started, or reprioritized.

## Done

- Created the Next.js frontend and Express/TypeScript backend workspaces.
- Added Docker Compose development and production-mode stacks for PostgreSQL,
  the backend, and the frontend, with separate development and production
  Dockerfiles for both applications.
- Added the backend PostgreSQL pool helper and `/health` database check.
- Added server-side Descope client configuration and bearer session middleware
  with backend tests.
- Added the initial users repository and transactional SQL migration runner.
- Added protected Google Calendar connection start, lookup, and status-refresh
  APIs backed by Descope Outbound Apps and PostgreSQL status metadata.
- Added the Descope frontend provider and sign-in flow component.
- Added dashboard logout functionality.
- Added the dashboard layout shell with Google Calendar connection controls;
  chat and calendar-event actions remain presentational or unavailable.
- Established the initial frontend Tailwind v4, shadcn Base UI, and theme
  token setup.
- Documented architecture, frontend best practices/performance, API contract,
  database, authentication, backend conventions, UI guidelines, and decisions.

## In progress

- No implementation task is currently recorded as actively in progress.
- Product implementation remains early: calendar event operations, agent
  workflows, persisted conversations, and MCP tools are not implemented.

## Next

1. Implement Google Calendar event, meeting, and conversation persistence
   models as required by the approved designs.
2. Finalize Google Calendar event scopes, token lifecycle, and sync/conflict
   behavior.
3. Implement user-scoped meeting services and REST endpoints that create,
   list, reschedule, and cancel meetings with parameterized SQL and Google
   Calendar synchronization.
4. Implement calendar event and chat workflows, then connect the dashboard
   shell with loading, empty, failure, and sync states.
5. Finalize mutation confirmation rules, chat streaming protocol, conversation
   persistence, and working-memory design; then integrate Mastra.
6. Implement Google Meet and email invitation support with explicit
   permissions and failure behavior.
7. Integrate the Descope MCP server and expose appropriately authorized
   calendar tools to external AI clients.

## Later / decisions needed

- Define Google Calendar scopes, sync conflicts, and connection lifecycle.
- Choose the LLM provider/model and chat-history storage/retention design.
- Define chat streaming protocol and agent action confirmation UX.
- Specify Google Meet/email invite behavior and MCP transport/client
  authorization.
- Add deployment-specific cache, health-check, and operational requirements
  when the target hosting model is selected.
