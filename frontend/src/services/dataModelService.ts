import { criarModeloSeed } from '../mocks/dataModel';
import { gravarColecao, lerColecao, novoId, removerColecao, simularLatencia } from './prototypeStore';
import type {
  AtributoEntidadeAPI,
  CriarImpactoPayload,
  EntidadeDadosAPI,
  ImpactoDadosAPI,
  ModeloDadosProjeto,
} from '../types/dataModel';

/**
 * Serviço do módulo de modelagem de dados (`datamodel`).
 *
 * As assinaturas abaixo já são as da API planejada — o corpo de cada função é
 * o único ponto que muda quando os controllers REST forem publicados
 * (ver `services/prototypeStore.ts`).
 */

const COLECAO = 'datamodel';

const MODELO_VAZIO: ModeloDadosProjeto = {
  entidades: [],
  atributos: [],
  relacionamentos: [],
  impactos: [],
};

function carregar(projetoId: string): ModeloDadosProjeto | null {
  return lerColecao<ModeloDadosProjeto>(COLECAO, projetoId);
}

function salvar(projetoId: string, modelo: ModeloDadosProjeto): ModeloDadosProjeto {
  gravarColecao(COLECAO, projetoId, modelo);
  return modelo;
}

/**
 * Devolve o modelo de dados do projeto, semeando o cenário de demonstração na
 * primeira vez em que a tela é aberta.
 *
 * @param requisitoIds ids dos requisitos do projeto ordenados por código —
 *                     necessários apenas para semear os impactos iniciais
 */
export async function obterModelo(
  projetoId: string,
  requisitoIds: string[] = [],
): Promise<ModeloDadosProjeto> {
  const existente = carregar(projetoId);
  if (existente) return simularLatencia(existente);
  if (requisitoIds.length === 0) return simularLatencia(MODELO_VAZIO);
  return simularLatencia(salvar(projetoId, criarModeloSeed(projetoId, requisitoIds)));
}

/** Restaura o cenário de demonstração, descartando as alterações locais. */
export async function restaurarModelo(
  projetoId: string,
  requisitoIds: string[],
): Promise<ModeloDadosProjeto> {
  removerColecao(COLECAO, projetoId);
  return simularLatencia(salvar(projetoId, criarModeloSeed(projetoId, requisitoIds)));
}

export async function criarEntidade(
  projetoId: string,
  payload: { nome: string; descricao: string | null },
): Promise<EntidadeDadosAPI> {
  const modelo = carregar(projetoId) ?? MODELO_VAZIO;
  const entidade: EntidadeDadosAPI = {
    id: novoId(),
    projetoId,
    nome: payload.nome,
    descricao: payload.descricao,
  };
  salvar(projetoId, { ...modelo, entidades: [...modelo.entidades, entidade] });
  return simularLatencia(entidade);
}

export async function criarAtributo(
  projetoId: string,
  payload: { entidadeId: string; nome: string; tipo: string; obrigatorio: boolean },
): Promise<AtributoEntidadeAPI> {
  const modelo = carregar(projetoId) ?? MODELO_VAZIO;
  const atributo: AtributoEntidadeAPI = {
    id: novoId(),
    entidadeId: payload.entidadeId,
    nome: payload.nome,
    tipo: payload.tipo,
    obrigatorio: payload.obrigatorio,
    chavePrimaria: false,
  };
  salvar(projetoId, { ...modelo, atributos: [...modelo.atributos, atributo] });
  return simularLatencia(atributo);
}

export async function criarImpacto(
  projetoId: string,
  payload: CriarImpactoPayload,
): Promise<ImpactoDadosAPI> {
  const modelo = carregar(projetoId) ?? MODELO_VAZIO;
  const impacto: ImpactoDadosAPI = {
    id: novoId(),
    requisitoId: payload.requisitoId,
    entidadeId: payload.entidadeId,
    atributoId: payload.atributoId ?? null,
    tipoOperacao: payload.tipoOperacao,
    valorAnterior: payload.valorAnterior ?? null,
    valorNovo: payload.valorNovo ?? null,
  };
  salvar(projetoId, { ...modelo, impactos: [...modelo.impactos, impacto] });
  return simularLatencia(impacto);
}

export async function deletarImpacto(projetoId: string, impactoId: string): Promise<void> {
  const modelo = carregar(projetoId);
  if (!modelo) return;
  salvar(projetoId, {
    ...modelo,
    impactos: modelo.impactos.filter((i) => i.id !== impactoId),
  });
  await simularLatencia(null);
}

export default {
  obterModelo,
  restaurarModelo,
  criarEntidade,
  criarAtributo,
  criarImpacto,
  deletarImpacto,
};
