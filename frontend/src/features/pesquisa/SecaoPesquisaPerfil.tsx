import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import { extractApiErrorMessage } from '../../utils/apiError';
import { retirarParticipacao } from './pesquisaService';
import type { SituacaoPesquisa } from './types';
import { formatarDisponivelEm, usePesquisa } from './usePesquisa';

function descricao(s: SituacaoPesquisa): { rotulo: string; cor: 'success' | 'primary' | 'default'; texto: string } | null {
  switch (s.situacaoParticipacao) {
    case 'PARTICIPANDO':
      if (s.estado === 'CONCLUIDA') {
        return { rotulo: 'Concluída', cor: 'success', texto: 'Você respondeu às duas etapas. Obrigado pela contribuição!' };
      }
      return {
        rotulo: 'Participando',
        cor: 'primary',
        texto: s.estado === 'AGUARDANDO_DEPOIS' && s.depoisDisponivelEm
          ? `A segunda etapa fica disponível a partir de ${formatarDisponivelEm(s.depoisDisponivelEm)}, no botão "Nos ajude a melhorar".`
          : s.estado === 'PENDENTE_DEPOIS'
            ? 'A segunda etapa já está disponível no botão "Nos ajude a melhorar", no topo da tela.'
            : 'Você respondeu à primeira etapa. A coleta está encerrada no momento.',
      };
    case 'RETIRADA':
      return { rotulo: 'Retirada', cor: 'default', texto: 'Você retirou a sua participação e as suas respostas foram apagadas.' };
    default:
      return s.estado === 'PENDENTE_ANTES'
        ? { rotulo: 'Pendente', cor: 'default', texto: 'Você ainda não respondeu à primeira etapa. Leva cerca de 3 minutos.' }
        : null;
  }
}

/** Seção "Pesquisa do TCC" do Meu Perfil: estado, código e retirada da participação. */
export default function SecaoPesquisaPerfil() {
  const { situacao, atualizar, abrirAntes } = usePesquisa();
  const { notify } = useSnackbar();
  const [confirmar, setConfirmar] = useState(false);
  const [retirando, setRetirando] = useState(false);

  const info = situacao ? descricao(situacao) : null;
  if (!situacao || !info) return null;

  async function retirar() {
    setConfirmar(false);
    setRetirando(true);
    try {
      atualizar(await retirarParticipacao());
      notify('Participação retirada. Suas respostas foram apagadas.', 'success');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível retirar a participação. Tente novamente.'), 'error');
    } finally {
      setRetirando(false);
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Pesquisa do TCC</Typography>
          <Chip size="small" label={info.rotulo} color={info.cor} sx={{ height: 20, fontSize: 11 }} />
        </Box>
        {situacao.codigo && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
            Código do participante: <strong>{situacao.codigo}</strong> (é só por ele que as suas respostas aparecem nos resultados)
          </Typography>
        )}
        <Typography variant="body2" sx={{ mb: situacao.situacaoParticipacao === 'PARTICIPANDO' ? 2 : 0 }}>{info.texto}</Typography>
        {situacao.estado === 'PENDENTE_ANTES' && (
          <Button variant="contained" size="small" onClick={abrirAntes} sx={{ mt: 2 }}>Responder agora</Button>
        )}
        {situacao.situacaoParticipacao === 'PARTICIPANDO' && (
          <Button variant="outlined" color="error" size="small" onClick={() => setConfirmar(true)} disabled={retirando}>
            Retirar minha participação
          </Button>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmar}
        title="Retirar a participação?"
        message="Todas as suas respostas e a sua caracterização serão apagadas e não entram nos resultados. A pesquisa não será oferecida de novo."
        confirmLabel="Retirar e apagar"
        confirmColor="error"
        onConfirm={retirar}
        onCancel={() => setConfirmar(false)}
      />
    </Card>
  );
}
