/** Página de resultados da API (número a partir de 0). */
export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  total: number;
  totalPaginas: number;
}

/** GET /api/admin/resumo — só contagens (as contas de admin não entram). */
export interface ResumoAdmin {
  usuariosAtivos: number;
  usuariosInativos: number;
  organizacoes: number;
  projetos: number;
  requisitosPorStatus: Record<string, number>;
  solicitacoesPendentes: number;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  dataCriacao: string;
  adminPlataforma: boolean;
  /** A conta de quem está consultando. */
  propria: boolean;
}

/** Status de projeto ou de requisito. `sistema`: usado pelas regras, nome fixo e sem exclusão. */
export interface StatusReferencia {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  sistema: boolean;
}

export interface PrioridadeReferencia {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

// ── Pesquisa do TCC (painel) ─────────────────────────────────────────────────

export interface DistribuicaoPesquisa {
  n: number;
  /** [quantos marcaram 1, ..., quantos marcaram 5] */
  distribuicao: number[];
  mediana: number | null;
}

export interface ItemResumoPesquisa {
  numero: number;
  textoAntes: string;
  textoDepois: string;
  antes: DistribuicaoPesquisa;
  depois: DistribuicaoPesquisa;
  /** Só quem respondeu as duas etapas; diferença = depois − antes. */
  pareado: { n: number; medianaDiferenca: number | null; melhoraram: number; iguais: number; pioraram: number };
}

export interface ContagemPesquisa {
  valor: string;
  rotulo: string;
  quantidade: number;
}

export interface ResumoPesquisa {
  coletaAberta: boolean;
  abertaEm: string | null;
  encerradaEm: string | null;
  intervaloMinimoMin: number;
  participantes: number;
  recusas: number;
  retiradas: number;
  antesRespondidos: number;
  depoisRespondidos: number;
  paresCompletos: number;
  itens: ItemResumoPesquisa[];
  funcoes: ContagemPesquisa[];
  temposExperiencia: ContagemPesquisa[];
  ferramentas: ContagemPesquisa[];
}

export interface RespostaAbertaPesquisa {
  codigo: string;
  etapa: 'ANTES' | 'DEPOIS';
  texto: string;
  respondidaEm: string;
}
