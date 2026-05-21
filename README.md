# LiqHawk — Frontend

Dark-themed React + Vite dashboard that renders the top 100 most-at-risk
positions tracked by the FastAPI backend, colour-coded by severity.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS v4 (zero-config via `@tailwindcss/vite`)

## Quick start

```bash
cd frontend
cp .env.example .env        # one-time — sets VITE_API_BASE
npm install
npm run dev
```

Open <http://localhost:5173>.

`.env` controls the backend URL via `VITE_API_BASE` (default
`http://localhost:8000`). The frontend hits that base directly — CORS is open
on FastAPI, so no proxy is needed.

Start the backend separately (from the repo root):

```bash
uvicorn app.main:app --reload
```

## Build

```bash
npm run build       # outputs to dist/
npm run preview     # serves the built bundle locally
npm run typecheck   # strict TS check, no emit
```

The `dist/` folder is a static bundle — drop it on any static host (Netlify,
Vercel, S3 + CloudFront, nginx).

## Pointing at a different backend

Edit `.env` and restart `npm run dev`. For production builds, Vite inlines
`VITE_API_BASE` at build time:

```bash
echo "VITE_API_BASE=https://api.example.com" > .env.production.local
npm run build
```

Vite loads env files in this priority (highest first): `.env.production.local`
> `.env.local` > `.env.production` > `.env`. The `.local` variants are
git-ignored.

## What the UI shows

- Top stat cards per severity (CRITICAL / HIGH / MEDIUM / SAFE). Click one to
  filter the table.
- Protocol toggle (All / INIT / Lendle).
- Table of the 100 lowest health-factor positions, sorted ascending. Each row
  is tinted by severity with a coloured left bar.
- Sticky header with block number, "captured … s ago" indicator, auto-refresh
  toggle (30 s), and a manual refresh button.

## Moving the frontend

This folder is self-contained — no symlinks back into the Python project. You
can `cp -r frontend/ ../my-other-repo/` and it will run as-is. The proxy
targets in `vite.config.ts` are the only thing tied to the backend's local
port; adjust those if your backend listens elsewhere.
