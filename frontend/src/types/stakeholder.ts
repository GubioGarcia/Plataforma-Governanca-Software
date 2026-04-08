import type { DadosAuditoria } from './common';

export type PapelProjeto = 'GESTOR' | 'STAKEHOLDER' | 'ANALISTA';

export interface StakeholderProjeto extends DadosAuditoria {
  projetoId: number;
  userId: number;
  userName: string;
  userEmail: string;
  empresa?: string;
  papel: PapelProjeto;
  totalInteracoes?: number;
  interacoesWiki?: number;
  interacoesRequisitos?: number;
}
