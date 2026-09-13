import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import { generateInvoicePdf } from "./pdf/invoice-pdf.js";
import type { InvoicesService } from "./invoices.service.js";
import {
  parseCreateInvoiceRequest,
  parseInvoiceId,
  parseListInvoicesQuery,
  parseUpdateInvoiceRequest,
  parseVersionHeader
} from "./dto/invoices.validation.js";

export function createInvoicesController(invoicesService: InvoicesService): Router {
  const router = createRouter();

  router.post(
    "/",
    createPermissionGuard("invoices:write"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoice = await invoicesService.createInvoice({
        data: parseCreateInvoiceRequest(request.body),
        organizationId: tenant.organizationId
      });

      response.status(201).json({ invoice });
    })
  );

  router.get(
    "/",
    createPermissionGuard("invoices:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const result = await invoicesService.listInvoices({
        organizationId: tenant.organizationId,
        query: parseListInvoicesQuery(request.query)
      });

      response.status(200).json(result);
    })
  );

  router.get(
    "/:invoiceId/pdf",
    createPermissionGuard("invoices:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const { invoice, organizationName, clientEmail, clientAddress } =
        await invoicesService.getInvoicePdfData({
          invoiceId: parseInvoiceId(request.params.invoiceId),
          organizationId: tenant.organizationId
        });

      const pdfBuffer = await generateInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        notes: invoice.notes,
        terms: invoice.terms,
        organizationName,
        clientName: invoice.clientName,
        clientEmail,
        clientAddress,
        lineItems: invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal,
          lineTax: item.lineTax
        }))
      });

      const filename = invoice.invoiceNumber
        ? `${invoice.invoiceNumber}.pdf`
        : `invoice-draft-${invoice.id.slice(0, 8)}.pdf`;

      response.setHeader("Content-Type", "application/pdf");
      response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      response.setHeader("Content-Length", pdfBuffer.length);
      response.send(pdfBuffer);
    })
  );

  router.get(
    "/:invoiceId",
    createPermissionGuard("invoices:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoice = await invoicesService.getInvoice({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId
      });

      response.status(200).json({ invoice });
    })
  );

  router.patch(
    "/:invoiceId",
    createPermissionGuard("invoices:write"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoice = await invoicesService.updateInvoice({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId,
        expectedVersion: parseVersionHeader(request.headers["x-expected-version"]),
        data: parseUpdateInvoiceRequest(request.body)
      });

      response.status(200).json({ invoice });
    })
  );

  router.delete(
    "/:invoiceId",
    createPermissionGuard("invoices:delete"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      await invoicesService.deleteInvoice({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId
      });

      response.status(204).send();
    })
  );

  router.post(
    "/:invoiceId/issue",
    createPermissionGuard("invoices:approve"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoice = await invoicesService.issueInvoice({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId,
        expectedVersion: parseVersionHeader(request.headers["x-expected-version"])
      });

      response.status(200).json({ invoice });
    })
  );

  router.post(
    "/:invoiceId/send",
    createPermissionGuard("invoices:send"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoice = await invoicesService.sendInvoice({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId,
        expectedVersion: parseVersionHeader(request.headers["x-expected-version"])
      });

      response.status(200).json({ invoice });
    })
  );

  router.post(
    "/:invoiceId/cancel",
    createPermissionGuard("invoices:delete"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoice = await invoicesService.cancelInvoice({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId,
        expectedVersion: parseVersionHeader(request.headers["x-expected-version"])
      });

      response.status(200).json({ invoice });
    })
  );

  return router;
}
