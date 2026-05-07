export type TipoRequisito = 'FUNCIONAL' | 'NAO_FUNCIONAL' | 'REGRA_NEGOCIO' | 'TECNICO';

export interface StatusRequisitoAPI {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
}

export interface PrioridadeAPI {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

export interface RequisitoAPI {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  tipoRequisito: TipoRequisito;
  statusId: string | null;
  statusNome: string | null;
  prioridadeId: string | null;
  prioridadeNome: string | null;
  versao: number;
  criadoPorId: string | null;
  criadoPorNome: string | null;
  solicitadoPorId: string | null;
  solicitadoPorNome: string | null;
  aprovadoPorId: string | null;
  aprovadoPorNome: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
  dataSolicitacao: string | null;
  dataAprovacao: string | null;
}

export interface CriterioAceiteAPI {
  id: string;
  nome: string;
  descricao: string;
  requisitoId: string;
  criadoPorNome: string | null;
  criadoPorId: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface CriarRequisitoPayload {
  titulo: string;
  descricao: string;
  tipoRequisito: TipoRequisito;
  statusId?: string;
  prioridadeId?: string;
}

export interface AtualizarRequisitoPayload {
  titulo?: string;
  descricao?: string;
  tipoRequisito?: TipoRequisito;
  statusId?: string;
  prioridadeId?: string;
}

export interface CriarCriterioAceitePayload {
  nome: string;
  descricao: string;
}
