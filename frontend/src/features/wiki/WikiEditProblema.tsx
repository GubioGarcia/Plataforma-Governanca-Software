import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import WikiEditLayout from './WikiEditLayout';
import { fetchProjectWiki, saveProjectWiki } from '../../services/wikiService';
import { useSnackbar } from '../../context/SnackbarContext';
import type { WikiProjetoApi, WikiProjetoUpdateRequest } from '../../types/wiki';
import type { AuditCardHandle } from '../audit/AuditCard';

export default function WikiEditProblema() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const auditCardRef = useRef<AuditCardHandle>(null);

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [descricaoProblema, setDescricaoProblema] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetchProjectWiki(projectId)
      .then((data) => { setWiki(data); setDescricaoProblema(data.descricaoProblema ?? ''); })
      .catch(() => notify('Falha ao carregar Wiki', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  const handleSave = async () => {
    if (!projectId || !wiki) return;
    setSaving(true);
    try {
      const payload: WikiProjetoUpdateRequest = { ...wiki, descricaoProblema };
      await saveProjectWiki(projectId, payload);
      notify('Problema de negócio salvo com sucesso', 'success');
      auditCardRef.current?.reload();
    } catch {
      notify('Falha ao salvar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <WikiEditLayout
      title="Problema de Negócio"
      subtitle="Contexto atual, Dor do cliente, Impacto se não for atendido"
      onBack={() => navigate(backUrl)}
      infoRows={[
        { label: 'Criado em',          value: wiki?.dataCriacao },
        { label: 'Última atualização', value: wiki?.dataAtualizacao },
      ]}
      commentProps={wiki ? {
        entidadeTipo:  'WIKI_PROBLEMA',
        entidadeId:    wiki.id,
        projetoId:     projectId!,
        organizacaoId: orgId!,
      } : undefined}
      auditProps={wiki ? {
        entidadeTipo: 'WIKI_PROBLEMA',
        entidadeId:   wiki.id,
      } : undefined}
      auditCardRef={auditCardRef}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Descrição do Problema / Oportunidade"
          multiline
          rows={10}
          fullWidth
          value={descricaoProblema}
          onChange={(e) => setDescricaoProblema(e.target.value)}
          placeholder="Descreva o problema ou oportunidade identificada, o contexto atual, a dor do cliente e o impacto caso não seja atendido..."
          InputLabelProps={{ shrink: true }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(backUrl)} disabled={saving}>Cancelar</Button>
        </Box>
      </Box>
    </WikiEditLayout>
  );
}
