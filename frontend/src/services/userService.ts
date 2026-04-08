import api from '../config/axios';
import type { AxiosError } from 'axios';

export interface CadastrarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AtualizarUsuarioRequest {
  nome?: string;
  email?: string;
  senha?: string;
}

/** Formato retornado pela API do backend */
export interface UsuarioBackend {
  id: string;
  externalIdentityId?: string;
  nome: string;
  email: string;
  ativo: boolean;
  dataCriacao?: string;
  urlMidiaPerfil?: string | null;
  roles?: string[];
  papel?: string;
}

export interface ApiErrorResponse {
  detail: string;
  status: number;
  title: string;
  type: string;
  instance?: string;
}

export function isApiError(err: unknown): err is AxiosError<ApiErrorResponse> {
  return !!(err as AxiosError)?.response;
}

/** POST /api/usuario/cadastrar — cadastra novo usuário (201) */
export async function cadastrarUsuario(data: CadastrarUsuarioRequest): Promise<UsuarioBackend> {
  const res = await api.post<UsuarioBackend>('/usuario/cadastrar', data);
  return res.data;
}

/** GET /api/usuario — lista todos os usuários */
export async function listarUsuarios(): Promise<UsuarioBackend[]> {
  const res = await api.get<UsuarioBackend[]>('/usuario');
  return res.data;
}

/** PUT /api/usuario/{id} — atualiza dados do usuário */
export async function atualizarUsuario(id: string, data: AtualizarUsuarioRequest): Promise<UsuarioBackend> {
  const res = await api.put<UsuarioBackend>(`/usuario/${id}`, data);
  return res.data;
}

/** DELETE /api/usuario/{id} — remove usuário */
export async function removerUsuario(id: string): Promise<void> {
  await api.delete(`/usuario/${id}`);
}
