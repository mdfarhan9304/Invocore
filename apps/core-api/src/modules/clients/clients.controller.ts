import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import type { ClientsService } from "./clients.service.js";
import {
  parseClientId,
  parseCreateClientRequest,
  parseListClientsQuery,
  parseUpdateClientRequest
} from "./dto/clients.validation.js";

export function createClientsController(clientsService: ClientsService): Router {
  const router = createRouter();

  router.post(
    "/",
    createPermissionGuard("clients:write"),
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
    createPermissionGuard("clients:read"),
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
    createPermissionGuard("clients:read"),
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
    createPermissionGuard("clients:write"),
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
    createPermissionGuard("clients:delete"),
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
