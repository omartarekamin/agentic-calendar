# CLAUDE.md

Agentic Calendar: a full-stack AI agent app. Users sign in, then chat with an agent that reads and manages their calendar.

## IMPORTANT — Rule #1: read /docs first

**Before generating or editing any code, list `/docs` and read EVERY file in it. This is important and mandatory.** Treat those files as the source of truth for architecture, data model, API contracts, and decisions. Re-read them if they change during the session. If a request conflicts with `/docs`, say so and ask before proceeding. After a decision changes the design, update the matching doc in the same task.

## Structure

```
backend/             Node.js + Express API, agent, DB access
frontend/            Next.js app (UI only, no business logic)
docs/                Architecture and decision docs (read these first)
docker-compose.yml   Local infrastructure (PostgreSQL)
```

## Stack

| Layer    | Tech                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI variant), lucide-react |
| Backend  | Node.js, Express 5, TypeScript (ESM), Zod 4, `pg`, `cors`, `dotenv`                                                  |
| Auth     | Descope (`@descope/nextjs-sdk` on the frontend, `@descope/node-sdk` on the backend)                                  |
| Database | PostgreSQL 16 via Docker, raw SQL with `pg` (no ORM)                                                                 |
| Agent    | Mastra (**not installed yet**, will live in `backend/src/agent/`)                                                    |

## Commands

```bash
docker compose up -d        # start PostgreSQL
cd backend  && npm run dev  # tsx watch src/index.ts
cd backend  && npm run build && npm start
cd frontend && npm run dev
cd frontend && npm run build && npm start
cd frontend && npm test
```

Always add or update relevant unit tests after generating or changing code, and run them before finalizing. Run the affected package's tests and fix failures; run both frontend and backend tests when the change affects both. Do not claim tests passed unless they were run. If test infrastructure or dependencies are missing, ask before adding dependencies.

## Behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Keep project documentation current

Whenever code is generated or changed, review whether the change affects architecture, data models, API contracts, authentication, user-visible behavior, design conventions, or another documented capability. Update every relevant file in `/docs` in the same task; do not limit documentation updates to `AGENTS.md`. Also update `AGENTS.md` when durable project-wide instructions or conventions change. Put architectural decisions, data models, API contracts, feature behavior, and UI conventions in `/docs`; keep `AGENTS.md` focused on durable project-wide instructions and conventions. If no suitable `/docs` file exists, create one when the change warrants it. Do not duplicate the same detailed information across multiple files.

## Core rules

- **Auth is enforced on the backend.** The frontend gets a Descope session JWT and sends it as `Authorization: Bearer <token>`. The backend validates it with the Descope node SDK on every protected route. Never trust a user id sent in a body or query. Always derive it from the validated token.
- **Every DB query is scoped by the authenticated user id** and uses parameterized SQL (`$1, $2`). Never concatenate input into SQL.
- **Validate all external input with Zod** (request bodies, query params, env vars, agent tool inputs).
- **Secrets stay server-side.** Only `NEXT_PUBLIC_*` values may reach the browser. Never commit `.env` files. Keep `.env.example` current.
- **Agent tools** (once Mastra is added) must call the same service layer as the REST routes, receive the user id from request context, and have Zod input schemas.
- Do not add dependencies without asking. Prefer what is already installed.

## Backend conventions

- `"type": "module"`: use ESM only. Relative imports **must include the `.js` extension** (e.g. `import { db } from "./db/client.js"`).
- Layering: `routes/` (HTTP, validation) -> `services/` (business logic) -> `db/` (SQL). Routes never touch `pg` directly.
- Express 5 forwards rejected promises from async handlers to the error middleware, so no try/catch wrappers just to call `next(err)`. Use one central error handler.
- Config is loaded and validated once in `src/config.ts` (dotenv + Zod). Never read `process.env` elsewhere.
- Use a single shared `pg.Pool`. Use transactions for multi-statement writes.
- Use `snake_case` in SQL and `camelCase` in TypeScript. Map at the db layer.
- Dates are stored as `timestamptz` (UTC) and exchanged as ISO 8601 strings.

## Frontend conventions

- Next.js 16 conventions: Server Components by default, add `"use client"` only when needed. Request APIs (`cookies`, `headers`, `params`, `searchParams`) are async. Route protection lives in `proxy.ts` (the successor to `middleware.ts`) using the Descope SDK. Check current docs if unsure.
- Tailwind v4 is CSS-first: configure in `globals.css`, with no `tailwind.config.js`.
- UI components come from shadcn (Base UI variant, not Radix). Add them with `npx shadcn@latest add <component>` into `components/ui/`. Do not hand-edit generated files unless necessary.
- Use the `cn()` helper from `lib/utils.ts` for class merging.
- All API calls go through one typed client in `lib/api.ts` that attaches the Descope token.
- TypeScript strict mode. No `any`. Share types with the backend by copying contracts from `/docs`, not by cross-package imports.

## Environment variables

- `backend/.env`: `PORT`, `DATABASE_URL`, `DESCOPE_PROJECT_ID`, `DESCOPE_MANAGEMENT_KEY`, `DESCOPE_CALENDAR_CONNECTION_ID`, `FRONTEND_URL` (for CORS), plus the LLM provider key when Mastra is added.
- `frontend/.env.local`: `NEXT_PUBLIC_DESCOPE_PROJECT_ID`, `NEXT_PUBLIC_API_URL`.

## Working style

- Make small, focused changes. Explain the plan briefly before large ones.
- Match existing code style. Name files in `kebab-case`, components in `PascalCase`.
- If something is ambiguous or missing from `/docs`, ask instead of guessing.
- When finished, state what changed, how to run it, and anything left unverified.
