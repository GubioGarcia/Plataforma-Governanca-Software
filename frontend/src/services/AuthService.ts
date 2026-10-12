import api from '../config/axios';
import type { MeResponse } from '../types/acesso';

const API_LOGIN_URL   = '/auth/login';
const API_REFRESH_URL = '/auth/refresh';
const API_LOGOUT_URL  = '/auth/logout';
const API_ME_URL      = '/auth/me';

export interface LoginRequest {
  email: string;
  senha: string;
}

/**
 * Resposta de login/refresh. O refresh token NÃO vem aqui: o backend o grava num
 * cookie HttpOnly (o JavaScript não tem acesso). expiresIn = validade do token em segundos.
 */
export interface SessaoResponse {
  token: string;
  expiresIn: number;
}

const ERRO_GENERICO =
  'Não foi possível realizar seu login. Verifique os dados informados e tente novamente.';

/**
 * Autentica o usuário via backend.
 */
export async function loginWithCredentials(email: string, senha: string): Promise<SessaoResponse> {
  try {
    const response = await api.post<SessaoResponse>(API_LOGIN_URL, {
      email: email.trim().toLowerCase(),
      senha,
    } satisfies LoginRequest);

    const { token, expiresIn } = response.data;
    if (!token) {
      throw new Error('Resposta de login inválida do servidor.');
    }
    return { token, expiresIn };
  } catch (error: unknown) {
    // Erros HTTP com corpo de resposta (4xx/5xx do backend)
    if (error !== null && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
      const status = axiosError.response?.status;

      // 401 = credenciais inválidas — não revelar se foi e-mail ou senha
      if (status === 401 || status === 403) {
        throw new Error(ERRO_GENERICO);
      }

      // 422 = payload inválido (não deve chegar aqui se a validação do form estiver correta)
      if (status === 422) {
        throw new Error('Dados inválidos. Verifique o e-mail e a senha informados.');
      }

      // Outros erros do servidor
      const detalhe = axiosError.response?.data?.detail;
      throw new Error(detalhe ?? ERRO_GENERICO);
    }

    // Erro de rede / timeout
    throw new Error(ERRO_GENERICO);
  }
}

/** Troca o cookie de refresh por um access token novo (já com os grupos atuais). */
export async function refreshSession(): Promise<SessaoResponse> {
  const response = await api.post<SessaoResponse>(API_REFRESH_URL);
  return { token: response.data.token, expiresIn: response.data.expiresIn };
}

/** Encerra a sessão no servidor e apaga o cookie de refresh. */
export async function logoutSession(): Promise<void> {
  await api.post(API_LOGOUT_URL);
}

/**
 * Usuário autenticado + organizações/projetos com papéis e permissões.
 * O token já está no interceptor do Axios — não precisa ser passado aqui.
 */
export async function fetchMe(): Promise<MeResponse> {
  const response = await api.get<MeResponse>(API_ME_URL);
  return response.data;
}
