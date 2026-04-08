import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BusinessIcon from '@mui/icons-material/Business';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../context/UseAuth';
import { mockAudit } from '../mocks/audit';
import { mockProjects } from '../mocks/projects';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  GESTOR:        { label: 'Gestor',        color: '#7C3AED', bg: '#EDE9FE' },
  STAKEHOLDER:   { label: 'Stakeholder',   color: '#3B82F6', bg: '#EFF6FF' },
  ANALISTA:      { label: 'Analista',      color: '#0891B2', bg: '#E0F2FE' },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nome: user?.nome ?? '', email: user?.email ?? '' });

  // For display: persist edits locally
  const [displayName, setDisplayName] = useState(user?.nome ?? '');
  const [displayEmail, setDisplayEmail] = useState(user?.email ?? '');

  const handleSave = () => {
    if (!form.nome.trim()) return;
    setDisplayName(form.nome.trim());
    setDisplayEmail(form.email.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({ nome: displayName, email: displayEmail });
    setEditing(false);
  };

  const initials = displayName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const roleCfg = ROLE_LABELS[user?.role ?? 'GESTOR'] ?? ROLE_LABELS.GESTOR;

  // Activity stats
  const userAuditEntries = mockAudit.filter((a) => a.userName === (user?.nome ?? displayName));
  const myProjects = mockProjects.filter((p) => p.createdBy === (user?.nome ?? displayName));

  // Last 5 activities
  const recentActivity = mockAudit.slice(0, 5);

  return (
    <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
      <Typography variant="h2" sx={{ mb: 4 }}>Meu Perfil</Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Profile card */}
        <Card sx={{ minWidth: 300, flex: '0 0 auto' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80, height: 80,
                bgcolor: 'primary.main',
                fontSize: '28px', fontWeight: 700,
                mx: 'auto', mb: 2,
              }}
            >
              {initials}
            </Avatar>

            {!editing ? (
              <>
                <Typography variant="h4" sx={{ mb: 0.5 }}>{displayName}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>@{user?.email}</Typography>
                <Chip
                  label={roleCfg.label}
                  size="small"
                  sx={{ bgcolor: roleCfg.bg, color: roleCfg.color, fontWeight: 700, mb: 2.5 }}
                />
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2">{displayEmail}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AlternateEmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2">{user?.username}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ color: roleCfg.color, fontWeight: 600 }}>{roleCfg.label}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  size="small"
                  fullWidth
                  onClick={() => setEditing(true)}
                >
                  Editar perfil
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  autoFocus
                />
                <TextField
                  label="E-mail"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={{ mb: 2.5 }}
                  type="email"
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Cancelar">
                    <IconButton size="small" onClick={handleCancel} sx={{ border: '1px solid #E8EAED', borderRadius: 1 }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon />}
                    size="small"
                    fullWidth
                    onClick={handleSave}
                    disabled={!form.nome.trim()}
                  >
                    Salvar
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats + Activity */}
        <Box sx={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Activity stats */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { icon: <BusinessIcon />, label: 'Projetos criados', value: myProjects.length, color: '#3F51B5', bg: '#EEF2FF' },
              { icon: <AssignmentTurnedInIcon />, label: 'Ações registradas', value: userAuditEntries.length, color: '#16A34A', bg: '#DCFCE7' },
              { icon: <HistoryIcon />, label: 'Papel atual', value: roleCfg.label, color: roleCfg.color, bg: roleCfg.bg },
            ].map((stat) => (
              <Card key={stat.label} sx={{ flex: '1 1 140px' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, '& svg': { fontSize: 18 } }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '22px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Recent activity */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Atividade Recente</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Últimas ações registradas na plataforma
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {recentActivity.map((a, idx) => (
                  <Box key={a.id}>
                    <Box sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.4 }}>{a.descricao}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {a.userName} · {new Date(a.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                    {idx < recentActivity.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
