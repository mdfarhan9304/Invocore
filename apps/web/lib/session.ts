import type { AuthUser } from "@/lib/api/types";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  activeOrganizationId: string | null;
};

const STORAGE_KEY = "invocore.session";

let current: Session | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function persist(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (current) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Reads the persisted session from localStorage into memory and notifies
 * subscribers. Call once on the client after mount.
 */
export function hydrateSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  try {
    current = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    current = null;
  }

  emit();
  return current;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionSnapshot(): Session | null {
  return current;
}

export function getServerSessionSnapshot(): Session | null {
  return null;
}

export function setSession(next: Session | null): void {
  current = next;
  persist();
  emit();
}

export function updateSessionTokens(accessToken: string, refreshToken: string): void {
  if (!current) {
    return;
  }

  current = { ...current, accessToken, refreshToken };
  persist();
  emit();
}

export function setActiveOrganizationId(organizationId: string): void {
  if (!current || current.activeOrganizationId === organizationId) {
    return;
  }

  current = { ...current, activeOrganizationId: organizationId };
  persist();
  emit();
}
