import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import WikiEditLayout from './WikiEditLayout';
import { fetchProjectWiki, saveProjectWiki } from '../../services/wikiService';
import { useSnackbar } from '../../context/SnackbarContext';
import type { WikiProjetoApi, WikiProjetoUpdateRequest } from '../../types/wiki';

export default function WikiEditDescricao() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [descricaoProblema, setDescricaoProblema] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetchProjectWiki(projectId)
      .then((data) => {
        setWiki(data);
        setObjetivoGeral(data.objetivoGeral ?? '');
        setDescricaoProblema(data.descricaoProblema ?? '');
      })
      .catch(() => notify('Falha ao carregar Wiki', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  const handleSave = async () => {
    if (!projectId || !wiki) return;
    setSaving(true);
    try {
      const payload: WikiProjetoUpdateRequest = {
        descricaoProblema,
        publicoAlvo: wiki.publicoAlvo,
        objetivoGeral,
        objetivosEspecificos: wiki.objetivosEspecificos,
        kpis: wiki.kpis,
        restricoesPrazo: wiki.restricoesPrazo,
        restricoesOrcamento: wiki.restricoesOrcamento,
        tecnologiasObrigatorias: wiki.tecnologiasObrigatorias,
        regulamentacoes: wiki.regulamentacoes,
      };
      await saveProjectWiki(projectId, payload);
      notify('Informações salvas com sucesso', 'success');
      navigate(backUrl);
    } catch {
      notify('Falha ao salvar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <WikiEditLayout
      title="Descrição Geral do Produto"
      subtitle="Nome e descrição geral do projeto"
      onBack={() => navigate(backUrl)}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: '#374151' }}>
            Nome do projeto
          </Typography>
          <Typography
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 1,
              fontSize: '14px',
              color: '#6B7280',
            }}
          >
            {wiki?.projetoNome ?? '—'} <em style={{ fontSize: 12 }}>(gerenciado via configurações do projeto)</em>
          </Typography>
        </Box>

        <TextField
          label="Objetivo principal"
          multiline
          rows={4}
          fullWidth
          value={objetivoGeral}
          onChange={(e) => setObjetivoGeral(e.target.value)}
          placeholder="Descreva o objetivo principal do projeto..."
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Problema a ser resolvido"
          multiline
          rows={4}
          fullWidth
          value={descricaoProblema}
          onChange={(e) => setDescricaoProblema(e.target.value)}
          placeholder="Descreva o problema que o projeto resolve..."
          InputLabelProps={{ shrink: true }}
        />

        <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(backUrl)} disabled={saving}>
            Cancelar
          </Button>
        </Box>
      </Box>
    </WikiEditLayout>
  );
}