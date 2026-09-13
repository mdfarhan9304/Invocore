import { Prisma } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";
import type { CreateProductRequestDto, UpdateProductRequestDto } from "./dto/products.dto.js";

export type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  currency: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const productSelect = {
  id: true,
  name: true,
  description: true,
  unitPrice: true,
  currency: true,
  taxRate: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ProductSelect;

function buildWhere(
  organizationId: string,
  search?: string,
  active?: boolean
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { organizationId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  if (active !== undefined) {
    where.isActive = active;
  }

  return where;
}

export type ProductsRepository = {
  create(input: { data: CreateProductRequestDto; organizationId: string }): Promise<ProductRecord>;
  findById(input: { id: string; organizationId: string }): Promise<ProductRecord | null>;
  list(input: {
    limit: number;
    offset: number;
    organizationId: string;
    search?: string;
    active?: boolean;
  }): Promise<{ records: ProductRecord[]; total: number }>;
  update(input: {
    data: UpdateProductRequestDto;
    id: string;
    organizationId: string;
  }): Promise<ProductRecord | null>;
  remove(input: { id: string; organizationId: string }): Promise<boolean>;
};

export function createProductsRepository(client: CoreDbClient): ProductsRepository {
  return {
    create(input) {
      return client.product.create({
        data: {
          organizationId: input.organizationId,
          name: input.data.name,
          description: input.data.description,
          unitPrice: input.data.unitPrice,
          currency: input.data.currency,
          taxRate: input.data.taxRate
        },
        select: productSelect
      });
    },

    findById(input) {
      return client.product.findFirst({
        select: productSelect,
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });
    },

    async list(input) {
      const where = buildWhere(input.organizationId, input.search, input.active);

      const [records, total] = await Promise.all([
        client.product.findMany({
          orderBy: { createdAt: "desc" },
          select: productSelect,
          skip: input.offset,
          take: input.limit,
          where
        }),
        client.product.count({ where })
      ]);

      return { records, total };
    },

    async update(input) {
      const updated = await client.product.updateMany({
        data: input.data,
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });

      if (updated.count === 0) {
        return null;
      }

      return client.product.findFirst({
        select: productSelect,
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });
    },

    async remove(input) {
      const deleted = await client.product.deleteMany({
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });

      return deleted.count > 0;
    }
  };
}
