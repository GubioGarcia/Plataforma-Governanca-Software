import type { DadosAuditoria } from './common';

export interface Comentario extends DadosAuditoria {
  texto: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  requisitoId: number;
}
