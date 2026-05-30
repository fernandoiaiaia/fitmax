"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, tokenStore } from "./api";

interface ProUser {
  id: string;
  nome: string;
  especialidade: string | null;
  registroProfissional: string | null;
  avatarUrl: string | null;
  totalPacientes: number;
  totalConsultas: number;
}

interface AuthContextType {
  user: ProUser | null;
  accessToken: string | null;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
  loadingUser: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, _setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<ProUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const setAccessToken = useCallback((token: string) => {
    tokenStore.set(token);
    _setAccessToken(token);
  }, []);

  // Carrega dados do profissional logado
  const loadUser = useCallback(async (token: string) => {
    try {
      const { data } = await api.get('/professionals/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const avatarUrl = data.avatarUrl
        ? `${data.avatarUrl}?t=${Date.now()}`
        : null;
      setUser({
        id:                   data.id,
        nome:                 data.name,
        especialidade:        data.especialidade ?? null,
        registroProfissional: data.registroProfissional ?? null,
        avatarUrl,
        totalPacientes:       data._count?.pacientes ?? 0,
        totalConsultas:       data._count?.consultas ?? 0,
      });
    } catch {
      // dados do usuário não críticos — falha silenciosa
    }
  }, []);

  // Ao montar: tenta refresh silencioso para recuperar sessão após F5
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post<{ accessToken: string }>('/auth/pro/refresh');
        tokenStore.set(data.accessToken);
        _setAccessToken(data.accessToken);
        await loadUser(data.accessToken);
      } catch {
        // sem sessão ativa — usuário precisará fazer login
      } finally {
        setLoadingUser(false);
      }
    })();
  }, [loadUser]);

  // Quando o token mudar por login externo (ex: login page seta tokenStore direto)
  useEffect(() => {
    if (accessToken && !user) {
      loadUser(accessToken);
    }
  }, [accessToken, user, loadUser]);

  // Escuta o evento perfil-atualizado para recarregar informações do profissional
  useEffect(() => {
    const handler = () => {
      const token = tokenStore.get() || accessToken;
      if (token) loadUser(token);
    };
    window.addEventListener("perfil-atualizado", handler);
    return () => window.removeEventListener("perfil-atualizado", handler);
  }, [loadUser, accessToken]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/pro/logout'); } catch { /* ignora */ }
    tokenStore.clear();
    _setAccessToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, setAccessToken, logout, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
