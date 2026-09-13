export type ProductDto = {
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

export type CreateProductRequestDto = {
  name: string;
  description?: string;
  unitPrice: number;
  currency?: string;
  taxRate?: number;
};

export type UpdateProductRequestDto = {
  name?: string;
  description?: string | null;
  unitPrice?: number;
  currency?: string;
  taxRate?: number;
  isActive?: boolean;
};

export type ListProductsQuery = {
  limit: number;
  offset: number;
  search?: string;
  active?: boolean;
};

export type ProductListDto = {
  data: ProductDto[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};
