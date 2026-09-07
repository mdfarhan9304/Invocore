export const ROLES = ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"] as const;

export type Role = (typeof ROLES)[number];

export type HealthResponse = {
  service: string;
  status: "ok";
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}
