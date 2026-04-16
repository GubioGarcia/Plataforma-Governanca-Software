import api from '../config/axios';
import type {
  OrganizacaoAPI,
  CriarOrganizacaoRequest,
  AtualizarOrganizacaoRequest,
} from '../types/organizacao';

/** GET /api/organizacao — lista organizações; filtra por ativo se informado */
export async function listarOrganizacoes(ativo?: boolean): Promise<OrganizacaoAPI[]> {
  const params = ativo !== undefined ? { ativo } : {};
  const res = await api.get<OrganizacaoAPI[]>('/organizacao', { params });
  return res.data;
}

/** GET /api/organizacao/{id} */
export async function buscarOrganizacao(id: string): Promise<OrganizacaoAPI> {
  const res = await api.get<OrganizacaoAPI>(`/organizacao/${id}`);
  return res.data;
}

/** POST /api/organizacao — cria nova organização (201) */
export async function criarOrganizacao(data: CriarOrganizacaoRequest): Promise<OrganizacaoAPI> {
  const res = await api.post<OrganizacaoAPI>('/organizacao', data);
  return res.data;
}

/** PUT /api/organizacao/{id} — atualiza organização */
export async function atualizarOrganizacao(id: string, data: AtualizarOrganizacaoRequest): Promise<OrganizacaoAPI> {
  const res = await api.put<OrganizacaoAPI>(`/organizacao/${id}`, data);
  return res.data;
}

/** DELETE /api/organizacao/{id} — inativa organização */
export async function inativarOrganizacao(id: string): Promise<void> {
  await api.delete(`/organizacao/${id}`);
}
