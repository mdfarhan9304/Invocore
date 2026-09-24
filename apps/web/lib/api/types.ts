export type Role = "OWNER" | "ADMIN" | "ACCOUNTANT" | "VIEWER";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthOrganization = {
  id: string;
  name: string;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  organization?: AuthOrganization;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserOrganization = {
  id: string;
  name: string;
  role: Role;
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientList = {
  data: Client[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type CreateClientInput = {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
};

export type UpdateClientInput = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  currency: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductList = {
  data: Product[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type CreateProductInput = {
  name: string;
  description?: string;
  unitPrice: number;
  currency?: string;
  taxRate?: number;
};

export type UpdateProductInput = {
  name?: string;
  description?: string | null;
  unitPrice?: number;
  currency?: string;
  taxRate?: number;
  isActive?: boolean;
};

export type InvoiceStatus =
  "DRAFT" | "ISSUED" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

export type InvoiceDocumentStatus = "QUEUED" | "PROCESSING" | "READY" | "FAILED";

export type DashboardSummary = {
  totalRevenue: number;
  paidThisMonth: number;
  outstanding: number;
  outstandingCount: number;
  overdue: number;
  overdueCount: number;
  revenueByDay: { date: string; amount: number }[];
  recentInvoices: {
    id: string;
    invoiceNumber: string | null;
    status: InvoiceStatus;
    clientName: string;
    updatedAt: string;
  }[];
};

export type PaymentLinkStatus = "ACTIVE" | "PARTIALLY_PAID" | "PAID" | "CANCELLED" | "EXPIRED";

export type PaymentLink = {
  id: string;
  url: string;
  amount: number;
  amountPaid: number;
  currency: string;
  status: PaymentLinkStatus;
  expiresAt: string | null;
};

export type InvoicePdfDocument = {
  id: string;
  status: InvoiceDocumentStatus;
  invoiceVersion: number;
  error: string | null;
};

export type InvoiceLineItem = {
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

export type Invoice = {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
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
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
};

export type InvoiceSummary = {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
};

export type InvoiceList = {
  data: InvoiceSummary[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type CreateLineItemInput = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type CreateInvoiceInput = {
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

export type UpdateInvoiceInput = {
  clientId?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  terms?: string | null;
  lineItems?: UpdateLineItemInput[];
};
