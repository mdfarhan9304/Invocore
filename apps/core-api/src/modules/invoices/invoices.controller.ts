import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { loadConfig } from "@invocore/config";
import { AppError } from "@invocore/shared";
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncController } from "../../common/http/async-controller.js";
import { getTenantContext } from "../../common/http/context.js";
import { createPermissionGuard } from "../memberships/role.guard.js";
import type { InvoicesService } from "./invoices.service.js";
import {
  parseCreateInvoiceRequest,
  parseInvoiceId,
  parseListInvoicesQuery,
  parseUpdateInvoiceRequest,
  parseVersionHeader
} from "./dto/invoices.validation.js";

const invoicePdfsDirectory = resolve(loadConfig().storage.invoicePdfsDirectory);

function toPublicDocument(document: {
  id: string;
  status: string;
  invoiceVersion: number;
  errorMessage: string | null;
}) {
  return {
    id: document.id,
    status: document.status,
    invoiceVersion: document.invoiceVersion,
    error: document.errorMessage
  };
}

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
    "/:invoiceId/pdf/status",
    createPermissionGuard("invoices:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const document = await invoicesService.getInvoicePdfStatus({
        invoiceId: parseInvoiceId(request.params.invoiceId),
        organizationId: tenant.organizationId
      });

      if (!document) {
        throw new AppError("PDF has not been requested", "PDF_NOT_REQUESTED", 404);
      }

      response.status(200).json({ document: toPublicDocument(document) });
    })
  );

  router.get(
    "/:invoiceId/pdf",
    createPermissionGuard("invoices:read"),
    asyncController(async (request: Request, response: Response) => {
      const tenant = getTenantContext(request);
      const invoiceId = parseInvoiceId(request.params.invoiceId);
      const document = await invoicesService.requestInvoicePdf({
        invoiceId,
        organizationId: tenant.organizationId
      });

      if (document.status !== "READY" || !document.storagePath) {
        response.status(202).json({ document: toPublicDocument(document) });
        return;
      }

      const storagePath = resolve(invoicePdfsDirectory, document.storagePath);
      const relativeStoragePath = relative(invoicePdfsDirectory, storagePath);
      if (relativeStoragePath.startsWith("..") || isAbsolute(relativeStoragePath)) {
        throw new AppError("PDF storage path is invalid", "PDF_STORAGE_INVALID", 500);
      }

      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await readFile(storagePath);
      } catch {
        throw new AppError("PDF is not available yet", "PDF_NOT_READY", 409);
      }

      const filename =
        document.invoiceVersion > 0
          ? `${invoiceId.slice(0, 8)}-v${document.invoiceVersion}.pdf`
          : "invoice.pdf";

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
