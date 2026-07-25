# Rally

Relationship intelligence platform for the events economy. This repo is the **skeleton only** — a
running, type-checked monorepo with no product features yet. See [CLAUDE.md](CLAUDE.md) and
[`/docs`](docs/) for the locked stack, architecture rules, and scope.

## Structure

```
rally/
├── apps/
│   ├── web/          React + Vite PWA (Tailwind, React Router, React Query, TS strict)
│   └── api/          Node + Express + TypeScript (strict, modular)
├── packages/
│   └── shared/       Shared TypeScript types (API contracts + intent enum)
├── docs/             Architecture, build spec, Supabase setup, prototype
└── .env.example      Copy to .env (never commit real secrets)
```

The frontend talks to the backend via `VITE_API_BASE_URL` and calls `GET /health` on load to prove
the connection. Only `VITE_*` variables are exposed to the browser; all other env stays server-side.

## Prerequisites

- Node **22 LTS** (see [`.nvmrc`](.nvmrc) — run `nvm use` if you use nvm)
- npm 10+

## Setup

```bash
# 1. Use the pinned Node version (optional but recommended)
nvm use

# 2. Install all workspaces
npm install

# 3. Create your local env from the template
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

For the pilot you do not need real Supabase keys to run the skeleton — the defaults in `.env.example`
are enough to boot both apps. Fill in real values as you build features.

## Run

```bash
npm run dev
```

This starts both apps together:

| App | URL |
|-----|-----|
| Web (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:4000 |

Open **http://localhost:5173**. You should see the mobile-first Rally shell with a badge reading
**"API: connected ✓"** — that badge is the frontend successfully calling `GET /health` on the backend.
The app is installable as a PWA (add to home screen) and caches its shell for offline use.

## Scripts (run from the repo root)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run web + api together |
| `npm run build` | Production build of api and web |
| `npm run typecheck` | `tsc --noEmit` across all workspaces |
| `npm run lint` | ESLint across the repo |
| `npm run format` | Prettier write |
| `npm run test` | Vitest across all workspaces |

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs **typecheck + lint + test** on every pull
request (and pushes to `main`), using the Node version pinned in `.nvmrc`.
