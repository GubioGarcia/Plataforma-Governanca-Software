import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import WikiEditLayout from './WikiEditLayout';
import { fetchProjectWiki, saveProjectWiki } from '../../services/wikiService';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { extractApiErrorMessage } from '../../utils/apiError';
import type { WikiProjetoApi, WikiProjetoUpdateRequest } from '../../types/wiki';
import type { AuditCardHandle } from '../audit/AuditCard';

const MAX_CHARS = 1000;

export default function WikiEditPublico() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const auditCardRef = useRef<AuditCardHandle>(null);

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publicoAlvo, setPublicoAlvo] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetchProjectWiki(projectId)
      .then((data) => { setWiki(data); setPublicoAlvo(data.publicoAlvo ?? ''); })
      .catch(() => notify('Falha ao carregar Wiki', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  const handleSave = async () => {
    if (!projectId || !wiki) return;
    setSaving(true);
    try {
      const payload: WikiProjetoUpdateRequest = { ...wiki, publicoAlvo };
      await saveProjectWiki(projectId, payload);
      notify('Público-alvo salvo com sucesso', 'success');
      auditCardRef.current?.reload();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Falha ao salvar. Tente novamente.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <WikiEditLayout
      title="Usuários do Sistema"
      subtitle="Descritivo dos usuários finais do sistema"
      onBack={() => navigate(backUrl)}
      infoRows={[
        { label: 'Criado em',          value: wiki?.dataCriacao },
        { label: 'Última atualização', value: wiki?.dataAtualizacao },
      ]}
      commentProps={wiki ? {
        entidadeTipo:  'WIKI_PUBLICO',
        entidadeId:    wiki.id,
        projetoId:     projectId!,
        organizacaoId: orgId!,
      } : undefined}
      auditProps={wiki ? {
        entidadeTipo: 'WIKI_PUBLICO',
        entidadeId:   wiki.id,
      } : undefined}
      auditCardRef={auditCardRef}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Público-alvo / Usuários do sistema"
          multiline
          rows={10}
          fullWidth
          value={publicoAlvo}
          onChange={(e) => setPublicoAlvo(e.target.value)}
          placeholder="Descreva os usuários finais do sistema, seus perfis, necessidades e características..."
          InputLabelProps={{ shrink: true }}
          InputProps={{ readOnly: isStakeholder }}
          disabled={isStakeholder}
          inputProps={{ maxLength: MAX_CHARS }}
          helperText={!isStakeholder ? `${publicoAlvo.length}/${MAX_CHARS}` : undefined}
          FormHelperTextProps={{ sx: { textAlign: 'right' } }}
        />
        {!isStakeholder && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(backUrl)} disabled={saving}>Cancelar</Button>
        </Box>
        )}
      </Box>
    </WikiEditLayout>
  );
}
