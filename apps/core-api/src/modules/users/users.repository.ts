import type { User } from "@invocore/database";

import type { CoreDbClient } from "../../common/database/core-db-client.js";

export type PublicUserRecord = Pick<User, "email" | "id" | "name">;
export type UserWithPasswordRecord = Pick<User, "email" | "id" | "name" | "passwordHash">;

export type UsersRepository = {
  create(input: { email: string; name: string; passwordHash: string }): Promise<PublicUserRecord>;
  findByEmail(email: string): Promise<UserWithPasswordRecord | null>;
};

export function createUsersRepository(client: CoreDbClient): UsersRepository {
  return {
    create(input) {
      return client.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash
        },
        select: {
          email: true,
          id: true,
          name: true
        }
      });
    },

    findByEmail(email) {
      return client.user.findUnique({
        select: {
          email: true,
          id: true,
          name: true,
          passwordHash: true
        },
        where: {
          email
        }
      });
    }
  };
}
