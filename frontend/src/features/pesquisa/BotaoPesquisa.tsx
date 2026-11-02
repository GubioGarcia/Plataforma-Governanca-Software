import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { formatarDisponivelEm, mostraBotaoPesquisa, usePesquisa } from './usePesquisa';

/**
 * "Nos ajude a melhorar" no cabeçalho (a partir de sm): abre a segunda etapa da
 * pesquisa. Desabilitado, com o horário de liberação, enquanto o intervalo mínimo
 * não passou. No celular a mesma ação fica no menu do usuário (ItemMenuPesquisa).
 */
export default function BotaoPesquisa() {
  const { situacao, abrirDepois } = usePesquisa();
  if (!situacao || !mostraBotaoPesquisa(situacao.estado)) return null;
  const aguardando = situacao.estado === 'AGUARDANDO_DEPOIS';
  const dica = aguardando && situacao.depoisDisponivelEm
    ? `Disponível a partir de ${formatarDisponivelEm(situacao.depoisDisponivelEm)}`
    : 'Responda à segunda parte da pesquisa do TCC';

  return (
    <Tooltip title={dica}>
      {/* span: o Tooltip precisa de um elemento que receba eventos mesmo com o botão desabilitado */}
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline-flex' }, mr: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RateReviewOutlinedIcon />}
          disabled={aguardando}
          onClick={abrirDepois}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Nos ajude a melhorar
        </Button>
      </Box>
    </Tooltip>
  );
}

/** Versão do botão para o menu do usuário, só no celular. */
export function ItemMenuPesquisa({ onFecharMenu }: { onFecharMenu: () => void }) {
  const { situacao, abrirDepois } = usePesquisa();
  if (!situacao || !mostraBotaoPesquisa(situacao.estado)) return null;
  const aguardando = situacao.estado === 'AGUARDANDO_DEPOIS';

  return (
    <MenuItem
      disabled={aguardando}
      onClick={() => { onFecharMenu(); abrirDepois(); }}
      sx={{ fontSize: '13px', display: { xs: 'flex', sm: 'none' } }}
    >
      <ListItemIcon><RateReviewOutlinedIcon fontSize="small" /></ListItemIcon>
      <ListItemText
        primary="Nos ajude a melhorar"
        secondary={aguardando && situacao.depoisDisponivelEm
          ? `Disponível a partir de ${formatarDisponivelEm(situacao.depoisDisponivelEm)}` : undefined}
        slotProps={{ primary: { sx: { fontSize: '13px' } } }}
      />
    </MenuItem>
  );
}
