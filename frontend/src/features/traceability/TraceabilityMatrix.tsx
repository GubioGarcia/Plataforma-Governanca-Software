import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HubIcon from '@mui/icons-material/Hub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AnimacoesGlobais from '../../components/common/AnimacoesGlobais';
import EmptyState from '../../components/common/EmptyState';
import MetricBand from '../../components/common/MetricBand';
import PageHeading from '../../components/common/PageHeading';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { listarRequisitosPorProjeto } from '../../services/requirementService';
import { obterModelo } from '../../services/dataModelService';
import {
  criarVinculo,
  deletarVinculo,
  listarVinculos,
  restaurarVinculos,
} from '../../services/traceabilityService';
import {
  analisarImpacto,
  chaveCelula,
  construirMatriz,
  construirRelacoes,
  CORES_TIPO_VINCULO,
  ROTULOS_TIPO_VINCULO,
  SIGLAS_TIPO_VINCULO,
} from '../../utils/traceability';
import { ANIMACAO, ETIQUETA, FONTE_DADOS } from '../../theme/tokens';
import type { CelulaMatriz, TipoVinculoRequisito, VinculoRequisitoAPI } from '../../types/traceability';
import type { ModeloDadosProjeto } from '../../types/dataModel';
import type { RequisitoAPI } from '../../types/requirementAPI';
import ImpactAnalysisDrawer from './ImpactAnalysisDrawer';

const MODELO_VAZIO: ModeloDadosProjeto = {
  entidades: [],
  atributos: [],
  relacionamentos: [],
  impactos: [],
};

const LADO_CELULA = 54;
const LARGURA_EIXO = 214;
const ALTURA_EIXO_VERTICAL = 104;
/** Passo do escalonamento da plotagem inicial, em milissegundos. */
const PASSO_PLOTAGEM = 18;
/** Passo da onda de propagação, por salto percorrido. */
const PASSO_PROPAGACAO = 170;

type Filtro = 'TODOS' | 'DIRETOS' | 'INDIRETOS';

interface SelecaoCelula {
  origemId: string;
  destinoId: string;
  celula: CelulaMatriz;
}

/**
 * Matriz de rastreabilidade entre requisitos.
 *
 * Cruza todos os requisitos do projeto em um grid requisito × requisito,
 * combinando duas camadas: os vínculos DIRETOS cadastrados manualmente e as
 * relações INDIRETAS derivadas do compartilhamento de entidades de dados.
 * Nada é materializado — a matriz é recalculada a cada leitura.
 *
 * A leitura é tratada como um instrumento: grade milimetrada, coordenadas em
 * monoespaçada e marcadores plotados. Ao abrir a análise de impacto, a onda de
 * propagação percorre a matriz salto a salto, mostrando o alcance da mudança.
 */
export default function TraceabilityMatrix() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();

  const [requisitos, setRequisitos] = useState<RequisitoAPI[]>([]);
  const [vinculos, setVinculos] = useState<VinculoRequisitoAPI[]>([]);
  const [modelo, setModelo] = useState<ModeloDadosProjeto>(MODELO_VAZIO);
  const [carregando, setCarregando] = useState(true);

  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [cruzamento, setCruzamento] = useState<{ linha: string; coluna: string } | null>(null);

  const [selecao, setSelecao] = useState<SelecaoCelula | null>(null);
  const [requisitoAnalisado, setRequisitoAnalisado] = useState<string | null>(null);
  /** Muda a cada análise aberta para que a onda de propagação seja reexibida. */
  const [ondaAtual, setOndaAtual] = useState(0);
  const [dialogVinculoAberto, setDialogVinculoAberto] = useState(false);
  const [formVinculo, setFormVinculo] = useState({
    requisitoOrigemId: '',
    requisitoDestinoId: '',
    tipo: 'DEPENDE_DE' as TipoVinculoRequisito,
  });
  const [salvando, setSalvando] = useState(false);

  // Com poucos requisitos o código cabe deitado; a partir daí ele vira de pé.
  const rotulosVerticais = requisitos.length > 8;
  const alturaEixoVertical = rotulosVerticais ? ALTURA_EIXO_VERTICAL : 58;

  const mostrarDiretos = filtro !== 'INDIRETOS';
  const mostrarIndiretos = filtro !== 'DIRETOS';

  const carregar = useCallback(async () => {
    if (!projectId) return;
    setCarregando(true);
    try {
      let lista: RequisitoAPI[] = [];
      try {
        lista = await listarRequisitosPorProjeto(projectId);
      } catch {
        notify('Não foi possível carregar os requisitos do projeto.', 'warning');
      }
      const ordenados = [...lista].sort((a, b) => (a.codigo ?? '').localeCompare(b.codigo ?? ''));
      const ids = ordenados.map((r) => r.id);
      setRequisitos(ordenados);

      const [vinculosCarregados, modeloCarregado] = await Promise.all([
        listarVinculos(projectId, ids),
        obterModelo(projectId, ids),
      ]);
      setVinculos(vinculosCarregados);
      setModelo(modeloCarregado);
    } finally {
      setCarregando(false);
    }
  }, [projectId, notify]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const relacoes = useMemo(
    () => construirRelacoes(vinculos, modelo.impactos, modelo.entidades),
    [vinculos, modelo.impactos, modelo.entidades],
  );

  const matriz = useMemo(() => construirMatriz(relacoes), [relacoes]);

  const totalDiretas = relacoes.filter((r) => r.origem === 'DIRETO').length;
  // Relações indiretas são simétricas — registradas nos dois sentidos.
  const totalIndiretas = relacoes.filter((r) => r.origem === 'INDIRETO').length / 2;

  const requisitoPorId = useMemo(() => new Map(requisitos.map((r) => [r.id, r])), [requisitos]);

  /** Grau de conexão de cada requisito: quantos outros ele alcança em um salto. */
  const ranking = useMemo(() => {
    const vizinhos = new Map<string, Set<string>>();
    const registrar = (a: string, b: string) => {
      const atual = vizinhos.get(a) ?? new Set<string>();
      atual.add(b);
      vizinhos.set(a, atual);
    };
    for (const relacao of relacoes) {
      registrar(relacao.origemId, relacao.destinoId);
      registrar(relacao.destinoId, relacao.origemId);
    }
    return requisitos
      .map((requisito) => ({ requisito, grau: vizinhos.get(requisito.id)?.size ?? 0 }))
      .sort((a, b) => b.grau - a.grau);
  }, [relacoes, requisitos]);

  const conectados = ranking.filter((item) => item.grau > 0).length;
  const cobertura = requisitos.length > 0 ? Math.round((conectados / requisitos.length) * 100) : 0;
  const grauMaximo = ranking[0]?.grau ?? 0;

  /** Distância, em saltos, de cada requisito ao requisito em análise. */
  const saltosPorRequisito = useMemo(() => {
    if (!requisitoAnalisado) return new Map<string, number>();
    return new Map(analisarImpacto(requisitoAnalisado, relacoes).map((i) => [i.requisitoId, i.saltos]));
  }, [requisitoAnalisado, relacoes]);

  function analisar(requisitoId: string) {
    setRequisitoAnalisado(requisitoId);
    setOndaAtual((onda) => onda + 1);
  }

  function abrirCelula(origemId: string, destinoId: string) {
    const celula = matriz.get(chaveCelula(origemId, destinoId));
    if (celula && (celula.relacaoDireta || celula.relacaoIndireta)) {
      setSelecao({ origemId, destinoId, celula });
      return;
    }
    if (isStakeholder) return;
    setFormVinculo({ requisitoOrigemId: origemId, requisitoDestinoId: destinoId, tipo: 'DEPENDE_DE' });
    setDialogVinculoAberto(true);
  }

  async function salvarVinculo() {
    if (!projectId) return;
    const { requisitoOrigemId, requisitoDestinoId } = formVinculo;
    if (!requisitoOrigemId || !requisitoDestinoId || requisitoOrigemId === requisitoDestinoId) {
      notify('Escolha dois requisitos diferentes para vincular.', 'warning');
      return;
    }
    setSalvando(true);
    try {
      const criado = await criarVinculo(projectId, formVinculo);
      setVinculos((atual) => [...atual, criado]);
      setDialogVinculoAberto(false);
      notify('Vínculo criado com sucesso', 'success');
    } finally {
      setSalvando(false);
    }
  }

  async function removerVinculo(vinculoId: string) {
    if (!projectId) return;
    await deletarVinculo(projectId, vinculoId);
    setVinculos((atual) => atual.filter((v) => v.id !== vinculoId));
    setSelecao(null);
    notify('Vínculo removido', 'info');
  }

  async function restaurarCenario() {
    if (!projectId) return;
    setCarregando(true);
    try {
      const restaurados = await restaurarVinculos(projectId, requisitos.map((r) => r.id));
      setVinculos(restaurados);
      notify('Vínculos recarregados do servidor', 'info');
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: 'auto' }}>
      <AnimacoesGlobais />

      <PageHeading
        etiqueta="Rastreabilidade"
        titulo="Matriz de Rastreabilidade"
        descricao="Cada célula é o cruzamento de dois requisitos. Os vínculos diretos você cadastra; as relações indiretas aparecem sozinhas quando dois requisitos manipulam a mesma entidade de dados."
        acoes={
          <>
            <Tooltip title="Recarregar do servidor">
              <span>
                <IconButton onClick={restaurarCenario} disabled={isStakeholder}>
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {!isStakeholder && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setFormVinculo({ requisitoOrigemId: '', requisitoDestinoId: '', tipo: 'DEPENDE_DE' });
                  setDialogVinculoAberto(true);
                }}
              >
                Novo vínculo
              </Button>
            )}
          </>
        }
      />

      <MetricBand
        leituras={[
          { rotulo: 'Requisitos', valor: String(requisitos.length).padStart(2, '0') },
          {
            rotulo: 'Vínculos diretos',
            valor: String(totalDiretas).padStart(2, '0'),
            detalhe: 'cadastrados na tela do requisito',
            cor: theme.palette.primary.main,
          },
          {
            rotulo: 'Relações indiretas',
            valor: String(totalIndiretas).padStart(2, '0'),
            detalhe: 'por entidade compartilhada',
            cor: theme.palette.secondary.main,
          },
          {
            rotulo: 'Cobertura',
            valor: `${cobertura}%`,
            detalhe: `${conectados} de ${requisitos.length} com alguma relação`,
            cor: theme.palette.success.main,
          },
        ]}
      />

      {requisitos.length < 2 ? (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <EmptyState
            icon={<HubIcon fontSize="inherit" />}
            title="A matriz precisa de dois requisitos"
            description="Cadastre pelo menos dois requisitos no projeto para que exista um cruzamento a mostrar."
          />
        </Card>
      ) : (
        <Grid container spacing={3} alignItems="flex-start">
          {/* ── Instrumento ── */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {(Object.keys(ROTULOS_TIPO_VINCULO) as TipoVinculoRequisito[]).map((tipo) => (
                    <Box key={tipo} sx={{ display: 'flex', alignItems: 'center', gap: 0.65 }}>
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(CORES_TIPO_VINCULO[tipo], 0.16),
                          border: `1.5px solid ${CORES_TIPO_VINCULO[tipo]}`,
                          fontFamily: FONTE_DADOS,
                          fontSize: 7.5,
                          fontWeight: 700,
                          color: CORES_TIPO_VINCULO[tipo],
                        }}
                      >
                        {SIGLAS_TIPO_VINCULO[tipo]}
                      </Box>
                      <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.secondary' }}>
                        {ROTULOS_TIPO_VINCULO[tipo]}
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.65 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: `2px solid ${theme.palette.text.disabled}`,
                        mx: '3px',
                      }}
                    />
                    <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.secondary' }}>
                      Indireto
                    </Typography>
                  </Box>
                </Box>

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={filtro}
                  onChange={(_, valor: Filtro | null) => valor && setFiltro(valor)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 1.5,
                      py: 0.35,
                      fontFamily: FONTE_DADOS,
                      fontSize: 10.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    },
                  }}
                >
                  <ToggleButton value="TODOS">Todos</ToggleButton>
                  <ToggleButton value="DIRETOS">Diretos</ToggleButton>
                  <ToggleButton value="INDIRETOS">Indiretos</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <CardContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    overflow: 'auto',
                    maxHeight: '70vh',
                    bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.015),
                  }}
                  onMouseLeave={() => setCruzamento(null)}
                >
                  <Box
                    component="table"
                    sx={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 'max-content' }}
                  >
                    <Box component="thead">
                      <Box component="tr">
                        <Box
                          component="th"
                          sx={{
                            position: 'sticky',
                            left: 0,
                            top: 0,
                            zIndex: 4,
                            width: LARGURA_EIXO,
                            minWidth: LARGURA_EIXO,
                            height: alturaEixoVertical,
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            p: 2,
                            textAlign: 'left',
                            verticalAlign: 'bottom',
                          }}
                        >
                          <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.disabled' }}>
                            Origem ↓
                          </Typography>
                          <br />
                          <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.disabled' }}>
                            Destino →
                          </Typography>
                        </Box>

                        {requisitos.map((requisito) => {
                          const ativo = cruzamento?.coluna === requisito.id;
                          const emAnalise = requisito.id === requisitoAnalisado;
                          return (
                            <Box
                              component="th"
                              key={requisito.id}
                              sx={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 3,
                                minWidth: LADO_CELULA,
                                height: alturaEixoVertical,
                                bgcolor: 'background.paper',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                p: 0,
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  left: 6,
                                  right: 6,
                                  bottom: 0,
                                  height: 2,
                                  bgcolor: ativo || emAnalise ? 'primary.main' : 'transparent',
                                  transition: 'background-color 0.15s',
                                },
                              }}
                            >
                              <Tooltip title={`${requisito.codigo} — ${requisito.titulo}`} arrow>
                                <Typography
                                  component="span"
                                  sx={{
                                    fontFamily: FONTE_DADOS,
                                    fontWeight: 600,
                                    fontSize: 10.5,
                                    letterSpacing: '0.06em',
                                    color: ativo || emAnalise ? 'primary.main' : 'text.secondary',
                                    display: 'inline-block',
                                    transition: 'color 0.15s',
                                    ...(rotulosVerticais
                                      ? {
                                          writingMode: 'vertical-rl',
                                          transform: 'rotate(180deg)',
                                          height: alturaEixoVertical - 24,
                                        }
                                      : {}),
                                  }}
                                >
                                  {requisito.codigo}
                                </Typography>
                              </Tooltip>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>

                    <Box component="tbody">
                      {requisitos.map((linha, indiceLinha) => {
                        const linhaAtiva = cruzamento?.linha === linha.id;
                        const emAnalise = linha.id === requisitoAnalisado;
                        const salto = saltosPorRequisito.get(linha.id);

                        return (
                          <Box component="tr" key={linha.id}>
                            <Box
                              component="td"
                              sx={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 2,
                                width: LARGURA_EIXO,
                                minWidth: LARGURA_EIXO,
                                bgcolor: 'background.paper',
                                borderRight: '1px solid',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                p: 0,
                              }}
                            >
                              <Tooltip title="Ver o que uma mudança aqui alcança" placement="right" arrow>
                                <Box
                                  onClick={() => analisar(linha.id)}
                                  sx={{
                                    cursor: 'pointer',
                                    px: 2,
                                    py: 1.25,
                                    borderLeft: '2px solid',
                                    borderLeftColor: emAnalise
                                      ? 'primary.main'
                                      : linhaAtiva
                                        ? alpha(theme.palette.primary.main, 0.35)
                                        : 'transparent',
                                    bgcolor: emAnalise
                                      ? alpha(theme.palette.primary.main, 0.06)
                                      : 'transparent',
                                    transition: 'border-color 0.15s, background-color 0.15s',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontFamily: FONTE_DADOS,
                                        fontWeight: 600,
                                        fontSize: 11.5,
                                        letterSpacing: '0.04em',
                                        color: emAnalise ? 'primary.main' : 'text.primary',
                                      }}
                                    >
                                      {linha.codigo}
                                    </Typography>
                                    {salto !== undefined && (
                                      <Box
                                        sx={{
                                          fontFamily: FONTE_DADOS,
                                          fontSize: 9,
                                          fontWeight: 600,
                                          px: 0.5,
                                          borderRadius: '3px',
                                          color: theme.palette.warning.main,
                                          border: `1px solid ${alpha(theme.palette.warning.main, 0.5)}`,
                                        }}
                                      >
                                        +{salto}
                                      </Box>
                                    )}
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: 'text.secondary',
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: 320,
                                      fontSize: 11.5,
                                    }}
                                  >
                                    {linha.titulo}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>

                            {requisitos.map((coluna, indiceColuna) => {
                              const diagonal = linha.id === coluna.id;
                              const celula = matriz.get(chaveCelula(linha.id, coluna.id));
                              const direta = mostrarDiretos ? celula?.relacaoDireta : undefined;
                              const indireta = mostrarIndiretos ? celula?.relacaoIndireta : undefined;
                              const cruzando = linhaAtiva || cruzamento?.coluna === coluna.id;
                              const cor = direta
                                ? CORES_TIPO_VINCULO[direta.tipo ?? ''] ?? theme.palette.primary.main
                                : null;

                              // A onda percorre a linha e a coluna do requisito
                              // em análise, no tempo do salto de cada alcançado.
                              const saltoDaOnda = requisitoAnalisado
                                ? linha.id === requisitoAnalisado
                                  ? saltosPorRequisito.get(coluna.id)
                                  : coluna.id === requisitoAnalisado
                                    ? saltosPorRequisito.get(linha.id)
                                    : undefined
                                : undefined;

                              const descricao = diagonal
                                ? 'Mesmo requisito'
                                : direta && indireta
                                  ? `${linha.codigo} ${ROTULOS_TIPO_VINCULO[direta.tipo ?? '']?.toLowerCase()} ${coluna.codigo} · também compartilham ${indireta.entidadesCompartilhadas?.join(', ')}`
                                  : direta
                                    ? `${linha.codigo} ${ROTULOS_TIPO_VINCULO[direta.tipo ?? '']?.toLowerCase()} ${coluna.codigo}`
                                    : indireta
                                      ? `Indireto — ambos manipulam ${indireta.entidadesCompartilhadas?.join(', ')}`
                                      : 'Sem relação — clique para vincular';

                              return (
                                <Box
                                  component="td"
                                  key={coluna.id}
                                  onMouseEnter={() => setCruzamento({ linha: linha.id, coluna: coluna.id })}
                                  sx={{
                                    minWidth: LADO_CELULA,
                                    height: LADO_CELULA,
                                    borderBottom: '1px solid',
                                    borderRight: '1px solid',
                                    borderColor: alpha(theme.palette.divider, 0.6),
                                    p: 0.6,
                                    textAlign: 'center',
                                    bgcolor: diagonal
                                      ? alpha(theme.palette.text.disabled, 0.08)
                                      : cruzando
                                        ? alpha(theme.palette.primary.main, 0.06)
                                        : 'transparent',
                                    transition: 'background-color 0.1s',
                                  }}
                                >
                                  {diagonal ? (
                                    <Box
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 14,
                                          height: 1.5,
                                          bgcolor: 'text.disabled',
                                          opacity: 0.5,
                                          transform: 'rotate(-45deg)',
                                        }}
                                      />
                                    </Box>
                                  ) : (
                                    <Tooltip title={descricao} arrow>
                                      <Box
                                        // Remonta ao abrir uma análise para que a onda seja reexibida.
                                        key={saltoDaOnda !== undefined ? `onda-${ondaAtual}` : 'estatico'}
                                        onClick={() => abrirCelula(linha.id, coluna.id)}
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          animation:
                                            saltoDaOnda !== undefined
                                              ? `${ANIMACAO.propagacao} 700ms ease-out ${saltoDaOnda * PASSO_PROPAGACAO}ms both`
                                              : `${ANIMACAO.plotagem} 320ms ease-out ${(indiceLinha + indiceColuna) * PASSO_PLOTAGEM}ms both`,
                                          '&:hover .marcador': {
                                            transform: 'scale(1.12)',
                                          },
                                        }}
                                      >
                                        {direta ? (
                                          <Box
                                            className="marcador"
                                            sx={{
                                              width: 34,
                                              height: 34,
                                              borderRadius: '6px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              bgcolor: alpha(cor as string, 0.16),
                                              border: `1.5px solid ${cor}`,
                                              boxShadow: `0 2px 6px ${alpha(cor as string, 0.28)}`,
                                              transition: 'transform 0.14s ease',
                                            }}
                                          >
                                            <Typography
                                              component="span"
                                              sx={{
                                                fontFamily: FONTE_DADOS,
                                                fontWeight: 700,
                                                fontSize: 9,
                                                letterSpacing: '0.04em',
                                                color: cor as string,
                                              }}
                                            >
                                              {SIGLAS_TIPO_VINCULO[direta.tipo ?? ''] ?? '••'}
                                            </Typography>
                                          </Box>
                                        ) : indireta ? (
                                          <Box
                                            className="marcador"
                                            sx={{
                                              width: 14,
                                              height: 14,
                                              borderRadius: '50%',
                                              border: `2px solid ${alpha(theme.palette.text.secondary, 0.55)}`,
                                              transition: 'transform 0.14s ease',
                                            }}
                                          />
                                        ) : (
                                          <Box
                                            className="marcador"
                                            sx={{
                                              width: 5,
                                              height: 5,
                                              borderRadius: '50%',
                                              bgcolor: 'text.disabled',
                                              opacity: cruzando ? 0.55 : 0.2,
                                              transition: 'opacity 0.14s ease, transform 0.14s ease',
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1.5 }}>
              Clique em uma célula para abrir a relação, ou em um código à esquerda para ver o alcance
              de uma mudança.
            </Typography>
          </Grid>

          {/* ── Leitura lateral ── */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
                  Grau de conexão
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.75, mb: 2 }}>
                  Quantos requisitos cada um alcança em um salto.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                  {ranking.slice(0, 6).map(({ requisito, grau }, indice) => (
                    <Box
                      key={requisito.id}
                      onClick={() => analisar(requisito.id)}
                      sx={{ cursor: 'pointer', '&:hover .codigo': { color: 'primary.main' } }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
                        <Typography
                          className="codigo"
                          component="span"
                          sx={{
                            fontFamily: FONTE_DADOS,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            transition: 'color 0.15s',
                          }}
                        >
                          {requisito.codigo}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {requisito.titulo}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ fontFamily: FONTE_DADOS, fontSize: 11, fontWeight: 600, color: 'text.primary' }}
                        >
                          {String(grau).padStart(2, '0')}
                        </Typography>
                      </Box>
                      <Box sx={{ height: 4, bgcolor: alpha(theme.palette.text.primary, 0.06), borderRadius: 2 }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${grauMaximo > 0 ? (grau / grauMaximo) * 100 : 0}%`,
                            bgcolor: grau > 0 ? 'primary.main' : 'transparent',
                            borderRadius: 2,
                            transformOrigin: 'left',
                            animation: `${ANIMACAO.varredura} 520ms cubic-bezier(0.2, 0.8, 0.2, 1) ${indice * 70}ms both`,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
                  Como ler a matriz
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.75, mt: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      borderRadius: '6px',
                      border: `1.5px solid ${theme.palette.primary.main}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.16),
                    }}
                  />
                  <Typography variant="body2">
                    <strong>Marcador cheio.</strong> Vínculo direto entre dois requisitos, com o tipo
                    escolhido por quem especificou.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.75, mt: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: `2px solid ${alpha(theme.palette.text.secondary, 0.55)}`,
                      }}
                    />
                  </Box>
                  <Typography variant="body2">
                    <strong>Anel vazado.</strong> Relação indireta: os dois requisitos alteram a mesma
                    entidade de dados. Ninguém cadastrou — e ela some quando o impacto some.
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  A matriz é recalculada a cada leitura, sobre o estado atual dos requisitos. Não há
                  recomputo em lote que possa ficar defasado.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Detalhe da célula ── */}
      <Dialog open={!!selecao} onClose={() => setSelecao(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Relação entre requisitos</DialogTitle>
        <DialogContent>
          {selecao && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.disabled' }}>
                  Origem
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  <Box component="span" sx={{ fontFamily: FONTE_DADOS, fontSize: 12 }}>
                    {requisitoPorId.get(selecao.origemId)?.codigo}
                  </Box>{' '}
                  {requisitoPorId.get(selecao.origemId)?.titulo}
                </Typography>
              </Box>
              <Box>
                <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.disabled' }}>
                  Destino
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  <Box component="span" sx={{ fontFamily: FONTE_DADOS, fontSize: 12 }}>
                    {requisitoPorId.get(selecao.destinoId)?.codigo}
                  </Box>{' '}
                  {requisitoPorId.get(selecao.destinoId)?.titulo}
                </Typography>
              </Box>

              <Divider />

              {selecao.celula.relacaoDireta && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={ROTULOS_TIPO_VINCULO[selecao.celula.relacaoDireta.tipo ?? '']}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(CORES_TIPO_VINCULO[selecao.celula.relacaoDireta.tipo ?? ''] ?? '#000', 0.12),
                      color: CORES_TIPO_VINCULO[selecao.celula.relacaoDireta.tipo ?? ''],
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    vínculo direto, cadastrado manualmente
                  </Typography>
                  {!isStakeholder && selecao.celula.relacaoDireta.vinculoId && (
                    <Tooltip title="Remover vínculo">
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ ml: 'auto' }}
                        onClick={() => removerVinculo(selecao.celula.relacaoDireta?.vinculoId as string)}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}

              {selecao.celula.relacaoIndireta && (
                <Box>
                  <Chip label="Relação indireta" size="small" variant="outlined" sx={{ fontWeight: 700, mb: 1 }} />
                  <Typography variant="body2">
                    Os dois requisitos manipulam{' '}
                    <Box component="span" sx={{ fontFamily: FONTE_DADOS, fontSize: 12, fontWeight: 600 }}>
                      {selecao.celula.relacaoIndireta.entidadesCompartilhadas?.join(', ')}
                    </Box>
                    . Nada foi cadastrado aqui: a relação vem dos impactos no modelo de dados e some
                    junto com eles.
                  </Typography>
                </Box>
              )}

              <Button
                startIcon={<HubIcon />}
                variant="outlined"
                size="small"
                onClick={() => {
                  analisar(selecao.origemId);
                  setSelecao(null);
                }}
              >
                Ver alcance da origem
              </Button>
              <Button
                startIcon={<OpenInNewIcon />}
                size="small"
                onClick={() =>
                  navigate(`/organizations/${orgId}/projects/${projectId}/requirements/${selecao.destinoId}`)
                }
              >
                Abrir requisito de destino
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelecao(null)} size="small" color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Novo vínculo ── */}
      <Dialog open={dialogVinculoAberto} onClose={() => setDialogVinculoAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo vínculo entre requisitos</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Requisito de origem</InputLabel>
            <Select
              label="Requisito de origem"
              value={formVinculo.requisitoOrigemId}
              onChange={(e) => setFormVinculo((f) => ({ ...f, requisitoOrigemId: e.target.value }))}
            >
              {requisitos.map((requisito) => (
                <MenuItem key={requisito.id} value={requisito.id}>
                  {requisito.codigo} — {requisito.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Tipo de vínculo</InputLabel>
            <Select
              label="Tipo de vínculo"
              value={formVinculo.tipo}
              onChange={(e) => setFormVinculo((f) => ({ ...f, tipo: e.target.value as TipoVinculoRequisito }))}
            >
              {(Object.keys(ROTULOS_TIPO_VINCULO) as TipoVinculoRequisito[]).map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {ROTULOS_TIPO_VINCULO[tipo]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Requisito de destino</InputLabel>
            <Select
              label="Requisito de destino"
              value={formVinculo.requisitoDestinoId}
              onChange={(e) => setFormVinculo((f) => ({ ...f, requisitoDestinoId: e.target.value }))}
            >
              {requisitos.map((requisito) => (
                <MenuItem key={requisito.id} value={requisito.id} disabled={requisito.id === formVinculo.requisitoOrigemId}>
                  {requisito.codigo} — {requisito.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogVinculoAberto(false)} color="inherit" size="small" disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvarVinculo} variant="contained" size="small" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Criar vínculo'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImpactAnalysisDrawer
        aberto={!!requisitoAnalisado}
        requisitoOrigemId={requisitoAnalisado}
        requisitos={requisitos}
        relacoes={relacoes}
        aoFechar={() => setRequisitoAnalisado(null)}
        aoAbrirRequisito={(id) =>
          navigate(`/organizations/${orgId}/projects/${projectId}/requirements/${id}`)
        }
      />
    </Box>
  );
}
