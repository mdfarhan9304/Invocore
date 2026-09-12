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

- [x] TypeScript config is shared by apps and packages
- [x] Linting and formatting are configured
- [x] Test runner is configured

**Verification:**

- [x] `pnpm lint`
- [x] `pnpm test`
- [x] `pnpm build`

**Dependencies:** Task 1

**Files likely touched:**

- `packages/config/`
- root config files

**Estimated scope:** Medium

## Task 3: Add Docker Compose for Postgres and Redis

**Description:** Provide local infrastructure for database and queues.

**Acceptance criteria:**

- [x] `docker-compose.yml` starts Postgres
- [x] `docker-compose.yml` starts Redis
- [x] `.env.example` documents required local variables

**Verification:**

- [x] `docker compose up`
- [x] Services are reachable on documented ports

**Dependencies:** Task 1

**Files likely touched:**

- `docker-compose.yml`
- `.env.example`

**Estimated scope:** Small

## Task 4: Create service skeletons

**Description:** Create Core API, Payments Service, and Workers Service with minimal start scripts.

**Acceptance criteria:**

- [x] `apps/core-api` starts an Express server
- [x] `apps/payments-service` starts an Express server
- [x] `apps/workers-service` starts a worker process
- [x] API services expose `/health`

**Verification:**

- [x] `pnpm dev`
- [x] Health endpoints return success

**Dependencies:** Tasks 1, 2

**Files likely touched:**

- `apps/core-api/`
- `apps/payments-service/`
- `apps/workers-service/`

**Estimated scope:** Medium

## Task 5: Create shared packages

**Description:** Add shared packages for config, database access, and common types.

**Acceptance criteria:**

- [x] `packages/config` exports environment parsing
- [x] `packages/database` owns Prisma setup
- [x] `packages/shared` exports common DTOs/errors/constants

**Verification:**

- [x] `pnpm build`
- [x] Services import shared packages successfully

**Dependencies:** Tasks 1, 2

**Files likely touched:**

- `packages/config/`
- `packages/database/`
- `packages/shared/`

**Estimated scope:** Medium

## Checkpoint: Foundation

- [x] `pnpm install` works
- [x] `pnpm build` works
- [x] `docker compose up` starts Postgres and Redis
- [x] Backend health endpoints respond

## Phase 2: Core API Auth and Tenancy

## Task 6: Add Core Prisma schema

**Description:** Model users, organizations, memberships, refresh tokens, and audit logs.

**Acceptance criteria:**

- [x] Prisma schema includes core auth and tenant tables
- [x] Migrations run locally
- [x] Unique constraints protect emails and memberships

**Verification:**

- [x] `pnpm --filter @invocore/database exec prisma migrate dev --name init_core_auth`
- [x] `pnpm --filter @invocore/database prisma:validate`

**Dependencies:** Tasks 3, 5

**Files likely touched:**

- `packages/database/prisma/schema.prisma`
- migration files

**Estimated scope:** Medium

## Task 7: Implement registration and login

**Description:** Add user registration and login in Core API.

**Acceptance criteria:**

- [x] User can register with email, password, and name
- [x] Passwords are hashed
- [x] Login returns an access token and refresh token mechanism

**Verification:**

- [x] Manual API request can register and log in

**Dependencies:** Task 6

**Files likely touched:**

- `apps/core-api/src/modules/auth/`
- `apps/core-api/src/modules/users/`
- `apps/core-api/src/modules/organizations/`

**Estimated scope:** Medium

## Task 8: Implement refresh-token rotation and logout

**Description:** Make sessions revocable and safer by rotating refresh tokens.

**Acceptance criteria:**

- [x] Refresh endpoint rotates tokens
- [x] Reused revoked refresh tokens are rejected
- [x] Logout revokes current refresh token

**Verification:**

- [x] Manual API request can refresh and rotate tokens
- [x] Replaying a rotated/revoked refresh token is rejected
- [x] Logout revokes the current refresh token

**Dependencies:** Task 7

**Files likely touched:**

- `apps/core-api/src/modules/auth/auth.service.ts`
- `apps/core-api/src/modules/auth/auth.repository.ts`
- `apps/core-api/src/modules/auth/auth.controller.ts`
- `apps/core-api/src/modules/auth/token.service.ts`
- `apps/core-api/src/modules/auth/dto/`

**Estimated scope:** Medium

## Task 9: Implement tenant resolution middleware

**Description:** Resolve the active tenant from authenticated user membership.

**Acceptance criteria:**

- [x] Authenticated requests can provide/select organization context
- [x] Middleware verifies membership before setting `tenantId`
- [x] Missing or invalid tenant context is rejected

**Verification:**

- [x] Manual request with valid token + membership resolves tenant context (`GET /me`)
- [x] Missing/invalid `X-Organization-Id` is rejected (400)
- [x] Non-member organization is rejected (403)

**Dependencies:** Task 7

**Files likely touched:**

- `apps/core-api/src/modules/auth/guards/auth.guard.ts`
- `apps/core-api/src/modules/auth/token.service.ts`
- `apps/core-api/src/modules/memberships/tenant.middleware.ts`
- `apps/core-api/src/modules/memberships/memberships.repository.ts`
- `apps/core-api/src/common/http/context.ts`

**Estimated scope:** Medium

## Task 10: Implement role-based authorization middleware

**Description:** Enforce Owner, Admin, Accountant, and Viewer access levels.

**Acceptance criteria:**

- [x] Middleware supports role checks per route
- [x] Unauthorized roles receive a forbidden response
- [x] Owner role has full organization access

**Verification:**

- [x] OWNER reaches an ADMIN-gated route (owner bypass)
- [x] ADMIN reaches an ADMIN-gated route
- [x] VIEWER is rejected with 403 `INSUFFICIENT_ROLE`

**Dependencies:** Task 9

**Files likely touched:**

- `apps/core-api/src/modules/memberships/role.guard.ts`
- `apps/core-api/src/modules/organizations/organizations.controller.ts`
- `apps/core-api/src/modules/organizations/organizations.module.ts`

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

## Task 12b: Replace scattered role guards with a central permission matrix

**Description:** Define all resource permissions in a single `permissions.ts` file and replace `createRoleGuard` with `createPermissionGuard` across all controllers. No behaviour change — policy moves from scattered constants to one authoritative location.

**Acceptance criteria:**

- [ ] `permissions.ts` lists every permission as a key mapping to the roles that hold it
- [ ] `OWNER` is an explicit entry in each permission's role list — no special-case bypass in the guard
- [ ] `createPermissionGuard("clients:write")` replaces `createRoleGuard("ADMIN", "ACCOUNTANT")` in clients controller
- [ ] `createPermissionGuard("members:read")` replaces `createRoleGuard("ADMIN")` in organizations controller
- [ ] Existing behaviour is preserved: same roles pass/fail the same routes

**Verification:**

- [ ] `pnpm --filter @invocore/core-api build` passes
- [ ] `pnpm lint` passes

**Dependencies:** Task 10

**Files likely touched:**

- `apps/core-api/src/modules/memberships/permissions.ts` (new)
- `apps/core-api/src/modules/memberships/role.guard.ts` → renamed/replaced
- `apps/core-api/src/modules/clients/clients.controller.ts`
- `apps/core-api/src/modules/organizations/organizations.controller.ts`

**Estimated scope:** Small

## Task 13: Add OrganizationInvite schema and migration

**Description:** Add an `OrganizationInvite` table to the Prisma schema. Stores a hashed token, target email, role, expiry, and who created it. Enforces one active invite per email per organization.

**Acceptance criteria:**

- [ ] `OrganizationInvite` model exists with: `id`, `organizationId`, `invitedEmail`, `role`, `tokenHash` (unique), `expiresAt`, `acceptedAt` (nullable), `createdByUserId`
- [ ] Unique constraint on `(organizationId, invitedEmail)` where `acceptedAt IS NULL` — enforced at app level since Prisma partial indexes need raw SQL migration
- [ ] Migration applies cleanly against local Postgres

**Verification:**

- [ ] `pnpm --filter @invocore/database exec prisma migrate dev --name add_organization_invites`
- [ ] `pnpm --filter @invocore/database exec prisma validate`

**Dependencies:** Task 6

**Files likely touched:**

- `packages/database/prisma/schema.prisma`
- new migration file

**Estimated scope:** Small

## Task 14: Implement invite creation endpoint (OWNER only)

**Description:** `POST /organizations/current/invites` — owner creates an invite for an email + role. Returns the raw token once (never stored). Owner shares the link manually.

**Acceptance criteria:**

- [ ] Validates `email` (valid format) and `role` (ADMIN | ACCOUNTANT | VIEWER — not OWNER)
- [ ] Rejects if the email already has an active (non-expired, non-accepted) invite for this org
- [ ] Rejects if the email is already a member of this org
- [ ] Stores `tokenHash`, returns `{ token, expiresAt }` — token is never retrievable again
- [ ] Token expires in 7 days
- [ ] Only OWNER can call this endpoint

**Verification:**

- [ ] `POST /organizations/current/invites` with valid body returns 201 + token
- [ ] Duplicate active invite returns 409
- [ ] Non-OWNER returns 403

**Dependencies:** Tasks 12b, 13

**Files likely touched:**

- `apps/core-api/src/modules/organizations/invites.repository.ts` (new)
- `apps/core-api/src/modules/organizations/invites.service.ts` (new)
- `apps/core-api/src/modules/organizations/organizations.controller.ts`
- `apps/core-api/src/modules/organizations/organizations.module.ts`
- `apps/core-api/src/modules/organizations/dto/` (new invite DTOs)

**Estimated scope:** Medium

## Task 15: Implement invite lookup and accept endpoints

**Description:** Two public-ish endpoints: `GET /invites/:token` lets the invitee preview the invite (org name, role) before acting. `POST /invites/:token/accept` requires authentication — adds the caller as a member and marks the invite accepted.

**Acceptance criteria:**

- [ ] `GET /invites/:token` — no auth required — returns `{ organizationName, role, invitedEmail, expiresAt }` or 404 if not found/expired/accepted
- [ ] `POST /invites/:token/accept` — auth required — rejects if: token invalid/expired/already accepted, or caller's email does not match `invitedEmail`
- [ ] On success: creates `Membership` record atomically with marking `acceptedAt`, returns `{ organization: { id, name, role } }`
- [ ] Accepted invite cannot be reused (idempotent — if already a member, 409)

**Verification:**

- [ ] `GET /invites/:token` returns org name and role for a valid token
- [ ] `POST /invites/:token/accept` with correct user creates membership and returns org
- [ ] Wrong user email returns 403
- [ ] Expired token returns 410

**Dependencies:** Task 14

**Files likely touched:**

- `apps/core-api/src/modules/organizations/invites.repository.ts`
- `apps/core-api/src/modules/organizations/invites.service.ts`
- `apps/core-api/src/app.ts` (mount invites router at `/invites`)
- new invites controller

**Estimated scope:** Medium

## Checkpoint: Permission Matrix + Invite Flow

- [ ] `pnpm --filter @invocore/core-api build` passes
- [ ] `pnpm lint` passes
- [ ] Owner can create an invite token
- [ ] Invitee can preview and accept the invite
- [ ] Wrong user cannot accept another user's invite
- [ ] Expired tokens are rejected

## Later Phases

- [ ] Phase 3: Clients and products CRUD
- [ ] Phase 4: Invoice engine
- [ ] Phase 5: Payments service
- [ ] Phase 6: Workers service
- [ ] Phase 7: Web app
- [ ] Phase 8: Observability, security, load testing, and CI
