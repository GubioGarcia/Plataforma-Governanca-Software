import type { DadosAuditoria } from './common';

export type StatusProjeto =
  | 'PLANEJAMENTO'
  | 'EM_DESENVOLVIMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export interface Projeto extends DadosAuditoria {
  name: string;
  description: string;
  status: StatusProjeto;
  organizacaoId: number;
  totalRequisitos?: number;
  requisitosAprovados?: number;
  totalStakeholders?: number;
}
