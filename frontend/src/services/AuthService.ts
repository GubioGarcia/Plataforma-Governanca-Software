import api from '../config/axios';

const API_LOGIN_URL = '/auth/login';
const API_ME_URL    = '/auth/me';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthMeResponse {
  id: string;
  externalIdentityId: string;
  nome: string;
  email: string;
  ativo: boolean;
  dataCriacao: string;
  urlMidiaPerfil: string | null;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthMeResponse;
}

const ERRO_GENERICO =
  'Não foi possível realizar seu login. Verifique os dados informados e tente novamente.';

/**
 * Autentica o usuário via backend.
 */
export async function loginWithCredentials(
  email: string,
  senha: string,
): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>(API_LOGIN_URL, {
      email: email.trim().toLowerCase(),
      senha,
    } satisfies LoginRequest);

    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error('Resposta de login inválida do servidor.');
    }

    return { token, user };
  } catch (error: unknown) {
    // Erros HTTP com corpo de resposta (4xx/5xx do backend)
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error
    ) {
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

/**
 * Busca os dados do usuário autenticado.
 * O token já está no interceptor do Axios — não precisa ser passado aqui.
 */
export async function fetchAuthenticatedUser(): Promise<AuthMeResponse> {
  const response = await api.get<AuthMeResponse>(API_ME_URL);
  return response.data;
}