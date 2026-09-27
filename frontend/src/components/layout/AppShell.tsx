import { useState, type ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
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
import HubIcon from '@mui/icons-material/Hub';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import NotificationsIcon from '@mui/icons-material/NotificationsNone';
import MailIcon from '@mui/icons-material/MarkEmailUnread';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import { useAuth } from '../../context/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useThemeMode } from '../../context/ThemeContext';
import { usePendencias } from '../../hooks/usePendencias';
import { TIPO_SOLICITACAO_LABEL } from '../../services/acessoService';
import { PAPEL_ORGANIZACAO_LABEL, PAPEL_PROJETO_LABEL } from '../../types/acesso';

export default function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isGestor, projetoAtual, organizacaoAtual, adminPlataforma } = usePermissions();

  // Papel mais alto no projeto da rota; senão o da organização; senão Admin da Plataforma
  const papelLabel = projetoAtual?.papeis.length
    ? projetoAtual.papeis.map((p) => PAPEL_PROJETO_LABEL[p]).join(' + ')
    : organizacaoAtual?.papel
      ? PAPEL_ORGANIZACAO_LABEL[organizacaoAtual.papel]
      : adminPlataforma ? 'Admin da Plataforma' : null;
  const { mode, toggleMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  // Pendências reais: convites recebidos, pedidos a responder e pedidos próprios aguardando
  const pendencias = usePendencias();

  function abrir(caminho: string) {
    setNotifAnchor(null);
    navigate(caminho);
  }

  const initials = user?.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
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

          {/* Pendências */}
          <Tooltip title="Pendências">
            <IconButton size="small" onClick={(e) => { setNotifAnchor(e.currentTarget); pendencias.recarregar(); }} sx={{ mr: 1 }}>
              <Badge badgeContent={pendencias.total} color="warning" max={99}>
                <NotificationsIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Papel real do usuário no contexto atual (projeto, senão organização) */}
          {papelLabel && (
            <Tooltip title="Seu papel aqui">
              <Chip
                label={papelLabel}
                size="small"
                sx={{
                  mr: 1.5,
                  bgcolor: isGestor ? '#EDE9FE' : '#EFF6FF',
                  color: isGestor ? '#7C3AED' : '#3B82F6',
                  fontWeight: 600,
                  fontSize: '11px',
                  border: '1px solid',
                  borderColor: isGestor ? '#DDD6FE' : '#BFDBFE',
                }}
              />
            </Tooltip>
          )}

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

            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }} sx={{ fontSize: '13px', mt: 1 }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Meu Perfil
            </MenuItem>
            <MenuItem
              onClick={() => { setAnchorEl(null); logout().finally(() => navigate('/login')); }}
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pendências</Typography>
              {pendencias.total > 0 && (
                <Chip label={`${pendencias.total} para você`} size="small" color="warning" sx={{ height: 20, fontSize: '11px' }} />
              )}
            </Box>
            <Divider />
            <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
              {pendencias.convites.length > 0 && (
                <SecaoPendencias titulo="Convites" cor="primary.main">
                  {pendencias.convites.map((c) => (
                    <ItemPendencia
                      key={c.id}
                      icone={<MailIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                      texto={c.projetoNome ? `Projeto ${c.projetoNome}` : `Organização ${c.organizacaoNome}`}
                      detalhe={`Convidado por ${c.convidadoPorNome ?? '—'} · responda na lista de organizações`}
                      onClick={() => abrir('/organizations')}
                    />
                  ))}
                </SecaoPendencias>
              )}
              {pendencias.aResponder.length > 0 && (
                <SecaoPendencias titulo="Solicitações para responder" cor="warning.main">
                  {pendencias.aResponder.map((sol) => (
                    <ItemPendencia
                      key={sol.id}
                      icone={<PendingActionsIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                      texto={`${TIPO_SOLICITACAO_LABEL[sol.tipo]}${sol.alvoDescricao ? ` · ${sol.alvoDescricao}` : ''}`}
                      detalhe={`${sol.solicitanteNome} · ${sol.projetoNome}`}
                      onClick={() => abrir(`/organizations/${sol.orgId}/projects/${sol.projetoId}/solicitations`)}
                    />
                  ))}
                </SecaoPendencias>
              )}
              {pendencias.minhas.length > 0 && (
                <SecaoPendencias titulo="Seus pedidos aguardando resposta" cor="text.disabled">
                  {pendencias.minhas.map((sol) => (
                    <ItemPendencia
                      key={sol.id}
                      icone={<HourglassIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                      texto={`${TIPO_SOLICITACAO_LABEL[sol.tipo]}${sol.alvoDescricao ? ` · ${sol.alvoDescricao}` : ''}`}
                      detalhe={sol.projetoNome}
                      onClick={() => abrir(`/organizations/${sol.orgId}/projects/${sol.projetoId}/solicitations`)}
                    />
                  ))}
                </SecaoPendencias>
              )}
              {!pendencias.carregando && pendencias.total === 0 && pendencias.minhas.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  Nenhuma pendência. Tudo em dia!
                </Typography>
              )}
            </Box>
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

function SecaoPendencias({ titulo, cor, children }: { titulo: string; cor: string; children: ReactNode }) {
  return (
    <>
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: cor, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {titulo}
        </Typography>
      </Box>
      <List dense sx={{ py: 0 }}>{children}</List>
      <Divider />
    </>
  );
}

function ItemPendencia({ icone, texto, detalhe, onClick }: { icone: ReactNode; texto: string; detalhe: string; onClick: () => void }) {
  return (
    <ListItemButton onClick={onClick} sx={{ px: 2, py: 1, alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ mt: 0.25, flexShrink: 0, display: 'flex' }}>{icone}</Box>
      <ListItemText
        primary={<Typography variant="body2" sx={{ fontSize: '13px', lineHeight: 1.4, fontWeight: 500 }}>{texto}</Typography>}
        secondary={<Typography variant="caption" sx={{ color: 'text.secondary' }}>{detalhe}</Typography>}
      />
    </ListItemButton>
  );
}
