import { AppError } from "@invocore/shared";

import type { ClientRecord, ClientsRepository } from "./clients.repository.js";
import type {
  ClientDto,
  ClientListDto,
  CreateClientRequestDto,
  ListClientsQuery,
  UpdateClientRequestDto
} from "./dto/clients.dto.js";

function toClientDto(record: ClientRecord): ClientDto {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    taxId: record.taxId,
    addressLine1: record.addressLine1,
    addressLine2: record.addressLine2,
    city: record.city,
    state: record.state,
    postalCode: record.postalCode,
    country: record.country,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function clientNotFound(): AppError {
  return new AppError("Client not found", "CLIENT_NOT_FOUND", 404);
}

export type ClientsService = {
  createClient(input: { data: CreateClientRequestDto; organizationId: string }): Promise<ClientDto>;
  getClient(input: { clientId: string; organizationId: string }): Promise<ClientDto>;
  listClients(input: { organizationId: string; query: ListClientsQuery }): Promise<ClientListDto>;
  updateClient(input: {
    clientId: string;
    data: UpdateClientRequestDto;
    organizationId: string;
  }): Promise<ClientDto>;
  deleteClient(input: { clientId: string; organizationId: string }): Promise<void>;
};

export function createClientsService(clientsRepository: ClientsRepository): ClientsService {
  return {
    async createClient(input) {
      const record = await clientsRepository.create({
        data: input.data,
        organizationId: input.organizationId
      });

      return toClientDto(record);
    },

    async getClient(input) {
      const record = await clientsRepository.findById({
        id: input.clientId,
        organizationId: input.organizationId
      });
      if (!record) {
        throw clientNotFound();
      }

      return toClientDto(record);
    },

    async listClients(input) {
      const { records, total } = await clientsRepository.list({
        limit: input.query.limit,
        offset: input.query.offset,
        organizationId: input.organizationId,
        search: input.query.search
      });

      return {
        data: records.map(toClientDto),
        pagination: {
          limit: input.query.limit,
          offset: input.query.offset,
          total
        }
      };
    },

    async updateClient(input) {
      const record = await clientsRepository.update({
        data: input.data,
        id: input.clientId,
        organizationId: input.organizationId
      });
      if (!record) {
        throw clientNotFound();
      }

      return toClientDto(record);
    },

    async deleteClient(input) {
      const deleted = await clientsRepository.remove({
        id: input.clientId,
        organizationId: input.organizationId
      });
      if (!deleted) {
        throw clientNotFound();
      }
    }
  };
}
