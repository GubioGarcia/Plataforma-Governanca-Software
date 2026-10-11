import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import MailIcon from '@mui/icons-material/MarkEmailUnread';
import { aceitarConvite, listarMeusConvites, recusarConvite, type Convite } from '../../services/acessoService';
import { isApiError } from '../../services/userService';
import { useAuth } from '../../context/useAuth';
import { useSnackbar } from '../../context/SnackbarContext';

const PAPEL_LABEL: Record<Convite['papel'], string> = {
  GESTOR: 'Gestor',
  MEMBRO: 'Membro',
  STAKEHOLDER: 'Stakeholder',
};

/**
 * Convites pendentes para o e-mail do usuário. Ao aceitar, o backend inclui o usuário
 * no grupo do Keycloak; aqui recarregamos as permissões (/me) e avisamos a tela.
 */
export default function ConvitesPendentes({ onAceito }: { onAceito?: () => void }) {
  const { recarregarPermissoes } = useAuth();
  const { notify } = useSnackbar();
  const [convites, setConvites] = useState<Convite[]>([]);
  const [processando, setProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setConvites(await listarMeusConvites());
    } catch {
      setConvites([]); // não bloqueia a tela por causa dos convites
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function responder(convite: Convite, aceitar: boolean) {
    setProcessando(convite.id);
    try {
      if (aceitar) {
        await aceitarConvite(convite.id);
        await recarregarPermissoes();
        notify(`Você agora participa de ${convite.projetoNome ?? convite.organizacaoNome}`, 'success');
        onAceito?.();
      } else {
        await recusarConvite(convite.id);
        notify('Convite recusado', 'info');
      }
      carregar();
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao responder o convite' : 'Erro ao responder o convite', 'error');
    } finally {
      setProcessando(null);
    }
  }

  if (convites.length === 0) return null;

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'primary.light', bgcolor: '#F8FAFF', mb: 3 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <MailIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Convites pendentes ({convites.length})
          </Typography>
        </Box>
        {convites.map((c) => (
          <Box
            key={c.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {c.projetoNome ? `Projeto ${c.projetoNome}` : `Organização ${c.organizacaoNome}`} · {PAPEL_LABEL[c.papel]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {c.projetoNome ? `${c.organizacaoNome} · ` : ''}convidado por {c.convidadoPorNome ?? '—'}
              </Typography>
            </Box>
            <Button size="small" color="inherit" disabled={processando === c.id} onClick={() => responder(c, false)}>
              Recusar
            </Button>
            <Button size="small" variant="contained" disabled={processando === c.id} onClick={() => responder(c, true)}>
              Aceitar
            </Button>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
