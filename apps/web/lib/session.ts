import { create } from "zustand";

import type { AuthUser } from "@/lib/api/types";

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  activeOrganizationId: string | null;
};

const STORAGE_KEY = "invocore.session";

type SessionState = {
  session: Session | null;
  setSessionState: (session: Session | null) => void;
  updateSessionTokensState: (accessToken: string, refreshToken: string) => void;
  setActiveOrganizationIdState: (organizationId: string) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSessionState: (session) => set({ session }),
  updateSessionTokensState: (accessToken, refreshToken) =>
    set((state) =>
      state.session ? { session: { ...state.session, accessToken, refreshToken } } : state
    ),
  setActiveOrganizationIdState: (organizationId) =>
    set((state) =>
      state.session
        ? { session: { ...state.session, activeOrganizationId: organizationId } }
        : state
    )
}));

function persistSession(session: Session | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function hydrateSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const session = (() => {
    try {
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  })();

  useSessionStore.getState().setSessionState(session);
  return session;
}

export function subscribeToSession(listener: () => void): () => void {
  return useSessionStore.subscribe(listener);
}

export function getSessionSnapshot(): Session | null {
  return useSessionStore.getState().session;
}

export function getServerSessionSnapshot(): Session | null {
  return null;
}

export function setSession(next: Session | null): void {
  useSessionStore.getState().setSessionState(next);
  persistSession(next);
}

export function updateSessionTokens(accessToken: string, refreshToken: string): void {
  const current = getSessionSnapshot();
  if (!current) {
    return;
  }

  const next = { ...current, accessToken, refreshToken };
  useSessionStore.getState().updateSessionTokensState(accessToken, refreshToken);
  persistSession(next);
}

export function setActiveOrganizationId(organizationId: string): void {
  const current = getSessionSnapshot();
  if (!current || current.activeOrganizationId === organizationId) {
    return;
  }

  useSessionStore.getState().setActiveOrganizationIdState(organizationId);
  persistSession({ ...current, activeOrganizationId: organizationId });
}
