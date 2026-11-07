# UI Guidelines

These guidelines document the current visual foundation and the conventions
for extending the Agentic Calendar frontend. The application UI is still under
development; recommendations below are not claims that every pattern is
already implemented.

## Visual foundation

- Use the CSS variables in `frontend/src/app/globals.css` as the source of
  truth for colors, borders, rings, and radii. Prefer semantic tokens such as
  `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`,
  `border-border`, and `bg-primary` over hard-coded color values.
- The current palette is teal-forward with a light and dark theme. Preserve
  the existing CSS variable system when adding colors.
- Use the configured fonts: Plus Jakarta Sans for body/UI text and Source Serif
  4 for headings. They are defined in the root layout as CSS variables.
- The shared radius token is `0.85rem`; use the generated radius utilities
  consistently instead of introducing unrelated corner styles.
- Use Tailwind CSS v4 utilities and CSS-first configuration in `globals.css`.

## Components and icons

- Use the installed shadcn/ui Base UI variant. The component configuration is
  in `frontend/components.json`; do not introduce Radix-based components.
- Reuse components in `frontend/src/components/ui/` before creating new
  primitives. Current components include buttons, cards, badges, accordion,
  scroll area, separator, skeleton, textarea, and tooltip.
- Add generated shadcn components through the project CLI when needed; avoid
  hand-editing generated component internals unless required.
- Use `cn()` from `frontend/src/lib/utils.ts` to compose conditional classes.
- Use `lucide-react` for interface icons and keep icon sizes and stroke weight
  consistent within a control.

## Layout and interaction

- Build responsive layouts mobile-first and use a consistent spacing rhythm
  from Tailwind's spacing scale.
- Use cards and borders to establish hierarchy rather than adding many
  competing shadows or accent colors.
- Ensure interactive controls have visible focus states, clear disabled and
  pending states, and accessible names.
- Use semantic HTML and maintain readable contrast in both light and dark
  themes.
- Keep animation subtle and purposeful. Respect reduced-motion preferences
  when adding non-essential motion.

## Loading, empty, and error states

- Keep content layout stable while loading; use the existing `Skeleton`
  component for content-shaped placeholders.
- Product-facing pages must explain the intended Google Calendar and
  natural-language agent workflow. Clearly distinguish planned capabilities
  from functionality that is already available.
- Empty states should explain what is empty and provide a relevant next
  action when one exists. Do not show a blank panel or a fake example as live
  user data.
- For failed requests, show an actionable, user-readable error and provide a
  retry path where appropriate. Do not silently replace failures with empty
  results.
- For chat streaming, distinguish sending, streaming, completed, and failed
  states. Preserve existing conversation content when a new message fails.
- Destructive actions should be visually distinct and require clear user
  intent; the exact confirmation behavior should be decided before adding
  agent-driven destructive operations.

## Existing visual cues

`globals.css` defines a soft teal radial-gradient `.app-shell-bg`, a
`.message-enter` animation, and a `.composer-glow` treatment. Reuse these
utilities only where they fit the UI; avoid duplicating their styles inline.

## Before adding a UI pattern

1. Check for an existing component or semantic CSS token.
2. Follow the established light/dark palette and typography.
3. Include responsive, focus, pending, empty, and failure states relevant to
   the component.
4. Update this document if the shared design system changes.
