# Next.js Frontend Performance

This document describes performance practices for this project's Next.js 16
and React 19 frontend.

## Project boundaries

- Keep the frontend focused on UI. Fetch calendar and agent data through the
  typed API client; do not connect frontend components directly to PostgreSQL.
- The backend owns authentication, authorization, business rules, and data
  access. Never expose server secrets or trust a user ID supplied by the UI.
- Treat calendar and other user-specific responses as private. Do not put them
  in a shared or static cache. Any caching must preserve authentication and
  strict per-user isolation.
- Use Next.js Route Handlers only for frontend-specific needs. The Express
  backend remains the API for application business logic.

## Core practices

### Measure before optimizing

Use Lighthouse or browser performance tools to identify the actual bottleneck,
then compare results after a change. Use the Core Web Vitals as guideposts:

| Metric | Good target | Typical focus |
| --- | --- | --- |
| LCP | Under 2.5 seconds | Main visible content, images, fonts |
| INP | Under 200 milliseconds | Client JavaScript and interaction work |
| CLS | Under 0.1 | Image dimensions, fonts, reserved loading space |

### Keep rendering on the server by default

- Prefer Server Components for static UI and server-rendered work.
- Add `"use client"` only where browser APIs, React state, effects, event
  handlers, or other client-only behavior is needed; keep those boundaries
  close to the interactive elements.
- Fetch app data through the frontend API client, not direct database access.
- Use async Server Components and await Next.js request APIs such as `params`
  where required by the current Next.js version.
- Use React 19 features such as `use`, `useOptimistic`, and `useActionState`
  only when they simplify the interaction and fit the existing app patterns.

### Stream independently useful content

- Put Suspense boundaries around slow, independent sections rather than
  blocking an entire page on unrelated requests.
- Use specific loading UI that reserves appropriate space and communicates
  the shape of the pending content.
- Start independent requests in parallel when possible, while preserving
  dependencies between requests.

### Optimize images and fonts

- Use `next/image` for raster images, provide meaningful alt text and either
  intrinsic dimensions or a sized `fill` container with an appropriate
  `sizes` value.
- Prioritize only the above-the-fold image that is the page's likely LCP
  element; allow other images to load lazily.
- Use `next/font` for local or supported Google fonts, limit subsets, and
  configure font usage centrally. Avoid importing the same font in multiple
  components.
- Add placeholders or reserve layout space when doing so improves perceived
  loading without adding unnecessary complexity.

### Cache deliberately

- Next.js caching defaults and APIs vary by version; confirm behavior against
  the installed Next.js version before relying on a cache.
- Cache only data that is safe to reuse across requests. Calendar events,
  account data, and agent conversations are user-specific and must not enter a
  shared cache.
- For any approved cache, define an appropriate lifetime and invalidation
  strategy. Revalidate relevant paths or tags after mutations where applicable.

### Control client bundle growth

- Dynamically load genuinely large or rarely used interactive components when
  they are not needed for initial content.
- Prefer focused imports and avoid adding large dependencies for marginal
  benefits. Analyze bundle output before making bundle-related changes.
- Keep server-only code, credentials, and data access out of client modules.

### Metadata and API handlers

- Define page metadata using the App Router metadata APIs; generate dynamic
  metadata only when it depends on page data.
- Add robots, sitemap, or structured data only when relevant to the page and
  product; do not publish private application content in SEO metadata.
- Validate inputs and enforce appropriate authorization for any Route Handler.
  Do not treat framework caching or route placement as a substitute for
  backend authorization.

## Practical checklist

- [ ] Identify and measure the bottleneck before changing code.
- [ ] Keep components server-rendered unless interactivity requires a client.
- [ ] Use independent Suspense boundaries and useful loading states where they
      improve the experience.
- [ ] Provide image dimensions or a sized `fill` container, meaningful alt
      text, and accurate responsive sizes.
- [ ] Optimize only the actual LCP image and the fonts the page uses.
- [ ] Keep user-specific data out of shared caches.
- [ ] Verify bundle or Core Web Vitals changes with a relevant measurement.

## Related project documentation

- [Next.js frontend best practices](./nextjs-best-practices.md)
- [Application architecture](./architecture.md)
