import { Prisma } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";
import type { CreateClientRequestDto, UpdateClientRequestDto } from "./dto/clients.dto.js";

export type ClientRecord = {
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
  createdAt: Date;
  updatedAt: Date;
};

const clientSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  taxId: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ClientSelect;

function buildWhere(organizationId: string, search?: string): Prisma.ClientWhereInput {
  if (!search) {
    return { organizationId };
  }

  return {
    organizationId,
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ]
  };
}

export type ClientsRepository = {
  create(input: { data: CreateClientRequestDto; organizationId: string }): Promise<ClientRecord>;
  findById(input: { id: string; organizationId: string }): Promise<ClientRecord | null>;
  list(input: {
    limit: number;
    offset: number;
    organizationId: string;
    search?: string;
  }): Promise<{ records: ClientRecord[]; total: number }>;
  update(input: {
    data: UpdateClientRequestDto;
    id: string;
    organizationId: string;
  }): Promise<ClientRecord | null>;
  remove(input: { id: string; organizationId: string }): Promise<boolean>;
};

export function createClientsRepository(client: CoreDbClient): ClientsRepository {
  return {
    create(input) {
      return client.client.create({
        data: {
          organizationId: input.organizationId,
          name: input.data.name,
          email: input.data.email,
          phone: input.data.phone,
          taxId: input.data.taxId,
          addressLine1: input.data.addressLine1,
          addressLine2: input.data.addressLine2,
          city: input.data.city,
          state: input.data.state,
          postalCode: input.data.postalCode,
          country: input.data.country,
          notes: input.data.notes
        },
        select: clientSelect
      });
    },

    findById(input) {
      return client.client.findFirst({
        select: clientSelect,
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });
    },

    async list(input) {
      const where = buildWhere(input.organizationId, input.search);

      const [records, total] = await Promise.all([
        client.client.findMany({
          orderBy: { createdAt: "desc" },
          select: clientSelect,
          skip: input.offset,
          take: input.limit,
          where
        }),
        client.client.count({ where })
      ]);

      return { records, total };
    },

    async update(input) {
      const updated = await client.client.updateMany({
        data: input.data,
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });

      if (updated.count === 0) {
        return null;
      }

      return client.client.findFirst({
        select: clientSelect,
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });
    },

    async remove(input) {
      const deleted = await client.client.deleteMany({
        where: {
          id: input.id,
          organizationId: input.organizationId
        }
      });

      return deleted.count > 0;
    }
  };
}
