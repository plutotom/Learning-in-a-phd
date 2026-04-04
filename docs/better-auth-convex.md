# Better Auth + Convex Setup

## How it works

Better Auth handles authentication (sessions, sign-in, OAuth). Convex is the database backend. The `@convex-dev/better-auth` package provides the glue: a Convex adapter so Better Auth stores its data (users, sessions, accounts) in Convex tables instead of SQLite or Postgres.

Auth requests from the browser don't go to your Next.js API — they go directly to the Convex HTTP backend via the site URL (`.convex.site`). The Next.js route at `/api/auth/[...all]` acts as a thin proxy that forwards requests there.

---

## Key pieces

### Convex backend (`convex/`)

- **`convex.config.ts`** — mounts the `betterAuth` component, which registers the built-in adapter tables and functions
- **`auth.config.ts`** — tells Convex how to validate JWTs issued by Better Auth (uses a custom JWT provider pointing at the Convex site URL)
- **`betterAuth/auth.ts`** — creates the Better Auth instance using the Convex adapter (`authComponent.adapter(ctx)`). This is called per-request since it needs the Convex context
- **`http.ts`** — registers the auth routes (`/api/auth/*`) on the Convex HTTP router

### Next.js app (`app/`, `lib/`, `components/`)

- **`lib/auth-server.ts`** — server-side helpers: `getToken()` (reads the session cookie server-side), `handler` (the proxy for the API route), and typed Convex fetch helpers
- **`lib/auth-client.ts`** — browser-side auth client with the `convexClient()` plugin, which allows Better Auth to issue Convex JWTs
- **`components/ConvexClientProvider.tsx`** — wraps the app in `ConvexBetterAuthProvider`, connecting the Convex React client to Better Auth's session state
- **`app/layout.tsx`** — server component that calls `getToken()` and passes it to the provider as `initialToken` for SSR

### Route protection (`proxy.ts`)

Stays the same — checks for a session cookie and redirects to `/sign-in` if missing.

---

## Data flow

1. User submits sign-in form → `authClient.signIn.email()`
2. Request goes to Convex HTTP backend (`incredible-shrimp-358.convex.site/api/auth/sign-in/email`)
3. Better Auth runs on Convex, writes session to the `session` table, sets a cookie
4. `ConvexBetterAuthProvider` calls `authClient.convex.token()` to exchange the session cookie for a Convex JWT
5. Convex React client uses that JWT for all subsequent queries/mutations

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `.env` | Convex database URL (used by React client) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `.env` | Convex HTTP URL (auth requests go here) |
| `BETTER_AUTH_SECRET` | Convex backend | Signs sessions |
| `SITE_URL` | Convex backend | Trusted origin for CORS |
| `GOOGLE_CLIENT_ID/SECRET` | Convex backend | Google OAuth |

The `BETTER_AUTH_SECRET` and OAuth keys live on the **Convex backend** (set via `npx convex env set`), not in `.env`, because they're used by code running on Convex, not Next.js.

---

## Initial setup steps

1. `pnpm add convex @convex-dev/better-auth`
2. Create `convex/convex.config.ts`, `convex/auth.config.ts`, `convex/betterAuth/auth.ts`, `convex/http.ts`
3. Update `lib/auth-client.ts` to add `convexClient()` plugin
4. Replace `lib/auth.ts` + SQLite with `lib/auth-server.ts` pointing at Convex
5. Wrap layout with `ConvexClientProvider`
6. Run `npx convex dev` — generates `convex/_generated/api.ts` and deploys functions
7. Set backend env vars: `npx convex env set BETTER_AUTH_SECRET=...`
8. Fill `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` in `.env`
