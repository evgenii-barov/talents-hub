# Talents Hub Interface System

## Direction

Talents Hub should feel calm, professional, and collaborative: a focused workspace for presenting expertise, finding collaborators, and preparing profiles and projects for publication. Preserve the existing product identity instead of introducing a generic dashboard theme.

The profile completion experience is the signature pattern: users always understand where they are, what is complete, and how to return from editing to the profile view.

## Foundations

- Canvas: `--color-background` (`#fafafa`).
- Surface: `--color-surface` / white.
- Primary text: `--color-ink` (`#101b38`).
- Supporting text: `--color-muted` (`#737373`).
- Structural border: `--color-border` (`#e5e5e5`).
- Primary action and current state: `--color-primary` (`#2563eb`) with `--color-soft-blue` background.
- Completed state: `--color-green` (`#10b981`) with `--color-soft-green` background.
- Color communicates action or status; neutral colors provide structure.

## Typography

- Headings and strong product labels: Geist, weight `650`.
- Body text, fields, metadata, and controls: Inter.
- Page heading: `28px / 650`, slightly tightened tracking where supported.
- Section heading: `18px / 650`.
- Body and controls: `14px`.
- Field labels: `13px / 600`.
- Metadata and breadcrumbs: `12px`; counters may use `11px / 600`.
- Prefer weight and text color over small, arbitrary size changes for hierarchy.

## Spacing and Layout

- Base spacing unit: `4px`; use multiples of 4.
- Standard application container: `max-width: 1200px`, horizontal padding `24px`.
- Header height: `72px`.
- Profile breadcrumbs start `28px` below the header on mobile and `36px` below it on desktop across view and edit routes.
- Desktop profile editor: `220px` navigation column plus flexible content, gap `24px`.
- Sticky profile navigation: top offset `88px` (72px header + 16px), max height `calc(100dvh - 104px)`.
- Card gap: `18px`.
- Card padding: `24px`.
- Dense list row padding: `12–16px` depending on content.
- Mobile and tablet layouts stack content; section navigation becomes horizontally scrollable until the desktop breakpoint.

## Depth and Surfaces

- Use a borders-first depth strategy for application content.
- Cards: white surface, `1px` semantic border, `10px` radius, no decorative shadow.
- Inputs are inset controls on white with a quiet border and a blue focus ring.
- Reserve shadows for elevated overlays and the sticky global header.
- Avoid mixing strong shadows, tinted card backgrounds, and heavy borders on the same surface.

## Controls

- Reuse `components/ui/button.tsx`; do not create one-off clickable `div` elements.
- Default button: `40px` height, `16px` horizontal padding, `6px` radius, `14px / 600`.
- Small button: `32px` height, `12px` horizontal padding, `12px` text.
- Profile form control: `42px` height, `12px` horizontal padding, `6px` radius, `14px` text.
- Inline form rows keep every control on one baseline; when field utilities include a top margin, sibling buttons use the same margin.
- Every control needs visible focus, hover, disabled, and error/loading behavior where relevant.
- Icon-only destructive or editing actions require an accessible label and a minimum practical hit area.

## Navigation Patterns

- Profile pages use breadcrumbs: `Overview → My profile → Current page`.
- The authenticated account control combines avatar and display name, truncates long names, and opens a keyboard-accessible menu for profile routes and sign out.
- Editing pages always expose an explicit route back to profile viewing.
- Profile settings use anchored section navigation with a completion counter and progress bar.
- Current section: soft blue background and primary blue text.
- Completed inactive section: soft green background, green check, dark green text.
- Incomplete inactive section: neutral text and an outlined circle.
- Section cards use matching stable IDs and `scroll-margin-top` so anchors clear the sticky header.

## Information Architecture

- `/profile/settings`: identity, participation and visibility, skills, languages, work experience, and education.
- `/profile/complete`: additional publication details such as avatar, location, and external links.
- Do not duplicate editable sections across profile routes.
- Saved data determines completion state; optional fields do not block a section unless explicitly required by product rules.

## Content and Feedback

- Render taxonomy-backed labels through the active locale; never show stored bilingual labels such as `Русский / Russian` as a single UI value.
- Use concise action labels: “Edit profile”, “View profile”, “Finish editing”.
- Success and informational feedback uses the soft blue surface with primary text.
- Empty states explain what is missing without sounding like an error.
- Keep Russian and English labels semantically equivalent, not merely literal translations.

## Quality Checks

- Verify desktop sticky offsets against the 72px header.
- Check mobile stacking and horizontal section navigation.
- Ensure all profile routes share the 1200px container and breadcrumb alignment.
- Run TypeScript, scoped ESLint, and a production build after structural UI changes.
- Visually verify authenticated and empty/loading states when available.
