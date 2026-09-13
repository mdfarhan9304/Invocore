export type InvoiceLineItemDto = {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  lineTax: number;
  sortOrder: number;
};

export type InvoiceDto = {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string | null;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  terms: string | null;
  version: number;
  lineItems: InvoiceLineItemDto[];
  createdAt: string;
  updatedAt: string;
};

export type InvoiceSummaryDto = {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string | null;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
};

export type CreateLineItemInput = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type CreateInvoiceRequestDto = {
  clientId: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  terms?: string;
  lineItems: CreateLineItemInput[];
};

export type UpdateLineItemInput = {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type UpdateInvoiceRequestDto = {
  clientId?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  terms?: string | null;
  lineItems?: UpdateLineItemInput[];
};

export type ListInvoicesQuery = {
  limit: number;
  offset: number;
  status?: string;
  clientId?: string;
  search?: string;
};

export type InvoiceListDto = {
  data: InvoiceSummaryDto[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};
