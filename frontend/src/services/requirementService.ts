import api from '../config/axios';
import type {
  RequisitoAPI,
  StatusRequisitoAPI,
  PrioridadeAPI,
  CriterioAceiteAPI,
  CriarRequisitoPayload,
  AtualizarRequisitoPayload,
  CriarCriterioAceitePayload,
} from '../types/requirementAPI';

// ── Status de Requisito ────────────────────────────────────────────────────

export async function listarStatusRequisito(): Promise<StatusRequisitoAPI[]> {
  const res = await api.get<StatusRequisitoAPI[]>('/status-requisito');
  return res.data;
}

// ── Prioridades ────────────────────────────────────────────────────────────

export async function listarPrioridades(): Promise<PrioridadeAPI[]> {
  const res = await api.get<PrioridadeAPI[]>('/prioridade/ativas');
  return res.data;
}

// ── Requisitos ─────────────────────────────────────────────────────────────

export async function listarRequisitosPorProjeto(projetoId: string): Promise<RequisitoAPI[]> {
  const res = await api.get<RequisitoAPI[]>(`/requisito/projeto/${projetoId}`);
  return res.data;
}

export async function buscarRequisitoPorId(id: string): Promise<RequisitoAPI> {
  const res = await api.get<RequisitoAPI>(`/requisito/${id}`);
  return res.data;
}

export async function criarRequisito(
  projetoId: string,
  payload: CriarRequisitoPayload,
): Promise<RequisitoAPI> {
  const res = await api.post<RequisitoAPI>(`/requisito/projeto/${projetoId}`, payload);
  return res.data;
}

export async function atualizarRequisito(
  id: string,
  payload: AtualizarRequisitoPayload,
): Promise<RequisitoAPI> {
  const res = await api.put<RequisitoAPI>(`/requisito/${id}`, payload);
  return res.data;
}

export async function deletarRequisito(id: string): Promise<void> {
  await api.delete(`/requisito/${id}`);
}

// ── Critérios de Aceite ────────────────────────────────────────────────────

export async function listarCriteriosPorRequisito(
  requisitoId: string,
): Promise<CriterioAceiteAPI[]> {
  const res = await api.get<CriterioAceiteAPI[]>(`/criterio-aceite/requisito/${requisitoId}`);
  return res.data;
}

export async function criarCriterioAceite(
  requisitoId: string,
  payload: CriarCriterioAceitePayload,
): Promise<CriterioAceiteAPI> {
  const res = await api.post<CriterioAceiteAPI>(
    `/criterio-aceite/requisito/${requisitoId}`,
    payload,
  );
  return res.data;
}

export async function atualizarCriterioAceite(
  id: string,
  payload: CriarCriterioAceitePayload,
): Promise<CriterioAceiteAPI> {
  const res = await api.put<CriterioAceiteAPI>(`/criterio-aceite/${id}`, payload);
  return res.data;
}

export async function deletarCriterioAceite(id: string): Promise<void> {
  await api.delete(`/criterio-aceite/${id}`);
}

export default {
  listarStatusRequisito,
  listarPrioridades,
  listarRequisitosPorProjeto,
  buscarRequisitoPorId,
  criarRequisito,
  atualizarRequisito,
  deletarRequisito,
  listarCriteriosPorRequisito,
  criarCriterioAceite,
  atualizarCriterioAceite,
  deletarCriterioAceite,
};
