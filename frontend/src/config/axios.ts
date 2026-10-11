import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Access token mantido em memória — não acessível por scripts de terceiros via localStorage.
// O refresh token fica num cookie HttpOnly gravado pelo backend (/api/auth/*).
let _accessToken: string | null = null;

/** Chamado pelo AuthContext após login/refresh bem-sucedido */
export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

/** Lido internamente pelo interceptor do Axios */
export function getAccessToken(): string | null {
  return _accessToken;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' },
  // Envia o cookie de refresh nas rotas /auth (em dev o front roda em outra porta)
  withCredentials: true,
});

// Injeta o token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rotas de sessão: um 401 nelas não dispara refresh (evita laço)
const ROTAS_DE_SESSAO = ['/auth/login', '/auth/refresh', '/auth/logout'];

type ConfigComRetentativa = InternalAxiosRequestConfig & { _retry?: boolean };

// Um único refresh em andamento por vez: requisições que recebem 401 ao mesmo tempo esperam o mesmo
let refreshEmAndamento: Promise<string> | null = null;

function renovarToken(): Promise<string> {
  if (!refreshEmAndamento) {
    refreshEmAndamento = api
      .post<{ token: string }>('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.token);
        return res.data.token;
      })
      .finally(() => {
        refreshEmAndamento = null;
      });
  }
  return refreshEmAndamento;
}

/**
 * 401 = token expirado ou revogado (os grupos do usuário mudaram). Renova a sessão
 * pelo cookie e repete a requisição uma vez; se o refresh falhar, encerra a sessão.
 * 403 (sem permissão) não passa por aqui — é tratado por quem fez a chamada.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as ConfigComRetentativa | undefined;
    const url = original?.url ?? '';
    const ehRotaDeSessao = ROTAS_DE_SESSAO.some((rota) => url.endsWith(rota));

    if (error.response?.status === 401 && original && !original._retry && !ehRotaDeSessao) {
      original._retry = true;
      try {
        const token = await renovarToken();
        original.headers.Authorization = `Bearer ${token}`;
        // Os grupos podem ter mudado: o AuthContext recarrega as permissões (/me)
        window.dispatchEvent(new Event('auth:token-renovado'));
        return api(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } else if (error.response?.status === 401 && url.endsWith('/auth/refresh')) {
      setAccessToken(null);
    }
    return Promise.reject(error);
  }
);

export default api;
