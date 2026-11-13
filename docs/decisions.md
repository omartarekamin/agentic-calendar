# Architecture Decisions

Record durable choices here so future changes do not accidentally reverse
them. Keep each entry short; update the relevant detailed document when a
decision changes.

## Confirmed

### Backend owns authentication, data, and business rules

The frontend is a UI client. The Express backend validates Descope sessions,
authorizes access, and owns database operations. This keeps identity checks
and data rules in one trusted layer.

### PostgreSQL access uses raw parameterized SQL, not an ORM

The backend uses `pg` and keeps SQL in the database layer. This matches the
current dependency set and keeps database behavior explicit. All external
values must be parameterized.

### REST routes and agent tools share the service layer

Business rules must not diverge between direct API calls and future agent
actions. Agent tools will receive user identity from trusted request context
and call services, never raw SQL.

### UTC storage and transport

Store instants as `timestamptz` and exchange them as ISO 8601 strings in UTC.
Convert to local time only for display in the UI.

### Zod at external boundaries

Validate HTTP input, environment configuration, and future agent tool input
with Zod so untrusted data is checked before entering application logic.

### Frontend stack and component variant

The frontend uses Next.js App Router, React, Tailwind CSS v4, and shadcn/ui
Base UI components. The project is configured for Base UI rather than Radix.

### Product direction: conversational Google Calendar management

The target product securely connects a user's Google Calendar through Descope
Outbound Apps and lets them list, create, reschedule, and cancel meetings using
natural language with a Mastra agent. Successful changes must be reflected in
Google Calendar. The experience also targets streamed responses, persistent
chat history, agent working memory, Google Meet and email invite support, and
calendar MCP tools for external AI clients through the Descope MCP server.
These are product requirements; the integrations and workflows are not yet
implemented. Their detailed behavior remains subject to the open questions in
[architecture.md](./architecture.md).

## Not decided

- LLM provider and model.
- Confirmation of the proposed Server-Sent Events protocol for chat in
  [api-contract.md](./api-contract.md).
- Confirmation requirements and conflict handling for agent-proposed
  calendar mutations.
- Google Calendar scopes, Google Meet and email invite details.
- Chat history schema, retention, and separation from agent working memory.
- MCP transport, client authorization, and tool permission boundaries.
- Migration runner and production deployment model.

Do not treat undecided items as implementation requirements. Resolve and
record a decision before introducing behavior that depends on one.
