import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import { aprovarRequisito, reprovarRequisito } from '../../services/requirementService';
import { criarSolicitacao, TIPO_SOLICITACAO_LABEL, type TipoSolicitacao } from '../../services/acessoService';
import { isApiError } from '../../services/userService';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';
import type { RequisitoAPI } from '../../types/requirementAPI';

interface Props {
  projetoId: string;
  requisito: RequisitoAPI;
  onAtualizado: (requisito: RequisitoAPI) => void;
}

/**
 * Ações de decisão sobre o requisito:
 * - Dono/Gestor (REQ_APPROVE): aprovar / reprovar;
 * - Stakeholder: solicitar alteração ou reprovação (requisito APROVADO) e,
 *   se Cliente, solicitar aprovação (requisito ainda não aprovado).
 * O backend valida permissão e estado de novo.
 */
export default function RequirementActions({ projetoId, requisito, onAtualizado }: Props) {
  const { pode } = usePermissions();
  const { notify } = useSnackbar();
  const [tipoDialog, setTipoDialog] = useState<TipoSolicitacao | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);

  const status = (requisito.statusNome ?? '').toUpperCase();
  const aprovado = status === 'APROVADO';

  const erro = (err: unknown, padrao: string) =>
    notify(isApiError(err) ? err.response?.data?.detail ?? padrao : padrao, 'error');

  async function decidir(aprovar: boolean) {
    try {
      const atualizado = aprovar ? await aprovarRequisito(requisito.id) : await reprovarRequisito(requisito.id);
      onAtualizado(atualizado);
      notify(aprovar ? 'Requisito aprovado' : 'Requisito reprovado', 'success');
    } catch (err) {
      erro(err, 'Erro ao registrar a decisão');
    }
  }

  async function enviarSolicitacao() {
    if (!tipoDialog) return;
    setEnviando(true);
    try {
      await criarSolicitacao(projetoId, { tipo: tipoDialog, alvoId: requisito.id, justificativa: justificativa.trim() || undefined });
      notify('Solicitação enviada ao gestor do projeto', 'success');
      setTipoDialog(null);
      setJustificativa('');
    } catch (err) {
      erro(err, 'Erro ao enviar a solicitação');
    } finally {
      setEnviando(false);
    }
  }

  const botoes: React.ReactNode[] = [];
  if (pode('REQ_APPROVE')) {
    if (!aprovado) {
      botoes.push(
        <Button key="aprovar" size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => decidir(true)}>
          Aprovar
        </Button>,
      );
    }
    if (status !== 'REPROVADO') {
      botoes.push(
        <Button key="reprovar" size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => decidir(false)}>
          Reprovar
        </Button>,
      );
    }
  }
  const solicitar = (tipo: TipoSolicitacao, label: string) => (
    <Button key={tipo} size="small" variant="outlined" startIcon={<SendIcon />} onClick={() => setTipoDialog(tipo)}>
      {label}
    </Button>
  );
  if (aprovado && pode('REQ_REQUEST_CHANGE')) botoes.push(solicitar('ALTERACAO_REQUISITO', 'Solicitar alteração'));
  if (aprovado && pode('REQ_REQUEST_REJECTION')) botoes.push(solicitar('REPROVACAO_REQUISITO', 'Solicitar reprovação'));
  if (!aprovado && pode('REQ_REQUEST_APPROVAL')) botoes.push(solicitar('APROVACAO_REQUISITO', 'Solicitar aprovação'));

  if (botoes.length === 0) return null;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>{botoes}</Box>

      <Dialog open={Boolean(tipoDialog)} onClose={() => setTipoDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{tipoDialog ? TIPO_SOLICITACAO_LABEL[tipoDialog] : ''}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            label="Justificativa (opcional)"
            multiline
            minRows={3}
            fullWidth
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" size="small" onClick={() => setTipoDialog(null)} disabled={enviando}>Cancelar</Button>
          <Button variant="contained" size="small" onClick={enviarSolicitacao} disabled={enviando}>Enviar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
