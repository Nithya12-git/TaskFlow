"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Permission, Session } from "@/types";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refresh = useCallback(async () => {
    try {
      setSession(await api.get<Session>("/auth/me"));
    } catch (err) {
      setSession(null);
      if (!(err instanceof ApiError && err.status === 401)) console.error(err);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Any data request that comes back 401 means the session ended.
  useEffect(() => {
    const onUnauthorized = () => {
      if (sessionRef.current) {
        toast.info("Your session has expired. Please sign in again.");
        setSession(null);
      }
    };
    window.addEventListener("taskflow:unauthorized", onUnauthorized);
    return () => window.removeEventListener("taskflow:unauthorized", onUnauthorized);
  }, [toast]);

  const login = useCallback(async (email: string, password: string) => {
    setSession(await api.post<Session>("/auth/login", { email, password }));
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setSession(await api.post<Session>("/auth/register", input));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setSession(null);
    }
  }, []);

  const can = useCallback(
    (permission: Permission) => !!session?.permissions.includes(permission),
    [session]
  );

  const value = useMemo(
    () => ({ session, loading, login, register, logout, refresh, can }),
    [session, loading, login, register, logout, refresh, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}