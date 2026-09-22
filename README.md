# AI Club Recruitment Platform — Next.js (single-project) edition

This is the Vite+React / Express version migrated into **one Next.js 14 App
Router project**, deployable as a **single Vercel project**. There is no
separate backend, no `localhost:5000`, and no Express server — the API now
lives as Next.js Route Handlers under `app/api/`, running as Vercel Functions
next to the frontend.

Nothing about the product changed: same MongoDB schema, same JWT auth, same
admin/student features, same validation and scoring rules, same UI. Only the
framework/hosting shape changed.

## What changed, structurally

| Before (Vite + Express) | Now (Next.js) |
|---|---|
| `frontend/` (Vite/React SPA) + `backend/` (Express) | one root project |
| `react-router-dom` | Next.js App Router (`app/`) |
| Express `app.listen()` on port 5000 | Vercel Functions (no listener — each `route.js` export is the function) |
| `frontend/src/api/client.js` → `http://localhost:5000/api` (dev proxy) | `lib/api-client.js` → `/api/...` (same origin, no proxy needed) |
| `backend/src/controllers/*.js` + `routes/*.js` | `app/api/**/route.js` (one file per endpoint path) |
| `backend/src/middleware/auth.js` (Express middleware) | `lib/apiAuth.js` (plain functions called at the top of each route handler) |
| `multer` (memory storage) | `request.formData()` + `lib/fileParse.js` (Web API, no multer needed) |
| `backend/src/config/db.js` (`mongoose.connect` once at boot) | `lib/db.js` (connection cached on `global`, safe for serverless cold/warm starts) |
| Two `package.json`, two deployments | One `package.json`, one Vercel deployment |

## Project structure

```
exam-platform/
├── app/
│   ├── api/                    # every backend endpoint (Route Handlers)
│   ├── login/                  # student login
│   ├── admin/
│   │   ├── login/              # admin login (public, no sidebar)
│   │   ├── tests/new/          # test builder wizard (full-page, no sidebar)
│   │   ├── tests/[id]/edit/    # same wizard, edit mode
│   │   └── (dashboard)/        # route group: adds the admin sidebar shell
│   │       ├── page.jsx        # /admin overview
│   │       ├── students/
│   │       ├── questions/
│   │       ├── tests/
│   │       ├── results/
│   │       ├── analytics/
│   │       ├── categories/
│   │       └── settings/
│   ├── (student)/               # route group: adds the student top/bottom nav
│   │   ├── dashboard/
│   │   ├── available-tests/
│   │   ├── my-tests/
│   │   ├── my-results/
│   │   └── profile/
│   ├── test/                   # distraction-free test runner (standalone, no nav)
│   ├── result/                 # post-submit summary (standalone, no nav)
│   ├── layout.jsx / providers.jsx / globals.css
│   └── page.jsx                # "/" → redirects to /login
├── components/                 # shared UI (Badge, Modal, charts, forms, TestBuilder, ...)
├── context/                    # AuthContext, ToastContext ("use client")
├── lib/                        # db.js, apiAuth.js, withRoute.js, password.js, token.js, ...
├── models/                     # Mongoose schemas (hot-reload-safe)
├── scripts/create-admin.mjs    # one-time admin bootstrap script
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
├── jsconfig.json               # "@/..." import alias
└── .env.example
```

Route groups — the `(dashboard)` and `(student)` folders — add a shared
layout (sidebar / nav) to their nested pages **without** adding a URL
segment, so `app/admin/(dashboard)/students/page.jsx` still serves
`/admin/students`. `/admin/login` and the test-builder pages sit outside
that group so they render without the sidebar, matching the original
routing exactly.

## Why each backend piece was migrated the way it was

- **`lib/db.js`** — Vercel Functions can run cold or reuse a warm container.
  Calling `mongoose.connect()` fresh on every invocation would exhaust your
  Atlas connection limit. The connection (and its promise, while pending) is
  cached on `global`, so a warm function reuses it and a cold one connects
  once and caches the result.
- **`lib/withRoute.js`** — replaces Express's `asyncHandler` + centralized
  error middleware. Every route handler is wrapped so a thrown `ApiError`
  (or anything unexpected) becomes the same JSON error shape
  `{ message }` with the right HTTP status, exactly like before.
- **`lib/apiAuth.js`** — replaces the Express `requireAuth` /
  `requireAdmin` / `requireStudent` / `loadUser` middleware chain with plain
  functions (`getAuth`, `requireRole`, `loadUser`, `authenticate`) called at
  the top of each handler, since Route Handlers don't have Express-style
  middleware chaining.
- **`lib/fileParse.js`** — replaces `multer`. Route Handlers use the
  standard Web `Request`/`FormData` API, so uploaded files are read via
  `request.formData()` → `file.arrayBuffer()` → `Buffer`, then parsed with
  the same `csv-parse` / `xlsx` libraries as before.
- **Models** — identical Mongoose schemas, with
  `mongoose.models.X || mongoose.model("X", schema)` guards added so
  Next.js's dev hot-reload (and warm serverless reuse) doesn't throw
  "Cannot overwrite model once compiled."
- **JWT** — unchanged: `jsonwebtoken` sign/verify, same payload shape
  (`{ id, role }`), same `Authorization: Bearer <token>` header read from
  `request.headers.get("authorization")` instead of Express's `req.headers`.

## Two small additive endpoints (carried over from the previous version)

`GET /api/attempts/history` and `GET /api/my-results` are student-facing,
read-only endpoints that didn't exist in the original Express-only backend
either — they were added earlier so students can see their own attempt
history and ranked results. They're mounted independently of the admin-only
`/api/results`, so nothing about that existing contract changed. Every other
route, request/response shape, validation rule, and piece of scoring logic
is unchanged from the original implementation.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in MONGO_URI and JWT_SECRET
npm run create-admin         # one-time: creates the first admin account
npm run dev                  # http://localhost:3000
```

- Student login: `http://localhost:3000/login`
- Admin login: `http://localhost:3000/admin/login`

There is no separate backend process to start — `npm run dev` serves both
the UI and `/api/*` from the same Next.js dev server.

## Environment variables

Set these in `.env.local` for local dev, and in **Vercel → Project →
Settings → Environment Variables** for deployment (see `.env.example` for
the full annotated list):

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB Atlas connection string, must include a database name |
| `JWT_SECRET` | Yes | Long random string; rotate it and all sessions invalidate |
| `JWT_EXPIRES_IN` | No | Defaults to `8h` |
| `INITIAL_ADMIN_NAME` | Only for `npm run create-admin` | Bootstrap script only, not read by the deployed app |
| `INITIAL_ADMIN_EMAIL` | Only for `npm run create-admin` | Same |
| `INITIAL_ADMIN_USERNAME` | Only for `npm run create-admin` | Same |
| `INITIAL_ADMIN_PASSWORD` | Only for `npm run create-admin` | Same — change it after first login |

## Deploying to Vercel

1. **Push this project to a Git repository** (GitHub/GitLab/Bitbucket) — the
   repo root must be this Next.js project (the one with `package.json`,
   `next.config.js`, `app/` at the top level).
2. **MongoDB Atlas**: create/choose a cluster, create a database user, and
   under Network Access allow `0.0.0.0/0` (Vercel Functions run from
   dynamic IPs) or use Atlas's Vercel integration for scoped access. Copy
   the connection string.
3. **Import the repo into Vercel**: [vercel.com/new](https://vercel.com/new)
   → select the repo. Vercel auto-detects Next.js — no build command
   changes needed (`next build` / `next start` are already wired via
   `package.json`).
4. **Add environment variables** in the Vercel project (Settings →
   Environment Variables, applied to Production/Preview/Development as
   needed):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (optional)
5. **Deploy.**
6. **Create the first admin account** (one-time, from your machine, against
   the same `MONGO_URI` Vercel uses):
   ```bash
   # either pull Vercel's env vars locally...
   vercel env pull .env.local
   # ...or just fill .env.local by hand with the same MONGO_URI/JWT_SECRET,
   # plus INITIAL_ADMIN_* from .env.example, then:
   npm run create-admin
   ```
7. Visit `https://<your-project>.vercel.app/admin/login`, sign in, and start
   adding students/questions/tests exactly as before.

Refreshing or directly opening any URL (`/admin/students`,
`/dashboard`, `/test`, etc.) works correctly — these are real file-based
Next.js routes served by Vercel, not client-only paths that only exist after
a JS router takes over, so there's no 404-on-refresh issue.

## What's intentionally unchanged / not touched

- Database schema, indexes, and validation rules
- JWT payload shape and auth flow
- Server-side scoring (`correctAnswer` is still never sent to the browser)
- Test-activation validation messages
- CSV/XLSX templates and import/export formats
- All existing UI, copy, and behavior for both admin and student panels

## One behavioral note from the migration

The old SPA used `react-router-dom`'s `navigate(path, { state })` to hand
the just-computed score summary from the test-taking screen to the results
screen without a network round-trip. Next.js client-side navigation has no
equivalent "navigation state" API, so `app/test/page.jsx` now stashes that
summary in `sessionStorage` right before navigating, and `app/result/page.jsx`
reads it once on mount. Functionally identical — the result screen still
only shows a real, just-submitted score — just implemented with
`sessionStorage` instead of router state.
