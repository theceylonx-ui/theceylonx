# Threat Model

## Project Overview

Ceylon Expand is a public travel buddy platform for Sri Lanka. The production app is a React/Vite frontend backed by an Express/TypeScript API, PostgreSQL via Drizzle, session-based Replit auth, and JWT-based social auth helpers. The deployed app is public, so any internet user can reach public API routes. Replit-managed TLS is assumed in production.

## Assets

- **User accounts and sessions** -- session cookies, JWT access and refresh tokens, and account identities. Compromise allows impersonation or destructive account actions.
- **Traveler personal data** -- profile details, contact details, trip participation, chat history, ratings, and reports. Exposure can reveal private user activity and contact information.
- **Trip and quick-trip records** -- public listings plus organizer-linked metadata, interest requests, and status changes. Tampering can disrupt the service and harm users.
- **Administrative and site settings** -- moderation capabilities, site configuration, and privileged routes. Abuse can alter platform behavior or weaken controls.
- **Application secrets** -- database credentials, session signing secret, JWT signing secrets, and third-party auth secrets. Leakage or weak defaults can break trust in authentication.

## Trust Boundaries

- **Browser to API** -- all request data from the client is untrusted, including route params, query params, headers, cookies, and JSON bodies.
- **Public to authenticated boundary** -- browsing and some content reads are public; trip posting, chat, moderation-adjacent actions, and profile actions must be enforced server-side.
- **Authenticated user to admin boundary** -- admin routes and site-management features require explicit server-side privilege checks.
- **API to PostgreSQL** -- the server has broad database access; any SQL injection in route-handling code can become full database compromise.
- **API to external identity providers** -- Replit OIDC and social-login JWT flows establish identity; callback and token handling must not trust user-controlled data.
- **Dev-only to production boundary** -- sandbox or temporary setup helpers are out of scope unless mounted in production. Production-exposed “temporary” endpoints are in scope.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/auth.ts`, `server/auth/routes.ts`, `server/auth/jwt.ts`
- **Highest-risk code areas:** `server/storage.ts`, auth/session code, chat/thread routes, admin middleware and routers, any raw SQL or direct `pool.query(...)` usage
- **Surface split:** public routes in `server/routes.ts`; authenticated user flows use `isAuthenticated` or `unifiedAuthGuard`; admin flows use `server/middleware/adminAuth.ts` and `server/routes/adminRoutes.ts`
- **Usually ignore unless proven reachable:** unused or dead route files, local-only tooling, mockup sandbox artifacts, and development-only setup helpers not mounted by the production server

## Threat Categories

### Spoofing

This app supports multiple auth mechanisms, so the backend must treat identity as valid only when a verified session or token has been checked server-side. Session and JWT signing secrets must be strong and deployment-specific, and no production path should silently rely on built-in default secrets.

### Tampering

Users can create trips, comments, ratings, chats, and profile updates, so all state-changing endpoints must require the right authenticated user and validate ownership on the server. Public or weakly protected write routes can let attackers alter or delete data without permission.

### Information Disclosure

The platform stores traveler identities, contact details, trip activity, and private chats. Public endpoints must only return the minimum needed fields, and any direct database access path must prevent attackers from broadening reads beyond the intended record.

### Denial of Service

Public endpoints can be hit by anyone on the internet, so expensive or destructive routes need authentication and rate limits. Account deletion, heavy search/database reads, and chat-related endpoints are especially sensitive because they can disrupt user access or tie up database resources.

### Elevation of Privilege

The biggest privilege risks in this codebase are broken access control and injection. Any route that accepts a user-controlled identifier must enforce ownership or role checks, and all database queries must be parameterized rather than built from string concatenation.
