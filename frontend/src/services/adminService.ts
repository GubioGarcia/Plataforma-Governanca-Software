import api from '../config/axios';
import type { AcaoAuditoria, AuditoriaAPI } from '../types/auditoriaAPI';
import type { Pagina, PrioridadeReferencia, ResumoAdmin, StatusReferencia, UsuarioAdmin } from '../types/admin';

/** Área administrativa: todas as rotas exigem o Admin da Plataforma no backend. */

export async function obterResumoAdmin(): Promise<ResumoAdmin> {
  const res = await api.get<ResumoAdmin>('/admin/resumo');
  return res.data;
}

export async function listarUsuariosAdmin(params: {
  pagina: number; tamanho: number; busca?: string; ativo?: boolean;
}): Promise<Pagina<UsuarioAdmin>> {
  const res = await api.get<Pagina<UsuarioAdmin>>('/admin/usuarios', { params });
  return res.data;
}

export async function listarAuditoriaAdmin(params: {
  pagina: number; tamanho: number; acao?: AcaoAuditoria; de?: string; ate?: string;
}): Promise<Pagina<AuditoriaAPI>> {
  const res = await api.get<Pagina<AuditoriaAPI>>('/admin/auditoria', { params });
  return res.data;
}

// ── Dados de referência ──────────────────────────────────────────────────────

export type TipoStatus = 'status-projeto' | 'status-requisito';

export async function listarStatus(tipo: TipoStatus): Promise<StatusReferencia[]> {
  const res = await api.get<StatusReferencia[]>(`/${tipo}`);
  return res.data;
}

export async function atualizarStatus(
  tipo: TipoStatus, id: string, dados: { nome: string; descricao: string | null; ordem: number },
): Promise<StatusReferencia> {
  const res = await api.put<StatusReferencia>(`/${tipo}/${id}`, dados);
  return res.data;
}

export async function excluirStatus(tipo: TipoStatus, id: string): Promise<void> {
  await api.delete(`/${tipo}/${id}`);
}

export async function listarTodasPrioridades(): Promise<PrioridadeReferencia[]> {
  const res = await api.get<PrioridadeReferencia[]>('/prioridade');
  return res.data;
}

export async function criarPrioridade(
  dados: { codigo: string; nome: string; descricao: string | null; ordem: number },
): Promise<PrioridadeReferencia> {
  const res = await api.post<PrioridadeReferencia>('/prioridade', dados);
  return res.data;
}

export async function atualizarPrioridade(
  id: string, dados: { nome: string; descricao: string | null; ativo: boolean },
): Promise<PrioridadeReferencia> {
  const res = await api.put<PrioridadeReferencia>(`/prioridade/${id}`, dados);
  return res.data;
}

export async function excluirPrioridade(id: string): Promise<void> {
  await api.delete(`/prioridade/${id}`);
}
