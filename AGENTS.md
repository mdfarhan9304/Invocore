# Invocore Agent Guidelines

## Architecture Principles

- Use modular architecture. Each business capability belongs under `apps/<service>/src/modules/<module-name>/`.
- Keep controllers thin. Controllers parse input, call a service, and return HTTP responses.
- Put business rules in services. Services orchestrate use cases and own workflow decisions.
- Put database access in repositories. Do not call Prisma directly from controllers.
- Keep DTOs explicit. Request parsing and response contracts live in each module's `dto/` folder.
- Use dependency injection through factory functions. Modules wire dependencies in `<module>.module.ts`.
- Keep shared HTTP/error helpers under `src/common/`.
- Keep generated code out of hand edits and formatting expectations.
- Do not add test files for now. Manual verification, lint, format, Prisma validation, and build are the current gate.

## Core API Shape

```text
apps/core-api/src/
  app.ts
  index.ts
  common/
    errors/
    http/
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.module.ts
      dto/
      guards/
    users/
      users.repository.ts
      users.service.ts
      dto/
    organizations/
      organizations.repository.ts
      organizations.service.ts
    invoices/
      invoices.controller.ts
      invoices.service.ts
      invoices.repository.ts
      dto/
      invoice.types.ts
```

## Endpoint Rules

- Validate untrusted request bodies at the controller boundary.
- Return structured errors as `{ error: { code, message, details? } }`.
- Never return sensitive fields such as `passwordHash`, refresh token hashes, or internals.
- Tenant-owned future resources must always be queried by tenant scope plus resource ID.
- Prefer one complete MVP endpoint over broad partial scaffolding.
