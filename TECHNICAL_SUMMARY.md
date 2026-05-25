# Ceylon Expand — Technical Summary
*For external audit, debugging, optimization, and feature development*

---

## How the App Works

Ceylon Expand is a **travel buddy / trip-sharing platform for Sri Lanka**. Users post trips (origin → destination, date, seats, price), browse others' trips, send interest requests, and chat with organizers. There is also a "Quick Trip" feature for spontaneous same-day or next-5-day trips.

The app is a **monorepo**: one Express server serves both the REST API (`/api/*`) and the compiled React frontend (from `dist/public` in production, via Vite dev server in development).

---

## Folder Structure

```
/
├── client/                          # React frontend (Vite)
│   ├── index.html                   # Vite entry HTML
│   ├── preamble.js                  # React Fast Refresh preamble
│   ├── public/
│   │   ├── sw.js                    # Service worker (PWA, caching, push)
│   │   ├── manifest.json            # PWA manifest
│   │   └── offline.html             # Offline fallback page
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Router + all page routes (wouter)
│       ├── index.css                # Tailwind + CSS variables
│       ├── pages/                   # 30+ lazy-loaded page components
│       ├── components/              # Shared UI components
│       │   ├── ui/                  # shadcn/ui primitives
│       │   ├── chat/                # Chat UI (window, list, image upload)
│       │   ├── post-trip/           # Multi-step trip posting wizard
│       │   ├── trips/               # Browse filters, date chips
│       │   ├── admin/               # Admin panel components
│       │   ├── notifications/       # Notification dropdown (real-time)
│       │   ├── navigation/          # Navbar, profile menu
│       │   └── common/              # Error boundaries, lazy image, etc.
│       ├── hooks/                   # Custom React hooks
│       ├── lib/                     # Utilities (queryClient, utils, currency)
│       └── auth/                    # Clerk auth helpers
│
├── server/                          # Express backend (TypeScript)
│   ├── index.ts                     # *** MAIN ENTRY *** — Express app setup
│   ├── routes.ts                    # *** ALL API ROUTES *** (5,700 lines)
│   ├── auth.ts                      # Replit OIDC auth setup (passport)
│   ├── db.ts                        # Neon PostgreSQL pool + Drizzle ORM
│   ├── storage.ts                   # All database queries (IStorage interface)
│   ├── vite.ts                      # Vite dev-server integration
│   ├── auth/
│   │   ├── jwt.ts                   # JWT sign/verify, cookie config, middleware
│   │   └── routes.ts                # Google + Facebook OAuth callback routes
│   ├── cache/
│   │   ├── cacheService.ts          # In-memory LRU cache
│   │   └── enhancedCacheService.ts  # Smart cache headers middleware
│   ├── config/
│   │   ├── environment.ts           # Environment detection (dev/prod)
│   │   └── production.ts            # Production security settings
│   ├── health/
│   │   └── healthCheck.ts           # /health, /health/ready, /health/live
│   ├── middleware/
│   │   ├── adminAuth.ts             # Admin role guard middleware
│   │   └── performanceOptimization.ts # Compression, rate limit, response time
│   ├── routes/
│   │   ├── adminRoutes.ts           # Admin-only endpoints
│   │   ├── seo.ts                   # Sitemap + robots.txt
│   │   ├── errorReporting.ts        # Client error report ingestion
│   │   └── clerkHealth.ts           # Clerk SDK health check
│   ├── services/
│   │   ├── websocketService.ts      # WS server — real-time notifications
│   │   ├── tripArchiver.ts          # Daily cron: auto-archive past trips
│   │   ├── tripCompletion.ts        # Trip completion + notify participants
│   │   ├── moderationService.ts     # Content moderation
│   │   ├── aiModerationService.ts   # AI-assisted moderation
│   │   ├── adminService.ts          # Admin operations
│   │   ├── auditService.ts          # Audit log writes
│   │   ├── roleService.ts           # Role management
│   │   └── seedService.ts           # Dev data seeding
│   └── utils/
│       ├── logger.ts                # Structured production logger
│       ├── errorTracking.ts         # Error capture + reporting
│       ├── idempotencyHandler.ts    # Idempotency keys for mutations
│       ├── userNormalization.ts     # displayName/username resolution
│       ├── secureLogging.ts         # PII scrubbing for logs
│       └── databaseErrorHandler.ts  # Postgres error → HTTP status mapping
│
├── shared/
│   ├── schema.ts                    # *** Drizzle table definitions + Zod schemas ***
│   └── types/api.ts                 # Shared TypeScript API types
│
├── package.json                     # Dependencies + scripts
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite build config (DO NOT EDIT)
├── drizzle.config.ts                # Drizzle ORM config (DO NOT EDIT)
├── tailwind.config.ts               # Tailwind config
├── replit.md                        # Project overview + user preferences
└── threat_model.md                  # Security threat model
```

---

## Main Entry Files

| File | Role |
|------|------|
| `server/index.ts` | Express app, middleware stack, server startup |
| `server/routes.ts` | Every API route (5,700 lines — needs splitting) |
| `server/storage.ts` | All DB queries via Drizzle ORM |
| `shared/schema.ts` | Single source of truth: DB tables + Zod types |
| `client/src/App.tsx` | All frontend routes via wouter + React.lazy |
| `client/src/main.tsx` | React root render + QueryClient provider |

---

## Frameworks & Libraries

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5 | Build tool + dev server |
| wouter | 3 | Client-side routing |
| TanStack Query | 5 | Server state + caching |
| Tailwind CSS | 3 | Utility-first styling |
| shadcn/ui + Radix UI | — | Accessible component primitives |
| React Hook Form | 7 | Form handling |
| Zod | 3 | Schema validation |
| Framer Motion | 11 | Animations |
| Lucide React | — | Icon library |
| date-fns | 3 | Date utilities |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4 | HTTP server |
| TypeScript | 5.6 | Type safety |
| Drizzle ORM | 0.38 | Type-safe DB queries |
| @neondatabase/serverless | 0.10.4 | Neon PostgreSQL driver |
| ws | 8.21 | WebSocket server |
| passport | 0.7 | Auth middleware |
| jsonwebtoken | 9 | JWT tokens |
| bcrypt | 5 | Password hashing |
| helmet | 8 | Security headers |
| express-rate-limit | 7 | Rate limiting |
| nanoid | 5 | Unique ID generation |
| @clerk/express | — | Clerk auth SDK |
| connect-pg-simple | 10 | PostgreSQL session store |

---

## Database

**Provider**: Neon (serverless PostgreSQL)  
**ORM**: Drizzle ORM  
**Connection**: WebSocket pool via `@neondatabase/serverless`

### Key Tables (defined in `shared/schema.ts`)
| Table | Purpose |
|-------|---------|
| `users` | User profiles, auth data, displayName, username |
| `trips` | Full trip listings (origin, destination, date, price, seats, status) |
| `quick_trips` | Lightweight spontaneous trips (expires 3 days after creation) |
| `trip_interest_requests` | Interest in joining a trip (pending/accepted/declined) |
| `quick_trip_interest_requests` | Interest in quick trips |
| `chat_threads` | Conversation threads between users |
| `chat_messages` | Individual messages (text + image) |
| `ratings` | User ratings after trips |
| `comments` | Comments on trip listings |
| `reports` | Content moderation reports |
| `notifications` | In-app notifications |
| `auth_sessions` | JWT refresh token store |
| `site_settings` | Admin-configurable key/value settings |
| `audit_logs` | Admin action audit trail |
| `idempotency_keys` | Prevent duplicate mutations |

### Required Environment Variables
```env
DATABASE_URL=postgresql://user:password@host/dbname
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

SESSION_SECRET=<strong-random-string>
JWT_ACCESS_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<strong-random-string>

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

APP_URL=https://www.theceylonx.com
NODE_ENV=production
REPLIT_DEPLOYMENT=1          # Set automatically by Replit in production
```

---

## Authentication Flow

The app has **three auth systems** running in parallel:

### 1. Replit OIDC (passport-openidconnect)
- File: `server/auth.ts`
- Session-based via `connect-pg-simple`
- Only works in Replit environment (OIDC discovery sometimes times out in production)
- Guard: `req.isAuthenticated()`

### 2. Google + Facebook OAuth → JWT
- Files: `server/auth/routes.ts`, `server/auth/jwt.ts`
- OAuth callback → create/find user in DB → issue JWT access token (15m) + refresh token (7d) as HttpOnly cookies
- Guard: `unifiedAuthGuard` middleware in `routes.ts`

### 3. Clerk (email/password + social)
- Files: `server/utils/checkClerk.ts`, `client/src/auth/`
- `@clerk/express` middleware validates Clerk sessions
- Guard: integrated into `unifiedAuthGuard`

**`unifiedAuthGuard`** (in `routes.ts`) tries all three in order:
1. Check JWT cookie → verify access token → `req.user`
2. Check Replit session → `req.user`
3. Check Clerk session → `req.user`
4. Return 401 if none match

**User display**: Always use `displayName` first, then `username`, then user ID. Never use OAuth name or email.

---

## Key API Endpoints

```
GET  /health/ready              Readiness check (Replit routing uses this)
GET  /health/live               Liveness check
GET  /health                    Full system health (8 subsystems)

POST /api/auth/login            Email/password login → JWT
POST /api/auth/register         Email/password registration
POST /api/auth/refresh          Refresh access token
POST /api/auth/logout           Clear JWT cookies
GET  /api/auth/google           Initiate Google OAuth
GET  /api/auth/google/callback  Google OAuth callback
GET  /api/auth/me               Current user profile

GET  /api/trips                 Browse trips (with 15+ filter params)
POST /api/trips                 Create trip (auth required)
GET  /api/trips/:id             Trip detail
PUT  /api/trips/:id             Update trip (owner only)
DELETE /api/trips/:id           Delete trip (owner only)

GET  /api/quick-trips/:id       Quick trip detail
POST /api/quick-trips           Create quick trip (auth + rate limited)

POST /api/trips/:id/interest    Send interest request
PUT  /api/trips/:id/interest/:requestId  Accept/decline interest

GET  /api/chat/threads          User's chat threads
GET  /api/chat/threads/:id/messages  Thread messages
POST /api/chat/threads/:id/messages  Send message

GET  /api/notifications         User notifications
PUT  /api/notifications/:id/read  Mark read

GET  /api/users/:id/profile     Public user profile
PUT  /api/profile               Update own profile

GET  /api/popular-destinations  Cached popular destinations
GET  /api/site-settings/:key    Public site settings

/api/admin/*                    Admin-only endpoints (role guard)
```

---

## Real-time (WebSocket)

- File: `server/services/websocketService.ts`
- Server-side WebSocket on same HTTP server
- Client connects via `client/src/hooks/useWebSocket.ts`
- Events: new chat message, interest request received, trip completed, notification

---

## Key Features

1. **Trip Browsing** — 15+ filters: location, date, price, difficulty, duration, interests, group size, region
2. **Quick Trips** — spontaneous trips, 3-day expiry, auto-cleanup cron
3. **Interest System** — send interest → organizer accept/decline → chat auto-created
4. **Real-time Chat** — WebSocket-based with image upload (object storage)
5. **Trip Lifecycle** — active → archived (auto daily cron) → completed/cancelled
6. **Notifications** — real-time WS + database-persisted
7. **Admin Panel** — user management, moderation, site settings, audit logs
8. **PWA** — service worker, offline page, push notifications
9. **SEO** — dynamic sitemap, Open Graph, structured data

---

## Areas That Need Improvement / Refactoring

### Critical
1. **`server/routes.ts` is 5,700 lines** — should be split into ~10 router modules (trips, auth, chat, users, admin, notifications, quick-trips, etc.)
2. **Three auth systems** (Replit OIDC + JWT + Clerk) create complexity and overlap — should consolidate to one
3. **`server/storage.ts`** — monolithic query file, should be split by domain

### Performance
4. **No database indexes explicitly defined in schema** — add indexes on `trips.date`, `trips.status`, `trips.userId`, `chat_messages.threadId`, etc.
5. **WebSocket service** doesn't handle reconnection gracefully on the client side
6. **Image uploads** go through a placeholder URL (routes.ts line 5037-5038) — object storage integration is incomplete

### Security
7. **JWT secrets fall back to hardcoded dev values** if env vars not set (`'dev-access-secret'`) — should throw in production
8. **Rate limiting disabled in development** (`enabled: false`) — fine for dev, but verify production limits are correct
9. **`unifiedAuthGuard` tries 3 auth methods** — could leak timing information

### Code Quality
10. **Excessive console.log statements** throughout (production suppresses them, but they clutter the code)
11. **`client/src/App.tsx` has 270+ lines** of route definitions — could be split into route groups
12. **Dead code**: `ceylon-expand-code.zip`, `ceylon-expand-code.tar.gz`, `ceylon-expand-blueprint.docx` in root
13. **`@clerk/node` deprecation warning** on every startup — migrate to `@clerk/express`
14. **Replit OIDC discovery timeout** (8s) in production — auth unavailable for Replit-auth users in prod

### Missing
15. **No database migrations** — schema changes require manual `db:push`, no migration history
16. **Test coverage is minimal** — only 2 test files exist (`trips.test.ts`, `ActionsMenu.test.tsx`)
17. **Error boundaries** exist but don't report to a monitoring service in production

---

## Running the Project Locally (outside Replit)

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (copy and fill in)
cp .env.example .env   # (create this file with the vars listed above)

# 3. Push schema to database
npm run db:push

# 4. Start dev server (Express + Vite on port 5000)
npm run dev

# 5. Build for production
npm run build

# 6. Run production build
npm run start
```

### Scripts (package.json)
| Script | Command |
|--------|---------|
| `dev` | `NODE_ENV=development tsx server/index.ts` |
| `build` | `vite build && esbuild server/index.ts → dist/index.js` |
| `start` | `NODE_ENV=production node dist/index.js` |
| `db:push` | `drizzle-kit push` |
| `db:studio` | `drizzle-kit studio` |

---

## Deployment

**Platform**: Replit Autoscale (4 vCPU / 8 GiB RAM)  
**Custom domain**: `www.theceylonx.com` (DNS A record → `34.111.179.208`)  
**Fallback URL**: `https://theceylonx.replit.app`  
**SSL**: Managed by Replit (Let's Encrypt, auto-renewed)  
**Database**: Neon serverless PostgreSQL (connection pooling via WebSocket)  
**Static assets**: Served from `server/public/` (Vite build output)  
**Sessions**: PostgreSQL-backed via `connect-pg-simple`

Production is detected via `process.env.REPLIT_DEPLOYMENT === '1'`.
