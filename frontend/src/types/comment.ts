/**
 * @deprecated Importe de `../../features/comments` (ou `../features/comments`)
 * Esta reexportação existe apenas para compatibilidade com código legado (mocks).
 */
export type { ComentarioAPI, CriarComentarioPayload, AtualizarComentarioPayload } from '../features/comments/types';

export interface Comentario {
  id: number;
  texto: string;
  userId: number;
  userName: string;
  requisitoId: number;
  createdAt: string;
  updatedAt: string;
}
