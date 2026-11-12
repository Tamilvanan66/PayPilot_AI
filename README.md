<div align="center">

# PayPilot AI

### AI-Powered Smart Commerce & Payment Assistant

**Build Smarter. Sell Better. Grow Faster.**

React · TypeScript · Express · MongoDB · PayPal · OpenAI-compatible AI

</div>

---

## 1. What this is

PayPilot AI is a working full-stack commerce back office for small businesses. It is not a UI
mock-up: every number on the dashboard is aggregated from MongoDB, every payment change comes
from a server-verified PayPal capture or a signature-verified webhook, and every stock change
writes an auditable inventory movement.

**Core capabilities**

| Area | What works |
| --- | --- |
| Auth | Register, login, logout, `/me`, forgot/reset password, bcrypt hashing, HTTP-only JWT cookie, 2 roles (owner / manager), store-scoped access |
| Dashboard | Net revenue, gross, refunds, order counts, pending payments and value, low-stock and out-of-stock counts, inventory units/value, customer count, recent orders, recent transactions, customer activity, 30-day revenue series, AI insight card, quick actions |
| Products | Create, edit, archive, delete (auto-archives when order history exists), search, category filter, stock filter, 5 sort modes, pagination, per-product stock badges |
| Orders | List/search/filter by status and date, status counters, detail view, separate payment vs fulfilment status, guarded status transitions, cancellation with stock restore |
| Payments | PayPal Sandbox orders created server-side, capture verified against stored total and currency, idempotent transactions, webhook signature verification via PayPal's `verify-webhook-signature` |
| AI | Context-aware chat with conversation history, recommendation engine (budget/category/stock aware, explanations), description generator (description, summary, SEO title, keywords), business insights |
| Analytics | Revenue series, order series, best-sellers, sales by category, AOV, pending payments, inventory insights, customer activity, AI insight generator |
| Inventory | Stock tracking, movement ledger, manual adjustments with reasons, low-stock notifications, automatic deduction on verified payment, restore on cancellation/refund |
| Notifications | New order, payment succeeded/failed, low inventory, order status change; read/unread with a bell dropdown and full page |

## 2. Stack

**Frontend** React 18, Vite 5, TypeScript 5.6, Tailwind CSS 3.4, Lucide React, React Router 6,
TanStack Query 5, Recharts 2, React Hook Form + Zod (dependencies present; the shipped forms use
controlled state with Zod-compatible validation rules).

**Backend** Node 20, Express 4, TypeScript 5.6 (ESM), Mongoose 8, JWT (`jsonwebtoken`),
bcryptjs, helmet, CORS, compression, express-rate-limit, Zod validation.

**Database** MongoDB 7 (Atlas in production, `mongodb-memory-server` for dev/tests).

**Testing** Vitest + Supertest (server, real HTTP against an in-memory MongoDB), Vitest +
Testing Library + jsdom (client).

## 3. Architecture

```
paypilot-ai/
├── client/                     # Vite + React + TS SPA
│   └── src/
│       ├── components/         # ui kit, charts, PayPalCheckout, ProductFormModal, ProtectedRoute
│       ├── context/            # AuthContext (session restore, login/register/logout)
│       ├── hooks/              # TanStack Query hooks + mutations
│       ├── layouts/            # AppLayout (collapsible sidebar, notification bell)
│       ├── pages/              # 15 route pages
│       ├── services/           # api client (typed errors) + endpoint modules
│       ├── types/              # shared domain types
│       ├── utils/              # formatters
│       └── test/               # client test suites
├── server/
│   ├── src/
│   │   ├── config/             # env loader, DB connect (memory-server fallback)
│   │   ├── controllers/        # auth, product, order, payment, ai, analytics, inventory, notification
│   │   ├── middleware/         # auth (JWT cookie), validate (Zod), error, rate limits
│   │   ├── models/             # 14 models with indexes
│   │   ├── routes/             # REST routers + index
│   │   ├── services/           # paypal, payments, inventory, ai, recommendations, analytics
│   │   ├── utils/              # ApiError, helpers, pagination
│   │   ├── validators/         # Zod schemas
│   │   ├── app.ts              # express app factory
│   │   ├── server.ts           # bootstrap + graceful shutdown
│   │   └── seed.ts             # demo store seed
│   └── tests/                  # 6 integration suites
├── docs/                       # STATUS.md (test matrix), PAYPAL.md, DEPLOYMENT.md
├── README.md
├── LICENSE
└── package.json                # npm workspaces: client + server
```

**Request flow for a payment** (the security-critical path):

1. `POST /api/payments/paypal/create-order` → server recomputes the total from `Product` records,
   ignores any client-supplied amount, and asks PayPal for an order.
2. The browser approves with the official PayPal JS SDK.
3. `POST /api/payments/paypal/capture-order` → server captures with PayPal, then **compares capture
   value + currency with the stored order**. Mismatch ⇒ order stays unpaid, a failed `Payment` and
   an error notification are written.
4. Only after verification: order → `paid`, `Transaction` upserted, inventory decremented once
   (guarded by `inventoryCommitted` + per-product idempotency keys).
5. Webhooks are accepted **only** after `verify-webhook-signature` returns `SUCCESS`, and share the
   same idempotent `finalizePaidOrder` path.

## 4. Installation

```bash
# requirements: Node >= 20, npm >= 10
git clone <repo> && cd paypilot-ai
npm install                       # installs both workspaces

cp server/.env.example server/.env
cp client/.env.example client/.env

npm run seed                      # optional: demo store + 10 products
npm run dev                       # API :5000 and SPA :5173 together
```

Open http://localhost:5173 and sign in with the seeded owner:

```
demo@paypilot.ai / DemoPass123!
```

Without `MONGODB_URI` the server starts an in-memory MongoDB automatically (dev/test only) — data
is lost on restart. Set `MONGODB_URI` (e.g. Atlas) for persistence.

### Scripts

| Command | Effect |
| --- | --- |
| `npm run dev` | API + SPA concurrently |
| `npm run dev:server` / `dev:client` | one side only |
| `npm run build` | typecheck-free production build of both workspaces |
| `npm test` | server + client test suites |
| `npm run seed` | seed the demo store |
| `npm run typecheck` | `tsc --noEmit` for both workspaces |

## 5. Environment configuration

`server/.env` (see `server/.env.example`): `MONGODB_URI`, `JWT_SECRET`, `COOKIE_NAME`,
`RESET_TOKEN_TTL_MINUTES`, `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`, `PAYPAL_ENV`,
`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_CURRENCY`,
`PUBLIC_API_URL`, `UPLOAD_DIR`, `MAX_UPLOAD_MB`, `CLIENT_ORIGIN`, `PORT`.

`client/.env`: `VITE_API_URL` — leave empty in development to use the Vite proxy (`/api` → `:5000`).
In production set it to the public API origin (cookies require same-site or correct CORS).

Secrets are never imported by client code; only the PayPal **client ID** is sent to the browser
(`GET /api/payments/paypal/config`).

## 6. API

All responses use `{ success: boolean, data?: T, error?: { code, message, details? } }`.
All routes are JSON, cookie-authenticated, rate limited, and validate input with Zod.
Anything under a store is scoped to `req.user.storeId`.

### Auth — `/api/auth`
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/register` | name, email, password, storeName → creates store + owner |
| POST | `/login` | sets HTTP-only cookie |
| POST | `/logout` | clears cookie |
| GET | `/me` | current user + store |
| POST | `/forgot-password` | always generic 200; returns `resetToken` only outside production |
| POST | `/reset-password` | single-use, hashed, 30-min TTL |

### Products — `/api/products` (auth required)
`GET /` (page, limit, search, categoryId, status, stock, sort) · `POST /` · `GET /:id` ·
`PUT /:id` · `DELETE /:id` · `GET /categories` · `POST /categories`.
Write operations require `owner|manager`; `DELETE` requires `owner`.

### Orders — `/api/orders`
`GET /` (page, search, status, paymentStatus, from, to + `statusCounts`) · `GET /recent` ·
`POST /` · `GET /:id` · `PUT /:id/status`.

### Payments — `/api/payments`
`GET /` · `GET /paypal/config` · `POST /paypal/create-order` ·
`POST /paypal/capture-order` · `POST /paypal/webhook` (public, signature-verified).

### AI — `/api/ai`
`GET /status` · `POST /chat` · `GET /conversations` · `GET /conversations/:id` ·
`POST /recommendations` · `POST /generate-description` · `POST /business-insights`.

### Analytics — `/api/analytics`
`GET /overview` · `GET /revenue?days=30` · `GET /products` · `GET /orders`.

### Inventory — `/api/inventory`
`GET /` (search, filter=low|out, summary) · `PUT /:productId` (newStock, reason) ·
`GET /movements`.

### Notifications — `/api/notifications`
`GET /` (unreadOnly, unreadCount) · `PUT /:id/read` · `PUT /read-all`.

## 7. PayPal Sandbox setup

1. Create a Sandbox REST app at <https://developer.paypal.com/dashboard/applications/sandbox>.
2. Put the client ID / secret into `server/.env`; keep `PAYPAL_ENV=sandbox`.
3. Add a webhook pointing at `${PUBLIC_API_URL}/api/payments/paypal/webhook` subscribed to
   `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, and copy its
   ID into `PAYPAL_WEBHOOK_ID`.
4. Locally expose the API (e.g. `ngrok http 5000`) so PayPal can reach the webhook.
5. Open an unpaid order in the UI and pay with a Sandbox **personal** buyer account.

Details and troubleshooting: [`docs/PAYPAL.md`](docs/PAYPAL.md).

## 8. Testing

```bash
cd server && npx vitest run     # 6 files, 51 tests — real HTTP + in-memory MongoDB
cd client && npx vitest run     # 4 files, 19 tests — jsdom + Testing Library
cd client && npx vite build     # production bundle
```

Server suites: `auth`, `products`, `orders`, `payments`, `inventory`, `ai-analytics`.
They cover invalid payloads, 401/403 paths, store isolation, insufficient stock, duplicate
capture, amount mismatch, unsigned/spoofed webhooks, idempotent replay, low-stock alerts,
analytics correctness against real records, AI fallbacks and hallucinated-ID rejection.

Client suites: `format`, `api` (envelope/error/network), `components` (buttons, fields, states,
pagination, toasts), `auth-context` (session restore + redirect).

**What is *not* covered** — see the honesty table in [`docs/STATUS.md`](docs/STATUS.md). In short:
no live PayPal Sandbox transaction, no live LLM call, no browser E2E, MongoDB is in-memory rather
than a replica set (so multi-document transactions are not exercised).

## 9. Deployment

| Piece | Host | Notes |
| --- | --- | --- |
| Frontend | Vercel | Root `client`, build `npm run build`, output `dist`; set `VITE_API_URL` to the API origin |
| Backend | Render (or any Node host) | Root `server`, build `npm install && npm run build`, start `npm start`; set all `server/.env` variables, `NODE_ENV=production` |
| Database | MongoDB Atlas | Set `MONGODB_URI`; add the host's egress IPs to the Atlas allowlist |

Production checklist: strong `JWT_SECRET`, `NODE_ENV=production` (serves `secure` cookies),
`CLIENT_ORIGIN` set to the exact frontend origin, PayPal live credentials only when ready, and
`PUBLIC_API_URL` reachable for webhooks. Full guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 10. Security notes

- Passwords hashed with bcrypt (10 rounds); `passwordHash` is `select: false`.
- Sessions are HTTP-only, `SameSite=Lax` cookies; no tokens in localStorage.
- Every query is scoped by `storeId` from the JWT — cross-store reads return 404.
- Zod validates body/query/params; errors return stable `code` values.
- `helmet`, CORS allow-list, `express-rate-limit` (general 300/min, auth 30/15min, AI 30/min).
- Payment: no price trusted from the browser, capture verified, idempotent, no card data stored.
- Webhooks: rejected unless PayPal verifies the signature; unsigned calls cannot change state.
- Reset tokens are SHA-256 hashed at rest, single-use, and expire.

## 11. Screenshots

Add your own captures to `docs/screenshots/` (`dashboard.png`, `products.png`, `orders.png`,
`assistant.png`, `analytics.png`, `inventory.png`). The pages described above are all implemented;
no placeholder images ship with the repo.

## 12. Future improvements

- Store settings mutation endpoint (rename store, change currency, edit AI persona).
- Real image uploads to S3/Cloudinary (the API already serves `/uploads` statically and validates
  `MAX_UPLOAD_MB`).
- Email delivery for password resets and receipts (provider is deliberately unset).
- Refresh-token rotation and per-device session listing.
- Multi-document transactions once deployed against a MongoDB replica set / Atlas cluster.
- Refund endpoint that calls PayPal's refunds API (ledger already models `refund`).
- Browser E2E (Playwright) once the app is deployed with real credentials.

## License

MIT — see [`LICENSE`](LICENSE).
