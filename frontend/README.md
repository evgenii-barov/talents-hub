# Talents Hub frontend

Next.js App Router frontend for Talents Hub, integrated with the Django/DRF API and session-based authentication.

## Stack

- Next.js + React + TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui-compatible component configuration
- Lucide icons

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app is available at `http://localhost:3000`.

## API integration

`NEXT_PUBLIC_API_URL` points to Django/DRF and defaults to `http://localhost:8000/api`. `lib/api.ts` sends browser requests with `credentials: "include"`, while the backend owns the HttpOnly session cookie.

`NEXT_PUBLIC_SITE_URL` must contain the public frontend origin in production (for example, `https://talents.example.org`). It is used for canonical URLs, `sitemap.xml`, `robots.txt` and structured data.

`NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` enable the optional self-hosted
Umami tracker. Both are build-time values. The tracker still loads only after the visitor allows
anonymous analytics, respects Do Not Track, excludes URL queries/fragments, and sends events through
the typed adapter in `lib/analytics.ts`. Leave the Website ID empty to disable analytics safely.

API-facing modules live in `lib/`. The `mocks/` directory contains presentation fixtures only and is not used as an application data store.

## UI components

The repository contains the `components.json` configuration for shadcn CLI. Add components after installing dependencies, for example:

```bash
npx shadcn@latest add input card dialog
```

Shared primitives belong in `components/ui`; layout components belong in `components/layout`; page-specific components should remain next to their route.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run i18n:check
npm run build
```
