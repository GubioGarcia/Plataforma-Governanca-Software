import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import HubIcon from '@mui/icons-material/Hub';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import { corDestaque } from './cores';

/** Barra fixa da landing: marca, tema e as entradas da plataforma. */
export default function LandingCabecalho() {
  const { mode, toggleMode } = useThemeMode();
  const escuro = mode === 'dark';

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 64 }}>
        <Box
          component={RouterLink}
          to="/"
          aria-label="Discovery Platform — início"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary', textDecoration: 'none', mr: 'auto', minWidth: 0 }}
        >
          <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: '9px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HubIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 17, whiteSpace: 'nowrap' }}>
            Discovery <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>Platform</Box>
          </Typography>
        </Box>

        <Tooltip title={escuro ? 'Tema claro' : 'Tema escuro'}>
          <IconButton onClick={toggleMode} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'} size="small">
            {escuro ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Button component={RouterLink} to="/login" variant="text" sx={{ whiteSpace: 'nowrap', color: corDestaque }}>
          Entrar
        </Button>
        <Button component={RouterLink} to="/cadastro" variant="contained" sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'inline-flex' } }}>
          Criar conta
        </Button>
      </Container>
    </Box>
  );
}
