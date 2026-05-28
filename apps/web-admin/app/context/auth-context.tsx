"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { loginAdmin, logoutAdmin, silentRefresh, LoginCredentials, AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  error?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<{ user: AuthUser | null; isLoading: boolean; error?: string }>({
    user: null,
    isLoading: true,
  });

  // On mount: try silent refresh to restore session from httpOnly cookie
  useEffect(() => {
    silentRefresh()
      .then((restored) => {
        setAuthState({ user: restored, isLoading: false });
      })
      .catch(async (err) => {
        const status = err?.response?.status;
        let errMsg = err?.message || 'Unknown error';
        if (err?.response?.data) {
          errMsg = JSON.stringify(err.response.data);
        }
        if (status === 401 || status === 403) {
          try { await logoutAdmin(); } catch { /* ignora */ }
        }
        setAuthState({ user: null, isLoading: false, error: `[Auth Error] Status: ${status}. Msg: ${errMsg}` });
      });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const authedUser = await loginAdmin(credentials);
    setAuthState(prev => ({ ...prev, user: authedUser }));
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setAuthState(prev => ({ ...prev, user: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isAuthenticated: !!authState.user,
        isLoading: authState.isLoading,
        error: authState.error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
