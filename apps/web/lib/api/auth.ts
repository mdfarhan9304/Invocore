import { request } from "./client";
import type { AuthResponse } from "./types";

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export const authApi = {
  register(input: RegisterInput): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/register", { method: "POST", body: input });
  },

  login(input: LoginInput): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/login", { method: "POST", body: input });
  },

  logout(refreshToken: string): Promise<void> {
    return request<void>("/auth/logout", { method: "POST", body: { refreshToken } });
  }
};
