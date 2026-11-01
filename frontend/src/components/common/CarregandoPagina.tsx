import { Box, CircularProgress } from '@mui/material';

/** Fallback das telas carregadas sob demanda (React.lazy). */
export default function CarregandoPagina({ telaCheia }: { telaCheia?: boolean }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: telaCheia ? '100vh' : 240 }}>
      <CircularProgress />
    </Box>
  );
}
