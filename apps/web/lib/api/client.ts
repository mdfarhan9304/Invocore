import axios, { type AxiosResponse } from "axios";

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
  headers?: Record<string, string>;
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
    const response = await axios.post<RefreshResponse>(
      buildUrl("/auth/refresh"),
      { refreshToken: session.refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    updateSessionTokens(response.data.accessToken, response.data.refreshToken);
    return true;
  } catch {
    setSession(null);
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

function parseError(response: AxiosResponse<unknown>): ApiError {
  let code = "UNKNOWN_ERROR";
  let message = response.statusText || "Request failed";
  let details: unknown;

  if (response.data && typeof response.data === "object") {
    const body = response.data as Partial<ApiErrorBody>;
    if (body.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
      details = body.error.details;
    }
  }

  return new ApiError(response.status, code, message, details);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = false,
    org = false,
    query,
    headers: extraHeaders,
    signal
  } = options;

  const send = () => {
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

    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    return axios.request<T>({
      url: buildUrl(path, query),
      method,
      headers,
      data: body,
      signal,
      validateStatus: () => true
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

  if (!response.status || response.status < 200 || response.status >= 300) {
    throw parseError(response);
  }

  return response.data;
}

export { API_BASE_URL };
