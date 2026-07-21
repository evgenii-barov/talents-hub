# Talents Hub frontend

Next.js App Router frontend for Talents Hub. It is intentionally API-ready while the Django/DRF contract is being developed.

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

`NEXT_PUBLIC_API_URL` points to Django/DRF and defaults to `http://localhost:8000/api`. Use `lib/api.ts` for browser requests: it sends `credentials: "include"` so the future backend can own HttpOnly session cookies.

Until the OpenAPI contract is available, visual fixtures live in `mocks/`. Do not treat them as API types or persist data from them. Replace the fixture module with generated OpenAPI client calls once the schema is published.

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
npm run build
```
