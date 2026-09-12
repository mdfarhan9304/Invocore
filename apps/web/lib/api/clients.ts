import { request } from "./client";
import type { Client, ClientList, CreateClientInput, UpdateClientInput } from "./types";

export type ListClientsParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export const clientsApi = {
  list(params: ListClientsParams = {}): Promise<ClientList> {
    return request<ClientList>("/clients", { auth: true, org: true, query: params });
  },

  get(id: string): Promise<{ client: Client }> {
    return request<{ client: Client }>(`/clients/${id}`, { auth: true, org: true });
  },

  create(input: CreateClientInput): Promise<{ client: Client }> {
    return request<{ client: Client }>("/clients", {
      method: "POST",
      auth: true,
      org: true,
      body: input
    });
  },

  update(id: string, input: UpdateClientInput): Promise<{ client: Client }> {
    return request<{ client: Client }>(`/clients/${id}`, {
      method: "PATCH",
      auth: true,
      org: true,
      body: input
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/clients/${id}`, { method: "DELETE", auth: true, org: true });
  }
};
