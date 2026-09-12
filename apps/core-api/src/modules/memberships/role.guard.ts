import { AppError } from "@invocore/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { getTenantContext } from "../../common/http/context.js";
import { hasPermission, type Permission } from "./permissions.js";

/**
 * createPermissionGuard("clients:write")
 *
 * Reads the resolved role from tenant context and checks it against the
 * permission matrix. No role is special-cased here — OWNER's wildcard is
 * handled inside hasPermission().
 *
 * Adding a new role or a new permission never requires touching this file.
 */
export function createPermissionGuard(permission: Permission): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      const { role } = getTenantContext(request);

      if (!hasPermission(role, permission)) {
        throw new AppError(
          "You do not have permission to perform this action",
          "INSUFFICIENT_PERMISSIONS",
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
