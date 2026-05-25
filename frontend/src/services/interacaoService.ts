import api from '../config/axios';
import type { InteracaoAPI, ResumoInteracaoProjeto } from '../types/interacao';

/** GET /api/interacao/projeto/{projetoId} */
export async function listarInteracoesPorProjeto(projetoId: string): Promise<InteracaoAPI[]> {
  const res = await api.get<InteracaoAPI[]>(`/interacao/projeto/${projetoId}`);
  return res.data;
}

/** GET /api/interacao/projeto/{projetoId}/resumo */
export async function buscarResumoPorProjeto(projetoId: string): Promise<ResumoInteracaoProjeto> {
  const res = await api.get<ResumoInteracaoProjeto>(`/interacao/projeto/${projetoId}/resumo`);
  return res.data;
}

/** GET /api/interacao/projeto/{projetoId}/usuario/{usuarioId} */
export async function listarPorUsuarioNoProjeto(projetoId: string, usuarioId: string): Promise<InteracaoAPI[]> {
  const res = await api.get<InteracaoAPI[]>(`/interacao/projeto/${projetoId}/usuario/${usuarioId}`);
  return res.data;
}
