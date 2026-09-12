import type { Role } from "@invocore/database";
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createRoleGuard } from "../memberships/role.guard.js";
import type { ClientsService } from "./clients.service.js";
import {
  parseClientId,
  parseCreateClientRequest,
  parseListClientsQuery,
  parseUpdateClientRequest
} from "./dto/clients.validation.js";

const READ_ROLES: Role[] = ["ADMIN", "ACCOUNTANT", "VIEWER"];
const WRITE_ROLES: Role[] = ["ADMIN", "ACCOUNTANT"];

export function createClientsController(clientsService: ClientsService): Router {
  const router = createRouter();

  router.post(
    "/",
    createRoleGuard(...WRITE_ROLES),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const client = await clientsService.createClient({
        data: parseCreateClientRequest(request.body),
        organizationId: tenant.organizationId
      });

      response.status(201).json({ client });
    })
  );

  router.get(
    "/",
    createRoleGuard(...READ_ROLES),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const result = await clientsService.listClients({
        organizationId: tenant.organizationId,
        query: parseListClientsQuery(request.query)
      });

      response.status(200).json(result);
    })
  );

  router.get(
    "/:clientId",
    createRoleGuard(...READ_ROLES),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const client = await clientsService.getClient({
        clientId: parseClientId(request.params.clientId),
        organizationId: tenant.organizationId
      });

      response.status(200).json({ client });
    })
  );

  router.patch(
    "/:clientId",
    createRoleGuard(...WRITE_ROLES),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const client = await clientsService.updateClient({
        clientId: parseClientId(request.params.clientId),
        data: parseUpdateClientRequest(request.body),
        organizationId: tenant.organizationId
      });

      response.status(200).json({ client });
    })
  );

  router.delete(
    "/:clientId",
    createRoleGuard(...WRITE_ROLES),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      await clientsService.deleteClient({
        clientId: parseClientId(request.params.clientId),
        organizationId: tenant.organizationId
      });

      response.status(204).send();
    })
  );

  return router;
}
