import type { DadosAuditoria } from './common';

export type PlanoOrganizacao = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface Organizacao extends DadosAuditoria {
  name: string;
  description: string;
  plano: PlanoOrganizacao;
  totalProjetos?: number;
  totalMembros?: number;
}
