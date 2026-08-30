import type { VinculoRequisitoAPI } from '../types/traceability';

/**
 * Vínculos diretos de demonstração entre requisitos.
 *
 * Como os requisitos vêm da API (ids gerados no banco), o cenário é descrito
 * por posição na listagem ordenada por código e resolvido na semeadura.
 */
const VINCULOS_SEED: Array<{
  origem: number;
  destino: number;
  tipo: VinculoRequisitoAPI['tipo'];
}> = [
  { origem: 0, destino: 1, tipo: 'IMPACTA' },
  { origem: 2, destino: 0, tipo: 'DEPENDE_DE' },
  { origem: 3, destino: 1, tipo: 'DEPENDE_DE' },
];

export function criarVinculosSeed(
  projetoId: string,
  requisitoIds: string[],
): VinculoRequisitoAPI[] {
  return VINCULOS_SEED.filter(
    (v) => v.origem < requisitoIds.length && v.destino < requisitoIds.length,
  ).map((v, indice) => ({
    id: `${projetoId}:vin:${indice}`,
    requisitoOrigemId: requisitoIds[v.origem],
    requisitoDestinoId: requisitoIds[v.destino],
    tipo: v.tipo,
  }));
}
