import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';
import EmptyState from '../../components/common/EmptyState';
import {
  atenderSolicitacao,
  cancelarSolicitacao,
  listarSolicitacoes,
  recusarSolicitacao,
  TIPO_SOLICITACAO_LABEL,
  type Solicitacao,
  type StatusSolicitacao,
} from '../../services/acessoService';
import { isApiError } from '../../services/userService';
import { useAuth } from '../../context/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';

const STATUS_COR: Record<StatusSolicitacao, { bg: string; color: string; label: string }> = {
  PENDENTE:  { bg: '#FEF3C7', color: '#B45309', label: 'Pendente' },
  ATENDIDA:  { bg: '#DCFCE7', color: '#15803D', label: 'Atendida' },
  RECUSADA:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Recusada' },
  CANCELADA: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelada' },
};

function data(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
}

/**
 * Solicitações do projeto (D12). Dono/Gestor (SOLICITACAO_RESPONDER) veem todas e
 * respondem; stakeholders veem as próprias e podem cancelar enquanto pendentes.
 */
export default function SolicitationList() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { pode } = usePermissions();
  const { notify } = useSnackbar();

  const [filtro, setFiltro] = useState<StatusSolicitacao | 'TODAS'>('PENDENTE');
  const [itens, setItens] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [resposta, setResposta] = useState('');
  const [respondendo, setRespondendo] = useState<{ item: Solicitacao; atender: boolean } | null>(null);

  const responsavel = pode('SOLICITACAO_RESPONDER');

  const carregar = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      setItens(await listarSolicitacoes(projectId, filtro === 'TODAS' ? undefined : filtro));
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao carregar solicitações' : 'Erro ao carregar solicitações', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, filtro, notify]);

  useEffect(() => { carregar(); }, [carregar]);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    try {
      await acao();
      notify(sucesso, 'success');
      carregar();
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao processar a solicitação' : 'Erro ao processar a solicitação', 'error');
    }
  }

  async function confirmarResposta() {
    if (!respondendo) return;
    const { item, atender } = respondendo;
    setRespondendo(null);
    await executar(
      () => (atender ? atenderSolicitacao(item.id, resposta || undefined) : recusarSolicitacao(item.id, resposta || undefined)),
      atender ? 'Solicitação atendida' : 'Solicitação recusada',
    );
    setResposta('');
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Solicitações</Typography>
          <Typography variant="body2" color="text.secondary">
            {responsavel ? 'Pedidos dos stakeholders para você responder' : 'Seus pedidos ao gestor do projeto'}
          </Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={filtro} onChange={(_, v) => v && setFiltro(v)}>
          <ToggleButton value="PENDENTE">Pendentes</ToggleButton>
          <ToggleButton value="ATENDIDA">Atendidas</ToggleButton>
          <ToggleButton value="RECUSADA">Recusadas</ToggleButton>
          <ToggleButton value="TODAS">Todas</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}

      {!loading && itens.length === 0 && (
        <EmptyState icon={<InboxIcon sx={{ fontSize: 64 }} />} title="Nenhuma solicitação" description="Não há solicitações neste filtro." />
      )}

      {!loading && itens.map((s) => {
        const cor = STATUS_COR[s.status];
        const minha = s.solicitanteId === user?.id;
        return (
          <Card key={s.id} elevation={0} sx={{ border: '1px solid #E8EAED', mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{TIPO_SOLICITACAO_LABEL[s.tipo]}</Typography>
                <Chip size="small" label={cor.label} sx={{ bgcolor: cor.bg, color: cor.color, fontWeight: 600, height: 22, fontSize: 11 }} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {s.solicitanteNome} · {data(s.dataCriacao)}
                </Typography>
              </Box>
              {s.alvoDescricao && <Typography variant="body2" sx={{ mb: 0.5 }}>{s.alvoDescricao}</Typography>}
              {s.justificativa && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>“{s.justificativa}”</Typography>
              )}
              {s.status !== 'PENDENTE' && s.respondidoPorNome && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Respondida por {s.respondidoPorNome} em {data(s.dataResposta)}{s.resposta ? `: ${s.resposta}` : ''}
                </Typography>
              )}

              {s.status === 'PENDENTE' && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
                  {minha && (
                    <Button size="small" color="inherit" onClick={() => executar(() => cancelarSolicitacao(s.id), 'Solicitação cancelada')}>
                      Cancelar
                    </Button>
                  )}
                  {responsavel && (
                    <>
                      <Button size="small" color="error" variant="outlined" onClick={() => setRespondendo({ item: s, atender: false })}>
                        Recusar
                      </Button>
                      <Button size="small" variant="contained" onClick={() => setRespondendo({ item: s, atender: true })}>
                        Atender
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={Boolean(respondendo)} onClose={() => setRespondendo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{respondendo?.atender ? 'Atender solicitação' : 'Recusar solicitação'}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            label="Resposta ao solicitante (opcional)"
            multiline
            minRows={3}
            fullWidth
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" size="small" onClick={() => setRespondendo(null)}>Cancelar</Button>
          <Button variant="contained" size="small" color={respondendo?.atender ? 'primary' : 'error'} onClick={confirmarResposta}>
            {respondendo?.atender ? 'Atender' : 'Recusar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
