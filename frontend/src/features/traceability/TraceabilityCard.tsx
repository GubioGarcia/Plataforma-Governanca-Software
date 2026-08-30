import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HubIcon from '@mui/icons-material/Hub';
import LinkIcon from '@mui/icons-material/Link';
import StorageIcon from '@mui/icons-material/Storage';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { listarRequisitosPorProjeto } from '../../services/requirementService';
import { obterModelo } from '../../services/dataModelService';
import { criarVinculo, deletarVinculo, listarVinculos } from '../../services/traceabilityService';
import {
  construirRelacoes,
  CORES_TIPO_VINCULO,
  ROTULOS_TIPO_VINCULO,
} from '../../utils/traceability';
import type { TipoVinculoRequisito, VinculoRequisitoAPI } from '../../types/traceability';
import type { ModeloDadosProjeto } from '../../types/dataModel';
import type { RequisitoAPI } from '../../types/requirementAPI';
import { ETIQUETA, FONTE_DADOS } from '../../theme/tokens';
import ImpactAnalysisDrawer from './ImpactAnalysisDrawer';

interface TraceabilityCardProps {
  organizacaoId: string;
  projetoId: string;
  requisitoId: string;
  /** Alterado pela tela pai quando os impactos de dados mudam, para recarregar as relações indiretas. */
  versaoDados?: number;
}

const MODELO_VAZIO: ModeloDadosProjeto = {
  entidades: [],
  atributos: [],
  relacionamentos: [],
  impactos: [],
};

/**
 * Card de rastreabilidade exibido no detalhe do requisito.
 *
 * Separa as duas camadas do modelo: os vínculos diretos, que o usuário
 * cadastra e remove aqui, e os relacionados indiretos, apenas exibidos —
 * eles existem porque dois requisitos manipulam a mesma entidade de dados.
 */
export default function TraceabilityCard({
  organizacaoId,
  projetoId,
  requisitoId,
  versaoDados = 0,
}: TraceabilityCardProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();

  const [requisitos, setRequisitos] = useState<RequisitoAPI[]>([]);
  const [vinculos, setVinculos] = useState<VinculoRequisitoAPI[]>([]);
  const [modelo, setModelo] = useState<ModeloDadosProjeto>(MODELO_VAZIO);
  const [carregando, setCarregando] = useState(true);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState({ requisitoDestinoId: '', tipo: 'DEPENDE_DE' as TipoVinculoRequisito });
  const [salvando, setSalvando] = useState(false);
  const [analiseAberta, setAnaliseAberta] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      let lista: RequisitoAPI[] = [];
      try {
        lista = await listarRequisitosPorProjeto(projetoId);
      } catch {
        // Sem a listagem não há como montar as relações; o card mostra vazio.
      }
      const ordenados = [...lista].sort((a, b) => (a.codigo ?? '').localeCompare(b.codigo ?? ''));
      const ids = ordenados.map((r) => r.id);
      setRequisitos(ordenados);

      const [vinculosCarregados, modeloCarregado] = await Promise.all([
        listarVinculos(projetoId, ids),
        obterModelo(projetoId, ids),
      ]);
      setVinculos(vinculosCarregados);
      setModelo(modeloCarregado);
    } finally {
      setCarregando(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar, versaoDados]);

  const requisitoPorId = useMemo(() => new Map(requisitos.map((r) => [r.id, r])), [requisitos]);

  const relacoes = useMemo(
    () => construirRelacoes(vinculos, modelo.impactos, modelo.entidades),
    [vinculos, modelo.impactos, modelo.entidades],
  );

  /** Vínculos diretos em que este requisito é origem ou destino. */
  const vinculosDoRequisito = useMemo(
    () => vinculos.filter((v) => v.requisitoOrigemId === requisitoId || v.requisitoDestinoId === requisitoId),
    [vinculos, requisitoId],
  );

  const relacionadosIndiretos = useMemo(
    () =>
      relacoes.filter((r) => r.origem === 'INDIRETO' && r.origemId === requisitoId),
    [relacoes, requisitoId],
  );

  const candidatos = useMemo(
    () => requisitos.filter((r) => r.id !== requisitoId),
    [requisitos, requisitoId],
  );

  async function salvarVinculo() {
    if (!form.requisitoDestinoId) return;
    setSalvando(true);
    try {
      const criado = await criarVinculo(projetoId, {
        requisitoOrigemId: requisitoId,
        requisitoDestinoId: form.requisitoDestinoId,
        tipo: form.tipo,
      });
      setVinculos((atual) => [...atual, criado]);
      setDialogAberto(false);
      setForm({ requisitoDestinoId: '', tipo: 'DEPENDE_DE' });
      notify('Vínculo criado com sucesso', 'success');
    } finally {
      setSalvando(false);
    }
  }

  async function removerVinculo(vinculoId: string) {
    await deletarVinculo(projetoId, vinculoId);
    setVinculos((atual) => atual.filter((v) => v.id !== vinculoId));
    notify('Vínculo removido', 'info');
  }

  function abrirRequisito(id: string) {
    navigate(`/organizations/${organizacaoId}/projects/${projetoId}/requirements/${id}`);
  }

  const totalRelacoes = vinculosDoRequisito.length + relacionadosIndiretos.length;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HubIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Rastreabilidade
            </Typography>
            {totalRelacoes > 0 && (
              <Chip label={totalRelacoes} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Analisar impacto de uma mudança neste requisito">
              <IconButton size="small" onClick={() => setAnaliseAberta(true)}>
                <HubIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
            {!isStakeholder && (
              <Tooltip title="Vincular a outro requisito">
                <IconButton size="small" onClick={() => setDialogAberto(true)}>
                  <AddIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {carregando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : (
          <>
            {/* ── Vínculos diretos ── */}
            <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Vínculos diretos
            </Typography>
            {vinculosDoRequisito.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, border: '1.5px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <LinkIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Nenhum vínculo cadastrado com outro requisito.
                </Typography>
                {!isStakeholder && (
                  <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogAberto(true)}>
                    Criar vínculo
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {vinculosDoRequisito.map((vinculo) => {
                  const ehOrigem = vinculo.requisitoOrigemId === requisitoId;
                  const outroId = ehOrigem ? vinculo.requisitoDestinoId : vinculo.requisitoOrigemId;
                  const outro = requisitoPorId.get(outroId);
                  const cor = CORES_TIPO_VINCULO[vinculo.tipo] ?? theme.palette.primary.main;

                  return (
                    <Box
                      key={vinculo.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeft: `3px solid ${cor}`,
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Chip
                        label={ehOrigem ? ROTULOS_TIPO_VINCULO[vinculo.tipo] : `${ROTULOS_TIPO_VINCULO[vinculo.tipo]} (inverso)`}
                        size="small"
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: alpha(cor, 0.12), color: cor }}
                      />
                      <Box
                        onClick={() => abrirRequisito(outroId)}
                        sx={{ cursor: 'pointer', flex: 1, minWidth: 160, '&:hover': { color: 'primary.main' } }}
                      >
                        <Typography
                          component="span"
                          sx={{ fontFamily: FONTE_DADOS, fontSize: 11.5, fontWeight: 600, display: 'block' }}
                        >
                          {outro?.codigo ?? 'REQ-???'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {outro?.titulo ?? 'Requisito não encontrado'}
                        </Typography>
                      </Box>
                      {!isStakeholder && (
                        <Tooltip title="Remover vínculo">
                          <IconButton size="small" color="error" onClick={() => removerVinculo(vinculo.id)}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* ── Relacionados indiretos ── */}
            <Divider sx={{ my: 2.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
                Relacionados indiretos
              </Typography>
              <Tooltip title="Deduzidos automaticamente: outros requisitos que manipulam as mesmas entidades de dados">
                <StorageIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
              </Tooltip>
            </Box>

            {relacionadosIndiretos.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Nenhum outro requisito manipula as mesmas entidades de dados.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {relacionadosIndiretos.map((relacao) => {
                  const outro = requisitoPorId.get(relacao.destinoId);
                  return (
                    <Box
                      key={relacao.destinoId}
                      onClick={() => abrirRequisito(relacao.destinoId)}
                      sx={{
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.light' },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <Box component="span" sx={{ fontFamily: FONTE_DADOS, fontSize: 11.5 }}>
                          {outro?.codigo ?? 'REQ-???'}
                        </Box>{' '}
                        <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                          {outro?.titulo ?? 'Requisito não encontrado'}
                        </Box>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        Compartilha: {relacao.entidadesCompartilhadas?.join(', ')}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </CardContent>

      {/* ── Dialog: novo vínculo ── */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Vincular a outro requisito</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de vínculo</InputLabel>
            <Select
              label="Tipo de vínculo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoVinculoRequisito }))}
            >
              {(Object.keys(ROTULOS_TIPO_VINCULO) as TipoVinculoRequisito[]).map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {ROTULOS_TIPO_VINCULO[tipo]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Requisito</InputLabel>
            <Select
              label="Requisito"
              value={form.requisitoDestinoId}
              onChange={(e) => setForm((f) => ({ ...f, requisitoDestinoId: e.target.value }))}
            >
              {candidatos.map((requisito) => (
                <MenuItem key={requisito.id} value={requisito.id}>
                  {requisito.codigo} — {requisito.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogAberto(false)} color="inherit" size="small" disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvarVinculo} variant="contained" size="small" disabled={salvando || !form.requisitoDestinoId}>
            {salvando ? 'Salvando...' : 'Criar vínculo'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImpactAnalysisDrawer
        aberto={analiseAberta}
        requisitoOrigemId={requisitoId}
        requisitos={requisitos}
        relacoes={relacoes}
        aoFechar={() => setAnaliseAberta(false)}
        aoAbrirRequisito={abrirRequisito}
      />
    </Card>
  );
}
