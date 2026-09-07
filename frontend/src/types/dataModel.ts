/**
 * Espelha o módulo `datamodel` do backend (EntidadeDados, AtributoEntidade,
 * RelacionamentoEntidade e ImpactoDados).
 *
 * Enquanto os controllers REST não existem, os dados vêm do repositório de
 * protótipo em `services/dataModelService.ts` — os contratos abaixo já são os
 * DTOs esperados da API, de modo que a troca do mock pelo HTTP não altere as
 * telas.
 */

/**
 * Operação que um requisito executa sobre o modelo de dados.
 * Espelha o enum `TipoOperacaoImpacto` do backend.
 */
export type TipoOperacaoImpacto =
  | 'CRIA_ENTIDADE'
  | 'ALTERA_ENTIDADE'
  | 'REMOVE_ENTIDADE'
  | 'CRIA_ATRIBUTO'
  | 'ALTERA_ATRIBUTO'
  | 'REMOVE_ATRIBUTO';

/** Cardinalidade da FK entre duas entidades de negócio. */
export type TipoRelacionamentoEntidade = 'UM_PARA_UM' | 'UM_PARA_MUITOS' | 'MUITOS_PARA_MUITOS';

export interface EntidadeDadosAPI {
  id: string;
  projetoId: string;
  nome: string;
  descricao: string | null;
}

export interface AtributoEntidadeAPI {
  id: string;
  entidadeId: string;
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  /** Marca a chave primária — usado na leitura do diagrama e na tabela de atributos. */
  chavePrimaria: boolean;
}

export interface RelacionamentoEntidadeAPI {
  id: string;
  entidadeOrigemId: string;
  entidadeDestinoId: string;
  tipo: TipoRelacionamentoEntidade;
  /** Atributo que materializa a FK (ex.: `cliente_id`); `null` quando não informado. */
  atributoFk: string | null;
}

export interface ImpactoDadosAPI {
  id: string;
  requisitoId: string;
  entidadeId: string;
  atributoId: string | null;
  tipoOperacao: TipoOperacaoImpacto;
  valorAnterior: string | null;
  valorNovo: string | null;
}

/** Modelo de dados completo de um projeto, como consumido pelas telas. */
export interface ModeloDadosProjeto {
  entidades: EntidadeDadosAPI[];
  atributos: AtributoEntidadeAPI[];
  relacionamentos: RelacionamentoEntidadeAPI[];
  impactos: ImpactoDadosAPI[];
}

export interface CriarImpactoPayload {
  requisitoId: string;
  entidadeId: string;
  atributoId?: string | null;
  tipoOperacao: TipoOperacaoImpacto;
  valorAnterior?: string | null;
  valorNovo?: string | null;
}

// ── Projeções derivadas (calculadas no front, não persistidas) ──────────────

/** Situação de um atributo ao comparar estado atual × estado proposto. */
export type SituacaoAtributoDiff = 'INALTERADO' | 'ADICIONADO' | 'ALTERADO' | 'REMOVIDO';

export interface LinhaDiffAtributo {
  nome: string;
  /** Assinatura no estado atual (`null` quando o atributo ainda não existe). */
  atual: string | null;
  /** Assinatura no estado proposto (`null` quando o requisito remove o atributo). */
  proposto: string | null;
  situacao: SituacaoAtributoDiff;
}

/** Diff de uma entidade provocado por um requisito específico. */
export interface DiffEntidade {
  entidade: EntidadeDadosAPI;
  linhas: LinhaDiffAtributo[];
  /** `true` quando o próprio requisito cria a entidade. */
  entidadeNova: boolean;
}
