import type {
  AtributoEntidadeAPI,
  EntidadeDadosAPI,
  ImpactoDadosAPI,
  ModeloDadosProjeto,
  RelacionamentoEntidadeAPI,
} from '../types/dataModel';

/**
 * Cenário de demonstração do módulo de modelagem de dados.
 *
 * Representa o modelo do PRODUTO SENDO ESPECIFICADO (Cliente, Pedido...),
 * não as tabelas da própria plataforma. Os ids são derivados do id do projeto
 * para que a semeadura seja determinística e reexecutável.
 */

interface SeedAtributo {
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  chavePrimaria?: boolean;
}

interface SeedEntidade {
  slug: string;
  nome: string;
  descricao: string;
  atributos: SeedAtributo[];
}

interface SeedRelacionamento {
  origem: string;
  destino: string;
  tipo: RelacionamentoEntidadeAPI['tipo'];
  atributoFk: string;
}

const ENTIDADES_SEED: SeedEntidade[] = [
  {
    slug: 'cliente',
    nome: 'Cliente',
    descricao: 'Pessoa física ou jurídica que realiza compras na plataforma.',
    atributos: [
      { nome: 'id', tipo: 'UUID', obrigatorio: true, chavePrimaria: true },
      { nome: 'nome', tipo: 'VARCHAR(150)', obrigatorio: true },
      { nome: 'email', tipo: 'VARCHAR(150)', obrigatorio: true },
      { nome: 'cpf', tipo: 'VARCHAR(11)', obrigatorio: true },
      { nome: 'data_nascimento', tipo: 'DATE', obrigatorio: false },
    ],
  },
  {
    slug: 'endereco',
    nome: 'Endereco',
    descricao: 'Endereço de entrega vinculado a um cliente.',
    atributos: [
      { nome: 'id', tipo: 'UUID', obrigatorio: true, chavePrimaria: true },
      { nome: 'cliente_id', tipo: 'UUID', obrigatorio: true },
      { nome: 'logradouro', tipo: 'VARCHAR(200)', obrigatorio: true },
      { nome: 'cidade', tipo: 'VARCHAR(100)', obrigatorio: true },
      { nome: 'uf', tipo: 'CHAR(2)', obrigatorio: true },
      { nome: 'cep', tipo: 'VARCHAR(8)', obrigatorio: true },
    ],
  },
  {
    slug: 'pedido',
    nome: 'Pedido',
    descricao: 'Compra efetuada por um cliente em um dado momento.',
    atributos: [
      { nome: 'id', tipo: 'UUID', obrigatorio: true, chavePrimaria: true },
      { nome: 'cliente_id', tipo: 'UUID', obrigatorio: true },
      { nome: 'data_pedido', tipo: 'TIMESTAMP', obrigatorio: true },
      { nome: 'valor_total', tipo: 'NUMERIC(12,2)', obrigatorio: true },
      { nome: 'status', tipo: 'VARCHAR(30)', obrigatorio: true },
    ],
  },
  {
    slug: 'item_pedido',
    nome: 'ItemPedido',
    descricao: 'Produto e quantidade que compõem um pedido.',
    atributos: [
      { nome: 'id', tipo: 'UUID', obrigatorio: true, chavePrimaria: true },
      { nome: 'pedido_id', tipo: 'UUID', obrigatorio: true },
      { nome: 'produto_id', tipo: 'UUID', obrigatorio: true },
      { nome: 'quantidade', tipo: 'INTEGER', obrigatorio: true },
      { nome: 'preco_unitario', tipo: 'NUMERIC(12,2)', obrigatorio: true },
    ],
  },
  {
    slug: 'produto',
    nome: 'Produto',
    descricao: 'Item disponível para venda no catálogo.',
    atributos: [
      { nome: 'id', tipo: 'UUID', obrigatorio: true, chavePrimaria: true },
      { nome: 'nome', tipo: 'VARCHAR(150)', obrigatorio: true },
      { nome: 'preco', tipo: 'NUMERIC(12,2)', obrigatorio: true },
      { nome: 'ativo', tipo: 'BOOLEAN', obrigatorio: true },
    ],
  },
];

const RELACIONAMENTOS_SEED: SeedRelacionamento[] = [
  { origem: 'cliente', destino: 'pedido',      tipo: 'UM_PARA_MUITOS', atributoFk: 'cliente_id' },
  { origem: 'cliente', destino: 'endereco',    tipo: 'UM_PARA_MUITOS', atributoFk: 'cliente_id' },
  { origem: 'pedido',  destino: 'item_pedido', tipo: 'UM_PARA_MUITOS', atributoFk: 'pedido_id' },
  { origem: 'produto', destino: 'item_pedido', tipo: 'UM_PARA_MUITOS', atributoFk: 'produto_id' },
];

/**
 * Impactos de demonstração, na ordem em que são aplicados aos requisitos do
 * projeto. O índice aponta para a posição do requisito na listagem ordenada
 * por código — assim o cenário se acomoda a qualquer base de requisitos.
 *
 * Os dois primeiros e o quarto tocam a entidade `Cliente` de propósito: são
 * eles que produzem os vínculos INDIRETOS da matriz de rastreabilidade.
 */
const IMPACTOS_SEED: Array<{
  indiceRequisito: number;
  entidade: string;
  atributo: string;
  tipoOperacao: ImpactoDadosAPI['tipoOperacao'];
  valorAnterior: string | null;
  valorNovo: string;
}> = [
  {
    indiceRequisito: 0,
    entidade: 'cliente',
    atributo: 'cpf',
    tipoOperacao: 'ADICAO_ATRIBUTO',
    valorAnterior: null,
    valorNovo: 'VARCHAR(11) NOT NULL',
  },
  {
    indiceRequisito: 1,
    entidade: 'cliente',
    atributo: 'email',
    tipoOperacao: 'ALTERACAO_ATRIBUTO',
    valorAnterior: 'VARCHAR(100) NULL',
    valorNovo: 'VARCHAR(150) NOT NULL',
  },
  {
    indiceRequisito: 2,
    entidade: 'pedido',
    atributo: 'status',
    tipoOperacao: 'ADICAO_ATRIBUTO',
    valorAnterior: null,
    valorNovo: 'VARCHAR(30) NOT NULL',
  },
  {
    indiceRequisito: 3,
    entidade: 'cliente',
    atributo: 'data_nascimento',
    tipoOperacao: 'ADICAO_ATRIBUTO',
    valorAnterior: null,
    valorNovo: 'DATE NULL',
  },
];

/**
 * Monta o modelo de dados de demonstração para um projeto.
 *
 * @param projetoId  projeto ao qual as entidades pertencem
 * @param requisitoIds ids dos requisitos do projeto, ordenados por código;
 *                     os impactos são distribuídos entre os primeiros deles
 */
export function criarModeloSeed(projetoId: string, requisitoIds: string[]): ModeloDadosProjeto {
  const idEntidade = (slug: string) => `${projetoId}:ent:${slug}`;
  const idAtributo = (slug: string, atributo: string) => `${projetoId}:atr:${slug}.${atributo}`;

  const entidades: EntidadeDadosAPI[] = ENTIDADES_SEED.map((e) => ({
    id: idEntidade(e.slug),
    projetoId,
    nome: e.nome,
    descricao: e.descricao,
  }));

  const atributos: AtributoEntidadeAPI[] = ENTIDADES_SEED.flatMap((e) =>
    e.atributos.map((a) => ({
      id: idAtributo(e.slug, a.nome),
      entidadeId: idEntidade(e.slug),
      nome: a.nome,
      tipo: a.tipo,
      obrigatorio: a.obrigatorio,
      chavePrimaria: a.chavePrimaria ?? false,
    })),
  );

  const relacionamentos: RelacionamentoEntidadeAPI[] = RELACIONAMENTOS_SEED.map((r, i) => ({
    id: `${projetoId}:rel:${i}`,
    entidadeOrigemId: idEntidade(r.origem),
    entidadeDestinoId: idEntidade(r.destino),
    tipo: r.tipo,
    atributoFk: r.atributoFk,
  }));

  const impactos: ImpactoDadosAPI[] = IMPACTOS_SEED.filter(
    (i) => i.indiceRequisito < requisitoIds.length,
  ).map((i, indice) => ({
    id: `${projetoId}:imp:${indice}`,
    requisitoId: requisitoIds[i.indiceRequisito],
    entidadeId: idEntidade(i.entidade),
    atributoId: idAtributo(i.entidade, i.atributo),
    tipoOperacao: i.tipoOperacao,
    valorAnterior: i.valorAnterior,
    valorNovo: i.valorNovo,
  }));

  return { entidades, atributos, relacionamentos, impactos };
}
