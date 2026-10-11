import { useState } from 'react';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ConfirmDialog from './ConfirmDialog';
import { baixarExportacao, criarSolicitacao } from '../../services/acessoService';
import { isApiError } from '../../services/userService';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';

interface Props {
  projetoId: string;
  tipo: 'mer' | 'rastreabilidade';
}

const CONFIG = {
  mer:             { exportar: 'MER_EXPORT', solicitar: 'MER_EXPORT_REQUEST', tipoSolicitacao: 'EXPORT_MER' },
  rastreabilidade: { exportar: 'RASTREABILIDADE_EXPORT', solicitar: 'RASTREABILIDADE_EXPORT_REQUEST', tipoSolicitacao: 'EXPORT_RASTREABILIDADE' },
} as const;

/**
 * Exportação em CSV gerada no backend (D11). Dono/Gestor baixam direto. Stakeholder baixa
 * depois que uma solicitação de exportação dele foi atendida; se ainda não foi (403),
 * o botão oferece enviar a solicitação ao gestor.
 */
export default function BotaoExportar({ projetoId, tipo }: Props) {
  const { pode } = usePermissions();
  const { notify } = useSnackbar();
  const [oferecerSolicitacao, setOferecerSolicitacao] = useState(false);
  const cfg = CONFIG[tipo];

  const podeExportar = pode(cfg.exportar);
  const podeSolicitar = pode(cfg.solicitar);
  if (!podeExportar && !podeSolicitar) return null;

  async function exportar() {
    try {
      await baixarExportacao(projetoId, tipo);
    } catch (err) {
      if (isApiError(err) && err.response?.status === 403 && podeSolicitar) {
        setOferecerSolicitacao(true);
      } else {
        notify('Não foi possível exportar.', 'error');
      }
    }
  }

  async function solicitar() {
    setOferecerSolicitacao(false);
    try {
      await criarSolicitacao(projetoId, { tipo: cfg.tipoSolicitacao });
      notify('Exportação solicitada. Você poderá baixar quando o gestor atender.', 'success');
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao solicitar a exportação' : 'Erro ao solicitar a exportação', 'error');
    }
  }

  return (
    <>
      <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportar}>
        Exportar CSV
      </Button>
      <ConfirmDialog
        open={oferecerSolicitacao}
        title="Exportação não liberada"
        message="A exportação precisa ser liberada pelo gestor do projeto. Deseja enviar a solicitação agora?"
        confirmLabel="Solicitar"
        confirmColor="primary"
        onConfirm={solicitar}
        onCancel={() => setOferecerSolicitacao(false)}
      />
    </>
  );
}
