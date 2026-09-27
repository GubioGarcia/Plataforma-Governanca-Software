import api from '../config/axios';
import type { AuditoriaAPI } from '../types/auditoriaAPI';

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

// Sem mutações: o log de auditoria é somente leitura na API (gravado pelo backend).
