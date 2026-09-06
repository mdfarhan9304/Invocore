# Invocore Task Checklist

## Phase 1: Foundation

## Task 1: Initialize repository and monorepo tooling

**Description:** Create the Git repo, root package files, workspace config, and baseline scripts.

**Acceptance criteria:**
- [x] Repository has `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json`
- [x] Workspace includes `apps/*` and `packages/*`
- [x] Root scripts exist for build, test, lint, format, and dev

**Verification:**
- [x] `pnpm install`
- [x] `pnpm build`

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`

**Estimated scope:** Medium

## Task 2: Add shared TypeScript, lint, format, and test configuration

**Description:** Add shared tooling so all services use the same quality baseline.

**Acceptance criteria:**
- [ ] TypeScript config is shared by apps and packages
- [ ] Linting and formatting are configured
- [ ] Test runner is configured

**Verification:**
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`

**Dependencies:** Task 1

**Files likely touched:**
- `packages/config/`
- root config files

**Estimated scope:** Medium

## Task 3: Add Docker Compose for Postgres and Redis

**Description:** Provide local infrastructure for database and queues.

**Acceptance criteria:**
- [ ] `docker-compose.yml` starts Postgres
- [ ] `docker-compose.yml` starts Redis
- [ ] `.env.example` documents required local variables

**Verification:**
- [ ] `docker compose up`
- [ ] Services are reachable on documented ports

**Dependencies:** Task 1

**Files likely touched:**
- `docker-compose.yml`
- `.env.example`

**Estimated scope:** Small

## Task 4: Create service skeletons

**Description:** Create Core API, Payments Service, and Workers Service with minimal start scripts.

**Acceptance criteria:**
- [ ] `apps/core-api` starts an Express server
- [ ] `apps/payments-service` starts an Express server
- [ ] `apps/workers-service` starts a worker process
- [ ] API services expose `/health`

**Verification:**
- [ ] `pnpm dev`
- [ ] Health endpoints return success

**Dependencies:** Tasks 1, 2

**Files likely touched:**
- `apps/core-api/`
- `apps/payments-service/`
- `apps/workers-service/`

**Estimated scope:** Medium

## Task 5: Create shared packages

**Description:** Add shared packages for config, database access, and common types.

**Acceptance criteria:**
- [ ] `packages/config` exports environment parsing
- [ ] `packages/database` owns Prisma setup
- [ ] `packages/shared` exports common DTOs/errors/constants

**Verification:**
- [ ] `pnpm build`
- [ ] Services import shared packages successfully

**Dependencies:** Tasks 1, 2

**Files likely touched:**
- `packages/config/`
- `packages/database/`
- `packages/shared/`

**Estimated scope:** Medium

## Checkpoint: Foundation

- [ ] `pnpm install` works
- [ ] `pnpm build` works
- [ ] `docker compose up` starts Postgres and Redis
- [ ] Backend health endpoints respond

## Phase 2: Core API Auth and Tenancy

## Task 6: Add Core Prisma schema

**Description:** Model users, organizations, memberships, refresh tokens, and audit logs.

**Acceptance criteria:**
- [ ] Prisma schema includes core auth and tenant tables
- [ ] Migrations run locally
- [ ] Unique constraints protect emails and memberships

**Verification:**
- [ ] `pnpm prisma migrate dev`
- [ ] `pnpm test`

**Dependencies:** Tasks 3, 5

**Files likely touched:**
- `packages/database/prisma/schema.prisma`
- migration files

**Estimated scope:** Medium

## Task 7: Implement registration and login

**Description:** Add user registration and login in Core API.

**Acceptance criteria:**
- [ ] User can register with email, password, and name
- [ ] Passwords are hashed
- [ ] Login returns an access token and refresh token mechanism

**Verification:**
- [ ] Auth tests pass
- [ ] Manual API request can register and log in

**Dependencies:** Task 6

**Files likely touched:**
- `apps/core-api/src/routes/auth.ts`
- `apps/core-api/src/services/auth.service.ts`
- auth tests

**Estimated scope:** Medium

## Task 8: Implement refresh-token rotation and logout

**Description:** Make sessions revocable and safer by rotating refresh tokens.

**Acceptance criteria:**
- [ ] Refresh endpoint rotates tokens
- [ ] Reused revoked refresh tokens are rejected
- [ ] Logout revokes current refresh token

**Verification:**
- [ ] Refresh/logout tests pass

**Dependencies:** Task 7

**Files likely touched:**
- auth service files
- refresh token tests

**Estimated scope:** Medium

## Task 9: Implement tenant resolution middleware

**Description:** Resolve the active tenant from authenticated user membership.

**Acceptance criteria:**
- [ ] Authenticated requests can provide/select organization context
- [ ] Middleware verifies membership before setting `tenantId`
- [ ] Missing or invalid tenant context is rejected

**Verification:**
- [ ] Middleware tests pass

**Dependencies:** Task 7

**Files likely touched:**
- `apps/core-api/src/middleware/tenant.ts`
- tenant tests

**Estimated scope:** Medium

## Task 10: Implement role-based authorization middleware

**Description:** Enforce Owner, Admin, Accountant, and Viewer access levels.

**Acceptance criteria:**
- [ ] Middleware supports role checks per route
- [ ] Unauthorized roles receive a forbidden response
- [ ] Owner role has full organization access

**Verification:**
- [ ] RBAC tests pass

**Dependencies:** Task 9

**Files likely touched:**
- `apps/core-api/src/middleware/rbac.ts`
- RBAC tests

**Estimated scope:** Small

## Task 11: Add tenant-isolation tests

**Description:** Prove tenant-owned resources cannot be read or mutated across tenants.

**Acceptance criteria:**
- [ ] Tests cover same resource IDs across different tenants where possible
- [ ] Tests fail if queries are made by ID alone
- [ ] Test helpers make tenant setup easy

**Verification:**
- [ ] Tenant isolation test suite passes

**Dependencies:** Tasks 9, 10

**Files likely touched:**
- integration tests
- test helpers

**Estimated scope:** Medium

## Checkpoint: Auth and Tenancy

- [ ] User can register, log in, refresh, and log out
- [ ] User can create or belong to an organization
- [ ] Tenant middleware resolves `tenantId`
- [ ] Cross-tenant access is rejected by tests

## Later Phases

- [ ] Phase 3: Clients and products CRUD
- [ ] Phase 4: Invoice engine
- [ ] Phase 5: Payments service
- [ ] Phase 6: Workers service
- [ ] Phase 7: Web app
- [ ] Phase 8: Observability, security, load testing, and CI
