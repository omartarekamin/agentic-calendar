# Agentic Calendar

### **A secure, full-stack AI calendar assistant built to turn natural language into real calendar actions.**

> Sign in. Connect Google Calendar. Ask for an agenda, find open time, or schedule a meeting — in a conversation.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Mastra](https://img.shields.io/badge/Mastra_AI-Agent_Framework-7C3AED?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Fast_LLM_Inference-F55036?style=for-the-badge)
![Descope](https://img.shields.io/badge/Descope-Identity_&_OAuth-2F80ED?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## Video Walkthrough

- [Example scenario](https://drive.google.com/file/d/1T3vaLu1Cy0gZoJLrVo_DfFJ7B0Fgtv9T/view?usp=sharing)
- [Example scenario](https://drive.google.com/file/d/1Uj4ve0BV_vYlyldLJ4_KvdwtUo5AvayR/view?usp=drive_link)

---

## Why This Project Stands Out

Agentic Calendar is not just a calendar UI. It is a **secure application boundary, an AI agent runtime, and a real productivity workflow** working together:

- **Conversational calendar operations** powered by Mastra and Groq
- **Server-Sent Event streaming** for responsive, token-by-token chat
- **Descope authentication and Google Calendar OAuth** with backend authorization
- **Strict user isolation** for identities, threads, tools, and calendar operations
- **Timezone-aware meeting tools** that convert wall-clock time into correct UTC instants
- **Agent memory** that retains conversation context and user preferences
- **Dockerized development and production environments** for reproducible setup
- **Typed API contracts, Zod validation, and parameterized SQL** throughout

---

## What It Does

Users can sign in, connect their Google Calendar, and manage a persistent chat workspace.

| Available now                                                      | Planned                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| Descope sign-in and protected routes                               | PostgreSQL-backed calendar event REST operations        |
| Google Calendar connection status and OAuth consent                | Full meeting conflict and synchronization workflow      |
| Mastra calendar tools: list, check, create, reschedule, and cancel | Google Meet invitation flows and provider edge handling |
| Conversation threads and streamed agent responses                  | Public MCP integration for external AI clients          |
| Server-side identity-derived authorization                         | Production memory storage and conversation retention    |

The implemented agent tools include:

- List upcoming meetings
- Check a calendar's busy intervals
- Create meetings and optionally add Google Meet
- Add attendee emails and Google Calendar invitations
- Reschedule existing meetings
- Cancel meetings

The agent can also remember the active conversation and user-scoped meeting preferences.

---

## System Architecture

```mermaid
flowchart LR
    U[User] --> FE[Next.js 16 Dashboard]
    FE -->|Descope session JWT| API[Express 5 API]
    API -->|Validate session| DS[Descope]
    API --> TM[Trusted request context]
    TM --> AS[Agent service]
    AS --> MA[Mastra agent]
    MA --> GR[Groq LLM]
    MA --> CT[Zod calendar tools]
    CT --> CAL[Google Calendar]
    API --> PG[(PostgreSQL)]
    CT --> SV[Shared services]
    SV --> PG

    FE -->|SSE chat stream| API
```

### Engineering boundaries

- **Frontend:** presentation, browser SDK integration, responsive chat UI
- **Backend:** authentication, authorization, validation, agent orchestration, business rules
- **Database:** raw parameterized PostgreSQL SQL with internal, per-user ownership
- **Agent:** Mastra tools call the same service layer used by the REST API
- **Identity:** OAuth credentials remain in Descope; Google access/refresh tokens are never exposed

---

## Technology Stack

| Area           | Technologies                                                                         |
| -------------- | ------------------------------------------------------------------------------------ |
| Frontend       | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Lucide React |
| Backend        | Node.js, Express 5, TypeScript ESM, Zod 4                                            |
| AI             | Mastra, Groq AI SDK, tool-calling agents, LibSQL working memory                      |
| Authentication | Descope Next.js SDK, Descope Node SDK, Bearer session JWT                            |
| Calendar       | Google Calendar API through Google APIs + Descope Outbound Apps                      |
| Database       | PostgreSQL 16, `pg`, transactional migrations                                        |
| Streaming      | Server-Sent Events                                                                   |
| DevOps         | Docker, Docker Compose, multi-stage production Dockerfiles                           |
| Testing        | Node test runner, Vitest, React Testing Library                                      |

---

## Engineering Highlights

### Authentication is enforced twice

Next.js Proxy improves navigation, while the Express backend independently validates every protected request. Identity comes only from the validated Descope `sub` claim, never from a client-supplied user ID.

### Agent tools cannot cross user boundaries

The tool factory permanently closes over the authenticated Descope identity. Tool arguments do not accept a model-controlled user ID, and every tool call reaches user-scoped services.

### Date and timezone mistakes are designed out

Tools accept IANA timezone names plus timezone-local ISO values or explicit UTC offsets. The backend converts wall-clock values into UTC using the requested timezone and validates ranges and daylight-saving behavior.

### One business layer serves every entry point

REST routes and AI tools share the service layer. This keeps authorization and calendar rules consistent instead of duplicating logic across HTTP and agent code.

### Realtime conversations without page reloads

The dashboard consumes structured SSE events for agent planning, tool progress, text tokens, completion, and failures.

---

## Repository Structure

```text
agentic-calender/
├── frontend/                # Next.js App Router experience
│   └── src/
│       ├── app/             # Routes, dashboard, sign-in, auth flows
│       ├── components/      # Shared and shadcn UI components
│       ├── hooks/           # Calendar connection state
│       └── lib/             # Typed API client and route constants
├── backend/                 # Express API and AI agent runtime
│   ├── src/
│   │   ├── routes/          # Protected HTTP routes
│   │   ├── services/        # Agent and calendar business logic
│   │   ├── middleware/      # Descope session authorization
│   │   ├── db/              # PostgreSQL pool and migrations
│   │   └── config/          # Agent instructions and memory
│   └── sql/                 # Ordered database migrations
├── docs/                    # Architecture and engineering decisions
├── docker-compose.yml       # Local development stack
└── docker-compose.prod.yml  # Production-mode container stack
```

---

## Run Locally

### 1. Configure environment variables

Create the backend and frontend environment files.

**Backend — `backend/.env`**

```dotenv
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5442/agentic_calendar_app_db
DESCOPE_PROJECT_ID=your-descope-project-id
DESCOPE_MANAGEMENT_KEY=your-descope-management-key
DESCOPE_CALENDAR_CONNECTION_ID=google-calendar
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:3000
```

**Frontend — `frontend/.env.local`**

```dotenv
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your-descope-project-id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Keep secrets server-side. Never add management keys or provider secrets to `NEXT_PUBLIC_*` variables.

### 2. Start with Docker

```bash
docker compose up --build
```

This starts PostgreSQL, Adminer, the Express backend, and the Next.js frontend.

| Service      | URL                          |
| ------------ | ---------------------------- |
| Application  | http://localhost:3000        |
| Backend API  | http://localhost:4000        |
| Health check | http://localhost:4000/health |
| Adminer      | http://localhost:8080        |
| PostgreSQL   | `localhost:5442`             |

### 3. Alternative: run services directly

```bash
# Terminal 1: PostgreSQL
docker compose up postgres adminer

# Terminal 2: Backend
cd backend
npm ci
npm run migrate
npm run dev

# Terminal 3: Frontend
cd frontend
npm ci
npm run dev
```

---

## Testing

Run the package-level test suites:

```bash
cd backend && npm test
cd frontend && npm test
```

The backend test suite covers authentication middleware, calendar date conversion, connection management, and agent route/service behavior. The frontend suite uses Vitest and React Testing Library for route protection and dashboard components.

For production builds:

```bash
cd backend && npm run build
cd frontend && npm run build
```

---

## Security Model

- Every protected backend endpoint validates a Descope Bearer JWT
- Every database operation is scoped to an authenticated internal user ID
- SQL values are parameterized
- OAuth and Google credentials are retained by Descope
- External HTTP, environment, and agent-tool inputs are validated with Zod
- CORS is configured for the intended frontend origin
- Internal errors never expose stacks, SQL, credentials, or raw provider errors

---

## Project Documentation

Detailed technical decisions and contracts live in the [docs](./docs) directory:

- [Architecture](./docs/architecture.md)
- [API contract](./docs/api-contract.md)
- [Authentication](./docs/auth.md)
- [Database](./docs/database.md)
- [Architecture decisions](./docs/decisions.md)
- [Roadmap](./docs/roadmap.md)
- [Backend conventions](./docs/backend-best-practices.md)

> **Note:** This repository is an active build. The README describes both the verified implementation and the next product milestones, while the roadmap clearly separates shipped functionality from planned integrations.
