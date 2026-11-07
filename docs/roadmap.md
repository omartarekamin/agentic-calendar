# Roadmap

Status snapshot: 2026-11-07. Update this document when work is completed,
started, or reprioritized.

## Done

- Created the Next.js frontend and Express/TypeScript backend workspaces.
- Added PostgreSQL 16 local infrastructure in `docker-compose.yml`.
- Added the backend PostgreSQL pool helper and `/health` database check.
- Added server-side Descope client configuration and bearer session middleware
  with backend tests.
- Added the initial users repository and transactional SQL migration runner.
- Added the Descope frontend provider and sign-in flow component.
- Added dashboard logout functionality.
- Established the initial frontend Tailwind v4, shadcn Base UI, and theme
  token setup.
- Documented architecture, frontend best practices/performance, API contract,
  database, authentication, backend conventions, UI guidelines, and decisions.

## In progress

- No implementation task is currently recorded as actively in progress.
- Product implementation remains early: calendar integration, protected
  application APIs, agent workflows, persisted conversations, and MCP tools
  are not implemented.

## Next

1. Add central error handling and protected API foundations.
2. Implement Google Calendar connection metadata, meeting, and conversation
   persistence models as required by the approved designs.
3. Implement Google Calendar authorization through Descope Connections,
   including scopes, token lifecycle, and sync/conflict behavior.
4. Implement user-scoped meeting services and REST endpoints that create,
   list, reschedule, and cancel meetings with parameterized SQL and Google
   Calendar synchronization.
5. Add the typed frontend API client and calendar/chat interface, including
   loading, empty, failure, and sync states.
6. Finalize mutation confirmation rules, chat streaming protocol, conversation
   persistence, and working-memory design; then integrate Mastra.
7. Implement Google Meet and email invitation support with explicit
   permissions and failure behavior.
8. Integrate the Descope MCP server and expose appropriately authorized
   calendar tools to external AI clients.

## Later / decisions needed

- Define Google Calendar scopes, sync conflicts, and connection lifecycle.
- Choose the LLM provider/model and chat-history storage/retention design.
- Define chat streaming protocol and agent action confirmation UX.
- Specify Google Meet/email invite behavior and MCP transport/client
  authorization.
- Add deployment-specific cache, health-check, and operational requirements
  when the target hosting model is selected.
