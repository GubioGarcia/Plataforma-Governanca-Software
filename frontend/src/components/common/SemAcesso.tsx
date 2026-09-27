import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import LockIcon from '@mui/icons-material/LockOutlined';
import type { SituacaoAcesso } from '../../hooks/useAcessoRota';

/**
 * Tela para organização/projeto que o usuário não pode abrir (nunca participou ou
 * foi removido). Enquanto o acesso é verificado, mostra um carregamento.
 */
export default function SemAcesso({ situacao, alvo }: { situacao: Exclude<SituacaoAcesso, 'ok'>; alvo: 'organização' | 'projeto' }) {
  const navigate = useNavigate();

  if (situacao === 'verificando') {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4, textAlign: 'center' }}>
      <LockIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
      <Typography variant="h4">Você não tem acesso a esta {alvo}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
        Ela não existe ou você não participa dela. Se você foi removido recentemente,
        peça um novo convite a quem administra a {alvo}.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/organizations')}>
        Ir para minhas organizações
      </Button>
    </Box>
  );
}
