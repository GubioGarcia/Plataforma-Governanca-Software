import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { mockProjects } from '../../mocks/projects';
import { usePermissions } from '../../hooks/usePermissions';

const SIDEBAR_WIDTH = 220;

export default function ProjectShell() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { canViewAudit } = usePermissions();
  const project = mockProjects.find((p) => p.id === Number(projectId));

  const base = `/organizations/${orgId}/projects/${projectId}`;

  const navItems = [
    { label: 'Visão Geral', icon: <DashboardIcon fontSize="small" />, to: base },
    { label: 'WIKI', icon: <AutoStoriesIcon fontSize="small" />, to: `${base}/wiki` },
    { label: 'Requisitos', icon: <ChecklistIcon fontSize="small" />, to: `${base}/requirements` },
    { label: 'Eventos', icon: <EventNoteIcon fontSize="small" />, to: `${base}/events` },
    { label: 'Arquivos', icon: <FolderOpenIcon fontSize="small" />, to: `${base}/files` },
    { label: 'Stakeholders', icon: <GroupIcon fontSize="small" />, to: `${base}/stakeholders` },
    { label: 'Analytics', icon: <BarChartIcon fontSize="small" />, to: `${base}/analytics` },
    ...(canViewAudit
      ? [{ label: 'Auditoria', icon: <HistoryIcon fontSize="small" />, to: `${base}/audit` }]
      : []),
  ];

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
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
            title={project?.name}
          >
            {project?.name ?? 'Projeto'}
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
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 1.5,
                py: 0.75,
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
                primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
