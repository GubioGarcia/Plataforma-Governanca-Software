import api from '../../config/axios';
import type {
  ComentarioAPI,
  CriarComentarioPayload,
  AtualizarComentarioPayload,
} from './types';

/**
 * Lista comentários ativos de uma entidade.
 * O par (entidadeTipo + entidadeId) garante o isolamento por entidade.
 */
export async function listarComentarios(
  entidadeTipo: string,
  entidadeId: string,
): Promise<ComentarioAPI[]> {
  const res = await api.get<ComentarioAPI[]>('/comentario', {
    params: { entidadeTipo, entidadeId },
  });
  return res.data;
}

/** Cria um novo comentário vinculado à entidade. */
export async function criarComentario(
  payload: CriarComentarioPayload,
): Promise<ComentarioAPI> {
  const res = await api.post<ComentarioAPI>('/comentario', payload);
  return res.data;
}

/**
 * Edita o conteúdo de um comentário existente.
 * Apenas o autor pode editar — o backend valida.
 */
export async function editarComentario(
  id: string,
  payload: AtualizarComentarioPayload,
): Promise<ComentarioAPI> {
  const res = await api.patch<ComentarioAPI>(`/comentario/${id}`, payload);
  return res.data;
}

/**
 * Soft-delete de um comentário.
 * Apenas o autor pode excluir, e somente se não houver comentários posteriores.
 */
export async function deletarComentario(id: string): Promise<void> {
  await api.delete(`/comentario/${id}`);
}
