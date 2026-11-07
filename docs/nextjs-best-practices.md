# Next.js Frontend Best Practices

This document describes conventions for this project's Next.js 16 App Router
frontend. Check the installed Next.js version when behavior may vary between
releases.

## Project boundaries

- The frontend owns presentation and UI state. Calendar and agent operations
  go through the typed API client to the Express backend.
- The backend is the source of truth for authentication, authorization,
  validation, business logic, and database access. Do not access PostgreSQL
  from Next.js components or trust a user ID provided by the browser.
- Do not expose server secrets through client components or `NEXT_PUBLIC_*`
  variables.
- Use Next.js Route Handlers only when a frontend-specific endpoint is
  necessary. They are not a replacement for the backend's application API.

## Routing and file conventions

- Use the App Router's special files for their intended roles: `page.tsx` for
  route UI, `layout.tsx` for shared UI, `loading.tsx` for loading boundaries,
  `error.tsx` for segment error boundaries, and `not-found.tsx` for 404 UI.
- Keep frontend navigation paths in `src/lib/paths.ts` and backend endpoint
  URLs in `src/lib/apiURLs.ts`; use these constants instead of duplicating
  route strings. The API URL helper uses `NEXT_PUBLIC_API_URL`, defaulting to
  `http://localhost:4000` for local development.
- Use route groups `(group)`, dynamic segments `[id]`, and private folders
  `_folder` to organize routes without changing public URLs.
- Keep components used only by one route in a `components/` folder beside that
  route's `page.tsx`. Keep shared components in `src/components/`, organized
  by purpose (for example, `ui/` and `auth/`). Create route-local folders only
  when the route has components to colocate.
- In Next.js 16, route protection uses `proxy.ts` (the successor to
  `middleware.ts`); use the project's Descope middleware there to protect
  routes before rendering, and keep it aligned with the session-cookie setup.
- A `route.ts` endpoint cannot coexist with `page.tsx` in the same route
  segment.
- Add parallel or intercepting routes only when the UX calls for concurrent
  route slots or navigation-aware overlays. Provide `default.tsx` for each
  parallel slot. For an intercepted modal, support direct URL navigation too.

## Server and Client Components

- Server Components are the default. Use them for server rendering and
  non-interactive UI.
- Add `"use client"` only for hooks, event handlers, browser APIs, or client
  state. Keep client boundaries small and close to the interactive component.
- Client Components cannot be `async`. Load data outside the client component
  and pass it as serializable props.
- Props crossing from Server to Client should be serializable plain values.
  Convert values such as `Date`, `Map`, or class instances to appropriate
  strings, arrays, or plain objects. Server Actions are the supported function
  exception.
- Use Server Actions for narrowly scoped form/mutation interactions when
  appropriate; they do not replace the Express API for calendar business
  operations.

## Async APIs and data flow

- Next.js request APIs such as `params`, `searchParams`, `cookies()`, and
  `headers()` are asynchronous in current versions. Type promise-based route
  props and await them, or use React `use()` in a synchronous component when
  appropriate.
- Start independent work in parallel with `Promise.all`; use Suspense when
  independent sections can render progressively. Avoid sequential fetches that
  create unnecessary waterfalls.
- For this application, fetch private calendar and agent data through the
  typed API client, attaching the Descope session token as required. Do not
  follow generic examples that access a database directly from a Server
  Component.
- Do not use Server Actions as a general read API. Keep user-specific data
  private and out of shared caches; preserve authorization and user isolation
  in every data path.

## Navigation, metadata, and assets

- Use `next/link` for internal navigation. Use navigation hooks only in Client
  Components.
- `metadata` and `generateMetadata` belong in Server Components. Prefer
  static metadata; generate it dynamically only when page content requires
  it. Never place private calendar or account data in public metadata.
- Use `next/image` for images, with meaningful alt text, actual dimensions or
  a sized `fill` container, and an accurate `sizes` value. Reserve `priority`
  for the actual above-the-fold LCP image.
- Use `next/font` and load only the needed font subsets and weights. Configure
  fonts centrally rather than re-declaring them in multiple components.
- Load third-party scripts with `next/script` and choose a loading strategy
  that matches their purpose. Give inline scripts an `id`; avoid redundant
  polyfills already supplied by Next.js.

## Suspense, errors, and navigation control flow

- Wrap `useSearchParams()` in a Suspense boundary on static routes; account for
  the boundary requirements of `usePathname()` on dynamic routes.
- Give Suspense boundaries useful, section-specific fallbacks rather than
  forcing an entire page into client rendering or blocking on unrelated data.
- Use `error.tsx` for route-segment failures and `global-error.tsx` for root
  layout failures. Add `not-found.tsx` where a custom 404 experience is needed.
- Next.js navigation functions such as `redirect()`, `notFound()`,
  `forbidden()`, and `unauthorized()` use control-flow exceptions. Do not
  swallow these in broad `try/catch` blocks; keep navigation calls outside
  catches or use `unstable_rethrow()` before handling other errors.
- Return explicit user-facing errors for expected failures; avoid success-like
  fallbacks that hide the underlying failure.

## Runtime, bundling, and deployment

- Use the default Node.js runtime unless a concrete Edge requirement exists
  and all required dependencies support it.
- If a dependency uses browser-only APIs, isolate it in a Client Component
  and load it client-side where needed. Use supported Next.js configuration
  such as `transpilePackages` or `serverExternalPackages` only for demonstrated
  bundling issues.
- Prefer Turbopack-compatible configuration; review custom Webpack settings
  before using them with the project's Next.js setup.
- Measure bundle changes with the analyzer available in the installed
  Next.js version instead of adding tooling without a demonstrated need.
- For containerized self-hosting, standalone output can reduce deployment
  size, but validate the actual build and deployment configuration first.
  Multi-instance ISR and path/tag revalidation require shared cache
  coordination; do not assume local filesystem caches are shared.
- Keep public build-time configuration separate from server-only runtime
  secrets. Build and verify the frontend before deployment.

## Debugging workflow

- Use the Next.js development overlay and server logs to diagnose build,
  runtime, and hydration errors. When available, Next.js 16's development MCP
  endpoint can expose route and error details; use the actual dev-server port.
- Common hydration causes include browser-only APIs during initial render,
  locale-dependent date output, random values, invalid HTML nesting, and
  third-party scripts that mutate the DOM. Make server and first client output
  deterministic, and isolate browser-only behavior.
- For an isolated build failure, use the installed Next.js version's
  route-specific debug-build option when supported; finish with the normal
  build to verify the whole frontend.

## Unit tests

- Run frontend unit tests with `npm test` from `frontend/`.
- Use Vitest with React Testing Library for component behavior; mock external
  SDKs and navigation rather than making tests depend on live services.
- Test meaningful loading, success, and redirect/error states for interactive
  components.

## Quick checklist

- [ ] Keep business logic, authentication, and database access in the backend.
- [ ] Default to Server Components; keep client boundaries small.
- [ ] Await async Next.js request APIs and pass serializable props.
- [ ] Keep private user data out of shared caches and public metadata.
- [ ] Use correct loading, error, and not-found boundaries.
- [ ] Optimize images, fonts, scripts, and bundles only where relevant.
- [ ] Verify against the installed Next.js version and run a production build.

## Related project documentation

- [Next.js frontend performance](./nextjs-performance.md)
- [Application architecture](./architecture.md)
