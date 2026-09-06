# Invocore
### Multi-Tenant Invoicing & Payment Management SaaS — Microservices Architecture

**Architecture:** 3-service backend (Core API, Payments Service, Workers Service)
**Backend:** Node.js + Express + TypeScript
**Database:** PostgreSQL + Prisma (shared instance, per-service schemas)
**Async Processing:** Redis + BullMQ
**Documents:** PDF generation + S3-compatible storage
**Primary Users:** Small businesses, service providers, accounting teams

---

## 1. Product Overview

Invocore is a multi-tenant SaaS platform for small businesses to manage clients, products/services, invoices, payments, reminders, and basic financial analytics.

The project deliberately focuses on the core invoicing workflow rather than reproducing a full accounting or regulatory platform. The engineering focus is on **correctness under concurrency, financial data integrity, and service-to-service consistency** — not on feature breadth.

```
Business
  |
  +-- Clients
  +-- Products / Services
  +-- Invoices
  +-- Payments
  +-- Reports
  +-- Notifications
```

---

## 2. Why Microservices — and Why Only Three

A common mistake in portfolio projects is splitting an app into many small services with no technical justification. Invocore uses **exactly three deployable services**, each justified by a real architectural boundary:

| Service | Why it's separate |
|---|---|
| **Core API** | Owns transactional, tenant-scoped business data (orgs, clients, products, invoices). No reason to distribute this internally — it shares one consistency boundary. |
| **Payments Service** | Public webhook surface, bursty traffic pattern, strict idempotency requirements, and a financial correctness boundary distinct from general business data. |
| **Workers Service** | Async, non-blocking job processing (PDF, email, reminders, overdue detection) — a different runtime and scaling profile than request/response APIs. |

No additional services (e.g. separate Clients, Products, or Notifications services) are created, since they share the same consistency boundary as Core API and would only add network calls without solving a new class of problem.

```
        ┌─────────────┐
        │  Core API   │◄──────────────┐
        └─────┬───────┘                │
              │ events                 │ events
              ▼                        │
      ┌──────────────┐          ┌─────────────┐
      │   Payments   │─events──▶│   Workers   │
      │   Service    │          │   Service   │
      └──────────────┘          └─────────────┘
           ▲
           │ webhooks
      ┌────┴─────┐
      │  Stripe  │
      └──────────┘
```

---

## 3. Multi-Tenant Model

One application serves multiple businesses. Each business is a tenant; tenant-owned records are isolated using a `tenant_id` column, scoped in **every** service that touches tenant data.

**Critical isolation rule:** never query a tenant-owned resource by ID alone.

```sql
SELECT * FROM invoices
WHERE id = $1 AND tenant_id = $2;
```

### Tenant Resolution Flow

```
JWT → Authenticated user → Tenant membership → req.tenantId
    → Authorization → Tenant-scoped database query
```

---

## 4. Roles & Permissions

| Role | Typical Permissions |
|---|---|
| Owner | Full organization access, users, settings, invoices, payments, reports |
| Admin | Clients, products, invoices, payments, reports |
| Accountant | Invoices, payments, financial views, reminders |
| Viewer | Read-only access to permitted organization data |

---

## 5. Feature Scope

### 5.1 Core API Service — Keep

- **Auth**: register, login, refresh-token rotation, logout, password reset
- **Organizations & RBAC**: org creation, memberships, role middleware, tenant-scoping middleware
- **Clients**: CRUD, search/filter, outstanding balance, payment history (kept intentionally simple)
- **Products/Services**: catalog, pricing, tax rate (kept intentionally simple)
- **Invoices**: CRUD, service-layer state machine, concurrency-safe invoice numbering, optimistic locking (`version` column)
- **Dashboard**: revenue / outstanding / overdue stats, Redis-cached and invalidated on payment events
- **Audit logs**: invoice, payment, permission, and organization change tracking

### 5.2 Payments Service — Keep (highest engineering priority)

- Payment recording, partial payments, balance calculation
- Stripe test-mode webhook ingestion
- Idempotency keys on manual payments and webhook events
- **Outbox pattern**: payment writes and event publication happen transactionally, with a relay process forwarding events to Core API and Workers

### 5.3 Workers Service — Keep

- Email worker, PDF worker (Puppeteer, non-blocking), reminder worker, overdue-detection worker
- Retry with exponential backoff + dead-letter queue on repeated failure
- Signed URLs for PDF access (no public object storage access)

### 5.4 Cross-Cutting — Keep

- Structured logging with request/tenant/trace IDs
- Basic OpenTelemetry tracing across all three services
- Rate limiting on auth and webhook endpoints
- Input validation on all bodies, params, dates, amounts, and file uploads
- Load testing (k6/Artillery) proving invoice numbering and webhook idempotency hold under concurrency

### 5.5 Explicitly Cut / Minimized

- Notifications as its own deployable service (folded into Workers)
- Email verification flow (optional, low priority)
- Reports beyond revenue / outstanding / overdue (a few SQL aggregates only)
- Full general ledger, payroll, inventory management, OCR, tax-authority integrations, Peppol/e-invoicing networks, native mobile apps
- Additional service splits (Clients service, Products service, standalone Notifications service) — no coupling justification

---

## 6. Invoice Lifecycle

```
DRAFT → ISSUED → SENT ──────────► CANCELLED
                  │
                  ▼
          PARTIALLY_PAID
                  │
                  ▼
                PAID

SENT + due_date passed + unpaid → OVERDUE
```

Transitions are controlled by a service-layer state machine in Core API — never by direct controller status updates.

---

## 7. Invoice & Payment Requirements

### Invoice Fields
Invoice number, client, issue date, due date, currency, line items, quantity, unit price, discount, tax, subtotal, total, amount paid, balance due, notes, terms.

### Concurrent-Safe Invoice Numbering
Concurrent users must never receive the same invoice number. Enforced via a PostgreSQL transaction/locking strategy plus a unique constraint scoped to the tenant.

```
INV-2026-00001
INV-2026-00002
INV-2026-00003
```

### Partial Payments Example
```
Invoice total: 100,000
Payment 1:      30,000
Payment 2:      40,000
------------------------
Balance:        30,000
Status: PARTIALLY_PAID
```

### Payment Idempotency
Payment creation and payment-provider webhook processing must be idempotent. A unique provider event ID or idempotency key is persisted so repeated requests never create duplicate financial records.

### Outbox Pattern (Payments Service)
1. Payment write and outbox-event write happen in a single DB transaction.
2. A relay process polls/streams the outbox and publishes events (Redis Streams or BullMQ) to Core API and Workers.
3. Downstream consumers apply changes idempotently (e.g. dashboard cache invalidation, receipt emails).

---

## 8. Background Processing

```
Payments Service ──events──▶ Redis / BullMQ ──▶ Workers Service
                                                    │
                                    +---------------+---------------+
                                    │       │        │              │
                                Email    PDF     Reminder       Overdue
                                Worker  Worker    Worker        Worker
```

### Example: Send Invoice
```
POST /invoices/:id/send
   → Validate + authorize
   → Create email job (Core API → BullMQ)
   → Return HTTP response
   → Email worker picks up job
   → Email provider
```

### Example: Overdue Detection
```
Scheduler (Workers) → Find unpaid invoices past due_date
   → Transition to OVERDUE (via Core API event/API call)
   → Create reminder jobs
   → Email worker
```

---

## 9. PDF & Object Storage

```
Invoice → PDF Job → PDF Worker → Object Storage → Signed URL
```

Invoice PDFs are generated asynchronously and stored in S3-compatible object storage, exposed only via short-lived signed URLs — never public access.

---

## 10. Database Model

Shared PostgreSQL instance, **separate schema per service** (`core`, `payments`, `workers`) to avoid cross-schema joins and force communication via events/APIs.

| Table | Schema | Important Fields |
|---|---|---|
| users | core | id, email, password_hash, name, created_at |
| organizations | core | id, name, logo, currency, tax settings |
| organization_members | core | organization_id, user_id, role |
| clients | core | id, tenant_id, name, email, phone, address, tax_number |
| products | core | id, tenant_id, name, sku, unit_price, tax_rate, unit |
| invoices | core | id, tenant_id, client_id, invoice_number, status, version, dates, totals |
| invoice_items | core | id, invoice_id, product_id, description, quantity, price, tax |
| refresh_tokens | core | id, user_id, token_hash, expires_at, revoked_at |
| audit_logs | core | id, tenant_id, user_id, action, resource, metadata, created_at |
| payments | payments | id, tenant_id, invoice_id, amount, provider_event_id, paid_at |
| payment_outbox | payments | id, event_type, payload, published_at |
| notifications | workers | id, tenant_id, type, recipient, status, sent_at |

---

## 11. API Surface

| Area | Endpoints | Service |
|---|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Core API |
| Clients | `GET/POST /clients`, `GET/PATCH/DELETE /clients/:id` | Core API |
| Products | `GET/POST /products`, `PATCH/DELETE /products/:id` | Core API |
| Invoices | `GET/POST /invoices`, `GET/PATCH /invoices/:id` | Core API |
| Invoice Actions | `POST /invoices/:id/send`, `/cancel`, `GET /invoices/:id/pdf` | Core API / Workers |
| Payments | `GET/POST /invoices/:id/payments` | Payments Service |
| Webhooks | `POST /webhooks/stripe` | Payments Service |
| Dashboard | `GET /dashboard`, `GET /reports/revenue` | Core API |
| Audit | `GET /audit-logs` | Core API |

---

## 12. Security Requirements

- **Tenant isolation**: every tenant-owned query, in every service, must be tenant-scoped
- **Authorization**: authenticate → resolve org membership → enforce role permissions
- **Service-to-service auth**: internal JWT or mTLS between Core API, Payments, and Workers
- **Password security**: Argon2id or bcrypt; never store plaintext
- **Session security**: short-lived access tokens, refresh-token rotation, secure HTTP-only cookies
- **Webhook security**: verify provider signatures, retry with backoff, dead-letter after repeated failure
- **Input validation**: bodies, query params, IDs, dates, amounts, uploaded files
- **Rate limiting**: auth and webhook endpoints
- **Auditability**: invoice, payment, permission, and organization changes logged
- **Financial integrity**: DB transactions, constraints, and the outbox pattern for payment operations
- **Storage security**: signed URLs; no public access to invoice documents

---

## 13. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (shared instance, per-service schemas) |
| ORM | Prisma |
| Queue / Events | Redis + BullMQ (or Redis Streams for the outbox relay) |
| PDF | Puppeteer |
| Object Storage | S3-compatible storage |
| Payments | Stripe (test mode) |
| Observability | OpenTelemetry + structured logging |
| Deployment | Docker (3 services + Postgres + Redis via docker-compose) |
| Monorepo Tooling | pnpm workspaces / Turborepo or Nx |

---

## 14. Implementation Roadmap

| Phase | Scope |
|---|---|
| 1 — Foundation | Monorepo, 3 service skeletons, shared Prisma schema/types packages, docker-compose, inter-service auth |
| 2 — Auth, Tenants, RBAC | Registration/login/refresh, orgs, memberships, tenant middleware, role middleware, tenant-isolation tests |
| 3 — Business Data | Clients and products CRUD, search/filter (kept simple) |
| 4 — Invoice Engine | State machine, concurrency-safe numbering, optimistic locking |
| 5 — Payments Service | Payment recording, Stripe webhooks, idempotency, outbox pattern |
| 6 — Workers Service | Email/PDF/reminder/overdue workers, retries, dead-letter queues |
| 7 — Observability & Hardening | Tracing, structured logging, rate limiting, audit logs, load testing |

---

## 15. Explicit Non-Goals

Do not attempt to build a complete accounting suite. Out of scope for this version: full general ledger, payroll, inventory management, OCR, tax-authority integrations, Peppol/e-invoicing networks, native mobile applications, and additional microservice splits beyond the three defined above.

---

## 16. Portfolio / Interview Positioning

The strongest engineering topics to be ready to discuss in depth:

- Service boundary justification (why 3 services, not more or fewer)
- Multi-tenant data isolation and authorization across service boundaries
- Transactional invoice and payment operations
- Concurrent-safe invoice numbering under load
- Idempotent payment/webhook processing via the outbox pattern
- Asynchronous jobs with BullMQ/Redis and dead-letter handling
- Scheduled reminders and overdue detection
- Non-blocking PDF generation
- Audit logging and financial traceability
- Optimistic locking for concurrent invoice edits
- Distributed tracing across services
- Load testing results demonstrating correctness under concurrency

### Resume Summary

**Invocore — Multi-Tenant Invoicing & Payment SaaS**

Built a 3-service, multi-tenant invoicing and payment platform (Core API, Payments Service, Workers Service) using Node.js, Express, PostgreSQL, Redis, and BullMQ, with tenant-scoped authorization, a service-layer invoice state machine, and concurrency-safe invoice numbering under transactional constraints.

Designed an outbox-pattern event flow between the Payments Service and downstream consumers for idempotent Stripe webhook processing, eliminating duplicate financial records under retried or concurrent delivery.

Implemented a dedicated Workers service for asynchronous email, PDF, and reminder processing with retry/backoff and dead-letter queues, plus distributed tracing across all three services for end-to-end observability.