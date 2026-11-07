# Backend Best Practices

These conventions apply to the Node.js, TypeScript, and Express 5 API.

## Layering

Keep HTTP concerns, business logic, and persistence separate:

```text
routes/ -> services/ -> db/
```

- Routes parse and validate HTTP input, call services, and format responses.
- Services implement business rules and receive the authenticated user ID from
  trusted request context.
- The database layer owns SQL and row-to-TypeScript mapping.
- Routes and agent tools must not execute SQL directly.
- The agent (when added) must call the same service layer as HTTP routes.

## Express 5 and errors

- Use one central error-handling middleware registered after routes.
- Express 5 forwards rejected promises from async route handlers to error
  middleware. Do not add `try/catch` solely to call `next(error)`.
- Catch errors only when translating a known failure or performing necessary
  cleanup; do not suppress unexpected failures.
- Return the standard `{ "error": { "code": "...", "message": "..." } }`
  envelope from [api-contract.md](./api-contract.md).
- Log unexpected errors on the server without returning stack traces, SQL,
  credentials, or raw internal exceptions to clients.
- Handle expected failures with deliberate status codes, including Zod
  validation errors and authentication failures.

## Input validation and configuration

- Validate every external input with Zod: request bodies, query parameters,
  path parameters, environment variables, and future agent tool inputs.
- Validate once at the boundary, then pass typed values into services.
- Load environment configuration centrally (for example `src/config.ts`),
  validate it at startup, and avoid reading `process.env` from arbitrary
  modules.
- Keep secrets server-side and out of logs and API responses.

## TypeScript and modules

- The backend uses `"type": "module"`; use ESM imports and exports.
- Include `.js` extensions in relative TypeScript imports (for example,
  `import { getPool } from "./pool.js"`).
- Keep TypeScript strict and avoid `any`; define request/context types where
  needed instead of weakening types.
- Use `camelCase` in TypeScript. Map from database `snake_case` fields at the
  persistence boundary.

## Database access

- Use one shared `pg.Pool`, not a new pool per request.
- Use parameterized SQL and scope every user-owned row by the authenticated
  user ID.
- Keep SQL in the database layer. Use transactions for multi-statement writes
  that must be atomic.
- Use `timestamptz` and UTC instants; exchange date-time values as ISO 8601.
- Follow [database.md](./database.md) for schema and migration conventions.

## Authentication and authorization

- Validate Descope JWTs in backend middleware on every protected route.
- Derive the user ID from the validated token's `sub` claim.
- Never trust a request-supplied identity or rely on frontend route protection.
- Follow [auth.md](./auth.md) and [api-contract.md](./api-contract.md) for
  authentication and error behavior.

## Startup, shutdown, and dependencies

- Validate configuration before accepting traffic.
- Register JSON parsing, CORS, routes, not-found handling, and error handling
  in an intentional order.
- Close the shared pool during graceful shutdown.
- Do not add dependencies without approval; prefer the current stack:
  Express 5, Zod, `pg`, and the Descope SDK.

## Current implementation status

The backend currently contains an Express bootstrap, a PostgreSQL pool helper,
and a database-checking `/health` endpoint. The planned routes, configuration
module, auth middleware, service layer, migration runner, and central error
handler remain to be implemented.
