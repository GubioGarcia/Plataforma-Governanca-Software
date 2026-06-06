export type ModuloInteracao = 'WIKI' | 'REQUISITO' | 'COMENTARIO' | 'EVENTO';
export type TipoInteracao =
  | 'CRIACAO'
  | 'EDICAO'
  | 'EXCLUSAO'
  | 'APROVACAO'
  | 'REPROVACAO'
  | 'COMENTARIO'
  | 'MUDANCA_STATUS';

export interface InteracaoAPI {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioUrlFoto: string | null;
  projetoId: string;
  modulo: ModuloInteracao;
  tipo: TipoInteracao;
  entidadeId: string | null;
  descricao: string | null;
  dataInteracao: string;
}

export interface ResumoInteracaoUsuario {
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioUrlFoto: string | null;
  totalInteracoes: number;
  interacoesWiki: number;
  interacoesRequisito: number;
  interacoesComentario: number;
  interacoesEvento: number;
}

export interface ResumoInteracaoProjeto {
  totalInteracoes: number;
  totalMembros: number;
  interacoesPorModulo: Record<string, number>;
  porUsuario: ResumoInteracaoUsuario[];
}
