import type { DadosAuditoria } from './common';

export type StatusWikiSection =
  | 'RASCUNHO'
  | 'EM_VALIDACAO'
  | 'APROVADO'
  | 'REPROVADO'
  | 'VALIDADO';

export interface WikiVoto {
  userId: number;
  userName: string;
  userAvatar?: string;
  voto: 'APROVADO' | 'REPROVADO' | null;
  votadoEm?: string;
}

export interface WikiSection {
  status: StatusWikiSection;
  conteudo: string;
  totalStakeholders: number;
  aprovacoes: number;
  reprovacoes: number;
  votos: WikiVoto[];
}

export interface WikiProjeto extends DadosAuditoria {
  projetoId: number;
  objetivo: WikiSection;
  objetivosEspecificos: WikiSection;
  kpis: WikiSection;
  restricoes: WikiSection;
  stakeholderParticipacao: number;
}
