import api from '../config/axios';
import type { ProjetoAPI } from '../types/projeto';

export interface CriarProjetoRequest {
  organizacaoId: string;
  nome: string;
  descricao?: string;
}

export interface AtualizarProjetoRequest {
  nome?: string;
  descricao?: string;
  statusId?: string;
}

export async function listarProjetosPorOrg(orgId: string, ativo = true): Promise<ProjetoAPI[]> {
  const url = ativo === undefined ? `/projeto/organizacao/${orgId}` : `/projeto/organizacao/${orgId}?ativo=${ativo}`;
  const res = await api.get<ProjetoAPI[]>(url);
  return res.data;
}

export async function buscarProjetoPorId(id: string): Promise<ProjetoAPI> {
  const res = await api.get<ProjetoAPI>(`/projeto/${id}`);
  return res.data;
}

export async function criarProjeto(data: CriarProjetoRequest): Promise<ProjetoAPI> {
  const res = await api.post<ProjetoAPI>('/projeto', data);
  return res.data;
}

export async function atualizarProjeto(id: string, data: AtualizarProjetoRequest): Promise<ProjetoAPI> {
  const res = await api.put<ProjetoAPI>(`/projeto/${id}`, data);
  return res.data;
}

export async function inativarProjeto(id: string): Promise<void> {
  await api.delete(`/projeto/${id}`);
}

export default {
  listarProjetosPorOrg,
  buscarProjetoPorId,
  criarProjeto,
  atualizarProjeto,
  inativarProjeto,
};
