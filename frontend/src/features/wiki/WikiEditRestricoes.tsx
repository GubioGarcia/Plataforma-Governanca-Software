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

export default function WikiEditRestricoes() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restricoesPrazo, setRestricoesPrazo] = useState('');
  const [restricoesOrcamento, setRestricoesOrcamento] = useState('');
  const [tecnologiasObrigatorias, setTecnologiasObrigatorias] = useState('');
  const [regulamentacoes, setRegulamentacoes] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetchProjectWiki(projectId)
      .then((data) => {
        setWiki(data);
        setRestricoesPrazo(data.restricoesPrazo ?? '');
        setRestricoesOrcamento(data.restricoesOrcamento ?? '');
        setTecnologiasObrigatorias(data.tecnologiasObrigatorias ?? '');
        setRegulamentacoes(data.regulamentacoes ?? '');
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
        restricoesPrazo,
        restricoesOrcamento,
        tecnologiasObrigatorias,
        regulamentacoes,
      };
      await saveProjectWiki(projectId, payload);
      notify('Restrições salvas com sucesso', 'success');
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
      title="Restrições do Projeto"
      subtitle="Quais limitações externas ou condições obrigatórias influenciam o desenvolvimento do produto"
      onBack={() => navigate(backUrl)}
      infoRows={[
        { label: 'Criado em',          value: wiki?.dataCriacao },
        { label: 'Última atualização', value: wiki?.dataAtualizacao },
      ]}
      commentProps={wiki ? {
        entidadeTipo:  'WIKI_RESTRICOES',
        entidadeId:    wiki.id,
        projetoId:     projectId!,
        organizacaoId: orgId!,
      } : undefined}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>Prazo</Typography>
          <TextField
            multiline rows={3} fullWidth
            value={restricoesPrazo}
            onChange={(e) => setRestricoesPrazo(e.target.value)}
            placeholder="Informe restrições de prazo e datas importantes..."
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>Orçamento</Typography>
          <TextField
            multiline rows={3} fullWidth
            value={restricoesOrcamento}
            onChange={(e) => setRestricoesOrcamento(e.target.value)}
            placeholder="Informe restrições financeiras e limites de orçamento..."
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>Tecnologias obrigatórias</Typography>
          <TextField
            multiline rows={4} fullWidth
            value={tecnologiasObrigatorias}
            onChange={(e) => setTecnologiasObrigatorias(e.target.value)}
            placeholder="Liste as tecnologias que devem ser utilizadas no projeto..."
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>Regulamentações</Typography>
          <TextField
            multiline rows={4} fullWidth
            value={regulamentacoes}
            onChange={(e) => setRegulamentacoes(e.target.value)}
            placeholder="Informe normas, leis e regulamentações aplicáveis ao projeto..."
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
