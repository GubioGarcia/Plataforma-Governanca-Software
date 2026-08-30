import type { EntidadeDadosAPI, ImpactoDadosAPI } from '../types/dataModel';
import type {
  CelulaMatriz,
  RelacaoRequisito,
  RequisitoImpactado,
  VinculoRequisitoAPI,
} from '../types/traceability';

/**
 * Núcleo da matriz de rastreabilidade e da análise de impacto.
 *
 * As relações são recalculadas a cada leitura, nunca materializadas: é o
 * equivalente, em memória, à consulta `WITH RECURSIVE` que o backend
 * executará sobre `vinculo_requisito` e `impacto_dados`. Por isso a matriz
 * jamais fica desatualizada — não existe etapa de recomputo que possa ficar
 * atrás do estado real dos requisitos.
 *
 * Duas camadas de aresta compõem o grafo:
 *  - DIRETA:   um `VinculoRequisito` cadastrado manualmente pelo usuário;
 *  - INDIRETA: dois requisitos com `ImpactoDados` sobre a mesma
 *              `EntidadeDados` — resultado de uma junção, não de um cadastro.
 */

export function chaveCelula(origemId: string, destinoId: string): string {
  return `${origemId}|${destinoId}`;
}

/** Deriva as relações indiretas: requisitos que compartilham entidade de dados. */
export function derivarRelacoesIndiretas(
  impactos: ImpactoDadosAPI[],
  entidades: EntidadeDadosAPI[],
): RelacaoRequisito[] {
  const nomePorEntidade = new Map(entidades.map((e) => [e.id, e.nome]));

  // requisitoId -> entidades que ele toca
  const entidadesPorRequisito = new Map<string, Set<string>>();
  for (const impacto of impactos) {
    const atual = entidadesPorRequisito.get(impacto.requisitoId) ?? new Set<string>();
    atual.add(impacto.entidadeId);
    entidadesPorRequisito.set(impacto.requisitoId, atual);
  }

  const requisitos = [...entidadesPorRequisito.keys()];
  const relacoes: RelacaoRequisito[] = [];

  for (let i = 0; i < requisitos.length; i += 1) {
    for (let j = i + 1; j < requisitos.length; j += 1) {
      const a = requisitos[i];
      const b = requisitos[j];
      const compartilhadas = [...(entidadesPorRequisito.get(a) as Set<string>)]
        .filter((entidadeId) => entidadesPorRequisito.get(b)?.has(entidadeId))
        .map((entidadeId) => nomePorEntidade.get(entidadeId) ?? entidadeId)
        .sort();

      if (compartilhadas.length === 0) continue;

      // A relação indireta é simétrica: registrada nos dois sentidos para que
      // a matriz fique espelhada e a travessia encontre o caminho em ambos.
      relacoes.push({ origemId: a, destinoId: b, origem: 'INDIRETO', entidadesCompartilhadas: compartilhadas });
      relacoes.push({ origemId: b, destinoId: a, origem: 'INDIRETO', entidadesCompartilhadas: compartilhadas });
    }
  }

  return relacoes;
}

export function derivarRelacoesDiretas(vinculos: VinculoRequisitoAPI[]): RelacaoRequisito[] {
  return vinculos.map((v) => ({
    origemId: v.requisitoOrigemId,
    destinoId: v.requisitoDestinoId,
    origem: 'DIRETO' as const,
    tipo: v.tipo,
    vinculoId: v.id,
  }));
}

/** Todas as arestas do grafo de rastreabilidade do projeto. */
export function construirRelacoes(
  vinculos: VinculoRequisitoAPI[],
  impactos: ImpactoDadosAPI[],
  entidades: EntidadeDadosAPI[],
): RelacaoRequisito[] {
  return [...derivarRelacoesDiretas(vinculos), ...derivarRelacoesIndiretas(impactos, entidades)];
}

/**
 * Indexa as relações por célula (origem × destino) para renderizar a matriz.
 * Uma célula pode acumular a relação direta e a indireta ao mesmo tempo.
 */
export function construirMatriz(relacoes: RelacaoRequisito[]): Map<string, CelulaMatriz> {
  const matriz = new Map<string, CelulaMatriz>();

  for (const relacao of relacoes) {
    const chave = chaveCelula(relacao.origemId, relacao.destinoId);
    const celula = matriz.get(chave) ?? {};
    if (relacao.origem === 'DIRETO') celula.relacaoDireta = relacao;
    else celula.relacaoIndireta = relacao;
    matriz.set(chave, celula);
  }

  return matriz;
}

/**
 * Análise de impacto: percorre o grafo em largura a partir de um requisito e
 * devolve todos os alcançáveis, com a distância em saltos.
 *
 * A travessia é não direcionada — alterar um requisito interessa tanto a quem
 * depende dele quanto a quem ele depende (o "subir e descer o grafo" do
 * enunciado). O primeiro caminho encontrado é o mais curto, propriedade da
 * busca em largura.
 */
export function analisarImpacto(
  requisitoOrigemId: string,
  relacoes: RelacaoRequisito[],
  maxSaltos = 3,
): RequisitoImpactado[] {
  const adjacencia = new Map<string, RelacaoRequisito[]>();
  for (const relacao of relacoes) {
    const vizinhos = adjacencia.get(relacao.origemId) ?? [];
    vizinhos.push(relacao);
    adjacencia.set(relacao.origemId, vizinhos);

    // Arestas diretas também são navegáveis no sentido inverso.
    if (relacao.origem === 'DIRETO') {
      const inversos = adjacencia.get(relacao.destinoId) ?? [];
      inversos.push({ ...relacao, origemId: relacao.destinoId, destinoId: relacao.origemId });
      adjacencia.set(relacao.destinoId, inversos);
    }
  }

  const visitados = new Set<string>([requisitoOrigemId]);
  const resultado: RequisitoImpactado[] = [];
  let fronteira: Array<{ id: string; caminho: string[] }> = [
    { id: requisitoOrigemId, caminho: [requisitoOrigemId] },
  ];

  for (let salto = 1; salto <= maxSaltos && fronteira.length > 0; salto += 1) {
    const proxima: Array<{ id: string; caminho: string[] }> = [];

    for (const no of fronteira) {
      for (const relacao of adjacencia.get(no.id) ?? []) {
        if (visitados.has(relacao.destinoId)) continue;
        visitados.add(relacao.destinoId);

        const caminho = [...no.caminho, relacao.destinoId];
        resultado.push({
          requisitoId: relacao.destinoId,
          saltos: salto,
          origem: relacao.origem,
          caminho,
          tipo: relacao.tipo,
          entidadesCompartilhadas: relacao.entidadesCompartilhadas,
        });
        proxima.push({ id: relacao.destinoId, caminho });
      }
    }

    fronteira = proxima;
  }

  return resultado;
}

export const ROTULOS_TIPO_VINCULO: Record<string, string> = {
  DEPENDE_DE: 'Depende de',
  IMPACTA: 'Impacta',
  DUPLICA: 'Duplica',
  CONFLITA: 'Conflita com',
};

/** Sigla exibida dentro da célula da matriz. */
export const SIGLAS_TIPO_VINCULO: Record<string, string> = {
  DEPENDE_DE: 'DEP',
  IMPACTA: 'IMP',
  DUPLICA: 'DUP',
  CONFLITA: 'CFL',
};

export const CORES_TIPO_VINCULO: Record<string, string> = {
  DEPENDE_DE: '#3B82F6',
  IMPACTA: '#EA580C',
  DUPLICA: '#7C3AED',
  CONFLITA: '#DC2626',
};
