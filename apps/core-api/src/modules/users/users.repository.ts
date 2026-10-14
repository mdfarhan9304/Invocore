import type { User } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type PublicUserRecord = Pick<User, "email" | "id" | "name"> & {
  emailVerified: boolean;
};
export type UserWithPasswordRecord = Pick<User, "email" | "id" | "name" | "passwordHash"> & {
  emailVerified: boolean;
};

export type UsersRepository = {
  create(input: { email: string; name: string; passwordHash: string }): Promise<PublicUserRecord>;
  findByEmail(email: string): Promise<UserWithPasswordRecord | null>;
  findById(id: string): Promise<PublicUserRecord | null>;
  isEmailVerified(userId: string): Promise<boolean>;
  markEmailVerified(userId: string): Promise<void>;
};

function toPublicUser(
  record: Pick<User, "email" | "emailVerifiedAt" | "id" | "name">
): PublicUserRecord {
  return {
    email: record.email,
    emailVerified: record.emailVerifiedAt !== null,
    id: record.id,
    name: record.name
  };
}

export function createUsersRepository(client: CoreDbClient): UsersRepository {
  return {
    create(input) {
      return client.user
        .create({
          data: {
            email: input.email,
            name: input.name,
            passwordHash: input.passwordHash
          },
          select: {
            email: true,
            emailVerifiedAt: true,
            id: true,
            name: true
          }
        })
        .then(toPublicUser);
    },

    findByEmail(email) {
      return client.user
        .findUnique({
          select: {
            email: true,
            emailVerifiedAt: true,
            id: true,
            name: true,
            passwordHash: true
          },
          where: {
            email
          }
        })
        .then((record) =>
          record
            ? {
                ...record,
                emailVerified: record.emailVerifiedAt !== null
              }
            : null
        );
    },

    findById(id) {
      return client.user
        .findUnique({
          select: {
            email: true,
            emailVerifiedAt: true,
            id: true,
            name: true
          },
          where: {
            id
          }
        })
        .then((record) => (record ? toPublicUser(record) : null));
    },

    async isEmailVerified(userId) {
      const record = await client.user.findUnique({
        select: { emailVerifiedAt: true },
        where: { id: userId }
      });

      return record?.emailVerifiedAt !== null && record?.emailVerifiedAt !== undefined;
    },

    async markEmailVerified(userId) {
      await client.user.update({
        data: { emailVerifiedAt: new Date() },
        where: { id: userId }
      });
    }
  };
}
