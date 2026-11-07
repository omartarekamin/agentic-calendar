# Authentication and Authorization

Descope handles sign-in and issues session tokens. The backend is the
authorization boundary: frontend route guards improve navigation but do not
secure API data.

## Request flow

1. The user signs in through the Descope flow rendered by the Next.js app.
2. The Descope frontend SDK manages the session and provides a session JWT.
   The root layout configures session and refresh tokens to use cookies.
3. For each protected backend request, the frontend sends the session token
   as `Authorization: Bearer <token>`.
4. Backend authentication middleware extracts the bearer token and validates
   it with the Descope Node SDK.
5. On successful validation, the backend derives the user ID from the token's
   `sub` claim and makes it available to downstream route/service code.
6. Services and database queries use that authenticated user ID for ownership
   checks and row scoping.

The frontend sign-in provider/component is present. Backend token-validation
middleware and protected application routes are not implemented yet.

Google Calendar authorization is a separate, planned integration. The product
will use Descope Connections for Google Calendar access; no Google connection
flow, scopes, or token lifecycle is implemented yet. Google connection
credentials must remain server-side and must not be confused with the
application's Descope session JWT.

## Security requirements

- Validate the token on every protected API request. Never trust a user ID in
  a request body, query string, or path as proof of identity.
- Treat a missing, invalid, or expired bearer token as `401 UNAUTHENTICATED`,
  using the standard error format in [api-contract.md](./api-contract.md).
- Return `403 FORBIDDEN` only when the authenticated identity is known but the
  operation is explicitly disallowed. For a resource owned by a different
  user, prefer `404 NOT_FOUND` to avoid disclosing its existence.
- Scope every database operation on user-owned data to the validated `sub`.
- Do not log bearer tokens, refresh tokens, cookies, or raw authentication
  credentials.
- Keep Descope project configuration and server secrets out of client code.
  Only values intentionally public, such as the frontend project ID, may use
  the `NEXT_PUBLIC_` prefix.
- Configure CORS to allow the intended frontend origin; CORS is not a
  substitute for authentication or authorization.

## Frontend route protection

The root route checks the Descope session and sends signed-in users to
`/dashboard` and signed-out users to `/sign-in`. The sign-in page redirects
signed-in users to `/dashboard`, while `/dashboard` sends signed-out users to
`/sign-in`. These routes use the Descope `useSession()` hook and wait for its
session-loading/refresh check before rendering or redirecting, including after
a page refresh.

The sign-in page's layout and copy are Server Component UI. Only the Descope
flow and session-dependent route guard are Client Components.

These client-side redirects improve navigation only; they are not an
authorization boundary. Every protected backend endpoint must independently
validate the JWT.

## Account identity

The Descope subject (`sub`) is the canonical user key. Do not substitute email,
display name, a frontend-generated ID, or an agent-provided ID. If user records
are created or upserted, derive the ID only from the validated token.

## Configuration and lifecycle

- Frontend: `NEXT_PUBLIC_DESCOPE_PROJECT_ID`.
- Backend: `DESCOPE_PROJECT_ID`, loaded and validated with the other backend
  configuration.
- Let the Descope SDK manage token refresh according to the configured
  frontend session behavior. API calls must use a current session token and
  handle authentication failures without silently treating them as success.
- Document any change to cookie behavior, token transport, claims, or
  validation rules here and in the related API contract.
