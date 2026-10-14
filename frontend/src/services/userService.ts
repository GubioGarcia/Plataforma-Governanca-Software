import api from '../config/axios';
import type { AxiosError } from 'axios';
import type { PapelNoProjeto, PapelOrganizacao } from '../types/acesso';

export interface CadastrarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
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

/** GET /api/usuario — lista os usuários da plataforma (Admin da Plataforma); `ativo` filtra */
export async function listarUsuarios(ativo?: boolean): Promise<UsuarioBackend[]> {
  const res = await api.get<UsuarioBackend[]>('/usuario', { params: ativo === undefined ? {} : { ativo } });
  return res.data;
}

/** Onde a pessoa atua: papel real em cada organização e projeto */
export interface AcessosUsuario {
  usuarioId: string;
  organizacoes: {
    id: string;
    nome: string;
    ativo: boolean;
    /** null quando só participa de projetos da organização (convidada) */
    papel: PapelOrganizacao | null;
    projetos: { id: string; nome: string; ativo: boolean; papeis: PapelNoProjeto[] }[];
  }[];
}

/** GET /api/usuario/{id}/acessos — papéis da pessoa, a partir dos grupos dela (Admin da Plataforma) */
export async function obterAcessosUsuario(id: string): Promise<AcessosUsuario> {
  const res = await api.get<AcessosUsuario>(`/usuario/${id}/acessos`);
  return res.data;
}

export interface AtualizarPerfilRequest {
  nome: string;
  email: string;
  urlMidiaPerfil?: string | null;
}

/** PUT /api/usuario/atualizar — o próprio usuário atualiza nome/e-mail */
export async function atualizarMeuPerfil(data: AtualizarPerfilRequest): Promise<UsuarioBackend> {
  const res = await api.put<UsuarioBackend>('/usuario/atualizar', data);
  return res.data;
}

/** DELETE /api/usuario/{id} — exclui (inativa) a conta: a pessoa não entra mais e as sessões caem */
export async function removerUsuario(id: string): Promise<void> {
  await api.delete(`/usuario/${id}`);
}
