import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { PADDING_PAGINA } from '../../theme/responsivo';

/** Espaço reservado para os questionários da pesquisa do TCC (próxima etapa). */
export default function AdminPesquisas() {
  return (
    <Box sx={{ p: PADDING_PAGINA, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h2" component="h1">Pesquisas</Typography>
      <Box sx={{ mt: 4, py: 8, textAlign: 'center', color: 'text.secondary', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
        <QuizOutlinedIcon sx={{ fontSize: 48, opacity: 0.4, mb: 1 }} />
        <Typography>Disponível na próxima etapa.</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Aqui ficarão os questionários da pesquisa (antes e depois do uso da plataforma) e as respostas.
        </Typography>
      </Box>
    </Box>
  );
}
