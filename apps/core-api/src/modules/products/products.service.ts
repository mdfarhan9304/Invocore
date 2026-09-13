import { AppError } from "@invocore/shared";

import type { ProductRecord, ProductsRepository } from "./products.repository.js";
import type {
  CreateProductRequestDto,
  ListProductsQuery,
  ProductDto,
  ProductListDto,
  UpdateProductRequestDto
} from "./dto/products.dto.js";

function toProductDto(record: ProductRecord): ProductDto {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    unitPrice: record.unitPrice,
    currency: record.currency,
    taxRate: record.taxRate,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function productNotFound(): AppError {
  return new AppError("Product not found", "PRODUCT_NOT_FOUND", 404);
}

export type ProductsService = {
  createProduct(input: {
    data: CreateProductRequestDto;
    organizationId: string;
  }): Promise<ProductDto>;
  getProduct(input: { productId: string; organizationId: string }): Promise<ProductDto>;
  listProducts(input: {
    organizationId: string;
    query: ListProductsQuery;
  }): Promise<ProductListDto>;
  updateProduct(input: {
    productId: string;
    data: UpdateProductRequestDto;
    organizationId: string;
  }): Promise<ProductDto>;
  deleteProduct(input: { productId: string; organizationId: string }): Promise<void>;
};

export function createProductsService(productsRepository: ProductsRepository): ProductsService {
  return {
    async createProduct(input) {
      const record = await productsRepository.create({
        data: input.data,
        organizationId: input.organizationId
      });

      return toProductDto(record);
    },

    async getProduct(input) {
      const record = await productsRepository.findById({
        id: input.productId,
        organizationId: input.organizationId
      });
      if (!record) {
        throw productNotFound();
      }

      return toProductDto(record);
    },

    async listProducts(input) {
      const { records, total } = await productsRepository.list({
        active: input.query.active,
        limit: input.query.limit,
        offset: input.query.offset,
        organizationId: input.organizationId,
        search: input.query.search
      });

      return {
        data: records.map(toProductDto),
        pagination: {
          limit: input.query.limit,
          offset: input.query.offset,
          total
        }
      };
    },

    async updateProduct(input) {
      const record = await productsRepository.update({
        data: input.data,
        id: input.productId,
        organizationId: input.organizationId
      });
      if (!record) {
        throw productNotFound();
      }

      return toProductDto(record);
    },

    async deleteProduct(input) {
      const deleted = await productsRepository.remove({
        id: input.productId,
        organizationId: input.organizationId
      });
      if (!deleted) {
        throw productNotFound();
      }
    }
  };
}
