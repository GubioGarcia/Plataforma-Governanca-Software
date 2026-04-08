export type TipoEntidadeAuditoria =
  | 'PROJETO'
  | 'WIKI'
  | 'REQUISITO'
  | 'COMENTARIO'
  | 'EVENTO'
  | 'ARQUIVO'
  | 'STAKEHOLDER';

export type AcaoAuditoria =
  | 'CRIADO'
  | 'ATUALIZADO'
  | 'EXCLUIDO'
  | 'STATUS_ALTERADO'
  | 'APROVADO'
  | 'REPROVADO'
  | 'VALIDADO';

export interface Auditoria {
  id: number;
  projetoId?: number;
  entityId: number;
  entityType: TipoEntidadeAuditoria;
  acao: AcaoAuditoria;
  userId: number;
  userName: string;
  descricao: string;
  data: string;
}
