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

export async function ativarProjeto(id: string): Promise<ProjetoAPI> {
  const res = await api.patch<ProjetoAPI>(`/projeto/${id}/ativar`);
  return res.data;
}

export async function listarStatusProjeto(): Promise<import('../types/projeto').StatusProjetoAPI[]> {
  const res = await api.get('/status-projeto');
  return res.data;
}

export async function listarRequisitosResumoPorProjeto(projetoId: string): Promise<{ total: number; aprovados: number }> {
  const res = await api.get<Array<{ statusNome: string | null }>>(`/requisito/projeto/${projetoId}`);
  const reqs = res.data;
  const total = reqs.length;
  const aprovados = reqs.filter((r) => r.statusNome && r.statusNome.toUpperCase() === 'APROVADO').length;
  return { total, aprovados };
}

export default {
  listarProjetosPorOrg,
  buscarProjetoPorId,
  criarProjeto,
  atualizarProjeto,
  inativarProjeto,
};