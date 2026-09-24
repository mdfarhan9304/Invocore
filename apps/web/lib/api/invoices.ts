import axios, { type AxiosResponse } from "axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";

import { getSessionSnapshot } from "@/lib/session";
import { API_BASE_URL, request } from "./client";
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceList,
  InvoicePdfDocument,
  PaymentLink,
  UpdateInvoiceInput
} from "./types";

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

function invoiceRequestHeaders(): Record<string, string> {
  const session = getSessionSnapshot();
  const headers: Record<string, string> = {};

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  if (session?.activeOrganizationId) {
    headers["X-Organization-Id"] = session.activeOrganizationId;
  }

  return headers;
}

function getPdfStatus(
  id: string,
  headers: Record<string, string>
): Promise<{ document: InvoicePdfDocument }> {
  return request<{ document: InvoicePdfDocument }>(`/invoices/${id}/pdf/status`, {
    auth: true,
    org: true,
    headers
  });
}

function waitForPdfEvent(
  id: string,
  headers: Record<string, string>,
  initialDocument: InvoicePdfDocument
): Promise<InvoicePdfDocument> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeout = { id: 0 };
    let settled = false;

    const finish = (document: InvoicePdfDocument, error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      if (timeout.id) {
        window.clearTimeout(timeout.id);
      }
      controller.abort();
      if (error) {
        reject(error);
      } else {
        resolve(document);
      }
    };

    void fetchEventSource(`${API_BASE_URL}/invoices/${id}/pdf/events`, {
      headers,
      signal: controller.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (!response.ok) {
          throw new Error("PDF event stream could not be opened");
        }
      },
      onmessage(message) {
        if (message.event !== "invoice-pdf") {
          return;
        }

        const document = JSON.parse(message.data) as InvoicePdfDocument;
        if (document.status === "READY") {
          finish(document);
        }
        if (document.status === "FAILED") {
          finish(document, new Error(document.error ?? "PDF generation failed"));
        }
      },
      onerror() {
        return;
      }
    }).catch((error: unknown) => {
      if (!settled) {
        settled = true;
        reject(error instanceof Error ? error : new Error("PDF event stream failed"));
      }
    });

    if (initialDocument.status === "READY") {
      finish(initialDocument);
      return;
    }
    if (initialDocument.status === "FAILED") {
      finish(initialDocument, new Error(initialDocument.error ?? "PDF generation failed"));
      return;
    }

    timeout.id = window.setTimeout(() => {
      finish(initialDocument, new Error("PDF event stream timed out"));
    }, 90000);
  });
}

function savePdf(response: AxiosResponse<Blob>): void {
  const blob = response.data;
  const dispositionHeader = response.headers["content-disposition"];
  const disposition = typeof dispositionHeader === "string" ? dispositionHeader : undefined;
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

  createPaymentLink(id: string): Promise<{ paymentLink: PaymentLink }> {
    return request<{ paymentLink: PaymentLink }>(`/invoices/${id}/payment-link`, {
      method: "POST",
      auth: true,
      org: true
    });
  },

  async downloadPdf(id: string): Promise<void> {
    const headers = invoiceRequestHeaders();

    const requestPdf = async (): Promise<AxiosResponse<Blob>> => {
      const response = await axios.get<Blob>(`${API_BASE_URL}/invoices/${id}/pdf`, {
        headers,
        responseType: "blob",
        validateStatus: () => true
      });

      if (response.status === 200) {
        return response;
      }

      if (response.status === 202) {
        const body = JSON.parse(await response.data.text()) as {
          document: InvoicePdfDocument;
        };
        const currentDocument = body.document;

        if (currentDocument.status === "FAILED") {
          throw new Error(currentDocument.error ?? "PDF generation failed");
        }

        if (currentDocument.status === "QUEUED" || currentDocument.status === "PROCESSING") {
          try {
            const readyDocument = await waitForPdfEvent(id, headers, currentDocument);
            if (readyDocument.status !== "READY") {
              throw new Error(readyDocument.error ?? "PDF generation failed");
            }
          } catch (streamError) {
            const fallback = await getPdfStatus(id, headers);
            if (fallback.document.status !== "READY") {
              throw streamError;
            }
          }
        }

        return requestPdf();
      }

      throw new Error("Failed to download PDF");
    };

    savePdf(await requestPdf());
  }
};
