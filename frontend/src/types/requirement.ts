import type { DadosAuditoria } from './common';

export type StatusRequisito =
  | 'RASCUNHO'
  | 'EM_ANALISE'
  | 'EM_VALIDACAO'
  | 'APROVADO'
  | 'REPROVADO'
  | 'VALIDADO';

export type TipoRequisito = 'FUNCIONAL' | 'NAO_FUNCIONAL';

export interface RequisitoVoto {
  userId: string | number;
  userName: string;
  voto: 'APROVADO' | 'REPROVADO' | null;
  votadoEm?: string;
}

export interface VersaoRequisito {
  versao: string;
  data: string;
  changedBy: string;
  descricaoMudanca: string;
  statusAnterior?: StatusRequisito;
  statusNovo?: StatusRequisito;
}

export interface Requisito extends DadosAuditoria {
  titulo: string;
  descricao: string;
  tipo: TipoRequisito;
  status: StatusRequisito;
  versao: string;
  projetoId: number;
  totalComentarios?: number;
  votos?: RequisitoVoto[];
  totalStakeholders?: number;
  historico?: VersaoRequisito[];
}
