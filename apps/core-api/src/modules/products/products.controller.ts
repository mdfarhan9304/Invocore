import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import type { ProductsService } from "./products.service.js";
import {
  parseCreateProductRequest,
  parseListProductsQuery,
  parseProductId,
  parseUpdateProductRequest
} from "./dto/products.validation.js";

export function createProductsController(productsService: ProductsService): Router {
  const router = createRouter();

  router.post(
    "/",
    createPermissionGuard("products:write"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const product = await productsService.createProduct({
        data: parseCreateProductRequest(request.body),
        organizationId: tenant.organizationId
      });

      response.status(201).json({ product });
    })
  );

  router.get(
    "/",
    createPermissionGuard("products:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const result = await productsService.listProducts({
        organizationId: tenant.organizationId,
        query: parseListProductsQuery(request.query)
      });

      response.status(200).json(result);
    })
  );

  router.get(
    "/:productId",
    createPermissionGuard("products:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const product = await productsService.getProduct({
        productId: parseProductId(request.params.productId),
        organizationId: tenant.organizationId
      });

      response.status(200).json({ product });
    })
  );

  router.patch(
    "/:productId",
    createPermissionGuard("products:write"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const product = await productsService.updateProduct({
        productId: parseProductId(request.params.productId),
        data: parseUpdateProductRequest(request.body),
        organizationId: tenant.organizationId
      });

      response.status(200).json({ product });
    })
  );

  router.delete(
    "/:productId",
    createPermissionGuard("products:delete"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      await productsService.deleteProduct({
        productId: parseProductId(request.params.productId),
        organizationId: tenant.organizationId
      });

      response.status(204).send();
    })
  );

  return router;
}
