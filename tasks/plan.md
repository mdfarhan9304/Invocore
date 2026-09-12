# Implementation Plan: Invocore

## Overview

Invocore will start as a TypeScript monorepo for a multi-tenant invoicing SaaS. The first goal is not to build every service at once; it is to create a reliable foundation, then ship one working vertical path through authentication, tenant resolution, client/product management, invoices, payments, and async jobs.

## Architecture Decisions

- Use a `pnpm` workspace monorepo so the API services, frontend, shared types, and database package can evolve together.
- Keep the planned three-service boundary: `core-api`, `payments-service`, and `workers-service`.
- Put tenant-owned business data behind the Core API first. Payments and workers should not be implemented until tenant isolation and authorization are tested.
- Use PostgreSQL with Prisma and separate logical schemas for `core`, `payments`, and `workers`.
- Use Redis/BullMQ only after the Core API has a working invoice flow.
- Start with Docker Compose for local development: Postgres, Redis, Core API, Payments Service, Workers Service, and later the web app.

## Recommended Repository Shape

```text
apps/
  core-api/
  payments-service/
  workers-service/
  web/
packages/
  config/
  database/
  shared/
tasks/
  plan.md
  todo.md
docker-compose.yml
package.json
pnpm-workspace.yaml
tsconfig.base.json
```

## Task List

### Phase 1: Foundation

- [ ] Task 1: Initialize repository and monorepo tooling
- [ ] Task 2: Add shared TypeScript, lint, format, and test configuration
- [ ] Task 3: Add Docker Compose for Postgres and Redis
- [ ] Task 4: Create service skeletons for Core API, Payments Service, and Workers Service
- [ ] Task 5: Create shared packages for config, database, and common types

### Checkpoint: Foundation

- [ ] `pnpm install` works
- [ ] `pnpm build` works across packages
- [ ] `docker compose up` starts Postgres and Redis
- [ ] Each backend service exposes a health endpoint

### Phase 2: Core API Auth and Tenancy

- [ ] Task 6: Add Prisma schema for users, organizations, memberships, refresh tokens, and audit logs
- [ ] Task 7: Implement registration and login
- [ ] Task 8: Implement refresh-token rotation and logout
- [ ] Task 9: Implement tenant resolution middleware
- [ ] Task 10: Implement role-based authorization middleware
- [ ] Task 11: Add tenant-isolation tests

### Checkpoint: Auth and Tenancy

- [ ] User can register, log in, refresh, and log out
- [ ] User can create or belong to an organization
- [ ] API requests resolve `tenantId` from authenticated membership
- [ ] Tests prove tenant-owned records cannot be accessed by ID alone

### Phase 3: Business Data

- [x] Task 12: Implement clients CRUD with tenant scoping
- [ ] Task 13: Implement products/services CRUD with tenant scoping
- [ ] Task 14: Add search and basic filtering for clients and products
- [ ] Task 15: Add audit logs for client and product changes

### Checkpoint: Business Data

- [ ] Authenticated tenant members can manage clients and products
- [ ] Cross-tenant reads and writes are rejected
- [ ] Audit logs are written for mutating actions

### Phase 4: Invoice Engine

- [ ] Task 16: Add invoice and invoice item schema
- [ ] Task 17: Implement invoice total calculation using integer minor units
- [ ] Task 18: Implement concurrency-safe invoice numbering
- [ ] Task 19: Implement invoice state machine
- [ ] Task 20: Implement invoice CRUD and actions: issue, send, cancel
- [ ] Task 21: Add optimistic locking with a `version` field
- [ ] Task 22: Add concurrency tests for numbering and edits

### Checkpoint: Invoice Engine

- [ ] Invoices can be created, issued, sent, cancelled, and viewed
- [ ] Invalid status transitions are rejected
- [ ] Concurrent invoice creation does not duplicate invoice numbers
- [ ] Concurrent invoice edits respect optimistic locking

### Phase 5: Payments Service

- [ ] Task 23: Add payments schema and idempotency storage
- [ ] Task 24: Implement manual payment recording
- [ ] Task 25: Implement partial payment and balance calculation
- [ ] Task 26: Implement Stripe test-mode webhook endpoint
- [ ] Task 27: Verify Stripe webhook signatures
- [ ] Task 28: Implement transactional outbox for payment events
- [ ] Task 29: Implement outbox relay to Redis/BullMQ or Redis Streams
- [ ] Task 30: Add idempotency and webhook replay tests

### Checkpoint: Payments

- [ ] Manual payment creation is idempotent
- [ ] Replayed Stripe webhook events do not duplicate payments
- [ ] Invoice balance and status update correctly after payments
- [ ] Payment events are stored and published through the outbox

### Phase 6: Workers Service

- [ ] Task 31: Add BullMQ worker setup
- [ ] Task 32: Implement email job worker
- [ ] Task 33: Implement PDF generation worker
- [ ] Task 34: Store PDFs in S3-compatible storage
- [ ] Task 35: Generate signed URLs for invoice PDFs
- [ ] Task 36: Implement reminder worker
- [ ] Task 37: Implement overdue-detection scheduler
- [ ] Task 38: Add retry, backoff, and dead-letter behavior

### Checkpoint: Workers

- [ ] Sending an invoice queues background email/PDF work
- [ ] PDF generation does not block API responses
- [ ] Failed jobs retry and eventually move to a dead-letter queue
- [ ] Invoice PDFs are private and accessible only through signed URLs

### Phase 7: Web App

- [ ] Task 39: Create Next.js app shell
- [ ] Task 40: Build login and registration screens
- [ ] Task 41: Build organization switcher or tenant context UI
- [ ] Task 42: Build clients and products screens
- [ ] Task 43: Build invoice list, editor, detail, and send flows
- [ ] Task 44: Build payment recording UI
- [ ] Task 45: Build basic dashboard for revenue, outstanding, and overdue totals

### Checkpoint: Web App

- [ ] A user can complete the main flow from browser: register, create client, create product, create invoice, send invoice, record payment
- [ ] UI handles loading, empty, error, and unauthorized states
- [ ] Main screens work on desktop and mobile widths

### Phase 8: Observability, Security, and Hardening

- [ ] Task 46: Add structured logging with request, tenant, and trace IDs
- [ ] Task 47: Add basic OpenTelemetry tracing across services
- [ ] Task 48: Add rate limiting for auth and webhook endpoints
- [ ] Task 49: Add validation for request bodies, params, dates, amounts, and uploads
- [ ] Task 50: Add load tests for invoice numbering and webhook idempotency
- [ ] Task 51: Add CI for lint, tests, build, and type checking

### Checkpoint: Ready for Portfolio Review

- [ ] All services build and start locally
- [ ] Automated tests cover tenant isolation, invoice numbering, optimistic locking, and payment idempotency
- [ ] Load tests demonstrate concurrency correctness
- [ ] README explains architecture, setup, tradeoffs, and demo flow

## First Milestone

The first milestone should stop after Phase 2. A strong first milestone is:

1. Monorepo exists.
2. Postgres and Redis run locally.
3. Core API starts.
4. User can register and log in.
5. User belongs to an organization.
6. Tenant middleware resolves `tenantId`.
7. Tests prove tenant isolation.

Do not start Stripe, PDF generation, dashboard analytics, or frontend polish before this milestone is complete.

## Risks and Mitigations

| Risk                                        | Impact | Mitigation                                                                       |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Building all services too early             | High   | Start with Core API and add service integration only after tenant/auth is stable |
| Tenant data leakage                         | High   | Require tenant-scoped queries and write explicit isolation tests                 |
| Duplicate invoice numbers under concurrency | High   | Use database transactions, constraints, and load/concurrency tests               |
| Duplicate payments from webhook retries     | High   | Persist idempotency keys/provider event IDs and test replay behavior             |
| Financial rounding errors                   | High   | Store money as integer minor units, not floating-point numbers                   |
| Outbox relay complexity                     | Medium | Implement manual payment first, then outbox, then Stripe webhooks                |
| Worker failures hidden from API             | Medium | Add retry, dead-letter queues, and structured logs                               |

## Open Questions

- Should the first version support only one currency per organization or multiple invoice currencies?
- Should authentication use secure HTTP-only cookies from day one, or bearer tokens during early API development?
- Should local object storage use MinIO from the beginning or be mocked until PDF work starts?
- Should service-to-service auth start with internal JWTs before considering mTLS?
- Should the web app be included in the first demo milestone or added only after the backend flow works?
