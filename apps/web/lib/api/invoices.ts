import { request } from "./client";
import { getSessionSnapshot } from "@/lib/session";
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceList,
  InvoicePdfDocument,
  UpdateInvoiceInput
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ListInvoicesParams = {
  status?: string;
  clientId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

function versionHeaders(version: number): Record<string, string> {
  return { "X-Expected-Version": String(version) };
}

async function waitForPdf(
  id: string,
  headers: Record<string, string>,
  initialDocument: InvoicePdfDocument
): Promise<void> {
  let document = initialDocument;

  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (document.status === "READY") return;
    if (document.status === "FAILED") {
      throw new Error(document.error ?? "PDF generation failed");
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf/status`, { headers });
    if (!response.ok) {
      throw new Error("Failed to check PDF status");
    }
    const body = (await response.json()) as { document: InvoicePdfDocument };
    document = body.document;
  }

  throw new Error("PDF generation timed out");
}

export const invoicesApi = {
  list(params: ListInvoicesParams = {}): Promise<InvoiceList> {
    return request<InvoiceList>("/invoices", { auth: true, org: true, query: params });
  },

  get(id: string): Promise<{ invoice: Invoice }> {
    return request<{ invoice: Invoice }>(`/invoices/${id}`, { auth: true, org: true });
  },

  create(input: CreateInvoiceInput): Promise<{ invoice: Invoice }> {
    return request<{ invoice: Invoice }>("/invoices", {
      method: "POST",
      auth: true,
      org: true,
      body: input
    });
  },

  update(id: string, input: UpdateInvoiceInput, version: number): Promise<{ invoice: Invoice }> {
    return request<{ invoice: Invoice }>(`/invoices/${id}`, {
      method: "PATCH",
      auth: true,
      org: true,
      body: input,
      headers: versionHeaders(version)
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/invoices/${id}`, { method: "DELETE", auth: true, org: true });
  },

  issue(id: string, version: number): Promise<{ invoice: Invoice }> {
    return request<{ invoice: Invoice }>(`/invoices/${id}/issue`, {
      method: "POST",
      auth: true,
      org: true,
      headers: versionHeaders(version)
    });
  },

  send(id: string, version: number): Promise<{ invoice: Invoice }> {
    return request<{ invoice: Invoice }>(`/invoices/${id}/send`, {
      method: "POST",
      auth: true,
      org: true,
      headers: versionHeaders(version)
    });
  },

  cancel(id: string, version: number): Promise<{ invoice: Invoice }> {
    return request<{ invoice: Invoice }>(`/invoices/${id}/cancel`, {
      method: "POST",
      auth: true,
      org: true,
      headers: versionHeaders(version)
    });
  },

  async downloadPdf(id: string): Promise<void> {
    const session = getSessionSnapshot();
    const headers: Record<string, string> = {};
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    if (session?.activeOrganizationId) {
      headers["X-Organization-Id"] = session.activeOrganizationId;
    }

    const requestPdf = async (): Promise<Response> => {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, { headers });
      if (response.status === 202) {
        const body = (await response.json()) as { document: InvoicePdfDocument };
        await waitForPdf(id, headers, body.document);
        return requestPdf();
      }
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      return response;
    };

    const response = await requestPdf();
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? "invoice.pdf";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
