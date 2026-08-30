import type {
  AtributoEntidadeAPI,
  DiffEntidade,
  ImpactoDadosAPI,
  LinhaDiffAtributo,
  ModeloDadosProjeto,
  TipoOperacaoImpacto,
} from '../types/dataModel';

/**
 * Projeções do modelo de dados usadas pelas telas: o diff "estado atual x
 * estado proposto" de um requisito e a geração do diagrama ER.
 *
 * Convenção do diff: o modelo persistido representa o estado PROPOSTO (o mais
 * recente). O estado ATUAL é reconstruído revertendo os impactos do requisito
 * — é para isso que `ImpactoDados` guarda `valor_anterior` e `valor_novo`,
 * mesmo princípio já adotado no módulo de auditoria.
 */

/** Assinatura textual de um atributo, no formato exibido no diff. */
export function assinaturaAtributo(atributo: AtributoEntidadeAPI): string {
  return `${atributo.tipo} ${atributo.obrigatorio ? 'NOT NULL' : 'NULL'}`;
}

export const ROTULOS_OPERACAO: Record<TipoOperacaoImpacto, string> = {
  CRIACAO_ENTIDADE: 'Criação de entidade',
  ADICAO_ATRIBUTO: 'Adição de atributo',
  ALTERACAO_ATRIBUTO: 'Alteração de atributo',
  REMOCAO_ATRIBUTO: 'Remoção de atributo',
};

export const CORES_OPERACAO: Record<TipoOperacaoImpacto, string> = {
  CRIACAO_ENTIDADE: '#7C3AED',
  ADICAO_ATRIBUTO: '#16A34A',
  ALTERACAO_ATRIBUTO: '#D97706',
  REMOCAO_ATRIBUTO: '#DC2626',
};

/**
 * Monta o diff de todas as entidades tocadas por um requisito.
 * Uma entrada por entidade, na ordem em que os impactos foram registrados.
 */
export function construirDiff(modelo: ModeloDadosProjeto, requisitoId: string): DiffEntidade[] {
  const impactosDoRequisito = modelo.impactos.filter((i) => i.requisitoId === requisitoId);
  if (impactosDoRequisito.length === 0) return [];

  const atributoPorId = new Map(modelo.atributos.map((a) => [a.id, a]));
  const entidadeIds = [...new Set(impactosDoRequisito.map((i) => i.entidadeId))];

  return entidadeIds.flatMap((entidadeId) => {
    const entidade = modelo.entidades.find((e) => e.id === entidadeId);
    if (!entidade) return [];

    const impactos = impactosDoRequisito.filter((i) => i.entidadeId === entidadeId);
    const entidadeNova = impactos.some((i) => i.tipoOperacao === 'CRIACAO_ENTIDADE');

    const atributosDaEntidade = modelo.atributos.filter((a) => a.entidadeId === entidadeId);
    const linhas = new Map<string, LinhaDiffAtributo>();

    // Base: estado proposto (o que está gravado no modelo hoje).
    for (const atributo of atributosDaEntidade) {
      const assinatura = assinaturaAtributo(atributo);
      linhas.set(atributo.id, {
        nome: atributo.nome,
        atual: entidadeNova ? null : assinatura,
        proposto: assinatura,
        situacao: entidadeNova ? 'ADICIONADO' : 'INALTERADO',
      });
    }

    // Reversão: cada impacto reconstrói como o atributo estava antes.
    for (const impacto of impactos) {
      aplicarImpactoNoDiff(impacto, linhas, atributoPorId);
    }

    return [{ entidade, linhas: [...linhas.values()], entidadeNova }];
  });
}

function aplicarImpactoNoDiff(
  impacto: ImpactoDadosAPI,
  linhas: Map<string, LinhaDiffAtributo>,
  atributoPorId: Map<string, AtributoEntidadeAPI>,
): void {
  if (impacto.tipoOperacao === 'CRIACAO_ENTIDADE' || !impacto.atributoId) return;

  const atributo = atributoPorId.get(impacto.atributoId);
  const chave = impacto.atributoId;
  const nome = atributo?.nome ?? 'atributo';
  const propostoAtual = atributo ? assinaturaAtributo(atributo) : impacto.valorNovo;

  switch (impacto.tipoOperacao) {
    case 'ADICAO_ATRIBUTO':
      linhas.set(chave, {
        nome,
        atual: null,
        proposto: impacto.valorNovo ?? propostoAtual,
        situacao: 'ADICIONADO',
      });
      break;
    case 'ALTERACAO_ATRIBUTO':
      linhas.set(chave, {
        nome,
        atual: impacto.valorAnterior,
        proposto: impacto.valorNovo ?? propostoAtual,
        situacao: 'ALTERADO',
      });
      break;
    case 'REMOCAO_ATRIBUTO':
      linhas.set(chave, {
        nome,
        atual: impacto.valorAnterior ?? propostoAtual,
        proposto: null,
        situacao: 'REMOVIDO',
      });
      break;
  }
}

// ── Diagrama ER ────────────────────────────────────────────────────────────

/** Remove os sinais diacríticos, mantendo apenas as letras-base. */
function removerAcentos(texto: string): string {
  const COMBINANTES_INICIO = 0x0300;
  const COMBINANTES_FIM = 0x036f;
  return [...texto.normalize('NFD')]
    .filter((caractere) => {
      const codigo = caractere.codePointAt(0) ?? 0;
      return codigo < COMBINANTES_INICIO || codigo > COMBINANTES_FIM;
    })
    .join('');
}

/** Nome de entidade no formato aceito pelo Mermaid (sem espaços ou acentos). */
function nomeMermaid(nome: string): string {
  return removerAcentos(nome)
    .replace(/[^A-Za-z0-9_]/g, '_')
    .toUpperCase();
}

/** Tipos como `NUMERIC(12,2)` precisam perder espaços para o parser do Mermaid. */
function tipoMermaid(tipo: string): string {
  return tipo.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_(),[\]]/g, '');
}

const CARDINALIDADE_MERMAID: Record<string, string> = {
  UM_PARA_UM: '||--||',
  UM_PARA_MUITOS: '||--o{',
  MUITOS_PARA_MUITOS: '}o--o{',
};

export interface OpcoesDiagrama {
  /** Restringe o diagrama a estas entidades e às suas vizinhas diretas. */
  entidadesEmFoco?: string[];
  /** Omite a lista de atributos, deixando apenas as caixas e as ligações. */
  somenteEstrutura?: boolean;
}

/**
 * Gera o código `erDiagram` do Mermaid a partir do estado atual do modelo.
 * O diagrama é derivado a cada render — não há artefato salvo para
 * desatualizar.
 */
export function gerarErDiagram(modelo: ModeloDadosProjeto, opcoes: OpcoesDiagrama = {}): string {
  const { entidadesEmFoco, somenteEstrutura = false } = opcoes;

  let entidades = modelo.entidades;
  let relacionamentos = modelo.relacionamentos;

  if (entidadesEmFoco && entidadesEmFoco.length > 0) {
    const foco = new Set(entidadesEmFoco);
    relacionamentos = modelo.relacionamentos.filter(
      (r) => foco.has(r.entidadeOrigemId) || foco.has(r.entidadeDestinoId),
    );
    const visiveis = new Set(foco);
    for (const relacionamento of relacionamentos) {
      visiveis.add(relacionamento.entidadeOrigemId);
      visiveis.add(relacionamento.entidadeDestinoId);
    }
    entidades = modelo.entidades.filter((e) => visiveis.has(e.id));
  }

  const nomePorId = new Map(entidades.map((e) => [e.id, nomeMermaid(e.nome)]));
  const linhas: string[] = ['erDiagram'];

  for (const relacionamento of relacionamentos) {
    const origem = nomePorId.get(relacionamento.entidadeOrigemId);
    const destino = nomePorId.get(relacionamento.entidadeDestinoId);
    if (!origem || !destino) continue;
    const cardinalidade = CARDINALIDADE_MERMAID[relacionamento.tipo] ?? '||--o{';
    const rotulo = relacionamento.atributoFk ?? 'relaciona';
    linhas.push(`    ${origem} ${cardinalidade} ${destino} : "${rotulo}"`);
  }

  for (const entidade of entidades) {
    const nome = nomePorId.get(entidade.id) as string;
    if (somenteEstrutura) {
      linhas.push(`    ${nome} {`, '    }');
      continue;
    }

    const chavesEstrangeiras = new Set(
      modelo.relacionamentos
        .filter((r) => r.entidadeDestinoId === entidade.id && r.atributoFk)
        .map((r) => r.atributoFk as string),
    );

    linhas.push(`    ${nome} {`);
    for (const atributo of modelo.atributos.filter((a) => a.entidadeId === entidade.id)) {
      const marcador = atributo.chavePrimaria
        ? ' PK'
        : chavesEstrangeiras.has(atributo.nome)
          ? ' FK'
          : '';
      linhas.push(`        ${tipoMermaid(atributo.tipo)} ${atributo.nome}${marcador}`);
    }
    linhas.push('    }');
  }

  return linhas.join('\n');
}

/** Nome no formato do diagrama — usado para destacar a entidade em foco no SVG. */
export function idEntidadeNoDiagrama(nome: string): string {
  return nomeMermaid(nome);
}
