// Tipos do GET /api/auth/me — onde o usuário atua e o que pode fazer em cada lugar.
// Os nomes das permissões são os mesmos do backend (enum Permissao) e do realm do Keycloak.

export const PERMISSOES = [
  // Organização
  'ORG_CREATE_PROJECT', 'ORG_EDIT', 'ORG_INATIVAR', 'ORG_DELETE',
  'ORG_INVITE_USER', 'ORG_VIEW_USERS', 'ORG_PROMOTE_USER', 'ORG_REMOVE_USER',
  // Projeto
  'PROJETO_EDIT', 'PROJETO_INATIVAR', 'PROJETO_DELETE',
  'PROJETO_VIEW_USERS', 'PROJETO_INVITE_USER', 'PROJETO_PROMOTE_USER', 'PROJETO_REMOVE_USER',
  // Requisitos
  'REQ_CREATE', 'REQ_EDIT', 'REQ_DELETE', 'REQ_VIEW', 'REQ_COMMENT', 'REQ_APPROVE',
  'REQ_REQUEST_APPROVAL', 'REQ_REQUEST_REJECTION', 'REQ_REQUEST_CHANGE',
  // Wiki
  'WIKI_VIEW', 'WIKI_EDIT', 'WIKI_COMMENT',
  // Eventos
  'EVENTO_VIEW', 'EVENTO_CREATE', 'EVENTO_EDIT', 'EVENTO_DELETE', 'EVENTO_APPROVE', 'EVENTO_REQUEST',
  // Arquivos
  'ARQUIVO_VIEW', 'ARQUIVO_DOWNLOAD', 'ARQUIVO_UPLOAD', 'ARQUIVO_DELETE',
  // Analytics e auditoria
  'ANALYTICS_VIEW', 'AUDIT_VIEW', 'AUDIT_HISTORICO_VIEW',
  // Modelagem de dados
  'MER_VIEW', 'MER_EDIT', 'MER_EXPORT', 'MER_EXPORT_REQUEST',
  // Rastreabilidade
  'RASTREABILIDADE_VIEW', 'RASTREABILIDADE_EDIT', 'RASTREABILIDADE_EXPORT', 'RASTREABILIDADE_EXPORT_REQUEST',
  // Solicitações e plataforma
  'SOLICITACAO_RESPONDER', 'REF_DATA_EDIT',
] as const;

export type Permissao = typeof PERMISSOES[number];

export type PapelOrganizacao = 'DONO' | 'GESTOR' | 'MEMBRO';
export type PapelNoProjeto = 'DONO' | 'GESTOR' | 'STAKEHOLDER_TECNICO' | 'STAKEHOLDER_CLIENTE';

export interface ProjetoAcesso {
  id: string;
  nome: string;
  ativo: boolean;
  papeis: PapelNoProjeto[];
  permissoes: Permissao[];
}

export interface OrganizacaoAcesso {
  id: string;
  nome: string;
  ativo: boolean;
  /** null quando o usuário só participa de projetos da organização (convidado). */
  papel: PapelOrganizacao | null;
  permissoes: Permissao[];
  projetos: ProjetoAcesso[];
}

export interface MeResponse {
  id: string;
  externalIdentityId: string;
  nome: string;
  email: string;
  ativo: boolean;
  dataCriacao: string;
  urlMidiaPerfil: string | null;
  adminPlataforma: boolean;
  organizacoes: OrganizacaoAcesso[];
}

export const PAPEL_ORGANIZACAO_LABEL: Record<PapelOrganizacao, string> = {
  DONO: 'Dono',
  GESTOR: 'Gestor',
  MEMBRO: 'Membro',
};

export const PAPEL_PROJETO_LABEL: Record<PapelNoProjeto, string> = {
  DONO: 'Dono',
  GESTOR: 'Gestor',
  STAKEHOLDER_TECNICO: 'Stakeholder Técnico',
  STAKEHOLDER_CLIENTE: 'Stakeholder Cliente',
};
