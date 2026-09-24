import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const localEnvPath = [
  process.env.ENV_FILE,
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env")
].find((path): path is string => typeof path === "string" && existsSync(path));

if (localEnvPath) {
  process.loadEnvFile(localEnvPath);
}

export type NodeEnv = "development" | "test" | "production";

export type ServicePorts = {
  coreApi: number;
  paymentsService: number;
  workersService: number;
};

export type AppConfig = {
  auth: {
    accessTokenTtlSeconds: number;
    jwtSecret: string;
    refreshTokenTtlDays: number;
  };
  corsOrigins: string[];
  databaseUrl: string;
  nodeEnv: NodeEnv;
  redisUrl: string;
  servicePorts: ServicePorts;
  payments: {
    appUrl: string;
    razorpayKeyId: string;
    razorpayKeySecret: string;
    razorpayWebhookSecret: string;
  };
  storage: {
    invoicePdfsDirectory: string;
  };
};

const defaultInvoicePdfsDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../storage/invoices"
);

type Environment = Record<string, string | undefined>;

function readInteger(env: Environment, key: string, fallback: number): number {
  const value = env[key];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
}

function readNodeEnv(env: Environment): NodeEnv {
  const value = env.NODE_ENV ?? "development";
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  throw new Error("NODE_ENV must be development, test, or production");
}

function readCorsOrigins(env: Environment): string[] {
  const raw = env.CORS_ORIGINS ?? "http://localhost:3000";

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function loadConfig(env: Environment = process.env): AppConfig {
  const nodeEnv = readNodeEnv(env);
  const jwtSecret = env.JWT_SECRET ?? "dev-only-invocore-jwt-secret-change-me";

  if (nodeEnv === "production" && !env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production");
  }

  const postgresHost = env.POSTGRES_HOST ?? "127.0.0.1";
  const postgresPort = readInteger(env, "POSTGRES_PORT", 5433);
  const postgresDb = env.POSTGRES_DB ?? "invocore";
  const postgresUser = env.POSTGRES_USER ?? "invocore";
  const postgresPassword = env.POSTGRES_PASSWORD ?? "invocore_dev_password";
  const redisHost = env.REDIS_HOST ?? "localhost";
  const redisPort = readInteger(env, "REDIS_PORT", 6379);

  return {
    auth: {
      accessTokenTtlSeconds: readInteger(env, "ACCESS_TOKEN_TTL_SECONDS", 900),
      jwtSecret,
      refreshTokenTtlDays: readInteger(env, "REFRESH_TOKEN_TTL_DAYS", 30)
    },
    corsOrigins: readCorsOrigins(env),
    databaseUrl:
      env.DATABASE_URL ??
      `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}?schema=core`,
    nodeEnv,
    redisUrl: env.REDIS_URL ?? `redis://${redisHost}:${redisPort}`,
    servicePorts: {
      coreApi: readInteger(env, "CORE_API_PORT", 3001),
      paymentsService: readInteger(env, "PAYMENTS_SERVICE_PORT", 3002),
      workersService: readInteger(env, "WORKERS_SERVICE_PORT", 3003)
    },
    payments: {
      appUrl: env.APP_URL ?? "http://localhost:3000",
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? "",
      razorpayKeySecret: env.RAZORPAY_KEY_SECRET ?? "",
      razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? ""
    },
    storage: {
      invoicePdfsDirectory: env.INVOICE_PDF_STORAGE_PATH
        ? resolve(process.cwd(), env.INVOICE_PDF_STORAGE_PATH)
        : defaultInvoicePdfsDirectory
    }
  };
}
