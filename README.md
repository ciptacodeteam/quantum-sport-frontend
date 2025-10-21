# Quantum Sport — Frontend

A modern Next.js frontend for the Quantum Sport project. This repository contains only the frontend application and is designed to be run against an external API. The app uses TypeScript, Tailwind, React Query, and Next 15 with turbopack for a fast developer experience.

## Table of contents

- [Project overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Quick start (dev)](#quick-start-dev)
- [Build & preview (production-like)](#build--preview-production-like)
- [Environment variables](#environment-variables)
- [Start guide (detailed)](#start-guide-detailed)
- [Troubleshooting & tips](#troubleshooting--tips)

## Project overview

- Framework: Next.js 15
- Language: TypeScript
- CSS: Tailwind CSS
- HTTP client: axios (configured in `lib/api.ts` to use `NEXT_PUBLIC_API_URL`)
- Env validation: `@t3-oss/env-nextjs` (see `env.ts`)

This repo contains the UI only — the API is external and must be available at the URL configured in `NEXT_PUBLIC_API_URL`.

## Prerequisites

- Node.js 18+ or Bun (if you prefer Bun)
- Git

## Quick start (dev)

Install dependencies:

```bash
# npm
npm install

# or bun
bun install
```

Run the dev server:

```bash
npm run dev
# or
bun run dev
```

Open http://localhost:3000 in your browser.

## Build & preview (production-like)

```bash
npm run build
npm run preview
# or with bun
bun run build
bun run preview
```

## Environment variables

The app uses `@t3-oss/env-nextjs` to validate envs. Client-side variables must be prefixed with `NEXT_PUBLIC_`. See `env.ts` for the schema and defaults.

Common variables:

- `NEXT_PUBLIC_API_URL` — base URL of the external API (e.g., `https://api.example.com`)
- `NEXT_PUBLIC_BASE_URL` — URL where the frontend runs (defaults to `http://localhost:3000`)

For a detailed, step-by-step setup including a `.env` example and troubleshooting, see the Start Guide:

## Start guide (detailed)

- See [`start-guide.md`](start-guide.md) for a full developer-friendly walkthrough: install, .env setup, run, build, CORS notes, and verification steps.

## Troubleshooting & tips

- If your build fails because of env validation, you can skip validation with `SKIP_ENV_VALIDATION=1 npm run build` (only for constrained environments).
- If your API uses cookies and cross-site requests, ensure the API sets `Access-Control-Allow-Credentials: true` and the appropriate `Access-Control-Allow-Origin`.
- Use `.env.local` for local overrides and do not commit it.

---

If you'd like, I can also add a `.env.example` file and a small npm script to load alternative env files (staging/prod). Want me to add those now?
