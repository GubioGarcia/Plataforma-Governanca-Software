// ── Tipos da feature de Comentários ──────────────────────────────────────────
// Centralizados aqui para que qualquer tela que use comentários (Requisito,
// Wiki, etc.) importe deste único lugar.

/** Comentário retornado pela API */
export interface ComentarioAPI {
  id: string;
  conteudo: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioAvatarUrl: string | null;
  entidadeTipo: string;   // 'REQUISITO' | 'WIKI' | ...
  entidadeId: string;
  organizacaoId: string;
  projetoId: string;
  ativo: boolean;
  editado: boolean;       // true se o conteúdo já foi editado ao menos uma vez
  dataCriacao: string;    // ISO timestamp
  dataAtualizacao: string;
}

/** Payload de criação */
export interface CriarComentarioPayload {
  conteudo: string;
  entidadeTipo: string;
  entidadeId: string;
  projetoId: string;
  organizacaoId: string;
}

/** Payload de edição */
export interface AtualizarComentarioPayload {
  conteudo: string;
}
