import api from '../config/axios';
import type { CriarVinculoPayload, TipoVinculoRequisito, VinculoRequisitoAPI } from '../types/traceability';

/**
 * Serviço do módulo de rastreabilidade (`traceability`).
 *
 * Cobre os vínculos DIRETOS entre requisitos, os únicos persistidos. As
 * relações INDIRETAS e a análise de impacto são derivadas no cliente
 * (`utils/traceability.ts`), a partir destes vínculos somados aos impactos de
 * dados — a mesma junção que o backend também expõe em
 * `/api/rastreabilidade/...`, aqui não consumida para manter uma única fonte
 * da lógica de visualização.
 */

/** Projeção enxuta que a matriz consome — recorte do `VinculoRequisitoResponseDTO`. */
interface VinculoRequisitoResponseDTO {
  id: string;
  requisitoOrigemId: string;
  requisitoDestinoId: string;
  tipo: TipoVinculoRequisito;
}

function toVinculo(dto: VinculoRequisitoResponseDTO): VinculoRequisitoAPI {
  return {
    id: dto.id,
    requisitoOrigemId: dto.requisitoOrigemId,
    requisitoDestinoId: dto.requisitoDestinoId,
    tipo: dto.tipo,
  };
}

/** Lista os vínculos diretos de todos os requisitos do projeto. */
export async function listarVinculos(
  projetoId: string,
  _requisitoIds: string[] = [],
): Promise<VinculoRequisitoAPI[]> {
  const res = await api.get<VinculoRequisitoResponseDTO[]>(`/vinculo-requisito/projeto/${projetoId}`);
  return res.data.map(toVinculo);
}

export async function criarVinculo(
  _projetoId: string,
  payload: CriarVinculoPayload,
): Promise<VinculoRequisitoAPI> {
  const res = await api.post<VinculoRequisitoResponseDTO>(
    `/vinculo-requisito/requisito/${payload.requisitoOrigemId}`,
    { requisitoDestinoId: payload.requisitoDestinoId, tipo: payload.tipo },
  );
  return toVinculo(res.data);
}

export async function deletarVinculo(_projetoId: string, vinculoId: string): Promise<void> {
  await api.delete(`/vinculo-requisito/${vinculoId}`);
}

/** Recarrega os vínculos do servidor (o botão ↺ das telas). */
export async function restaurarVinculos(
  projetoId: string,
  requisitoIds: string[],
): Promise<VinculoRequisitoAPI[]> {
  return listarVinculos(projetoId, requisitoIds);
}

export default { listarVinculos, criarVinculo, deletarVinculo, restaurarVinculos };
