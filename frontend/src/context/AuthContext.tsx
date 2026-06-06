import React, { createContext, useState, useCallback, useEffect } from 'react';
import { setAccessToken } from '../config/axios';
import type { AuthMeResponse } from '../services/AuthService';
import { loginWithCredentials } from '../services/AuthService';
import type { PapelProjeto } from '../types/stakeholder';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  roles: string[];
  urlMidiaPerfil: string | null;
  role: PapelProjeto;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: PapelProjeto) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_STORAGE_KEY = 'auth_user_profile';

function resolveRole(roles: string[]): PapelProjeto {
  if (roles.includes('GESTOR'))    return 'GESTOR';
  if (roles.includes('ANALISTA'))  return 'ANALISTA';
  return 'STAKEHOLDER';
}

function mapToAuthUser(me: AuthMeResponse): AuthUser {
  return {
    id:              me.id,
    nome:            me.nome,
    email:           me.email,
    ativo:           me.ativo,
    roles:           me.roles,
    urlMidiaPerfil:  me.urlMidiaPerfil,
    role:            resolveRole(me.roles),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Ao montar, restaura dados de exibição do localStorage (sem token).
  // Como não temos token em memória, isAuthenticated será false até novo login.
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Só restaura o perfil se houver sessão ativa (token em memória).
    // Como o módulo axios foi recarregado, o token em memória é null —
    // então não restauramos o usuário (forçamos novo login após refresh).
    return null;
  });

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  // Escuta o evento de 401 disparado pelo interceptor do Axios
  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email: string, senha: string) => {
    const { token, user: me } = await loginWithCredentials(email, senha);

    // Armazena token APENAS em memória — nunca em storage
    setAccessToken(token);

    const authUser = mapToAuthUser(me);

    // Persiste apenas dados de exibição não-sensíveis
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));

    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const switchRole = useCallback((role: PapelProjeto) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, role };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}