import { useState, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HubIcon from '@mui/icons-material/Hub';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useAuth } from '../../context/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useThemeMode } from '../../context/ThemeContext';
import { mockAudit } from '../../mocks/audit';
import { mockRequirements } from '../../mocks/requirements';
import { mockProjects } from '../../mocks/projects';
import type { PapelProjeto } from '../../types/stakeholder';

const ROLES: { value: PapelProjeto; label: string }[] = [
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'STAKEHOLDER', label: 'Stakeholder' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();
  const { isGestor } = usePermissions();
  const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  // Pending: requirements in EM_VALIDACAO that the current user hasn't voted on yet
  const pendingItems = useMemo(() => {
    if (!user) return [];
    return mockRequirements
      .filter((r) => r.status === 'EM_VALIDACAO')
      .filter((r) => {
        const myVote = r.votos?.find((v) => v.userId === Number(user.id));
        return !myVote || myVote.voto === null;
      })
      .map((r) => {
        const proj = mockProjects.find((p) => p.id === r.projetoId);
        return { id: r.id, message: `"${r.titulo}" aguarda seu voto`, sub: proj?.name ?? 'Projeto', urgent: true };
      });
  }, [user]);

  // Recent activity from audit (up to 5)
  const recentNotifs = mockAudit.slice(0, 5).map((a) => ({
    id: `a-${a.id}`,
    message: a.descricao,
    sub: new Date(a.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    urgent: false,
  }));

  const initials = user?.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '56px !important' }}>
          {/* Logo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 4 }}
            onClick={() => navigate('/organizations')}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HubIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: 'text.primary', display: { xs: 'none', sm: 'block' } }}
            >
              Discovery
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 400, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
            >
              Platform
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Dark / Light toggle */}
          <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            <IconButton size="small" onClick={toggleMode} sx={{ mr: 0.5 }}>
              {mode === 'dark'
                ? <LightModeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                : <DarkModeIcon  sx={{ fontSize: 20, color: 'text.secondary' }} />}
            </IconButton>
          </Tooltip>

          {/* Demo role switcher */}
          <Tooltip title="Trocar papel (demonstração)">
            <Chip
              icon={<SwapHorizIcon sx={{ fontSize: '14px !important' }} />}
              label={user?.role ?? 'GESTOR'}
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                mr: 1.5,
                bgcolor: isGestor ? '#EDE9FE' : '#EFF6FF',
                color: isGestor ? '#7C3AED' : '#3B82F6',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isGestor ? '#DDD6FE' : '#BFDBFE',
              }}
            />
          </Tooltip>

          {/* User avatar */}
          <Tooltip title={user?.nome ?? ''}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { elevation: 3, sx: { mt: 0.5, minWidth: 220, borderRadius: 2 } } }}
          >
            {/* User info */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user?.nome}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
            </Box>
            <Divider />

            {/* Role switcher items */}
            <Box sx={{ px: 2, pt: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.08em' }}>
                Simular papel
              </Typography>
            </Box>
            {ROLES.map((r) => (
              <MenuItem
                key={r.value}
                onClick={() => { switchRole(r.value); setAnchorEl(null); }}
                selected={user?.role === r.value}
                sx={{ fontSize: '13px' }}
              >
                {r.label}
              </MenuItem>
            ))}

            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ fontSize: '13px' }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Meu Perfil
            </MenuItem>
            <MenuItem
              onClick={() => { logout(); navigate('/login'); setAnchorEl(null); }}
              sx={{ fontSize: '13px', color: 'error.main' }}
            >
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
              Sair
            </MenuItem>
          </Menu>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { elevation: 3, sx: { mt: 0.5, width: 360, borderRadius: 2 } } }}
          >
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notificações</Typography>
              {pendingItems.length > 0 && (
                <Chip label={`${pendingItems.length} pendente${pendingItems.length > 1 ? 's' : ''}`} size="small" color="warning" sx={{ height: 20, fontSize: '11px' }} />
              )}
            </Box>
            <Divider />
            {pendingItems.length > 0 && (
              <>
                <Box sx={{ px: 2, pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aguardando seu voto</Typography>
                </Box>
                <List dense sx={{ py: 0 }}>
                  {pendingItems.map((n, idx) => (
                    <Box key={n.id}>
                      <ListItem sx={{ px: 2, py: 1, alignItems: 'flex-start', gap: 1 }}>
                        <PendingActionsIcon sx={{ fontSize: 16, color: 'warning.main', mt: 0.25, flexShrink: 0 }} />
                        <ListItemText
                          primary={<Typography variant="body2" sx={{ fontSize: '13px', lineHeight: 1.4, fontWeight: 500 }}>{n.message}</Typography>}
                          secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{n.sub}</Typography>}
                        />
                      </ListItem>
                      {idx < pendingItems.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
                <Divider />
              </>
            )}
            <Box sx={{ px: 2, pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Atividade recente</Typography>
            </Box>
            <List dense sx={{ maxHeight: 240, overflowY: 'auto', py: 0 }}>
              {recentNotifs.map((n, idx) => (
                <Box key={n.id}>
                  <ListItem sx={{ px: 2, py: 1, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontSize: '12px', lineHeight: 1.4 }}>{n.message}</Typography>}
                      secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{n.sub}</Typography>}
                    />
                  </ListItem>
                  {idx < recentNotifs.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Popover>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
