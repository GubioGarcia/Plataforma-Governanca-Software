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
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import BusinessIcon from '@mui/icons-material/Business';
import HistoryIcon from '@mui/icons-material/History';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useSnackbar } from '../context/SnackbarContext';
import { atualizarMeuPerfil, isApiError } from '../services/userService';
import { PAPEL_ORGANIZACAO_LABEL, PAPEL_PROJETO_LABEL } from '../types/acesso';


export default function ProfilePage() {
  const { user, recarregarPermissoes } = useAuth();
  const { notify } = useSnackbar();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: user?.nome ?? '', email: user?.email ?? '' });

  const displayName = user?.nome ?? '';
  const displayEmail = user?.email ?? '';

  const handleSave = async () => {
    if (!form.nome.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      await atualizarMeuPerfil({ nome: form.nome.trim(), email: form.email.trim(), urlMidiaPerfil: user?.urlMidiaPerfil ?? null });
      await recarregarPermissoes(); // /me traz os dados novos
      notify('Perfil atualizado', 'success');
      setEditing(false);
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao atualizar o perfil' : 'Erro ao atualizar o perfil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ nome: displayName, email: displayEmail });
    setEditing(false);
  };

  const initials = displayName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  // Não há papel global: o papel é por organização/projeto. No perfil mostra o resumo.
  const totalOrganizacoes = user?.organizacoes.length ?? 0;
  const roleCfg = user?.adminPlataforma
    ? { label: 'Admin da Plataforma', color: '#7C3AED', bg: '#EDE9FE' }
    : {
        label: `${totalOrganizacoes} organizaç${totalOrganizacoes === 1 ? 'ão' : 'ões'}`,
        color: '#3B82F6',
        bg: '#EFF6FF',
      };

  // Onde o usuário atua (do /me)
  const organizacoes = user?.organizacoes ?? [];
  const totalProjetos = organizacoes.reduce((acc, o) => acc + o.projetos.length, 0);

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
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>{user?.email}</Typography>
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
                    <Typography variant="body2">{displayName}</Typography>
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
                    size="small"
                    fullWidth
                    onClick={handleSave}
                    disabled={saving || !form.nome.trim() || !form.email.trim()}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
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
              { icon: <BusinessIcon />, label: 'Organizações', value: organizacoes.length, color: '#3F51B5', bg: '#EEF2FF' },
              { icon: <FolderOpenIcon />, label: 'Projetos', value: totalProjetos, color: '#16A34A', bg: '#DCFCE7' },
              { icon: <HistoryIcon />, label: 'Acesso global', value: user?.adminPlataforma ? 'Admin' : '—', color: roleCfg.color, bg: roleCfg.bg },
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

          {/* Onde você atua */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Onde você atua</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Seus papéis em cada organização e projeto
              </Typography>
              {organizacoes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Você ainda não participa de nenhuma organização. Crie uma ou aceite um convite.
                </Typography>
              )}
              {organizacoes.map((o, idx) => (
                <Box key={o.id}>
                  <Box sx={{ py: 1.5 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, cursor: 'pointer' }}
                      onClick={() => navigate(`/organizations/${o.id}/projects`)}
                    >
                      <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.nome}</Typography>
                      <Chip size="small" label={o.papel ? PAPEL_ORGANIZACAO_LABEL[o.papel] : 'Convidado em projetos'}
                        sx={{ height: 20, fontSize: 11 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 3.5 }}>
                      {o.projetos.map((p) => (
                        <Box
                          key={p.id}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover .nome': { color: 'primary.main' } }}
                          onClick={() => navigate(`/organizations/${o.id}/projects/${p.id}`)}
                        >
                          <FolderOpenIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                          <Typography className="nome" variant="caption" sx={{ flex: 1, minWidth: 0 }} noWrap>{p.nome}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {p.papeis.map((x) => PAPEL_PROJETO_LABEL[x]).join(' + ')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  {idx < organizacoes.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
