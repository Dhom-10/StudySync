---
name: studysync-design
description: StudySync frontend design system — exact fonts, color tokens, border/radius rules, and component patterns established on the landing page. Load this before building, restyling, or adding any page/component to frontend/ (login, signup, dashboard, record, or any new feature) so new UI matches the existing bold cream/black/yellow poster look instead of drifting to defaults.
---

# StudySync design system

The whole frontend is being rebuilt page by page on top of one landing page
(`frontend/src/app/page.tsx`) that is the canonical reference for this look. Don't introduce new
colors, fonts, radii, or border weights — reuse what's documented here. If a new situation isn't
covered below, match it to the closest existing pattern rather than inventing something new.

The visual language is a bold "poster / neo-brutalist" editorial style: warm cream background,
near-black ink, thick black borders, a punchy marker-yellow accent, and oversized condensed
display type for headlines. It comes from two hand-authored mockups kept for reference in
`frontend/src/design/*.dc.html` — `StudySync Landing v2.dc.html` is the current authoritative one;
`StudySync.dc.html` / `StudyWindow.dc.html` are an earlier draft (different fonts/colors, ignore
their font-family and color values, the structural ideas are still valid).

## Fonts

Three families, loaded via `next/font/google` in `frontend/src/app/layout.tsx` and exposed as CSS
vars consumed by `frontend/src/app/globals.css`:

| Role | Family | Tailwind class | Used for |
| --- | --- | --- | --- |
| Body / UI | **Figtree** (400/500/700) | `font-sans` (default) | paragraphs, nav links, buttons, form fields |
| Display | **Bricolage Grotesque** (variable, weight 700–800, width 75–100) | `font-display` | huge headlines, section titles, feature-card titles, brand wordmark |
| Labels / mono | **JetBrains Mono** (400/500) | `font-mono`, or the `.label-mono` utility | small uppercase eyebrow labels, timestamps, due-date chips |

Display headlines use the condensed end of Bricolage Grotesque's width axis — always pair
`font-display font-extrabold` with `[font-stretch:75%]` and tight tracking
(`tracking-[-0.02em]`ish). See `Hero`, `FeatureGrid`, `ClosingCta` in `app/page.tsx`.

The `.label-mono` utility (defined in `globals.css`) is the standard way to render a small
uppercase mono eyebrow label: `text-xs tracking-[0.12em] text-muted-foreground uppercase`. Use it
directly (`<span className="label-mono">Topics</span>`) rather than retyping those classes. When a
label needs to look like normal running text instead of a spaced-out eyebrow (e.g. the window
mockup's title-bar breadcrumb), override with `normal-case tracking-normal`.

## Color tokens

All colors are CSS custom properties in `globals.css` `:root`, mapped into Tailwind via
`@theme inline`. Never hardcode a hex value in a component — use the semantic class.

| Token | Value | Tailwind class | Meaning |
| --- | --- | --- | --- |
| `--background` | `#ece8dc` | `bg-background` | page backdrop (muted warm paper) |
| `--foreground` | `#111111` | `text-foreground`, `border-foreground` | ink — text and (almost) all borders |
| `--card` | `#fffdf7` | `bg-card` | cream-white surface for cards/panels/popovers |
| `--muted-foreground` | `#555555` | `text-muted-foreground` | secondary/eyebrow text |
| `--highlight` | `#ffe22e` | `bg-highlight`, `text-highlight-foreground` | marker yellow — the signature accent |
| `--destructive` | `#ec3a2a` | `bg-destructive`, `text-destructive` | signal red — recording dot, errors, the strike bar |
| `--border` / `--input` | `#111111` | `border-border` | same ink black, used for default component borders |
| `--ring` | `#ffe22e` | (focus-visible rings) | yellow focus ring on most controls |

There is no dark mode — it was deliberately removed. Don't add `dark:` variants or a theme toggle.

## Borders, radius, shape — two registers

The system deliberately mixes two registers: bold "poster" editorial elements, and standard/premium
shadcn-Vercel-style interactive controls. Don't blend them within one element.

- **Editorial register** (cards, badges, small chips/checkboxes): thick, visible
  `border-2 border-foreground`. Radius here is generous: `rounded-xl` (12px) for cards,
  `rounded-[6px]` for small chips, `rounded-full` for badges/pills. Keep this exactly as-is.
- **Page-structure and frame borders are subtle — this is settled, confirmed by the user.**
  Structural/framing borders are `border border-foreground/10` (1px, faint), not the thick
  editorial-register border: the outer page frame, `SiteHeader`'s bottom border, the footer's top
  border, the feature-grid dividers, the yellow `WindowBand`'s top/bottom border, **and** the
  embedded "window" mockup's own outer frame + internal dividers (title bar, two-pane split) —
  `rounded-[22px]` stays. This started as an experiment comparing bold vs. subtle and the user
  confirmed they prefer subtle, then explicitly asked to extend it to the window mockup's frame
  too. What stayed bold *inside* the window mockup on purpose: the traffic-light dots, topic
  pills, the due-date chip, and the task checkbox — those are still editorial-register components
  (badges/chips), not page framing, so they keep `border-2`. Use `border-foreground/10` for any
  new structural/framing divider; reserve bold `border-2` for actual badge/card/chip components.
- **Control register** (`Button`, `Input`): standard shadcn/Vercel styling — thin `border` (1px,
  `border-input`/`border-transparent` depending on variant), `rounded-md`, a subtle `shadow-xs`,
  not pill-shaped. This applies **everywhere**, including the landing page's own CTA buttons (the
  big hero "Start recording" button is still `rounded-md`, not a pill — only its `h-*`/`px-*`/
  `text-*` are scaled up for marketing size). The bold poster identity lives in the typography,
  color and layout around these controls, not in the controls' own border weight.
  - `components/ui/button.tsx` variants: `default` = black fill/cream text, `outline` = cream
    fill/`border-input`/black text, `secondary` = yellow fill (CTA accent, no border), `ghost` /
    `link` = no border/shadow, `destructive` = red fill/white text. Default Tailwind heights
    (`h-8`/`h-9`) are too short for marketing-scale buttons — override with `h-auto` plus explicit
    `px-*`/`py-*`/`text-*` for a mockup's larger button (see every CTA in `app/page.tsx`); radius
    stays `rounded-md` regardless of size.
  - `components/ui/input.tsx`: `h-9`, `rounded-md`, `border border-input`, `shadow-xs`, cream
    `bg-card`. This is the shadcn-default look translated onto our ink/cream palette. **Exception:**
    `Input`'s focus ring is `focus-visible:border-foreground focus-visible:ring-foreground/15` (a
    neutral ink ring), not the yellow `--ring` token every other focusable control uses — the user
    explicitly didn't want a yellow glow on form fields. Don't "fix" this back to `ring-ring`.
  - **Only `Button` and `Input` have been moved to this register so far.** Other form primitives
    (`Select`, `Textarea`, `Checkbox`) still carry the older thick-border treatment from before
    this change — don't assume they match `Input` until the user asks for that pass too; ask
    rather than guessing which register a not-yet-touched primitive should use.
- **The signature flat drop shadow**: standout cards (the embedded recording/summary window) get
  `shadow-[0_10px_0_var(--highlight)]` — a hard-edged yellow offset shadow, no blur, part of the
  editorial register. Reserve it for one hero element per view, not every card, and never put it on
  a `Button`/`Input`.

## Component patterns

- **Badges/pills** (`components/ui/badge.tsx`): editorial register, pill-shaped, `border-2`.
  `outline` = cream bg + black border (topic tags), a yellow-filled variant for due-date/highlight
  chips. For the small **non-pill** rounded-rect chip style (`rounded-[6px]`, mono text) seen on
  due-date chips, don't fight the Badge component — just use a styled `<span>` with `label-mono` +
  the border/bg classes directly (see the "Due Fri, Oct 16" chip in `StudyWindowPreview`).
- **Cards** (`components/ui/card.tsx`): editorial register, `border-2 border-foreground`,
  `rounded-xl`, `bg-card`.
- **The "window" chrome pattern — two different weights depending on context.** The decorative,
  marketing-only version (`StudyWindowPreview` in `app/page.tsx`, static fake data, lives in the
  landing page's yellow `WindowBand`) is a full "sticker" card: bordered, `rounded-[22px]`, yellow
  `shadow-[0_10px_0_var(--highlight)]` drop-shadow, three dots + `label-mono` breadcrumb top bar.
  **`app/record/page.tsx` reuses only the top-bar motif** (three dots + a breadcrumb, here an
  editable title `<input>`, under a plain `border-b border-foreground/10`) and the two-pane
  `border-r`-divided split — but as flat, edge-to-edge content inside `DashboardSidebar`'s `<main>`,
  with **no** outer card border, no rounded corners, no yellow shadow (see the "don't nest two
  bordered frames" rule above). The dots+breadcrumb bar is the shared identity between "this is a
  screenshot of the app" (landing) and "this is the app" (dashboard); the rounded/shadowed card
  wrapper is exclusively a landing-page decoration. Don't add the card treatment back to a real
  working page.
- **Marker highlight**: `<mark className="bg-highlight ...">` for inline emphasis in headlines/body
  copy, optionally with a slight tilt (`-rotate-[1.5deg]`) for a hand-marked sticker feel on big
  headlines. The red "strike" device (a thick absolutely-positioned bar through a word, not
  `text-decoration`) is reserved for the hero headline — see `Hero` in `app/page.tsx`.

## Layout

- The whole site lives inside one `max-w-[1280px]` card, centered on the muted `bg-background`
  backdrop with page padding (`p-4 sm:p-8`) around it — this "poster framed on a mat" composition
  is the site's overall shell. Keep new top-level pages inside this same framed container rather
  than going edge-to-edge. (The frame's own border is currently the subtle `border-foreground/10`
  treatment noted above.)
- **Every page's header is `<SiteHeader>` (`components/site-header.tsx`) — never hand-roll a
  `<header>`.** It fixes the navbar at a constant `h-20` and renders the brand mark linked to `/`;
  pass page-specific right-side content (nav links, a "Back" link, whatever) as `children`. This is
  what keeps navbar height identical across every page — before this existed, two pages with
  slightly different header content silently ended up different heights. Don't go back to copying
  a `<header>` block per page.
- Section dividers between major blocks (footer/feature-grid rows) follow whatever the current
  page-structure border treatment is (see above) — not shadows or spacing alone.
- **Auth pages (login/signup) use a two-column split**: a plain, uncarded form on the left
  (vertically centered, no border/shadow around the form itself — simplicity comes from the form
  being bare, not from dropping the layout) and a `bg-highlight` promo panel on the right
  (diagonal hash-stripe overlay via `repeating-linear-gradient(135deg, rgba(17,17,17,0.08) ...)`,
  bottom-anchored content: a `label-mono` eyebrow, a big `font-display` headline, a line of body
  copy, one outline button). The right panel is `hidden` below `lg` — mobile just gets the centered
  form. `app/login/page.tsx` and `app/signup/page.tsx` are intentional near-duplicates of this same
  layout (only the form fields and heading copy differ) — keep them in sync when one changes. Both
  have, below the submit button: an "or" divider (two `h-px bg-border/10` lines), a
  `variant="outline"` "Continue with Google" button (`GoogleIcon` from `components/google-icon.tsx`
  — **UI only, not wired to real OAuth**, the backend has no Google auth endpoint yet), and a
  cross-link to the other page (`Don't have an account? Sign up` / `Already have an account? Log
  in`) styled like every other inline link (`underline decoration-transparent decoration-2
  underline-offset-4 hover:decoration-highlight`). Other single-task utility pages (settings, etc.)
  that don't need a marketing moment can skip the right panel and just keep the plain centered form.
- **Header "Back" control stays minimal** — a plain text link (`ArrowLeft` icon + "Back"), same
  underline-on-hover treatment as the landing nav's `decoration-transparent → hover:decoration-highlight`
  pattern. Never wrap it in a bordered/pill `Button` — that's too heavy for a secondary nav action.
- **Every page — marketing or authenticated — lives inside the same `max-w-[1280px]` bordered
  card shell.** There is no separate "app shell" layout; the outer frame (`flex min-h-screen
  justify-center bg-background p-4 sm:p-8` → `flex w-full max-w-[1280px] overflow-hidden border
  border-foreground/10 bg-card`) is constant across `/`, `/login`, `/signup`, and `/record` alike.
  What changes **inside** that one card is the top-level child: marketing/auth pages put
  `<SiteHeader>` first (a horizontal top bar); authenticated pages put `<DashboardSidebar />` first
  (a vertical left column) followed by a `<main className="flex min-w-0 flex-1 flex-col">` for the
  page content — see `app/record/page.tsx`. Never drop the outer card to go full-bleed/edge-to-edge
  for a dashboard page; "it should look like the landing page" means keep this exact outer frame.
  `DashboardSidebar` is a plain `w-60` left column (`border-r border-foreground/10`, `bg-card`):
  `BrandMark` at top, a `NAV_ITEMS` list (`rounded-md` items, active = `bg-foreground text-card`,
  matching the control register), "Log out" pinned at the bottom via `useLogout()`. Add new
  sections to `NAV_ITEMS` as they're built rather than inventing a second nav pattern.
- **Don't nest a second bordered/rounded/shadowed card inside the one outer frame.**
  `app/record/page.tsx` used to wrap its window-chrome in its *own* `border` + `rounded-[22px]` +
  yellow drop-shadow card, floating inside the already-bordered outer frame — two concentric
  rounded rectangles is the "Apple canvas" look the user rejected. Inside the outer frame, a
  protected page's content gets flat internal dividers only (the chrome bar's `border-b`, the
  two-pane split's `border-r`) — no second outer border, no radius, no card shadow. The yellow
  `shadow-[0_10px_0_var(--highlight)]` "sticker" shadow is reserved for the landing page's
  decorative mockup — never put it on a real working surface.
- **No boxed transcript/text areas on the dashboard.** The live transcript display and the
  post-stop editable transcript are both plain text directly on the page background — no
  `border`/`bg-muted` box, no `Textarea` primitive (which still carries the old thick-border
  register). Use a bare `<textarea className="bg-transparent ... outline-none">` when the content
  needs to be editable; a plain `<div>` when it's just display.
- **Protected pages guard themselves inline — there's no `(app)` layout/route group.** A page like
  `app/record/page.tsx` calls `useCurrentUser()` directly, shows a centered `Loader2` spinner while
  `isLoading`, or redirects to `/login` via `useEffect` when there's no user — see `RecordPage` for
  the exact pattern. Follow this same inline-guard pattern for new protected pages rather than
  reintroducing a nested route group/shared layout file.
- The site hides the browser scrollbar globally (`html` rules in `globals.css`) while keeping
  scroll fully functional — don't re-introduce a visible scrollbar on new pages.

## Source of truth

- `frontend/src/app/globals.css` — all tokens, the `.label-mono` utility, font-family wiring.
- `frontend/src/app/layout.tsx` — font loading (`Figtree`, `Bricolage_Grotesque`, `JetBrains_Mono`).
- `frontend/src/app/page.tsx` — canonical implementation of every pattern above; copy from here
  first before inventing new markup.
- `frontend/src/components/ui/*` — shared primitives (Button, Card, Badge, Dialog, Input, etc.),
  already restyled to this system. Reuse them; don't hand-roll a styled `<button>`/`<div>` when a
  primitive already exists, except for the small rounded-rect chip case noted above.
- `frontend/src/components/brand-mark.tsx` — the logo. A 38px black circle with three yellow
  (`bg-highlight`) vertical bars of different heights (a tiny soundwave glyph), plus the wordmark
  (`font-display`, 26px, weight 800, `tracking-[-0.03em]`) next to it. Always use `<BrandMark />`
  instead of retyping "StudySync" styling or the logo mark.
- `frontend/src/components/site-header.tsx` — the shared page header for marketing/auth pages
  only (see Layout section above). Never use this on an authenticated app page.
- `frontend/src/components/dashboard-sidebar.tsx` — the shared left nav for authenticated app
  pages (see Layout section above). Always use this instead of `<SiteHeader>` on a protected page.
- `frontend/src/app/record/page.tsx` — canonical implementation of the dashboard shell (sidebar +
  flat window-chrome, no card nesting), the inline auth-guard pattern, and the recording feature's
  data flow
  (`hooks/use-recording-session.ts` → `use-audio-recorder.ts` + `use-speech-recognition.ts` +
  `use-wake-lock.ts`, `hooks/use-lessons.ts` for saving, `components/record/waveform.tsx` for the
  live bar visualizer). `frontend/src/lib/api.ts` and `lib/types.ts` are the full typed contract
  with the (untouched) backend — more hooks/pages can be rebuilt against them the same way this one
  was, without touching backend code.
- `frontend/src/components/google-icon.tsx` — the Google "G" mark used on the login/signup social
  button (UI only, see Layout section above).
