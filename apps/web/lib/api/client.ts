import { getSessionSnapshot, setSession, updateSessionTokens } from "@/lib/session";
import type { ApiErrorBody, RefreshResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  org?: boolean;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, API_BASE_URL);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const session = getSessionSnapshot();
  if (!session?.refreshToken) {
    return false;
  }

  try {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });

    if (!response.ok) {
      setSession(null);
      return false;
    }

    const data = (await response.json()) as RefreshResponse;
    updateSessionTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function parseError(response: Response): Promise<ApiError> {
  let code = "UNKNOWN_ERROR";
  let message = response.statusText || "Request failed";
  let details: unknown;

  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      details = body.error.details;
    }
  } catch {
    // Response had no JSON body; keep defaults.
  }

  return new ApiError(response.status, code, message, details);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, org = false, query, signal } = options;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const session = getSessionSnapshot();
    if (auth && session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    if (org && session?.activeOrganizationId) {
      headers["X-Organization-Id"] = session.activeOrganizationId;
    }

    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  };

  let response = await send();

  if (response.status === 401 && auth && getSessionSnapshot()?.refreshToken) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      response = await send();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
