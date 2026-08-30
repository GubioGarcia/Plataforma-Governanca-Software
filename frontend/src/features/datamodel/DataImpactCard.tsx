import { useCallback, useEffect, useMemo, useState } from 'react';
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
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { criarImpacto, deletarImpacto, obterModelo } from '../../services/dataModelService';
import { listarRequisitosPorProjeto } from '../../services/requirementService';
import {
  construirDiff,
  CORES_OPERACAO,
  gerarErDiagram,
  idEntidadeNoDiagrama,
  ROTULOS_OPERACAO,
} from '../../utils/dataModel';
import type {
  LinhaDiffAtributo,
  ModeloDadosProjeto,
  SituacaoAtributoDiff,
  TipoOperacaoImpacto,
} from '../../types/dataModel';
import { ETIQUETA, FONTE_DADOS } from '../../theme/tokens';
import ErDiagram from './ErDiagram';

interface DataImpactCardProps {
  projetoId: string;
  requisitoId: string;
  /** Notifica a tela pai quando os impactos mudam (a rastreabilidade indireta depende deles). */
  aoAlterar?: () => void;
}

const MODELO_VAZIO: ModeloDadosProjeto = {
  entidades: [],
  atributos: [],
  relacionamentos: [],
  impactos: [],
};

const CORES_SITUACAO: Record<SituacaoAtributoDiff, string> = {
  INALTERADO: 'transparent',
  ADICIONADO: '#16A34A',
  ALTERADO: '#D97706',
  REMOVIDO: '#DC2626',
};

const ROTULOS_SITUACAO: Record<SituacaoAtributoDiff, string> = {
  INALTERADO: 'Inalterado',
  ADICIONADO: 'Adicionado',
  ALTERADO: 'Alterado',
  REMOVIDO: 'Removido',
};

const FORM_VAZIO = {
  entidadeId: '',
  atributoId: '',
  tipoOperacao: 'ADICAO_ATRIBUTO' as TipoOperacaoImpacto,
  valorAnterior: '',
  valorNovo: '',
};

/**
 * Card de modelagem de dados exibido no detalhe do requisito.
 *
 * Mostra, para cada entidade que o requisito manipula, o estado atual lado a
 * lado com o estado proposto, e o recorte do diagrama ER com a entidade em
 * destaque — a rastreabilidade semântica entre requisito e modelo de dados.
 */
export default function DataImpactCard({ projetoId, requisitoId, aoAlterar }: DataImpactCardProps) {
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();

  const [modelo, setModelo] = useState<ModeloDadosProjeto>(MODELO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      let requisitoIds: string[] = [];
      try {
        const requisitos = await listarRequisitosPorProjeto(projetoId);
        requisitoIds = [...requisitos]
          .sort((a, b) => (a.codigo ?? '').localeCompare(b.codigo ?? ''))
          .map((r) => r.id);
      } catch {
        // Sem a listagem do projeto o modelo simplesmente não é semeado.
      }
      setModelo(await obterModelo(projetoId, requisitoIds));
    } finally {
      setCarregando(false);
    }
  }, [projetoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const diffs = useMemo(() => construirDiff(modelo, requisitoId), [modelo, requisitoId]);
  const impactosDoRequisito = useMemo(
    () => modelo.impactos.filter((i) => i.requisitoId === requisitoId),
    [modelo.impactos, requisitoId],
  );

  const entidadesEmFoco = useMemo(() => diffs.map((d) => d.entidade.id), [diffs]);
  const codigoDiagrama = useMemo(
    () => gerarErDiagram(modelo, { entidadesEmFoco }),
    [modelo, entidadesEmFoco],
  );

  const atributosDaEntidadeSelecionada = useMemo(
    () => modelo.atributos.filter((a) => a.entidadeId === form.entidadeId),
    [modelo.atributos, form.entidadeId],
  );

  async function salvarImpacto() {
    if (!form.entidadeId) return;
    setSalvando(true);
    try {
      const criado = await criarImpacto(projetoId, {
        requisitoId,
        entidadeId: form.entidadeId,
        atributoId: form.atributoId || null,
        tipoOperacao: form.tipoOperacao,
        valorAnterior: form.valorAnterior.trim() || null,
        valorNovo: form.valorNovo.trim() || null,
      });
      setModelo((atual) => ({ ...atual, impactos: [...atual.impactos, criado] }));
      setDialogAberto(false);
      setForm(FORM_VAZIO);
      notify('Impacto no modelo de dados registrado', 'success');
      aoAlterar?.();
    } finally {
      setSalvando(false);
    }
  }

  async function removerImpacto(impactoId: string) {
    await deletarImpacto(projetoId, impactoId);
    setModelo((atual) => ({ ...atual, impactos: atual.impactos.filter((i) => i.id !== impactoId) }));
    notify('Impacto removido', 'info');
    aoAlterar?.();
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Modelagem de Dados
            </Typography>
            {impactosDoRequisito.length > 0 && (
              <Chip label={impactosDoRequisito.length} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
            )}
          </Box>
          {!isStakeholder && (
            <Tooltip title="Registrar impacto no modelo de dados">
              <IconButton size="small" onClick={() => setDialogAberto(true)}>
                <AddIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {carregando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : diffs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, border: '1.5px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <StorageIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Este requisito ainda não declara impacto sobre nenhuma entidade de dados.
            </Typography>
            {!isStakeholder && (
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogAberto(true)}>
                Registrar impacto
              </Button>
            )}
          </Box>
        ) : (
          <>
            {diffs.map((diff) => (
              <Box key={diff.entidade.id} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography
                    component="span"
                    sx={{ fontFamily: FONTE_DADOS, fontSize: 14.5, fontWeight: 600 }}
                  >
                    {diff.entidade.nome}
                  </Typography>
                  {diff.entidadeNova && (
                    <Chip
                      label="entidade nova"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10.5,
                        fontWeight: 700,
                        bgcolor: alpha(CORES_OPERACAO.CRIACAO_ENTIDADE, 0.12),
                        color: CORES_OPERACAO.CRIACAO_ENTIDADE,
                      }}
                    />
                  )}
                  <Box sx={{ display: 'flex', gap: 1.25, ml: 'auto', flexWrap: 'wrap' }}>
                    {(['ADICIONADO', 'ALTERADO', 'REMOVIDO'] as SituacaoAtributoDiff[])
                      .filter((situacao) => diff.linhas.some((l) => l.situacao === situacao))
                      .map((situacao) => (
                        <Box key={situacao} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: 0.5,
                              bgcolor: CORES_SITUACAO[situacao],
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10.5 }}>
                            {ROTULOS_SITUACAO[situacao]}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <ColunaDiff titulo="Estado atual" lado="atual" linhas={diff.linhas} />
                  <ColunaDiff titulo="Estado proposto" lado="proposto" linhas={diff.linhas} />
                </Box>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Impacto no diagrama do projeto
            </Typography>
            <ErDiagram
              codigo={codigoDiagrama}
              entidadesDestacadas={diffs.map((d) => idEntidadeNoDiagrama(d.entidade.nome))}
              altura={320}
            />

            <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary', display: 'block', mt: 3.5, mb: 1.5 }}>
              Registros de impacto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {impactosDoRequisito.map((impacto) => {
                const entidade = modelo.entidades.find((e) => e.id === impacto.entidadeId);
                const atributo = modelo.atributos.find((a) => a.id === impacto.atributoId);
                return (
                  <Box
                    key={impacto.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      flexWrap: 'wrap',
                    }}
                  >
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
                      {entidade?.nome ?? '—'}
                      {atributo ? `.${atributo.nome}` : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: FONTE_DADOS, fontSize: 10.5 }}>
                      {impacto.valorAnterior ?? '—'} → {impacto.valorNovo ?? '—'}
                    </Typography>
                    {!isStakeholder && (
                      <Tooltip title="Remover impacto">
                        <IconButton size="small" color="error" sx={{ ml: 'auto' }} onClick={() => removerImpacto(impacto.id)}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </CardContent>

      {/* ── Dialog: registrar impacto ── */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar impacto no modelo de dados</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Entidade</InputLabel>
            <Select
              label="Entidade"
              value={form.entidadeId}
              onChange={(e) => setForm((f) => ({ ...f, entidadeId: e.target.value, atributoId: '' }))}
            >
              {modelo.entidades.map((entidade) => (
                <MenuItem key={entidade.id} value={entidade.id}>
                  {entidade.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!form.entidadeId}>
            <InputLabel>Atributo (opcional)</InputLabel>
            <Select
              label="Atributo (opcional)"
              value={form.atributoId}
              onChange={(e) => setForm((f) => ({ ...f, atributoId: e.target.value }))}
            >
              <MenuItem value="">
                <em>Nenhum — impacto na entidade inteira</em>
              </MenuItem>
              {atributosDaEntidadeSelecionada.map((atributo) => (
                <MenuItem key={atributo.id} value={atributo.id}>
                  {atributo.nome} ({atributo.tipo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Operação</InputLabel>
            <Select
              label="Operação"
              value={form.tipoOperacao}
              onChange={(e) => setForm((f) => ({ ...f, tipoOperacao: e.target.value as TipoOperacaoImpacto }))}
            >
              {(Object.keys(ROTULOS_OPERACAO) as TipoOperacaoImpacto[]).map((operacao) => (
                <MenuItem key={operacao} value={operacao}>
                  {ROTULOS_OPERACAO[operacao]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Valor anterior"
            value={form.valorAnterior}
            onChange={(e) => setForm((f) => ({ ...f, valorAnterior: e.target.value }))}
            fullWidth
            size="small"
            placeholder="Ex.: VARCHAR(100) NULL — deixe vazio se o atributo não existia"
          />
          <TextField
            label="Valor novo"
            value={form.valorNovo}
            onChange={(e) => setForm((f) => ({ ...f, valorNovo: e.target.value }))}
            fullWidth
            size="small"
            placeholder="Ex.: VARCHAR(150) NOT NULL"
          />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            O par anterior/novo é o mesmo princípio já usado na auditoria da plataforma, aplicado ao
            schema em vez de a um campo do cadastro.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogAberto(false)} color="inherit" size="small" disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvarImpacto} variant="contained" size="small" disabled={salvando || !form.entidadeId}>
            {salvando ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

/** Sinal exibido na calha de cada linha, no estilo de um diff de schema. */
const SINAL_SITUACAO: Record<SituacaoAtributoDiff, string> = {
  INALTERADO: ' ',
  ADICIONADO: '+',
  ALTERADO: '~',
  REMOVIDO: '−',
};

function ColunaDiff({
  titulo,
  lado,
  linhas,
}: {
  titulo: string;
  lado: 'atual' | 'proposto';
  linhas: LinhaDiffAtributo[];
}) {
  const theme = useTheme();

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 1.75,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.text.primary, 0.02),
        }}
      >
        <Typography component="span" sx={{ ...ETIQUETA, fontSize: 9.5, color: 'text.secondary' }}>
          {titulo}
        </Typography>
      </Box>

      <Box sx={{ py: 0.75 }}>
        {linhas.map((linha) => {
          const valor = lado === 'atual' ? linha.atual : linha.proposto;
          const destacar =
            linha.situacao !== 'INALTERADO' &&
            ((lado === 'proposto' && linha.situacao !== 'REMOVIDO') ||
              (lado === 'atual' && linha.situacao !== 'ADICIONADO'));
          const cor = CORES_SITUACAO[linha.situacao];

          // Linha vazia deste lado: mantém a altura para as duas colunas
          // continuarem alinhadas atributo a atributo.
          return (
            <Box
              key={`${lado}-${linha.nome}`}
              sx={{
                display: 'flex',
                gap: 1,
                px: 1.25,
                py: 0.4,
                bgcolor: destacar
                  ? alpha(cor, theme.palette.mode === 'dark' ? 0.16 : 0.09)
                  : 'transparent',
              }}
            >
              <Box
                component="span"
                sx={{
                  fontFamily: FONTE_DADOS,
                  fontSize: 11,
                  fontWeight: 700,
                  width: 10,
                  flexShrink: 0,
                  color: destacar ? cor : 'transparent',
                }}
              >
                {destacar ? SINAL_SITUACAO[linha.situacao] : ' '}
              </Box>
              <Typography
                component="span"
                sx={{
                  fontFamily: FONTE_DADOS,
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: valor === null ? 'text.disabled' : 'text.primary',
                  opacity: valor === null ? 0.4 : 1,
                }}
              >
                {valor === null ? (
                  '—'
                ) : (
                  <>
                    {linha.nome}{' '}
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {valor}
                    </Box>
                  </>
                )}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
