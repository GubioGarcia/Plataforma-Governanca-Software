import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F8FAFC',
        gap: 2,
        p: 4,
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{ fontSize: '120px', fontWeight: 900, lineHeight: 1, color: '#E2E8F0', letterSpacing: '-8px' }}
      >
        404
      </Typography>
      <Typography variant="h2" sx={{ mt: -2 }}>
        Página não encontrada
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400 }}>
        O endereço que você acessou não existe ou foi removido. Verifique a URL ou volte para a tela inicial.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/organizations')}
        sx={{ mt: 2, borderRadius: 2 }}
      >
        Voltar ao início
      </Button>
    </Box>
  );
}
