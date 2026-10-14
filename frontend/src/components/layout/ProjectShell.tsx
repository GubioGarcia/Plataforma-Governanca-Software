import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ChecklistIcon from '@mui/icons-material/Checklist';
import HubIcon from '@mui/icons-material/Hub';
import SchemaIcon from '@mui/icons-material/Schema';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InboxIcon from '@mui/icons-material/Inbox';
import SemAcesso from '../common/SemAcesso';
import { usePermissions } from '../../hooks/usePermissions';
import { useAcessoRota } from '../../hooks/useAcessoRota';
import type { Permissao } from '../../types/acesso';

const SIDEBAR_WIDTH = 220;

export default function ProjectShell() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const { pode, projetoAtual } = usePermissions();
  // Só abre projeto em que o usuário participa (direto ou herdado da organização)
  const acesso = useAcessoRota(!!projetoAtual, projectId);

  const base = `/organizations/${orgId}/projects/${projectId}`;

  // Itens com `permissao` só aparecem para quem a tem (ex.: auditoria completa, Dono/Gestor)
  const allNavItems: { label: string; icon: ReactNode; to: string; permissao?: Permissao }[] = [
    { label: 'Visão Geral',  icon: <DashboardIcon fontSize="small" />,   to: base },
    { label: 'WIKI',         icon: <AutoStoriesIcon fontSize="small" />,  to: `${base}/wiki` },
    { label: 'Requisitos',   icon: <ChecklistIcon fontSize="small" />,    to: `${base}/requirements` },
    { label: 'Rastreabilidade', icon: <HubIcon fontSize="small" />,       to: `${base}/traceability` },
    { label: 'Modelo de Dados', icon: <SchemaIcon fontSize="small" />,    to: `${base}/data-model` },
    { label: 'Eventos',      icon: <EventNoteIcon fontSize="small" />,    to: `${base}/events` },
    { label: 'Arquivos',     icon: <FolderOpenIcon fontSize="small" />,   to: `${base}/files` },
    { label: 'Stakeholders', icon: <GroupIcon fontSize="small" />,        to: `${base}/stakeholders` },
    { label: 'Solicitações', icon: <InboxIcon fontSize="small" />,        to: `${base}/solicitations` },
    { label: 'Analytics',    icon: <BarChartIcon fontSize="small" />,     to: `${base}/analytics` },
    { label: 'Auditoria',    icon: <HistoryIcon fontSize="small" />,      to: `${base}/audit`, permissao: 'AUDIT_VIEW' },
  ];

  const navItems = allNavItems.filter((item) => !item.permissao || pode(item.permissao));

  if (acesso !== 'ok') return <SemAcesso situacao={acesso} alvo="projeto" />;

  // Seção atual (para a barra do celular): a Visão Geral só quando a rota é exatamente a base
  const secaoAtual = navItems.find((item) =>
    item.to === base ? pathname === base : pathname === item.to || pathname.startsWith(`${item.to}/`));

  const menu = (
    <>
      {/* Back + project name */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Tooltip title="Voltar aos projetos">
            <IconButton
              size="small"
              onClick={() => navigate(`/organizations/${orgId}/projects`)}
              sx={{ color: 'text.secondary', p: 0.5 }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Projetos
          </Typography>
        </Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: '13px',
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={projetoAtual?.nome}
        >
          {projetoAtual?.nome ?? 'Projeto'}
        </Typography>
      </Box>
      <Divider />

      {/* Nav */}
      <List dense sx={{ px: 1, pt: 1, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === base}
            onClick={() => setMenuAberto(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              px: 1.5,
              // Alvo de toque maior na gaveta do celular
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
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: { xs: '14px', md: '13px' }, fontWeight: 500 }}
            />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
      {/* Celular/tablet: barra do projeto com o menu em gaveta */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton aria-label="Abrir o menu do projeto" onClick={() => setMenuAberto(true)}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }} noWrap>
            {secaoAtual?.label ?? 'Projeto'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.3 }} noWrap>
            {projetoAtual?.nome}
          </Typography>
        </Box>
      </Box>
      <Drawer
        open={menuAberto}
        onClose={() => setMenuAberto(false)}
        ModalProps={{ keepMounted: true }}
        // Acima do AppBar (que fica em drawer + 1), como uma gaveta modal deve ficar
        sx={{ display: { xs: 'block', md: 'none' }, zIndex: (t) => t.zIndex.drawer + 2 }}
        slotProps={{ paper: { sx: { width: 280, maxWidth: '85vw' } } }}
      >
        {menu}
      </Drawer>

      {/* Notebook: menu lateral fixo */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {menu}
      </Box>

      {/* Content */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
