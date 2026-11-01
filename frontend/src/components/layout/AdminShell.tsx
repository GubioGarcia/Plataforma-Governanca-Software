import { Suspense, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import LockIcon from '@mui/icons-material/LockOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CarregandoPagina from '../common/CarregandoPagina';
import { useAuth } from '../../context/useAuth';
import { ETIQUETA } from '../../theme/tokens';

const SIDEBAR_WIDTH = 220;

const ITENS: { label: string; icon: ReactNode; to: string }[] = [
  { label: 'Visão geral',          icon: <DashboardIcon fontSize="small" />, to: '/admin' },
  { label: 'Usuários',             icon: <PeopleIcon fontSize="small" />,    to: '/admin/usuarios' },
  { label: 'Dados de referência',  icon: <TuneIcon fontSize="small" />,      to: '/admin/dados-referencia' },
  { label: 'Auditoria',            icon: <HistoryIcon fontSize="small" />,   to: '/admin/auditoria' },
  { label: 'Pesquisas',            icon: <QuizOutlinedIcon fontSize="small" />, to: '/admin/pesquisas' },
];

/** Quem não é Admin da Plataforma não vê nada da área (o backend também recusa tudo). */
function SemAcessoAdmin() {
  const navigate = useNavigate();
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4, textAlign: 'center' }}>
      <LockIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
      <Typography variant="h4">Você não tem acesso a esta área</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
        A área administrativa é exclusiva da administração da plataforma.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/organizations')}>
        Ir para minhas organizações
      </Button>
    </Box>
  );
}

/** Layout da área administrativa: menu lateral próprio (gaveta abaixo de 900px). */
export default function AdminShell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  if (!user?.adminPlataforma) return <SemAcessoAdmin />;

  const secaoAtual = ITENS.find((i) => (i.to === '/admin' ? pathname === '/admin' : pathname.startsWith(i.to)));

  const menu = (
    <>
      <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminPanelSettingsOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        <Typography sx={{ ...ETIQUETA, color: 'text.secondary' }}>Área administrativa</Typography>
      </Box>
      <Divider />
      <List dense sx={{ px: 1, pt: 1, flexGrow: 1 }} aria-label="Área administrativa">
        {ITENS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => setMenuAberto(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              px: 1.5,
              py: { xs: 1.1, md: 0.75 },
              '&.active': {
                bgcolor: 'primary.main' + '18',
                color: 'primary.main',
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
              '&:not(.active)': { color: 'text.secondary' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: { xs: '14px', md: '13px' }, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
      {/* Celular/tablet: barra com o menu em gaveta */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, px: 1, py: 0.5, flexShrink: 0,
          bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
        }}
      >
        <IconButton aria-label="Abrir o menu da área administrativa" onClick={() => setMenuAberto(true)}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }} noWrap>{secaoAtual?.label ?? 'Visão geral'}</Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.3 }} noWrap>
            Área administrativa
          </Typography>
        </Box>
      </Box>
      <Drawer
        open={menuAberto}
        onClose={() => setMenuAberto(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, zIndex: (t) => t.zIndex.drawer + 2 }}
        slotProps={{ paper: { sx: { width: 280, maxWidth: '85vw' } } }}
      >
        {menu}
      </Drawer>

      {/* Notebook: menu lateral fixo */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_WIDTH, flexShrink: 0, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider',
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column', overflow: 'auto',
        }}
      >
        {menu}
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, overflow: 'auto', bgcolor: 'background.default' }}>
        <Suspense fallback={<CarregandoPagina />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
