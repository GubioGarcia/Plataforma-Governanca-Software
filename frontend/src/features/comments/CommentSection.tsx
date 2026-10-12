import { useState, useEffect, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckIcon from '@mui/icons-material/Check';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useAuth } from '../../context/useAuth';
import { useSnackbar } from '../../context/SnackbarContext';
import { extractApiErrorMessage } from '../../utils/apiError';
import {
  listarComentarios,
  criarComentario,
  editarComentario,
  deletarComentario,
} from './commentService';
import type { ComentarioAPI } from './types';

const MAX_COMENTARIO = 2000;

/** Mesmo esquema do card "Alterações": 4 registros por página. */
const PAGE_SIZE = 4;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CommentSectionProps {
  /** Tipo da entidade dona dos comentários. Ex: 'REQUISITO', 'WIKI' */
  entidadeTipo: string;
  /** UUID da entidade dona dos comentários */
  entidadeId: string;
  /** UUID do projeto */
  projetoId: string;
  /** UUID da organização */
  organizacaoId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Sub-componente: card individual de comentário ─────────────────────────────

interface CommentCardProps {
  comentario: ComentarioAPI;
  isOwn: boolean;
  /** Verdadeiro se existe ao menos um comentário ATIVO após este na lista */
  temPosterior: boolean;
  onEdit: (id: string, novoConteudo: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function CommentCard({ comentario: c, isOwn, temPosterior, onEdit, onDelete }: CommentCardProps) {
  const [editando, setEditando] = useState(false);
  const [textoEdicao, setTextoEdicao] = useState(c.conteudo);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(false);

  const ini = iniciais(c.usuarioNome);

  async function handleSalvarEdicao() {
    const novo = textoEdicao.trim();
    if (!novo || novo === c.conteudo) { setEditando(false); return; }
    setSalvando(true);
    try {
      await onEdit(c.id, novo);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  function handleCancelarEdicao() {
    setTextoEdicao(c.conteudo);
    setEditando(false);
  }

  async function handleDeletar() {
    setDeletando(true);
    try {
      await onDelete(c.id);
    } finally {
      setDeletando(false);
    }
  }

  // Tooltip explicativo quando o botão de excluir está bloqueado
  const deleteTooltip = temPosterior
    ? 'Não é possível excluir: há comentários posteriores nesta conversa'
    : 'Excluir comentário';

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        my: 1,
        bgcolor: 'background.paper',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'primary.light' },
      }}
    >
      {/* ── Cabeçalho ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          mb: 1.5,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Avatar */}
        <Avatar
          src={c.usuarioAvatarUrl ?? undefined}
          sx={{
            width: 40,
            height: 40,
            fontSize: '13px',
            fontWeight: 700,
            bgcolor: isOwn ? 'primary.main' : '#6B7280',
            flexShrink: 0,
          }}
        >
          {!c.usuarioAvatarUrl && ini}
        </Avatar>

        {/* Nome + data */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary' }}>
              {c.usuarioNome}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatarData(c.dataCriacao)}
              </Typography>
              {/* Badge "editado" — aparece discretamente quando o conteúdo foi alterado */}
              {c.editado && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.disabled',
                    fontStyle: 'italic',
                    ml: 0.5,
                    fontSize: '11px',
                  }}
                >
                  (editado)
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Ações — apenas para o dono do comentário */}
        {isOwn && (
          <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0, ml: 0.5 }}>
            {/* Botão Editar — sempre disponível para o autor */}
            {!editando && (
              <Tooltip title="Editar comentário">
                <IconButton
                  size="small"
                  onClick={() => { setTextoEdicao(c.conteudo); setEditando(true); }}
                  sx={{ opacity: 0.45, '&:hover': { opacity: 1 } }}
                >
                  <EditIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Botão Excluir — desabilitado quando há comentários posteriores */}
            {!editando && (
              <Tooltip title={deleteTooltip}>
                {/* span necessário para o Tooltip funcionar em botão disabled */}
                <span>
                  <IconButton
                    size="small"
                    onClick={handleDeletar}
                    disabled={temPosterior || deletando}
                    sx={{
                      opacity: temPosterior ? 0.25 : 0.45,
                      '&:hover:not(:disabled)': { opacity: 1 },
                    }}
                  >
                    {deletando ? (
                      <CircularProgress size={12} />
                    ) : (
                      <DeleteIcon sx={{ fontSize: 14, color: 'error.main' }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* ── Corpo: modo visualização ou edição inline ── */}
      {editando ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            multiline
            maxRows={8}
            fullWidth
            size="small"
            autoFocus
            value={textoEdicao}
            onChange={(e) => setTextoEdicao(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleSalvarEdicao();
              if (e.key === 'Escape') handleCancelarEdicao();
            }}
            inputProps={{ maxLength: MAX_COMENTARIO }}
            helperText={`${textoEdicao.length}/${MAX_COMENTARIO}`}
            FormHelperTextProps={{ sx: { textAlign: 'right' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center', mr: 'auto' }}>
              Ctrl+Enter para salvar · Esc para cancelar
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
              onClick={handleCancelarEdicao}
              disabled={salvando}
              sx={{ textTransform: 'none', borderRadius: 1.5 }}
            >
              Cancelar
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={
                salvando
                  ? <CircularProgress size={13} sx={{ color: 'inherit' }} />
                  : <CheckIcon sx={{ fontSize: 14 }} />
              }
              onClick={handleSalvarEdicao}
              disabled={!textoEdicao.trim() || salvando}
              sx={{ textTransform: 'none', borderRadius: 1.5 }}
            >
              Salvar
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }}
        >
          {c.conteudo}
        </Typography>
      )}
    </Box>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CommentSection({
  entidadeTipo,
  entidadeId,
  projetoId,
  organizacaoId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const { notify } = useSnackbar();

  const [comentarios, setComentarios] = useState<ComentarioAPI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [novoTexto, setNovoTexto]   = useState('');
  const [page, setPage]             = useState(0);
  /** 'asc' = mais antigos primeiro (ordem do backend); 'desc' = mais recentes primeiro. */
  const [ordem, setOrdem]           = useState<'asc' | 'desc'>('asc');

  // ── Carregar ──────────────────────────────────────────────────────────────

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarComentarios(entidadeTipo, entidadeId);
      setComentarios(data);
      setPage(0);
    } catch {
      notify('Não foi possível carregar os comentários.', 'error');
    } finally {
      setLoading(false);
    }
  }, [entidadeTipo, entidadeId, notify]);

  useEffect(() => { carregar(); }, [carregar]);

  // Mantém a página dentro do intervalo válido quando a lista encolhe.
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(comentarios.length / PAGE_SIZE));
    setPage((p) => Math.min(p, totalPages - 1));
  }, [comentarios.length]);

  // ── Criar ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const conteudo = novoTexto.trim();
    if (!conteudo) return;
    setSubmitting(true);
    try {
      const novo = await criarComentario({ conteudo, entidadeTipo, entidadeId, projetoId, organizacaoId });
      const proxima = [...comentarios, novo];
      setComentarios(proxima);
      setNovoTexto('');
      // Vai para a página onde o comentário recém-criado aparece, conforme a ordenação.
      const ultimaPagina = Math.max(0, Math.ceil(proxima.length / PAGE_SIZE) - 1);
      setPage(ordem === 'asc' ? ultimaPagina : 0);
      notify('Comentário adicionado.', 'success');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erro ao adicionar comentário.'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Editar ────────────────────────────────────────────────────────────────

  async function handleEdit(id: string, novoConteudo: string) {
    try {
      const atualizado = await editarComentario(id, { conteudo: novoConteudo });
      setComentarios((prev) => prev.map((c) => (c.id === id ? atualizado : c)));
      notify('Comentário atualizado.', 'success');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erro ao editar comentário.'), 'error');
      throw new Error('edit failed'); // re-throw para o card não fechar o modo edição
    }
  }

  // ── Deletar ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    try {
      await deletarComentario(id);
      setComentarios((prev) => prev.filter((c) => c.id !== id));
      notify('Comentário removido.', 'info');
    } catch (err: unknown) {
      // O backend retorna 409 CONFLICT quando há comentários posteriores.
      // A regra também é aplicada no frontend (botão desabilitado),
      // mas tratamos aqui como fallback de segurança.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        notify('Não é possível excluir: há comentários posteriores nesta conversa.', 'warning');
      } else {
        notify('Erro ao remover comentário.', 'error');
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(comentarios.length / PAGE_SIZE));
  // `comentarios` vem sempre em ordem cronológica (asc); a exibição inverte quando pedido.
  const ordenados = ordem === 'asc' ? comentarios : [...comentarios].reverse();
  const paginados = ordenados.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function alternarOrdem() {
    setOrdem((o) => (o === 'asc' ? 'desc' : 'asc'));
    setPage(0);
  }

  return (
    <Box>
      {/* Título + contador + ordenação */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>
          Comentários
        </Typography>

        {!loading && comentarios.length > 0 && (
          <Tooltip title={`${comentarios.length} comentário${comentarios.length !== 1 ? 's' : ''} no total`}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: '50%',
                minWidth: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                px: 0.5,
                cursor: 'default',
              }}
            >
              {comentarios.length}
            </Box>
          </Tooltip>
        )}

        {!loading && comentarios.length > 1 && (
          <Tooltip
            title={
              ordem === 'asc'
                ? 'Mais antigos primeiro — clique para inverter'
                : 'Mais recentes primeiro — clique para inverter'
            }
          >
            <IconButton size="small" onClick={alternarOrdem} sx={{ width: 28, height: 28 }}>
              <SwapVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Lista */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : comentarios.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ textAlign: 'center', py: 4, color: 'text.disabled', fontStyle: 'italic' }}
        >
          Nenhum comentário ainda. Seja o primeiro a comentar.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {paginados.map((c) => {
              const isOwn = user?.id === c.usuarioId;

              // Um comentário tem "posterior" se existir outro comentário ativo
              // criado depois dele. `comentarios` está sempre em ordem
              // cronológica, então basta olhar a posição real (independe da
              // ordem de exibição escolhida pelo usuário).
              const chronoIdx = comentarios.findIndex((x) => x.id === c.id);
              const temPosterior = chronoIdx > -1 && chronoIdx < comentarios.length - 1;

              return (
                <CommentCard
                  key={c.id}
                  comentario={c}
                  isOwn={isOwn}
                  temPosterior={temPosterior}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
          </Box>

          {/* ── Paginação — mesmo padrão do card "Alterações" ── */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 2,
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
                {page + 1} de {totalPages}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Página anterior">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                      sx={{ width: 28, height: 28 }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Próxima página">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                      sx={{ width: 28, height: 28 }}
                    >
                      <ChevronRightIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Input novo comentário */}
      <Box
        sx={{
          mt: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar
            src={user?.urlMidiaPerfil ?? undefined}
            sx={{
              width: 36,
              height: 36,
              fontSize: '12px',
              fontWeight: 700,
              bgcolor: 'primary.main',
              flexShrink: 0,
              mt: 0.5,
            }}
          >
            {user ? iniciais(user.nome) : '?'}
          </Avatar>

          <TextField
            multiline
            maxRows={6}
            fullWidth
            size="small"
            placeholder="Adicione seu comentário ou sugestão..."
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
            inputProps={{ maxLength: MAX_COMENTARIO }}
            helperText={`${novoTexto.length}/${MAX_COMENTARIO}`}
            FormHelperTextProps={{ sx: { textAlign: 'right' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            mt: 1.5,
            pl: 6,
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={
              submitting
                ? <CircularProgress size={12} sx={{ color: 'inherit' }} />
                : <AddCommentIcon sx={{ fontSize: 14 }} />
            }
            onClick={handleSubmit}
            disabled={!novoTexto.trim() || submitting}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
              py: 0.4,
              px: 1.25,
              minWidth: 0,
            }}
          >
            Adicionar comentário
          </Button>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: 10.5, mt: 0.5 }}
          >
            Ctrl+Enter para enviar
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
