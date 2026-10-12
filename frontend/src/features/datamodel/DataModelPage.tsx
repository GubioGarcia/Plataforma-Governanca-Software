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
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import EmptyState from '../../components/common/EmptyState';
import AnimacoesGlobais from '../../components/common/AnimacoesGlobais';
import MetricBand from '../../components/common/MetricBand';
import PageHeading from '../../components/common/PageHeading';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import BotaoExportar from '../../components/common/BotaoExportar';
import { extractApiErrorMessage } from '../../utils/apiError';
import { listarRequisitosPorProjeto } from '../../services/requirementService';
import {
  atualizarAtributo,
  criarAtributo,
  criarEntidade,
  obterModelo,
  restaurarModelo,
} from '../../services/dataModelService';
import {
  gerarErDiagram,
  idEntidadeNoDiagrama,
  ROTULOS_OPERACAO,
  ROTULOS_CARDINALIDADE,
  CORES_OPERACAO,
} from '../../utils/dataModel';
import type { AtributoEntidadeAPI, ModeloDadosProjeto, TipoRelacionamentoEntidade } from '../../types/dataModel';
import type { RequisitoAPI } from '../../types/requirementAPI';
import { ETIQUETA, FONTE_DADOS } from '../../theme/tokens';
import ErDiagram from './ErDiagram';

const TIPOS_SUGERIDOS = [
  'UUID',
  'VARCHAR(50)',
  'VARCHAR(150)',
  'TEXT',
  'INTEGER',
  'NUMERIC(12,2)',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
];

const MODELO_VAZIO: ModeloDadosProjeto = {
  entidades: [],
  atributos: [],
  relacionamentos: [],
  impactos: [],
};

/**
 * Tela de modelagem de dados do projeto.
 *
 * Mostra as entidades de negócio especificadas, seus atributos e relações, o
 * diagrama ER derivado do estado atual e — para cada entidade — quais
 * requisitos a manipulam. É essa ligação requisito ↔ entidade que também
 * alimenta os vínculos indiretos da matriz de rastreabilidade.
 */
export default function DataModelPage() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();

  const [modelo, setModelo] = useState<ModeloDadosProjeto>(MODELO_VAZIO);
  const [requisitos, setRequisitos] = useState<RequisitoAPI[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [entidadeSelecionadaId, setEntidadeSelecionadaId] = useState<string | null>(null);

  const [dialogEntidadeAberto, setDialogEntidadeAberto] = useState(false);
  const [formEntidade, setFormEntidade] = useState({ nome: '', descricao: '' });
  const [dialogAtributoAberto, setDialogAtributoAberto] = useState(false);
  const [atributoEmEdicao, setAtributoEmEdicao] = useState<AtributoEntidadeAPI | null>(null);
  const [formAtributo, setFormAtributo] = useState({
    nome: '',
    tipo: 'VARCHAR(150)',
    obrigatorio: true,
    chavePrimaria: false,
    chaveEstrangeira: false,
    entidadeReferenciadaId: '',
    tipoRelacionamento: 'UM_PARA_MUITOS' as TipoRelacionamentoEntidade,
  });
  const [salvando, setSalvando] = useState(false);

  const ATRIBUTO_FORM_VAZIO = {
    nome: '',
    tipo: 'VARCHAR(150)',
    obrigatorio: true,
    chavePrimaria: false,
    chaveEstrangeira: false,
    entidadeReferenciadaId: '',
    tipoRelacionamento: 'UM_PARA_MUITOS' as TipoRelacionamentoEntidade,
  };

  function abrirNovoAtributo() {
    setAtributoEmEdicao(null);
    setFormAtributo(ATRIBUTO_FORM_VAZIO);
    setDialogAtributoAberto(true);
  }

  function abrirEdicaoAtributo(atributo: AtributoEntidadeAPI) {
    setAtributoEmEdicao(atributo);
    setFormAtributo({
      nome: atributo.nome,
      tipo: atributo.tipo,
      obrigatorio: atributo.obrigatorio,
      chavePrimaria: atributo.chavePrimaria,
      chaveEstrangeira: atributo.chaveEstrangeira,
      entidadeReferenciadaId: atributo.entidadeReferenciadaId ?? '',
      tipoRelacionamento: atributo.tipoRelacionamento ?? 'UM_PARA_MUITOS',
    });
    setDialogAtributoAberto(true);
  }

  const carregar = useCallback(async () => {
    if (!projectId) return;
    setCarregando(true);
    try {
      // Os requisitos são usados para resolver os códigos exibidos nos
      // impactos; o modelo em si vem inteiro de /entidade-dados/.../diagrama.
      let lista: RequisitoAPI[] = [];
      try {
        lista = await listarRequisitosPorProjeto(projectId);
      } catch {
        notify('Não foi possível carregar os requisitos do projeto.', 'warning');
      }
      const ordenados = [...lista].sort((a, b) => (a.codigo ?? '').localeCompare(b.codigo ?? ''));
      setRequisitos(ordenados);

      const carregado = await obterModelo(projectId, ordenados.map((r) => r.id));
      setModelo(carregado);
      setEntidadeSelecionadaId((atual) => atual ?? carregado.entidades[0]?.id ?? null);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível carregar o modelo de dados.'), 'error');
    } finally {
      setCarregando(false);
    }
  }, [projectId, notify]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const entidadeSelecionada = useMemo(
    () => modelo.entidades.find((e) => e.id === entidadeSelecionadaId) ?? null,
    [modelo.entidades, entidadeSelecionadaId],
  );

  const atributosDaEntidade = useMemo(
    () => modelo.atributos.filter((a) => a.entidadeId === entidadeSelecionadaId),
    [modelo.atributos, entidadeSelecionadaId],
  );

  // Uma entidade só pode ter uma PK — desabilita o switch quando já existe
  // outro atributo marcado (ignora o próprio atributo em edição).
  const entidadeJaTemOutraChavePrimaria = atributosDaEntidade.some(
    (a) => a.chavePrimaria && a.id !== atributoEmEdicao?.id,
  );

  const relacionamentosDaEntidade = useMemo(
    () =>
      modelo.relacionamentos.filter(
        (r) => r.entidadeOrigemId === entidadeSelecionadaId || r.entidadeDestinoId === entidadeSelecionadaId,
      ),
    [modelo.relacionamentos, entidadeSelecionadaId],
  );

  const impactosDaEntidade = useMemo(
    () => modelo.impactos.filter((i) => i.entidadeId === entidadeSelecionadaId),
    [modelo.impactos, entidadeSelecionadaId],
  );

  const codigoDiagrama = useMemo(() => gerarErDiagram(modelo), [modelo]);

  const requisitoPorId = useMemo(
    () => new Map(requisitos.map((r) => [r.id, r])),
    [requisitos],
  );

  const contagemImpactosPorEntidade = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const impacto of modelo.impactos) {
      contagem.set(impacto.entidadeId, (contagem.get(impacto.entidadeId) ?? 0) + 1);
    }
    return contagem;
  }, [modelo.impactos]);

  async function salvarEntidade() {
    if (!projectId || !formEntidade.nome.trim()) return;
    setSalvando(true);
    try {
      const criada = await criarEntidade(projectId, {
        nome: formEntidade.nome.trim(),
        descricao: formEntidade.descricao.trim() || null,
      });
      setModelo((atual) => ({ ...atual, entidades: [...atual.entidades, criada] }));
      setEntidadeSelecionadaId(criada.id);
      setDialogEntidadeAberto(false);
      setFormEntidade({ nome: '', descricao: '' });
      notify('Entidade criada com sucesso', 'success');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erro ao criar entidade.'), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarAtributo() {
    if (!projectId || !entidadeSelecionadaId || !formAtributo.nome.trim()) return;
    setSalvando(true);
    try {
      if (atributoEmEdicao) {
        await atualizarAtributo(projectId, atributoEmEdicao.id, {
          nome: formAtributo.nome.trim(),
          tipo: formAtributo.tipo,
          obrigatorio: formAtributo.obrigatorio,
          chavePrimaria: formAtributo.chavePrimaria,
          chaveEstrangeira: formAtributo.chaveEstrangeira,
          entidadeReferenciadaId: formAtributo.chaveEstrangeira ? formAtributo.entidadeReferenciadaId : null,
          tipoRelacionamento: formAtributo.chaveEstrangeira ? formAtributo.tipoRelacionamento : null,
        });
        // A edição pode criar, remover ou alterar um RelacionamentoEntidade
        // derivado — recarrega o modelo inteiro para refletir isso no
        // diagrama e na lista de relacionamentos, não só o atributo em si.
        await carregar();
        notify('Atributo atualizado', 'success');
      } else {
        const criado = await criarAtributo(projectId, {
          entidadeId: entidadeSelecionadaId,
          nome: formAtributo.nome.trim(),
          tipo: formAtributo.tipo,
          obrigatorio: formAtributo.obrigatorio,
          chavePrimaria: formAtributo.chavePrimaria,
          chaveEstrangeira: formAtributo.chaveEstrangeira,
          entidadeReferenciadaId: formAtributo.chaveEstrangeira ? formAtributo.entidadeReferenciadaId : null,
          tipoRelacionamento: formAtributo.chaveEstrangeira ? formAtributo.tipoRelacionamento : null,
        });
        setModelo((atual) => ({ ...atual, atributos: [...atual.atributos, criado] }));
        notify('Atributo adicionado', 'success');
      }
      setDialogAtributoAberto(false);
      setAtributoEmEdicao(null);
      setFormAtributo(ATRIBUTO_FORM_VAZIO);
    } catch (err) {
      notify(
        extractApiErrorMessage(err, atributoEmEdicao ? 'Erro ao atualizar atributo.' : 'Erro ao adicionar atributo.'),
        'error',
      );
    } finally {
      setSalvando(false);
    }
  }

  async function restaurarCenario() {
    if (!projectId) return;
    setCarregando(true);
    try {
      const restaurado = await restaurarModelo(projectId, requisitos.map((r) => r.id));
      setModelo(restaurado);
      setEntidadeSelecionadaId((atual) => atual ?? restaurado.entidades[0]?.id ?? null);
      notify('Modelo recarregado do servidor', 'info');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível recarregar o modelo de dados.'), 'error');
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <AnimacoesGlobais />

      <PageHeading
        etiqueta="Modelagem de dados"
        titulo="Modelo de Dados"
        descricao="As entidades que os requisitos deste projeto manipulam. O diagrama sai do estado atual do modelo, e cada entidade mostra quais requisitos a alteram."
        acoes={
          <>
            {projectId && <BotaoExportar projetoId={projectId} tipo="mer" />}
            <Tooltip title="Recarregar do servidor">
              <span>
                <IconButton onClick={restaurarCenario} disabled={isStakeholder}>
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {!isStakeholder && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogEntidadeAberto(true)}>
                Nova entidade
              </Button>
            )}
          </>
        }
      />

      <MetricBand
        leituras={[
          { rotulo: 'Entidades', valor: String(modelo.entidades.length).padStart(2, '0') },
          {
            rotulo: 'Atributos',
            valor: String(modelo.atributos.length).padStart(2, '0'),
            cor: theme.palette.secondary.main,
          },
          {
            rotulo: 'Relacionamentos',
            valor: String(modelo.relacionamentos.length).padStart(2, '0'),
            detalhe: 'chaves estrangeiras',
            cor: theme.palette.info.main,
          },
          {
            rotulo: 'Impactos declarados',
            valor: String(modelo.impactos.length).padStart(2, '0'),
            detalhe: 'alterações vindas de requisitos',
            cor: theme.palette.success.main,
          },
        ]}
      />

      {modelo.entidades.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <EmptyState
            icon={<TableChartIcon fontSize="inherit" />}
            title="Nenhuma entidade cadastrada"
            description="Cadastre as entidades de negócio manipuladas pelos requisitos para habilitar o diagrama ER e a rastreabilidade indireta."
            action={
              !isStakeholder && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogEntidadeAberto(true)}>
                  Nova entidade
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Grid container spacing={3} alignItems="flex-start">
          {/* ── Lista de entidades ── */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', px: 1, mb: 1.5, display: 'block' }}>
                  Entidades
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {modelo.entidades.map((entidade) => {
                    const selecionada = entidade.id === entidadeSelecionadaId;
                    const impactos = contagemImpactosPorEntidade.get(entidade.id) ?? 0;
                    return (
                      <Box
                        key={entidade.id}
                        onClick={() => setEntidadeSelecionadaId(entidade.id)}
                        sx={{
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: selecionada ? 'primary.main' : 'transparent',
                          bgcolor: selecionada ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          transition: 'all 0.12s',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: FONTE_DADOS,
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: selecionada ? 'primary.main' : 'text.primary',
                            }}
                          >
                            {entidade.nome}
                          </Typography>
                          {impactos > 0 && (
                            <Chip
                              label={impactos}
                              size="small"
                              sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                              title={`${impactos} impacto(s) de requisito`}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {modelo.atributos.filter((a) => a.entidadeId === entidade.id).length} atributos
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Diagrama + detalhe ── */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
                    Diagrama entidade-relacionamento
                  </Typography>
                  {entidadeSelecionada && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Destaque: <strong>{entidadeSelecionada.nome}</strong>
                    </Typography>
                  )}
                </Box>
                <ErDiagram
                  altura={560}
                  codigo={codigoDiagrama}
                  entidadesDestacadas={entidadeSelecionada ? [idEntidadeNoDiagrama(entidadeSelecionada.nome)] : []}
                />
              </CardContent>
            </Card>

            {entidadeSelecionada && (
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                    <Box>
                      <Typography
                        sx={{ fontFamily: FONTE_DADOS, fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}
                      >
                        {entidadeSelecionada.nome}
                      </Typography>
                      {entidadeSelecionada.descricao && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {entidadeSelecionada.descricao}
                        </Typography>
                      )}
                    </Box>
                    {!isStakeholder && (
                      <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={abrirNovoAtributo}>
                        Atributo
                      </Button>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Atributos */}
                  <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                    Atributos
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Obrigatório</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Chave</TableCell>
                          {!isStakeholder && <TableCell sx={{ fontWeight: 700 }} align="right" />}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {atributosDaEntidade.map((atributo) => (
                          <TableRow key={atributo.id}>
                            <TableCell sx={{ fontFamily: FONTE_DADOS, fontSize: 12 }}>{atributo.nome}</TableCell>
                            <TableCell sx={{ fontFamily: FONTE_DADOS, fontSize: 12, color: 'text.secondary' }}>
                              {atributo.tipo}
                            </TableCell>
                            <TableCell>{atributo.obrigatorio ? 'Sim' : 'Não'}</TableCell>
                            <TableCell>
                              {atributo.chavePrimaria && <Chip label="PK" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />}
                              {atributo.chaveEstrangeira && (
                                <Chip
                                  label={`FK → ${atributo.entidadeReferenciadaNome ?? '—'}`}
                                  size="small"
                                  sx={{ height: 18, fontSize: 10, ml: 0.5 }}
                                />
                              )}
                            </TableCell>
                            {!isStakeholder && (
                              <TableCell align="right" sx={{ py: 0.5 }}>
                                <Tooltip title="Editar atributo">
                                  <IconButton size="small" onClick={() => abrirEdicaoAtributo(atributo)}>
                                    <EditIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  {/* Relacionamentos */}
                  <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', display: 'block', mt: 3.5, mb: 1.5 }}>
                    Relacionamentos
                  </Typography>
                  {relacionamentosDaEntidade.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      Nenhum relacionamento cadastrado para esta entidade.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {relacionamentosDaEntidade.map((relacionamento) => {
                        const origem = modelo.entidades.find((e) => e.id === relacionamento.entidadeOrigemId);
                        const destino = modelo.entidades.find((e) => e.id === relacionamento.entidadeDestinoId);
                        return (
                          <Box
                            key={relacionamento.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              px: 1.5,
                              py: 1,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {origem?.nome ?? '—'}
                            </Typography>
                            <Chip
                              label={ROTULOS_CARDINALIDADE[relacionamento.tipo] ?? relacionamento.tipo}
                              size="small"
                              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {destino?.nome ?? '—'}
                            </Typography>
                            {relacionamento.atributoFkNome && (
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: FONTE_DADOS, fontSize: 10.5 }}>
                                via {relacionamento.atributoFkNome}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {/* Requisitos que impactam */}
                  <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', display: 'block', mt: 3.5, mb: 1.5 }}>
                    Requisitos que manipulam esta entidade
                  </Typography>
                  {impactosDaEntidade.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      Nenhum requisito registrou impacto sobre esta entidade.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {impactosDaEntidade.map((impacto) => {
                        const requisito = requisitoPorId.get(impacto.requisitoId);
                        const atributo = modelo.atributos.find((a) => a.id === impacto.atributoId);
                        return (
                          <Box
                            key={impacto.id}
                            onClick={() =>
                              requisito &&
                              navigate(`/organizations/${orgId}/projects/${projectId}/requirements/${requisito.id}`)
                            }
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              px: 1.5,
                              py: 1,
                              cursor: requisito ? 'pointer' : 'default',
                              '&:hover': { borderColor: requisito ? 'primary.light' : 'divider' },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={ROTULOS_OPERACAO[impacto.tipoOperacao]}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  bgcolor: alpha(CORES_OPERACAO[impacto.tipoOperacao], 0.12),
                                  color: CORES_OPERACAO[impacto.tipoOperacao],
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {requisito?.codigo ?? 'REQ-???'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {requisito?.titulo ?? 'Requisito não encontrado'}
                              </Typography>
                            </Box>
                            {atributo && (
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: FONTE_DADOS, fontSize: 10.5 }}>
                                {atributo.nome}: {impacto.valorAnterior ?? '—'} → {impacto.valorNovo ?? '—'}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* ── Dialog: nova entidade ── */}
      <Dialog open={dialogEntidadeAberto} onClose={() => setDialogEntidadeAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova entidade de dados</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome"
            value={formEntidade.nome}
            onChange={(e) => setFormEntidade((f) => ({ ...f, nome: e.target.value }))}
            fullWidth
            size="small"
            autoFocus
            placeholder="Ex.: Cliente"
          />
          <TextField
            label="Descrição"
            value={formEntidade.descricao}
            onChange={(e) => setFormEntidade((f) => ({ ...f, descricao: e.target.value }))}
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="O que esta entidade representa no domínio do projeto"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogEntidadeAberto(false)} color="inherit" size="small" disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvarEntidade} variant="contained" size="small" disabled={salvando || !formEntidade.nome.trim()}>
            {salvando ? 'Salvando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: novo atributo / editar atributo ── */}
      <Dialog
        open={dialogAtributoAberto}
        onClose={() => {
          setDialogAtributoAberto(false);
          setAtributoEmEdicao(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {atributoEmEdicao ? `Editar atributo ${atributoEmEdicao.nome}` : `Novo atributo em ${entidadeSelecionada?.nome}`}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome"
            value={formAtributo.nome}
            onChange={(e) => setFormAtributo((f) => ({ ...f, nome: e.target.value }))}
            fullWidth
            size="small"
            autoFocus
            placeholder="Ex.: cpf"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              value={formAtributo.tipo}
              onChange={(e) => setFormAtributo((f) => ({ ...f, tipo: e.target.value }))}
            >
              {TIPOS_SUGERIDOS.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={formAtributo.obrigatorio}
                onChange={(e) => setFormAtributo((f) => ({ ...f, obrigatorio: e.target.checked }))}
              />
            }
            label="Obrigatório (NOT NULL)"
          />
          <Tooltip title={entidadeJaTemOutraChavePrimaria ? 'Esta entidade já tem um atributo marcado como chave primária' : ''}>
            <FormControlLabel
              control={
                <Switch
                  checked={formAtributo.chavePrimaria}
                  disabled={entidadeJaTemOutraChavePrimaria}
                  onChange={(e) => setFormAtributo((f) => ({ ...f, chavePrimaria: e.target.checked }))}
                />
              }
              label="Chave primária (PK)"
            />
          </Tooltip>
          <FormControlLabel
            control={
              <Switch
                checked={formAtributo.chaveEstrangeira}
                onChange={(e) => setFormAtributo((f) => ({ ...f, chaveEstrangeira: e.target.checked }))}
              />
            }
            label="Chave estrangeira (FK)"
          />
          {formAtributo.chaveEstrangeira && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Entidade referenciada</InputLabel>
                <Select
                  label="Entidade referenciada"
                  value={formAtributo.entidadeReferenciadaId}
                  onChange={(e) => setFormAtributo((f) => ({ ...f, entidadeReferenciadaId: e.target.value }))}
                >
                  {modelo.entidades
                    .filter((e) => e.id !== entidadeSelecionadaId)
                    .map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.nome}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Cardinalidade</InputLabel>
                <Select
                  label="Cardinalidade"
                  value={formAtributo.tipoRelacionamento}
                  onChange={(e) =>
                    setFormAtributo((f) => ({
                      ...f,
                      tipoRelacionamento: e.target.value as TipoRelacionamentoEntidade,
                    }))
                  }
                >
                  {(Object.keys(ROTULOS_CARDINALIDADE) as TipoRelacionamentoEntidade[]).map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {ROTULOS_CARDINALIDADE[tipo]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDialogAtributoAberto(false);
              setAtributoEmEdicao(null);
            }}
            color="inherit"
            size="small"
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            onClick={salvarAtributo}
            variant="contained"
            size="small"
            disabled={
              salvando ||
              !formAtributo.nome.trim() ||
              (formAtributo.chaveEstrangeira && !formAtributo.entidadeReferenciadaId)
            }
          >
            {salvando ? 'Salvando...' : atributoEmEdicao ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
