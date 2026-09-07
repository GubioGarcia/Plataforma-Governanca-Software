import api from '../config/axios';
import type {
  AtributoEntidadeAPI,
  CriarImpactoPayload,
  EntidadeDadosAPI,
  ImpactoDadosAPI,
  ModeloDadosProjeto,
  RelacionamentoEntidadeAPI,
  TipoOperacaoImpacto,
  TipoRelacionamentoEntidade,
} from '../types/dataModel';

/**
 * Serviço do módulo de modelagem de dados (`datamodel`).
 *
 * Monta o `ModeloDadosProjeto` que as telas consomem a partir de dois
 * endpoints REST: o diagrama do projeto (entidades + atributos +
 * relacionamentos) e a lista de impactos do projeto. As projeções derivadas
 * (diff antes/depois, diagrama ER) continuam em `utils/dataModel.ts`.
 */

// ── Formato dos DTOs do backend (apenas os campos consumidos) ───────────────

interface AtributoEntidadeResponseDTO {
  id: string;
  entidadeId: string;
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  chavePrimaria: boolean;
  ordem: number | null;
}

interface RelacionamentoEntidadeResponseDTO {
  id: string;
  entidadeOrigemId: string;
  entidadeDestinoId: string;
  tipo: TipoRelacionamentoEntidade;
  atributoFk: string | null;
}

interface EntidadeDadosDetalheResponseDTO {
  id: string;
  projetoId: string;
  nome: string;
  descricao: string | null;
  atributos: AtributoEntidadeResponseDTO[];
  relacionamentos: RelacionamentoEntidadeResponseDTO[];
}

interface DiagramaProjetoResponseDTO {
  projetoId: string;
  entidadeDestacadaId: string | null;
  entidades: EntidadeDadosDetalheResponseDTO[];
  relacionamentos: RelacionamentoEntidadeResponseDTO[];
}

interface EntidadeDadosResponseDTO {
  id: string;
  projetoId: string;
  nome: string;
  descricao: string | null;
}

interface ImpactoDadosResponseDTO {
  id: string;
  requisitoId: string;
  entidadeId: string;
  atributoId: string | null;
  tipoOperacao: TipoOperacaoImpacto;
  valorAnterior: string | null;
  valorNovo: string | null;
}

// ── Adaptadores DTO → tipos das telas ──────────────────────────────────────

function toEntidade(e: EntidadeDadosDetalheResponseDTO | EntidadeDadosResponseDTO): EntidadeDadosAPI {
  return { id: e.id, projetoId: e.projetoId, nome: e.nome, descricao: e.descricao };
}

function toAtributo(a: AtributoEntidadeResponseDTO): AtributoEntidadeAPI {
  return {
    id: a.id,
    entidadeId: a.entidadeId,
    nome: a.nome,
    tipo: a.tipo,
    obrigatorio: a.obrigatorio,
    chavePrimaria: a.chavePrimaria,
  };
}

function toRelacionamento(r: RelacionamentoEntidadeResponseDTO): RelacionamentoEntidadeAPI {
  return {
    id: r.id,
    entidadeOrigemId: r.entidadeOrigemId,
    entidadeDestinoId: r.entidadeDestinoId,
    tipo: r.tipo,
    atributoFk: r.atributoFk,
  };
}

function toImpacto(i: ImpactoDadosResponseDTO): ImpactoDadosAPI {
  return {
    id: i.id,
    requisitoId: i.requisitoId,
    entidadeId: i.entidadeId,
    atributoId: i.atributoId,
    tipoOperacao: i.tipoOperacao,
    valorAnterior: i.valorAnterior,
    valorNovo: i.valorNovo,
  };
}

// ── API ───────────────────────────────────────────────────────────────────

/** Modelo de dados completo do projeto, montado a partir do diagrama + impactos. */
export async function obterModelo(
  projetoId: string,
  _requisitoIds: string[] = [],
): Promise<ModeloDadosProjeto> {
  const [diagrama, impactos] = await Promise.all([
    api.get<DiagramaProjetoResponseDTO>(`/entidade-dados/projeto/${projetoId}/diagrama`),
    api.get<ImpactoDadosResponseDTO[]>(`/impacto-dados/projeto/${projetoId}`),
  ]);

  return {
    entidades: diagrama.data.entidades.map(toEntidade),
    atributos: diagrama.data.entidades.flatMap((e) => e.atributos.map(toAtributo)),
    relacionamentos: diagrama.data.relacionamentos.map(toRelacionamento),
    impactos: impactos.data.map(toImpacto),
  };
}

/** Recarrega o modelo do servidor (o botão ↺ das telas). */
export async function restaurarModelo(
  projetoId: string,
  requisitoIds: string[],
): Promise<ModeloDadosProjeto> {
  return obterModelo(projetoId, requisitoIds);
}

export async function criarEntidade(
  projetoId: string,
  payload: { nome: string; descricao: string | null },
): Promise<EntidadeDadosAPI> {
  const res = await api.post<EntidadeDadosResponseDTO>(
    `/entidade-dados/projeto/${projetoId}`,
    { nome: payload.nome, descricao: payload.descricao },
  );
  return toEntidade(res.data);
}

export async function criarAtributo(
  _projetoId: string,
  payload: { entidadeId: string; nome: string; tipo: string; obrigatorio: boolean; chavePrimaria: boolean },
): Promise<AtributoEntidadeAPI> {
  const res = await api.post<AtributoEntidadeResponseDTO>(
    `/atributo-entidade/entidade/${payload.entidadeId}`,
    {
      nome: payload.nome,
      tipo: payload.tipo,
      obrigatorio: payload.obrigatorio,
      chavePrimaria: payload.chavePrimaria,
      ordem: null,
    },
  );
  return toAtributo(res.data);
}

export async function criarImpacto(
  _projetoId: string,
  payload: CriarImpactoPayload,
): Promise<ImpactoDadosAPI> {
  const res = await api.post<ImpactoDadosResponseDTO>(
    `/impacto-dados/requisito/${payload.requisitoId}`,
    {
      entidadeId: payload.entidadeId,
      atributoId: payload.atributoId ?? null,
      tipoOperacao: payload.tipoOperacao,
      valorAnterior: payload.valorAnterior ?? null,
      valorNovo: payload.valorNovo ?? null,
    },
  );
  return toImpacto(res.data);
}

export async function deletarImpacto(_projetoId: string, impactoId: string): Promise<void> {
  await api.delete(`/impacto-dados/${impactoId}`);
}

export default {
  obterModelo,
  restaurarModelo,
  criarEntidade,
  criarAtributo,
  criarImpacto,
  deletarImpacto,
};
