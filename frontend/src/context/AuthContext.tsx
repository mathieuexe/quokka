import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { apiRequest } from "../lib/api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
};

const STORAGE_KEY = "quokka_auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type StoredAuth = {
  token: string;
  user: User;
};

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const initial = readStoredAuth();
  const [token, setToken] = useState<string | null>(initial?.token ?? null);
  const [user, setUser] = useState<User | null>(initial?.user ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login: (nextToken: string, nextUser: User) => {
        setToken(nextToken);
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
        void apiRequest<void>("/chat/presence", { method: "POST", token: nextToken }).catch(() => undefined);
      },
      updateUser: (nextUser: User) => {
        setUser(nextUser);
        if (token) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
        }
      },
      logout: () => {
        if (token) {
          void apiRequest<void>("/chat/presence", { method: "DELETE", token }).catch(() => undefined);
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }),
    [token, user]
  );

  useEffect(() => {
    if (!token) return;
    let lastPingAt = 0;
    let cancelled = false;

    const ping = (): void => {
      if (cancelled) return;
      const now = Date.now();
      if (now - lastPingAt < 20_000) return;
      lastPingAt = now;
      void apiRequest<void>("/chat/presence", { method: "POST", token }).catch(() => undefined);
    };

    const onActivity = (): void => ping();
    window.addEventListener("click", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });

    ping();
    const interval = window.setInterval(() => ping(), 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.clearInterval(interval);
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
