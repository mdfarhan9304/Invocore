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
