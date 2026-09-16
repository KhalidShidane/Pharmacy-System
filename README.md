# Kalsan Pharmacy — Pharmacy Management System

A production-grade MERN pharmacy management platform. This is **Phase 1** of
a phased build — see [Phase 1 scope](#phase-1-scope) below for exactly
what's implemented versus planned for later phases.

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router, Axios, Recharts, lucide-react
- **Backend**: Node.js, Express, JWT auth (httpOnly cookie), role-based authorization
- **Database**: MongoDB, Mongoose

## Project layout

```
backend/     Express + Mongoose REST API   (src/models, controllers, routes, services, middleware)
frontend/    React + Vite + Tailwind app   (src/api, app, components, context, features)
```

## Getting started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod`, a Windows service, or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env     # edit MONGO_URI / JWT_SECRET if needed
npm run seed              # creates roles, demo users, sample medicines & batches
npm run dev                # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173 (proxies /api to :5000)
```

Open http://localhost:5173 and log in with one of the seeded demo accounts
(password for all: `Password@123`):

| Role | Email |
|---|---|
| Admin | admin@pharmacy.com |
| Pharmacist | pharmacist@pharmacy.com |
| Cashier | cashier@pharmacy.com |
| Inventory Manager | inventory@pharmacy.com |

## Architecture notes

- **Auth**: JWT is issued on login and set as an httpOnly, `SameSite=Strict`
  cookie (not localStorage), reducing XSS token-theft risk. The token embeds
  the user's resolved permissions, so authorization middleware (`authorize()`)
  enforces access **on the backend** without a DB round-trip per request —
  hiding a button on the frontend is never the only guard.
- **Dev CORS/cookies**: the Vite dev server proxies `/api/*` to the backend
  (`frontend/vite.config.js`), so the browser only ever talks to one origin
  in development and the strict-SameSite cookie works without extra config.
  **In production, serve the frontend and API from the same origin** (e.g.
  a reverse proxy) — a `SameSite=Strict` cookie will not be sent cross-site.
- **Inventory is batch-level**, never a single quantity field. All stock
  mutations go through `inventory.service.js#applyStockChange`, which is the
  only path allowed to change a batch's `remainingQuantity`, and it always
  writes a matching `InventoryTransaction` row — a full, queryable stock
  movement history.
- **FEFO dispensing**: `inventory.service.js#getSellableBatchesFEFO` selects
  active, non-expired batches ordered by soonest expiry first and greedily
  allocates a sale across them. Expired batches are excluded at the query
  level and re-checked again inside `sale.service.js` right before the sale
  commits, so a stale client cart can't sell expired stock.
- **Money math** happens once, server-side, in `sale.service.js`
  (`createSale`) — the frontend previews totals for UX but the backend is
  the source of truth for subtotal/discount/tax/total/profit.
- **Multi-document writes** (a POS sale touches Sale, SaleItem, N batches,
  Customer debt, and a Payment) run inside a Mongo transaction
  (`utils/withTransaction.js`). If the database is a standalone instance
  without replica-set support (common in local dev), it transparently falls
  back to sequential writes — production should run a replica set (Atlas
  always does).
- **Avatar uploads** are stored on local disk under `backend/uploads/avatars/`
  (multer, 2MB limit, JPEG/PNG/WEBP only) and served statically at
  `/uploads/*`; the Vite dev proxy forwards that path too, so images load
  same-origin. The folder is gitignored — back it up separately in production,
  or swap the multer disk storage engine for an object-storage one if you
  need multi-instance/horizontal scaling.

## Scope — what's built

**Phase 1:** Auth & RBAC · Medicines · Batches · Inventory (stock, low-stock,
expiry tracking, movement history) · POS & Sales (FEFO allocation, cash/
card/other, partial & credit sales) · Sales History & printable receipts ·
Customers · Dashboard (real aggregated KPIs & charts) · Users
(list/create/deactivate) · Settings (pharmacy identity, currency, tax rate).

**Phase 2:** Suppliers (contacts + purchase history + live payable balance) ·
Purchases (a dedicated "New Purchase" flow that receives stock — each line
creates a fresh Batch and writes an `InventoryTransaction`, and a partial
payment leaves a payable tracked against the supplier) · Expenses (categorized,
filterable, deletable) · Reports — eleven report types (Sales Summary,
Profit & Loss, Purchases Summary, Inventory Valuation, Best-Selling
Medicines, Low Stock, Expiry, Expenses, Customer Debts, Supplier Payables,
Payment History), each printable and CSV-exportable · self-service **My
Profile** (edit name/email, change password, upload a profile photo) —
restricted by business rule to **Admin and Cashier accounts only** via a
dedicated `profile.manage` permission, enforced on the backend, not just
hidden in the UI · **Admin user management**: edit any other user's name/
email/role, and permanently delete a user account (an admin can't delete or
edit their own account this way — that's what My Profile is for — and the
last remaining admin account can't be deleted, so the system can never end
up with zero admins).

**Still deferred:** Purchase Returns, Sales Returns, full Customer
statements, a Users/Roles *permission-editing* UI (permissions are enforced
now, just not yet editable from the UI), a persisted Notification center
(the topbar bell currently computes alerts live from current data), and an
Audit log viewer (audit events are already being recorded server-side).

All ~20 Mongoose models described in the original spec exist
(`backend/src/models`), so each phase builds routes/UI on an already-solid
schema layer instead of redesigning data.

### Role permission matrix (Phase 2 additions)

| Permission | Admin | Pharmacist | Cashier | Inventory Manager |
|---|---|---|---|---|
| Suppliers — view / manage | ✅ / ✅ | ✅ / — | — | ✅ / ✅ |
| Purchases — view / manage | ✅ / ✅ | ✅ / — | — | ✅ / ✅ |
| Expenses — view / manage | ✅ / ✅ | — | — | — |
| Reports — view | ✅ | ✅ | — | ✅ |
| Profile — self-edit | ✅ | — | ✅ | — |
