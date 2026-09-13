import { request } from "./client";
import type { CreateProductInput, Product, ProductList, UpdateProductInput } from "./types";

export type ListProductsParams = {
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
};

export const productsApi = {
  list(params: ListProductsParams = {}): Promise<ProductList> {
    return request<ProductList>("/products", { auth: true, org: true, query: params });
  },

  get(id: string): Promise<{ product: Product }> {
    return request<{ product: Product }>(`/products/${id}`, { auth: true, org: true });
  },

  create(input: CreateProductInput): Promise<{ product: Product }> {
    return request<{ product: Product }>("/products", {
      method: "POST",
      auth: true,
      org: true,
      body: input
    });
  },

  update(id: string, input: UpdateProductInput): Promise<{ product: Product }> {
    return request<{ product: Product }>(`/products/${id}`, {
      method: "PATCH",
      auth: true,
      org: true,
      body: input
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/products/${id}`, { method: "DELETE", auth: true, org: true });
  }
};
