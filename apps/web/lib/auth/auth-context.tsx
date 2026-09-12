"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react";

import { authApi, type LoginInput, type RegisterInput } from "@/lib/api/auth";
import { organizationsApi } from "@/lib/api/organizations";
import type { AuthUser, UserOrganization } from "@/lib/api/types";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  hydrateSession,
  setActiveOrganizationId,
  setSession,
  subscribeToSession
} from "@/lib/session";

type AuthContextValue = {
  user: AuthUser | null;
  organizations: UserOrganization[];
  activeOrganization: UserOrganization | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  selectOrganization: (organizationId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const loadOrganizations = useCallback((preferredId: string | null) => {
    return organizationsApi.listMine().then(({ organizations: orgs }) => {
      setOrganizations(orgs);

      const stillValid = preferredId && orgs.some((org) => org.id === preferredId);
      if (!stillValid && orgs[0]) {
        setActiveOrganizationId(orgs[0].id);
      }

      return orgs;
    });
  }, []);

  useEffect(() => {
    const restored = hydrateSession();
    if (!restored) {
      setIsInitializing(false);
      return;
    }

    loadOrganizations(restored.activeOrganizationId)
      .catch(() => {
        setSession(null);
        setOrganizations([]);
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [loadOrganizations]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await authApi.login(input);
      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        activeOrganizationId: result.organization?.id ?? null
      });
      await loadOrganizations(result.organization?.id ?? null);
    },
    [loadOrganizations]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await authApi.register(input);
      setSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        activeOrganizationId: result.organization?.id ?? null
      });
      await loadOrganizations(result.organization?.id ?? null);
    },
    [loadOrganizations]
  );

  const logout = useCallback(async () => {
    const currentSession = getSessionSnapshot();
    if (currentSession?.refreshToken) {
      try {
        await authApi.logout(currentSession.refreshToken);
      } catch {
        // Best-effort: clear local session regardless of server response.
      }
    }
    setSession(null);
    setOrganizations([]);
  }, []);

  const selectOrganization = useCallback((organizationId: string) => {
    setActiveOrganizationId(organizationId);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const activeOrganization =
      organizations.find((org) => org.id === session?.activeOrganizationId) ?? null;

    return {
      user: session?.user ?? null,
      organizations,
      activeOrganization,
      isAuthenticated: Boolean(session),
      isInitializing,
      login,
      register,
      logout,
      selectOrganization
    };
  }, [session, organizations, isInitializing, login, register, logout, selectOrganization]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
