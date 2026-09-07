import type { PublicUserRecord, UsersRepository } from "./users.repository.js";

export type UsersService = {
  getByEmail(email: string): Promise<PublicUserRecord | null>;
};

export function createUsersService(usersRepository: UsersRepository): UsersService {
  return {
    getByEmail(email) {
      return usersRepository.findByEmail(email);
    }
  };
}
