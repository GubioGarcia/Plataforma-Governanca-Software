import axios from 'axios';

// Token mantido em memória — não acessível por scripts de terceiros via localStorage
let _accessToken: string | null = null;

/** Chamado pelo AuthContext após login bem-sucedido */
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
  withCredentials: false,
});

// Injeta o token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata respostas de erro globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpa o token em memória e força novo login
      setAccessToken(null);
      // Dispara evento customizado para o AuthContext reagir sem acoplamento direto
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;