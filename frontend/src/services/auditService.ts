import api from '../config/axios';
import type { AuditoriaAPI, CriarAuditoriaPayload, AtualizarAuditoriaPayload } from '../types/auditoriaAPI';

// ── Listagens ──────────────────────────────────────────────────────────────

export async function listarAuditorias(
  entidadeTipo?: string,
  entidadeId?: string,
): Promise<AuditoriaAPI[]> {
  const params: Record<string, string> = {};
  if (entidadeTipo) params.entidadeTipo = entidadeTipo;
  if (entidadeId)   params.entidadeId   = entidadeId;
  const res = await api.get<AuditoriaAPI[]>('/auditoria', { params });
  return res.data;
}

export async function listarAuditoriasPorProjeto(
  projetoId: string,
  entidadeTipo?: string,
): Promise<AuditoriaAPI[]> {
  const params: Record<string, string> = {};
  if (entidadeTipo) params.entidadeTipo = entidadeTipo;
  const res = await api.get<AuditoriaAPI[]>(`/auditoria/projeto/${projetoId}`, { params });
  return res.data;
}

export async function buscarAuditoriaPorId(id: string): Promise<AuditoriaAPI> {
  const res = await api.get<AuditoriaAPI>(`/auditoria/${id}`);
  return res.data;
}

// ── Mutações ───────────────────────────────────────────────────────────────

export async function criarAuditoria(payload: CriarAuditoriaPayload): Promise<AuditoriaAPI> {
  const res = await api.post<AuditoriaAPI>('/auditoria', payload);
  return res.data;
}

export async function atualizarAuditoria(
  id: string,
  payload: AtualizarAuditoriaPayload,
): Promise<AuditoriaAPI> {
  const res = await api.put<AuditoriaAPI>(`/auditoria/${id}`, payload);
  return res.data;
}

export async function deletarAuditoria(id: string): Promise<void> {
  await api.delete(`/auditoria/${id}`);
}
