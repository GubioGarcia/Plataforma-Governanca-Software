import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import WikiEditLayout from './WikiEditLayout';
import { fetchProjectWiki } from '../../services/wikiService';
import { buscarProjetoPorId, atualizarProjeto } from '../../services/projetoService';
import { useSnackbar } from '../../context/SnackbarContext';
import type { WikiProjetoApi } from '../../types/wiki';

export default function WikiEditDescricao() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [projetoStatusId, setProjetoStatusId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetchProjectWiki(projectId),
      buscarProjetoPorId(projectId),
    ])
      .then(([wikiData, projetoData]) => {
        setWiki(wikiData);
        setNome(wikiData.projetoNome ?? '');
        setDescricao(wikiData.projetoDescricao ?? '');
        // Preserva o statusId atual para não perder o status ao salvar
        setProjetoStatusId(projetoData.status?.id);
      })
      .catch(() => notify('Falha ao carregar dados do projeto', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  const handleSave = async () => {
    if (!projectId || !wiki) return;
    if (!nome.trim()) {
      notify('O nome do projeto é obrigatório', 'error');
      return;
    }
    setSaving(true);
    try {
      await atualizarProjeto(projectId, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        statusId: projetoStatusId,
      });
      notify('Descrição do projeto salva com sucesso', 'success');
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
      subtitle="Nome e descrição do projeto"
      onBack={() => navigate(backUrl)}
      infoRows={[
        { label: 'Criado em', value: wiki?.projetoDataCriacao },
        { label: 'Última atualização', value: wiki?.projetoDataAtualizacao },
      ]}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Nome do projeto"
          fullWidth
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do projeto..."
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Descrição"
          multiline
          rows={5}
          fullWidth
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o projeto de forma geral..."
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
