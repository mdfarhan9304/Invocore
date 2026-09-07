import { Prisma } from "@invocore/database";
import { AppError } from "@invocore/shared";
import type { Response } from "express";

export function sendHttpError(response: Response, error: unknown): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("email")
  ) {
    response.status(409).json({
      error: {
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Email is already registered"
      }
    });
    return;
  }

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error"
    }
  });
}
