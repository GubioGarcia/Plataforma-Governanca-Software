import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import WikiEditLayout from './WikiEditLayout';
import { fetchProjectWiki } from '../../services/wikiService';
import { buscarProjetoPorId, atualizarProjeto, listarStatusProjeto } from '../../services/projetoService';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { WikiProjetoApi } from '../../types/wiki';
import type { AuditCardHandle } from '../audit/AuditCard';
import type { StatusProjetoAPI } from '../../types/projeto';

export default function WikiEditDescricao() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();
  const backUrl = `/organizations/${orgId}/projects/${projectId}/wiki`;

  const auditCardRef = useRef<AuditCardHandle>(null);

  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [projetoStatusId, setProjetoStatusId] = useState<string | undefined>(undefined);
  const [statusOptions, setStatusOptions] = useState<StatusProjetoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetchProjectWiki(projectId),
      buscarProjetoPorId(projectId),
      listarStatusProjeto(),
    ])
      .then(([wikiData, projetoData, statuses]) => {
        setWiki(wikiData);
        setNome(wikiData.projetoNome ?? '');
        setDescricao(wikiData.projetoDescricao ?? '');
        setProjetoStatusId(projetoData.status?.id);
        const sorted = [...statuses].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        setStatusOptions(sorted);
      })
      .catch(() => notify('Falha ao carregar dados do projeto', 'error'))
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  const handleSave = async () => {
    if (!projectId || !wiki) return;
    if (!nome.trim()) { notify('O nome do projeto é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      await atualizarProjeto(projectId, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        statusId: projetoStatusId,
      });
      notify('Descrição do projeto salva com sucesso', 'success');
      // Recarrega o card de auditoria para exibir as novas entradas
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
      title="Descrição Geral do Produto"
      subtitle="Nome e descrição do projeto"
      onBack={() => navigate(backUrl)}
      infoRows={[
        { label: 'Criado em',          value: wiki?.projetoDataCriacao },
        { label: 'Última atualização', value: wiki?.projetoDataAtualizacao },
      ]}
      commentProps={wiki ? {
        entidadeTipo:  'WIKI_DESCRICAO',
        entidadeId:    wiki.id,
        projetoId:     projectId!,
        organizacaoId: orgId!,
      } : undefined}
      auditProps={projectId ? {
        entidadeTipo: 'PROJETO',
        entidadeId:   projectId,
      } : undefined}
      auditCardRef={auditCardRef}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>
            Nome do projeto
          </Typography>
          <TextField
            fullWidth
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do projeto..."
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: isStakeholder }}
            disabled={isStakeholder}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>
            Descrição
          </Typography>
          <TextField
            multiline
            rows={5}
            fullWidth
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o projeto de forma geral..."
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: isStakeholder }}
            disabled={isStakeholder}
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#374151' }}>
            Status do Projeto
          </Typography>
          <FormControl fullWidth disabled={isStakeholder}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={projetoStatusId ?? ''}
              onChange={(e) => setProjetoStatusId(e.target.value || undefined)}
              inputProps={{ readOnly: isStakeholder }}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nome.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {!isStakeholder && (
        <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(backUrl)} disabled={saving}>
            Cancelar
          </Button>
        </Box>
        )}
      </Box>
    </WikiEditLayout>
  );
}
