import { AppError } from "@invocore/shared";
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import type { PaymentsService } from "./payments.service.js";

function parseInvoiceId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new AppError("Invalid invoice id", "INVALID_INVOICE_ID", 400);
  }
  return value;
}

export function createPaymentsController(paymentsService: PaymentsService): Router {
  const router = createRouter();

  router.post(
    "/:invoiceId/payment-link",
    createPermissionGuard("invoices:write"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoiceId = Array.isArray(request.params.invoiceId)
        ? request.params.invoiceId[0]
        : request.params.invoiceId;
      const paymentLink = await paymentsService.createPaymentLink(
        parseInvoiceId(invoiceId),
        tenant.organizationId
      );
      response.status(201).json({ paymentLink });
    })
  );

  return router;
}

export function createRazorpayWebhookController(paymentsService: PaymentsService): Router {
  const router = createRouter();

  router.post(
    "/razorpay",
    asyncController(async (request: Request, response: Response) => {
      const rawBody = Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(JSON.stringify(request.body ?? {}));
      const result = await paymentsService.handleWebhook(
        rawBody,
        request.header("x-razorpay-signature"),
        request.header("x-razorpay-event-id")
      );
      response.status(200).json(result);
    })
  );

  return router;
}
