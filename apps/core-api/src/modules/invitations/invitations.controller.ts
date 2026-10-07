import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getAuthContext, getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import type { InvitationsService } from "./invitations.service.js";
import {
  parseCreateInvitationRequest,
  parseInvitationId,
  parseListInvitationsQuery
} from "./dto/invitations.validation.js";

export function createInvitationsController(invitationsService: InvitationsService): Router {
  const router = createRouter();

  router.post(
    "/",
    createPermissionGuard("members:invite"),
    asyncController(async (request: Request, response: Response) => {
      const auth = getAuthContext(request);
      const tenant = getTenantContext(request);
      const invitation = await invitationsService.createInvitation({
        data: parseCreateInvitationRequest(request.body),
        invitedByUserId: auth.userId,
        inviterRole: tenant.role,
        organizationId: tenant.organizationId
      });

      response.status(201).json({ invitation });
    })
  );

  router.get(
    "/",
    createPermissionGuard("members:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invitations = await invitationsService.listInvitations({
        organizationId: tenant.organizationId,
        query: parseListInvitationsQuery(request.query)
      });

      response.status(200).json(invitations);
    })
  );

  router.delete(
    "/:invitationId",
    createPermissionGuard("members:invite"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      await invitationsService.revokeInvitation({
        invitationId: parseInvitationId(request.params.invitationId),
        organizationId: tenant.organizationId
      });

      response.status(204).send();
    })
  );

  return router;
}
