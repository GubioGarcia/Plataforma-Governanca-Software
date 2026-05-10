import api from '../config/axios';
import type { OrganizacaoAPI, PlanoAPI } from '../types/organizacao';

export interface CriarOrganizacaoRequest {
  nome: string;
  descricao?: string;
  plano: PlanoAPI;
}

export interface AtualizarOrganizacaoRequest {
  nome?: string;
  descricao?: string;
  plano?: PlanoAPI;
}

export async function listarOrganizacoes(ativo?: boolean): Promise<OrganizacaoAPI[]> {
  const url = ativo === undefined ? '/organizacao' : `/organizacao?ativo=${ativo}`;
  const res = await api.get<OrganizacaoAPI[]>(url);
  return res.data;
}

export async function criarOrganizacao(data: CriarOrganizacaoRequest): Promise<OrganizacaoAPI> {
  const res = await api.post<OrganizacaoAPI>('/organizacao', data);
  return res.data;
}

export async function atualizarOrganizacao(id: string, data: AtualizarOrganizacaoRequest): Promise<OrganizacaoAPI> {
  const res = await api.put<OrganizacaoAPI>(`/organizacao/${id}`, data);
  return res.data;
}

export async function inativarOrganizacao(id: string): Promise<void> {
  await api.delete(`/organizacao/${id}`);
}

export async function ativarOrganizacao(id: string): Promise<OrganizacaoAPI> {
  const res = await api.patch<OrganizacaoAPI>(`/organizacao/${id}/ativar`);
  return res.data;
}

export default {
  listarOrganizacoes,
  criarOrganizacao,
  atualizarOrganizacao,
  inativarOrganizacao,
};