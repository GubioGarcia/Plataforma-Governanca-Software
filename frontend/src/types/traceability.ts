/**
 * Espelha o módulo `traceability` do backend (VinculoRequisito e
 * TipoVinculoRequisito) e acrescenta as projeções derivadas que a matriz de
 * rastreabilidade e a análise de impacto consomem.
 *
 * As relações INDIRETAS não são persistidas: elas resultam do cruzamento de
 * dois `ImpactoDados` que apontam para a mesma `EntidadeDados` — a mesma
 * junção que o backend fará dentro da consulta `WITH RECURSIVE`.
 */

export type TipoVinculoRequisito = 'DEPENDE_DE' | 'IMPACTA' | 'DUPLICA' | 'CONFLITA';

export interface VinculoRequisitoAPI {
  id: string;
  requisitoOrigemId: string;
  requisitoDestinoId: string;
  tipo: TipoVinculoRequisito;
}

export interface CriarVinculoPayload {
  requisitoOrigemId: string;
  requisitoDestinoId: string;
  tipo: TipoVinculoRequisito;
}

// ── Projeções derivadas (calculadas no front, não persistidas) ──────────────

export type OrigemRelacao = 'DIRETO' | 'INDIRETO';

/** Aresta do grafo de rastreabilidade entre dois requisitos. */
export interface RelacaoRequisito {
  origemId: string;
  destinoId: string;
  origem: OrigemRelacao;
  /** Preenchido apenas em relações diretas. */
  tipo?: TipoVinculoRequisito;
  /** Preenchido apenas em relações indiretas: entidades compartilhadas. */
  entidadesCompartilhadas?: string[];
  /** Id do vínculo persistido — permite remover a relação direta. */
  vinculoId?: string;
}

/** Célula da matriz requisito × requisito. */
export interface CelulaMatriz {
  relacaoDireta?: RelacaoRequisito;
  relacaoIndireta?: RelacaoRequisito;
}

/** Requisito alcançado pela travessia, com a distância em saltos. */
export interface RequisitoImpactado {
  requisitoId: string;
  /** Número de saltos a partir do requisito de origem (1 = vizinho direto). */
  saltos: number;
  /** Como este requisito foi alcançado no último salto. */
  origem: OrigemRelacao;
  /** Caminho percorrido, do requisito de origem até este (ids inclusive). */
  caminho: string[];
  tipo?: TipoVinculoRequisito;
  entidadesCompartilhadas?: string[];
}
