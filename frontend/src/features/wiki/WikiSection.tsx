import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import StatusChip from '../../components/common/StatusChip';
import ValidationBar from './ValidationBar';
import type { WikiSection as WikiSectionType, StatusWikiSection } from '../../types/wiki';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';

interface WikiSectionProps {
  title: string;
  icon: string;
  section: WikiSectionType;
  onUpdate?: (section: WikiSectionType) => void;
}

export default function WikiSection({ title, icon, section, onUpdate }: WikiSectionProps) {
  const { canEdit, canSendToValidation, canVote, canValidateFinal, user } = usePermissions();
  const { notify } = useSnackbar();
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(section.conteudo);

  const responderam = section.votos.filter((v: typeof section.votos[0]) => v.voto !== null).length;
  const participacao =
    section.totalStakeholders > 0 ? Math.round((responderam / section.totalStakeholders) * 100) : 0;

  const userVoto = section.votos.find((v: typeof section.votos[0]) => v.userId === user?.id);
  const jaVotou = Boolean(userVoto?.voto);

  const handleSendToValidation = () => {
    onUpdate?.({ ...section, status: 'EM_VALIDACAO' });
    notify('Seção enviada para validação');
  };

  const handleVote = (voto: 'APROVADO' | 'REPROVADO') => {
    const newVotos = section.votos.map((v: typeof section.votos[0]) =>
      v.userId === user?.id ? { ...v, voto, votadoEm: new Date().toISOString() } : v
    );
    const novosAprovados = newVotos.filter((v: typeof newVotos[0]) => v.voto === 'APROVADO').length;
    const novosReprovados = newVotos.filter((v: typeof newVotos[0]) => v.voto === 'REPROVADO').length;
    onUpdate?.({ ...section, votos: newVotos, aprovacoes: novosAprovados, reprovacoes: novosReprovados });
    notify(voto === 'APROVADO' ? 'Voto registrado: Aprovado' : 'Voto registrado: Reprovado', voto === 'APROVADO' ? 'success' : 'warning');
  };

  const handleValidate = () => {
    onUpdate?.({ ...section, status: 'VALIDADO' });
    notify('Seção validada!', 'success');
  };

  const handleSaveEdit = () => {
    onUpdate?.({ ...section, conteudo: editContent });
    setEditOpen(false);
    notify('Conteúdo salvo');
  };

  const cardBorderColor =
    section.status === 'EM_VALIDACAO'
      ? '#D97706'
      : section.status === 'APROVADO'
      ? '#16A34A'
      : section.status === 'VALIDADO'
      ? '#7C3AED'
      : section.status === 'REPROVADO'
      ? '#DC2626'
      : '#E8EAED';

  return (
    <>
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: 2,
          border: `1px solid ${cardBorderColor}`,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1.75,
            cursor: 'pointer',
            borderBottom: expanded ? '1px solid #E8EAED' : 'none',
            '&:hover': { bgcolor: '#FAFBFC' },
          }}
          onClick={() => setExpanded((p) => !p)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '18px', lineHeight: 1 }}>{icon}</Typography>
            <Typography variant="h5">{title}</Typography>
            <StatusChip status={section.status as StatusWikiSection} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
            {/* Edit — Gestor/Analista + RASCUNHO/REPROVADO */}
            {canEdit && (section.status === 'RASCUNHO' || section.status === 'REPROVADO') && (
              <Tooltip title="Editar conteúdo">
                <IconButton size="small" onClick={() => { setEditContent(section.conteudo); setEditOpen(true); }}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Send to validation — Gestor + RASCUNHO/REPROVADO */}
            {canSendToValidation && (section.status === 'RASCUNHO' || section.status === 'REPROVADO') && (
              <Button
                size="small"
                variant="contained"
                startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                onClick={handleSendToValidation}
                sx={{ fontSize: '11px', py: 0.5 }}
              >
                Enviar para Validação
              </Button>
            )}

            {/* Vote buttons — visível para stakeholders em EM_VALIDACAO */}
            {canVote && section.status === 'EM_VALIDACAO' && !jaVotou && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<ThumbUpIcon sx={{ fontSize: 13 }} />}
                  onClick={() => handleVote('APROVADO')}
                  sx={{ fontSize: '11px', py: 0.5, borderColor: '#16A34A', color: '#16A34A' }}
                >
                  Aprovar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<ThumbDownIcon sx={{ fontSize: 13 }} />}
                  onClick={() => handleVote('REPROVADO')}
                  sx={{ fontSize: '11px', py: 0.5 }}
                >
                  Reprovar
                </Button>
              </>
            )}

            {/* Show voted state */}
            {jaVotou && section.status === 'EM_VALIDACAO' && (
              <Typography variant="caption" sx={{ color: userVoto?.voto === 'APROVADO' ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                Você: {userVoto?.voto}
              </Typography>
            )}

            {/* Validate final — Gestor + APROVADO */}
            {canValidateFinal && section.status === 'APROVADO' && section.aprovacoes >= Math.ceil(section.totalStakeholders / 2) && (
              <Button
                size="small"
                variant="contained"
                color="secondary"
                startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                onClick={handleValidate}
                sx={{ fontSize: '11px', py: 0.5 }}
              >
                Validar
              </Button>
            )}

            <IconButton size="small">
              {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={expanded}>
          <Box sx={{ px: 3, py: 2 }}>
            {section.status === 'EM_VALIDACAO' || section.status === 'APROVADO' || section.status === 'VALIDADO' ? (
              <ValidationBar
                participacao={participacao}
                totalStakeholders={section.totalStakeholders}
                responderam={responderam}
                votos={section.votos}
              />
            ) : null}

            {section.conteudo ? (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-line',
                  color: '#374151',
                  lineHeight: 1.8,
                }}
              >
                {section.conteudo}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#9CA3AF', py: 1 }}>
                Conteúdo ainda não preenchido.{' '}
                {canEdit && 'Clique em Editar para adicionar.'}
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Editar — {title}</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Digite o conteúdo desta seção..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
