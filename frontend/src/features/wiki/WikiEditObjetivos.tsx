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

export default function WikiEditObjetivos() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [objetivosEspecificos, setObjetivosEspecificos] = useState('');
  const [kpis, setKpis] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetchProjectWiki(projectId)
      .then((data) => {
        setWiki(data);
        setObjetivoGeral(data.objetivoGeral ?? '');
        setObjetivosEspecificos(data.objetivosEspecificos ?? '');
        setKpis(data.kpis ?? '');
      })
      .catch(() => notify('Falha ao carregar Wiki', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  const handleSave = async () => {
    if (!projectId || !wiki) return;
    setSaving(true);
    try {
      const payload: WikiProjetoUpdateRequest = {
        ...wiki,
        objetivoGeral,
        objetivosEspecificos,
        kpis,
      };
      await saveProjectWiki(projectId, payload);
      notify('Objetivos salvos com sucesso', 'success');
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
      title="Objetivos do Projeto"
      subtitle="Objetivo geral, Objetivos específicos e Indicadores de sucesso (KPIs)"
      onBack={() => navigate(backUrl)}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>
            Objetivo geral
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={objetivoGeral}
            onChange={(e) => setObjetivoGeral(e.target.value)}
            placeholder="Defina o objetivo principal do projeto..."
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>
            Objetivos específicos
          </Typography>
          <TextField
            multiline
            rows={5}
            fullWidth
            value={objetivosEspecificos}
            onChange={(e) => setObjetivosEspecificos(e.target.value)}
            placeholder="Liste os objetivos específicos, um por linha ou separados por ponto e vírgula..."
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>
            Indicadores de Sucesso (KPIs)
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={kpis}
            onChange={(e) => setKpis(e.target.value)}
            placeholder="Descreva os indicadores que demonstram o sucesso do projeto..."
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(backUrl)} disabled={saving}>Cancelar</Button>
        </Box>
      </Box>
    </WikiEditLayout>
  );
}