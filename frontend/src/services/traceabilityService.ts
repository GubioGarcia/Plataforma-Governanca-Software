import { criarVinculosSeed } from '../mocks/traceability';
import { gravarColecao, lerColecao, novoId, removerColecao, simularLatencia } from './prototypeStore';
import type { CriarVinculoPayload, VinculoRequisitoAPI } from '../types/traceability';

/**
 * Serviço do módulo de rastreabilidade (`traceability`).
 *
 * Cobre apenas os vínculos DIRETOS, que são os únicos persistidos. As relações
 * indiretas e a análise de impacto são derivadas em `utils/traceability.ts`,
 * a partir destes vínculos somados aos impactos de dados.
 */

const COLECAO = 'traceability';

function carregar(projetoId: string): VinculoRequisitoAPI[] | null {
  return lerColecao<VinculoRequisitoAPI[]>(COLECAO, projetoId);
}

function salvar(projetoId: string, vinculos: VinculoRequisitoAPI[]): VinculoRequisitoAPI[] {
  gravarColecao(COLECAO, projetoId, vinculos);
  return vinculos;
}

/**
 * Lista os vínculos diretos do projeto, semeando o cenário de demonstração na
 * primeira abertura.
 */
export async function listarVinculos(
  projetoId: string,
  requisitoIds: string[] = [],
): Promise<VinculoRequisitoAPI[]> {
  const existente = carregar(projetoId);
  if (existente) return simularLatencia(existente);
  if (requisitoIds.length === 0) return simularLatencia([]);
  return simularLatencia(salvar(projetoId, criarVinculosSeed(projetoId, requisitoIds)));
}

export async function criarVinculo(
  projetoId: string,
  payload: CriarVinculoPayload,
): Promise<VinculoRequisitoAPI> {
  const vinculos = carregar(projetoId) ?? [];
  const vinculo: VinculoRequisitoAPI = { id: novoId(), ...payload };
  salvar(projetoId, [...vinculos, vinculo]);
  return simularLatencia(vinculo);
}

export async function deletarVinculo(projetoId: string, vinculoId: string): Promise<void> {
  const vinculos = carregar(projetoId);
  if (!vinculos) return;
  salvar(projetoId, vinculos.filter((v) => v.id !== vinculoId));
  await simularLatencia(null);
}

/** Restaura o cenário de demonstração, descartando os vínculos criados localmente. */
export async function restaurarVinculos(
  projetoId: string,
  requisitoIds: string[],
): Promise<VinculoRequisitoAPI[]> {
  removerColecao(COLECAO, projetoId);
  return simularLatencia(salvar(projetoId, criarVinculosSeed(projetoId, requisitoIds)));
}

export default { listarVinculos, criarVinculo, deletarVinculo, restaurarVinculos };
