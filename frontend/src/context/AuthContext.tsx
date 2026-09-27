import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { setAccessToken } from '../config/axios';
import { fetchMe, loginWithCredentials, logoutSession, refreshSession } from '../services/AuthService';
import type { MeResponse } from '../types/acesso';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Usuário autenticado com as organizações/projetos em que atua e as permissões em cada um. */
export type AuthUser = MeResponse;

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** true enquanto a sessão é restaurada ao abrir/recarregar a página */
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Recarrega papéis/permissões (ex.: depois de criar uma organização ou projeto). */
  recarregarPermissoes: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [carregando, setCarregando] = useState(true);
  const recarregandoRef = useRef<Promise<void> | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const recarregarPermissoes = useCallback(async () => {
    // Evita chamadas simultâneas ao /me (vários 401 renovados ao mesmo tempo)
    if (!recarregandoRef.current) {
      recarregandoRef.current = fetchMe()
        .then(setUser)
        .finally(() => { recarregandoRef.current = null; });
    }
    return recarregandoRef.current;
  }, []);

  // Ao abrir/recarregar a página: tenta restaurar a sessão pelo cookie de refresh
  useEffect(() => {
    let ativo = true;
    refreshSession()
      .then(({ token }) => {
        setAccessToken(token);
        return fetchMe();
      })
      .then((me) => { if (ativo) setUser(me); })
      .catch(() => { if (ativo) clearSession(); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [clearSession]);

  // Eventos do interceptor do Axios: sessão encerrada / token renovado (grupos podem ter mudado)
  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    const handleTokenRenovado = () => { recarregarPermissoes().catch(() => {}); };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:token-renovado', handleTokenRenovado);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:token-renovado', handleTokenRenovado);
    };
  }, [clearSession, recarregarPermissoes]);

  const login = useCallback(async (email: string, senha: string) => {
    const { token } = await loginWithCredentials(email, senha);
    // Token APENAS em memória; o refresh token fica no cookie HttpOnly
    setAccessToken(token);
    setUser(await fetchMe());
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, carregando, login, logout, recarregarPermissoes }}
    >
      {children}
    </AuthContext.Provider>
  );
}
