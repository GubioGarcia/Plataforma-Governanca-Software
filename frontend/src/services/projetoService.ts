import api from '../config/axios';
import type {
  ProjetoAPI,
  CriarProjetoRequest,
  AtualizarProjetoRequest,
} from '../types/projeto';

/** GET /api/projeto/organizacao/{orgId} — lista projetos de uma organização */
export async function listarProjetosPorOrg(orgId: string, ativo?: boolean): Promise<ProjetoAPI[]> {
  const params = ativo !== undefined ? { ativo } : {};
  const res = await api.get<ProjetoAPI[]>(`/projeto/organizacao/${orgId}`, { params });
  return res.data;
}

/** GET /api/projeto/{id} */
export async function buscarProjeto(id: string): Promise<ProjetoAPI> {
  const res = await api.get<ProjetoAPI>(`/projeto/${id}`);
  return res.data;
}

/** POST /api/projeto — cria novo projeto (201) */
export async function criarProjeto(data: CriarProjetoRequest): Promise<ProjetoAPI> {
  const res = await api.post<ProjetoAPI>('/projeto', data);
  return res.data;
}

/** PUT /api/projeto/{id} — atualiza projeto */
export async function atualizarProjeto(id: string, data: AtualizarProjetoRequest): Promise<ProjetoAPI> {
  const res = await api.put<ProjetoAPI>(`/projeto/${id}`, data);
  return res.data;
}

/** DELETE /api/projeto/{id} — inativa projeto (204) */
export async function inativarProjeto(id: string): Promise<void> {
  await api.delete(`/projeto/${id}`);
}
