export type AcaoAuditoria = 'CRIACAO' | 'EDICAO' | 'EXCLUSAO';

export interface AuditoriaAPI {
  id: string;
  organizacaoId: string | null;
  projetoId: string | null;
  entidadeTipo: string;
  entidadeId: string;
  acao: AcaoAuditoria;
  campoAlterado: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  usuarioAvatarUrl: string | null;
  dataAlteracao: string;
}

export interface CriarAuditoriaPayload {
  organizacaoId?: string;
  projetoId?: string;
  entidadeTipo: string;
  entidadeId: string;
  acao: AcaoAuditoria;
  campoAlterado: string;
  valorAnterior?: string;
  valorNovo?: string;
}

export interface AtualizarAuditoriaPayload {
  campoAlterado?: string;
  valorAnterior?: string;
  valorNovo?: string;
}
