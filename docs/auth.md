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
5. On successful validation, the backend derives the Descope subject from
   `sub`, exposes all validated token claims as `req.user`, and upserts the
   corresponding user.
6. Downstream code receives the Descope subject as `req.userId` and the
   database user's internal UUID as `req.dbUserId`.

The frontend sign-in provider/component and backend bearer-token validation
middleware are present. Protected application routes have not been added yet.
The middleware returns the standard `401 UNAUTHENTICATED` error for a missing
or invalid token. It exposes the validated token claims (excluding the raw
JWT) as `req.user`, the `sub` as `req.userId`, and the database UUID as
`req.dbUserId`.

The authenticated dashboard provides a logout control using Descope's
`useDescope().logout()` API. After logout completes, it routes the user to
`/sign-in`; a failed logout remains on the dashboard and displays an error.

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
- Scope every database operation on user-owned data to the database UUID
  (`req.dbUserId`) resolved from the validated `sub`.
- Do not log bearer tokens, refresh tokens, cookies, or raw authentication
  credentials.
- Keep Descope project configuration and server secrets out of client code.
  Only values intentionally public, such as the frontend project ID, may use
  the `NEXT_PUBLIC_` prefix.
- Configure CORS to allow the intended frontend origin; CORS is not a
  substitute for authentication or authorization.

## Frontend route protection

Next.js Proxy protects `/dashboard` and redirects requests without a valid
Descope session token to `/sign-in` before rendering the page. It does not
accept a refresh token alone as authorization. The root route sends signed-in
users to `/dashboard` and signed-out users to `/sign-in`; the sign-in page
redirects signed-in users to `/dashboard` using the server-side route guard.
The Descope flow and interactive controls remain Client Components.

These frontend redirects improve navigation only; they are not an
authorization boundary. Every protected backend endpoint must independently
validate the JWT.

## Account identity

The Descope subject (`sub`) is stored as `users.auth_user_id`; `users.id` is
the database's internal UUID. Do not substitute email, display name, a
frontend-generated ID, or an agent-provided ID for the subject. User records
are upserted only from validated token claims.

## Configuration and lifecycle

- Frontend: `NEXT_PUBLIC_DESCOPE_PROJECT_ID`.
- Backend: `DESCOPE_PROJECT_ID` and `DESCOPE_MANAGEMENT_KEY`, validated by the
  server-side Descope client configuration in `backend/src/config/descope.ts`.
  Keep both values server-side; the management key is a secret.
- Let the Descope SDK manage token refresh according to the configured
  frontend session behavior. API calls must use a current session token and
  handle authentication failures without silently treating them as success.
- Document any change to cookie behavior, token transport, claims, or
  validation rules here and in the related API contract.
