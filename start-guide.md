## Quick start — Next.js frontend (external API)

This guide shows how to run the frontend only (Next.js app) against an external API. It assumes you have a recent Node.js or Bun runtime installed. The project already uses environment validation via `@t3-oss/env-nextjs`, so the important client-facing env var is `NEXT_PUBLIC_API_URL`.

### Prerequisites

- Node.js 18+ (or a compatible Node version) if you use npm/yarn
- Bun (optional) if you prefer Bun commands
- Git (to clone the repo)

### What this guide covers

- Install dependencies (npm or bun)
- Set environment variables to point the frontend at your external API
- Run the app in development, build and preview
- Troubleshooting and quick verification steps

---

### 1) Install dependencies

Using npm (recommended if you normally use npm):

```bash
# install deps
npm install
```

Using Bun (faster install):

```bash
# install deps with bun
bun install
```

Note: The project scripts are defined in `package.json`. Bun can run those scripts via `bun run <script>`.

### 2) Environment variables (.env)

The client expects these environment variables (see `env.ts` in the repository). The important ones for runtime in the browser are prefixed with `NEXT_PUBLIC_`.

Create a `.env.local` (or `.env`) file at the repository root with values for your environment. Example:

```bash
# .env.local (example)
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000   # Point this to your external API
SUPPORT_EMAIL=support@example.com

# Optional: set to skip env validation during build (useful in CI or Docker)
# SKIP_ENV_VALIDATION=1
```

Important notes:

- Only variables prefixed with `NEXT_PUBLIC_` are available to client-side code. Server-only vars must not be prefixed.
- If you change `.env.local`, restart the dev server to pick up changes.
- To skip the project's env validation (not generally recommended), set `SKIP_ENV_VALIDATION=1` when running `build` or `dev`.

### 3) Run in development

Default script uses turbopack for a fast dev server:

Using npm:

```bash
npm run dev
```

Using bun:

```bash
bun run dev
```

Behavior and options:

- Dev server default port: 3000. To use a different port, prefix the command or export `PORT`:

```bash
PORT=3001 npm run dev
# or
PORT=3001 bun run dev
```

### 4) Build & Preview (production-like)

Build the app:

```bash
npm run build
# or with bun
bun run build
```

Preview (build + start):

```bash
npm run preview
# or
bun run preview
```

Start (when you already built for production and want to run the optimized server):

```bash
npm run start
# or
bun run start
```

If env validation blocks a build in an environment where you can't provide all vars, run:

```bash
SKIP_ENV_VALIDATION=1 npm run build
```

### 5) How the frontend talks to the API

The project config uses `NEXT_PUBLIC_API_URL` as the axios baseURL (see `lib/api.ts`). Ensure this value points at your external API (including scheme and port). Example:

```
NEXT_PUBLIC_API_URL=https://api.my-service.com
```

If your API uses cookie-based auth across domains, note that `lib/api.ts` creates axios with `withCredentials: true`. That requires the API to:

- Set Access-Control-Allow-Origin to the frontend origin (or a specific origin), not `*`.
- Set Access-Control-Allow-Credentials: true on responses.
- Send cookies with the proper SameSite attribute (often `None`) and `Secure` for HTTPS.

### 6) Quick verification

- Start the dev server (`npm run dev` or `bun run dev`) and open http://localhost:3000 in your browser.
- Open the browser devtools Network tab, check requests to your API and confirm they go to the URL in `NEXT_PUBLIC_API_URL`.
- You can also curl the API directly to ensure it's reachable from your machine:

```bash
curl -I $NEXT_PUBLIC_API_URL
# or explicitly
curl -I http://localhost:8000
```

### 7) Common troubleshooting

- Env variables not available in browser:
  - Make sure the variable starts with `NEXT_PUBLIC_` and that you rebuilt/restarted the dev server after changes.

- Build fails with env validation errors:
  - Fix the env values to match the schemas in `env.ts`, or use `SKIP_ENV_VALIDATION=1` for the build in constrained environments.

- CORS / credentials problems when using cookie auth:
  - Ensure the API sets `Access-Control-Allow-Origin` to the frontend origin, `Access-Control-Allow-Credentials: true`, and the cookie has `SameSite=None; Secure` when using cross-site cookies.

- Port conflicts:
  - Use `PORT=<port>` when running dev or preview.

### 8) Recommended dev tips

- Use a `.env.local` file for local overrides and do not commit it.
- If you frequently switch APIs (staging/prod), create `.env.local.staging` and a small npm script to load it, or use direnv.
- Use the React Query devtools (already present in deps) while debugging data fetching.

---

If you'd like, I can also add a small `.env.example` file to the repo, or an npm script that runs the dev server with a specific `.env` filename. Want me to add either of those?
