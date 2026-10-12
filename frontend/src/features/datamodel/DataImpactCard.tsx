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
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { extractApiErrorMessage } from '../../utils/apiError';
import {
  atualizarAtributo,
  atualizarEntidade,
  criarAtributo,
  criarEntidade,
  criarImpacto,
  deletarImpacto,
  obterModelo,
} from '../../services/dataModelService';
import { listarRequisitosPorProjeto } from '../../services/requirementService';
import {
  assinaturaAtributo,
  construirDiff,
  CORES_OPERACAO,
  gerarErDiagram,
  idEntidadeNoDiagrama,
  ROTULOS_CARDINALIDADE,
  ROTULOS_OPERACAO,
} from '../../utils/dataModel';
import type {
  LinhaDiffAtributo,
  ModeloDadosProjeto,
  SituacaoAtributoDiff,
  TipoOperacaoImpacto,
  TipoRelacionamentoEntidade,
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

interface NovoAtributoForm {
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  chavePrimaria: boolean;
  chaveEstrangeira: boolean;
  entidadeReferenciadaId: string;
  tipoRelacionamento: TipoRelacionamentoEntidade;
}

const ATRIBUTO_VAZIO: NovoAtributoForm = {
  nome: '',
  tipo: 'VARCHAR(150)',
  obrigatorio: true,
  chavePrimaria: false,
  chaveEstrangeira: false,
  entidadeReferenciadaId: '',
  tipoRelacionamento: 'UM_PARA_MUITOS',
};

const FORM_VAZIO = {
  entidadeId: '',
  atributoId: '',
  // "Criação de entidade" é a primeira operação da lista e o ponto de partida
  // natural: quando o projeto ainda não tem modelo, é por aqui que se começa.
  tipoOperacao: 'CRIA_ENTIDADE' as TipoOperacaoImpacto,
  // Usados apenas quando tipoOperacao === 'CRIA_ENTIDADE'.
  novaEntidadeNome: '',
  novaEntidadeDescricao: '',
  novosAtributos: [] as NovoAtributoForm[],
  // Usado apenas quando tipoOperacao === 'CRIA_ATRIBUTO'.
  novoAtributo: { ...ATRIBUTO_VAZIO } as NovoAtributoForm,
  // Usado apenas quando tipoOperacao === 'ALTERA_ATRIBUTO' — pré-carregado a
  // partir do atributo selecionado, no mesmo modelo do dialog de edição da
  // tela Modelo de Dados.
  edicaoAtributo: { ...ATRIBUTO_VAZIO } as NovoAtributoForm,
  // Usados apenas quando tipoOperacao === 'ALTERA_ENTIDADE'.
  edicaoEntidadeNome: '',
  edicaoEntidadeDescricao: '',
};

/** Estado inicial do formulário, sempre com objetos/arrays novos. */
function formInicial(): typeof FORM_VAZIO {
  return {
    ...FORM_VAZIO,
    novosAtributos: [],
    novoAtributo: { ...ATRIBUTO_VAZIO },
    edicaoAtributo: { ...ATRIBUTO_VAZIO },
  };
}

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
  const [form, setForm] = useState(formInicial);
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
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível carregar o modelo de dados.'), 'error');
    } finally {
      setCarregando(false);
    }
  }, [projetoId, notify]);

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

  const criandoEntidade = form.tipoOperacao === 'CRIA_ENTIDADE';
  const criandoAtributo = form.tipoOperacao === 'CRIA_ATRIBUTO';
  const alterandoAtributo = form.tipoOperacao === 'ALTERA_ATRIBUTO';
  const alterandoEntidade = form.tipoOperacao === 'ALTERA_ENTIDADE';
  const removendoAtributo = form.tipoOperacao === 'REMOVE_ATRIBUTO';
  const removendoEntidade = form.tipoOperacao === 'REMOVE_ENTIDADE';

  const atributoFkValido = (a: NovoAtributoForm) => !a.chaveEstrangeira || a.entidadeReferenciadaId.length > 0;

  const podeSalvar = criandoEntidade
    ? form.novaEntidadeNome.trim().length > 0 &&
      form.novosAtributos.every((a) => a.nome.trim().length > 0 && atributoFkValido(a))
    : criandoAtributo
      ? form.entidadeId.length > 0 &&
        form.novoAtributo.nome.trim().length > 0 &&
        atributoFkValido(form.novoAtributo)
      : alterandoAtributo
        ? form.entidadeId.length > 0 &&
          form.atributoId.length > 0 &&
          form.edicaoAtributo.nome.trim().length > 0 &&
          atributoFkValido(form.edicaoAtributo)
        : alterandoEntidade
          ? form.entidadeId.length > 0 && form.edicaoEntidadeNome.trim().length > 0
          : removendoAtributo
            ? form.entidadeId.length > 0 && form.atributoId.length > 0
            : removendoEntidade
              ? form.entidadeId.length > 0
              : false;

  function adicionarAtributo() {
    setForm((f) => ({ ...f, novosAtributos: [...f.novosAtributos, { ...ATRIBUTO_VAZIO }] }));
  }

  function atualizarAtributoDaLista(indice: number, patch: Partial<NovoAtributoForm>) {
    setForm((f) => ({
      ...f,
      novosAtributos: f.novosAtributos.map((a, i) => (i === indice ? { ...a, ...patch } : a)),
    }));
  }

  function removerAtributoForm(indice: number) {
    setForm((f) => ({ ...f, novosAtributos: f.novosAtributos.filter((_, i) => i !== indice) }));
  }

  function atualizarNovoAtributo(patch: Partial<NovoAtributoForm>) {
    setForm((f) => ({ ...f, novoAtributo: { ...f.novoAtributo, ...patch } }));
  }

  function atualizarEdicaoAtributo(patch: Partial<NovoAtributoForm>) {
    setForm((f) => ({ ...f, edicaoAtributo: { ...f.edicaoAtributo, ...patch } }));
  }

  /** Troca de entidade no formulário de impacto — reseta o atributo escolhido
   * e, conforme a operação, pré-carrega os campos editáveis (nome/descrição
   * da entidade, ou zera o formulário de edição de atributo). */
  function selecionarEntidadeImpacto(entidadeId: string) {
    setForm((f) => {
      const atualizado = { ...f, entidadeId, atributoId: '', edicaoAtributo: { ...ATRIBUTO_VAZIO } };
      if (f.tipoOperacao === 'ALTERA_ENTIDADE') {
        const entidade = modelo.entidades.find((e) => e.id === entidadeId);
        atualizado.edicaoEntidadeNome = entidade?.nome ?? '';
        atualizado.edicaoEntidadeDescricao = entidade?.descricao ?? '';
      }
      return atualizado;
    });
  }

  /** Seleção do atributo a alterar — pré-carrega o mini-formulário de edição
   * com os valores atuais, no mesmo princípio da tela Modelo de Dados. */
  function selecionarAtributoParaAlterar(atributoId: string) {
    const atributo = modelo.atributos.find((a) => a.id === atributoId);
    setForm((f) => ({
      ...f,
      atributoId,
      edicaoAtributo: atributo
        ? {
            nome: atributo.nome,
            tipo: atributo.tipo,
            obrigatorio: atributo.obrigatorio,
            chavePrimaria: atributo.chavePrimaria,
            chaveEstrangeira: atributo.chaveEstrangeira,
            entidadeReferenciadaId: atributo.entidadeReferenciadaId ?? '',
            tipoRelacionamento: atributo.tipoRelacionamento ?? 'UM_PARA_MUITOS',
          }
        : { ...ATRIBUTO_VAZIO },
    }));
  }

  function fecharDialog() {
    setDialogAberto(false);
    setForm(formInicial());
  }

  async function salvarImpacto() {
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      if (criandoEntidade) {
        // Fluxo guiado: cria a entidade, seus atributos e o registro de
        // impacto que amarra o requisito a essa nova entidade.
        const entidade = await criarEntidade(projetoId, {
          nome: form.novaEntidadeNome.trim(),
          descricao: form.novaEntidadeDescricao.trim() || null,
        });
        for (const atributo of form.novosAtributos) {
          if (!atributo.nome.trim()) continue;
          await criarAtributo(projetoId, {
            entidadeId: entidade.id,
            nome: atributo.nome.trim(),
            tipo: atributo.tipo,
            obrigatorio: atributo.obrigatorio,
            chavePrimaria: atributo.chavePrimaria,
            chaveEstrangeira: atributo.chaveEstrangeira,
            entidadeReferenciadaId: atributo.chaveEstrangeira ? atributo.entidadeReferenciadaId : null,
            tipoRelacionamento: atributo.chaveEstrangeira ? atributo.tipoRelacionamento : null,
          });
        }
        await criarImpacto(projetoId, {
          requisitoId,
          entidadeId: entidade.id,
          atributoId: null,
          tipoOperacao: 'CRIA_ENTIDADE',
          valorAnterior: null,
          valorNovo: null,
        });
        await carregar();
        notify('Entidade criada e impacto registrado', 'success');
      } else if (criandoAtributo) {
        // Cria o atributo na entidade escolhida e registra o impacto
        // apontando para ele — o diff mostra a entidade com a coluna nova.
        const atributo = await criarAtributo(projetoId, {
          entidadeId: form.entidadeId,
          nome: form.novoAtributo.nome.trim(),
          tipo: form.novoAtributo.tipo,
          obrigatorio: form.novoAtributo.obrigatorio,
          chavePrimaria: form.novoAtributo.chavePrimaria,
          chaveEstrangeira: form.novoAtributo.chaveEstrangeira,
          entidadeReferenciadaId: form.novoAtributo.chaveEstrangeira ? form.novoAtributo.entidadeReferenciadaId : null,
          tipoRelacionamento: form.novoAtributo.chaveEstrangeira ? form.novoAtributo.tipoRelacionamento : null,
        });
        await criarImpacto(projetoId, {
          requisitoId,
          entidadeId: form.entidadeId,
          atributoId: atributo.id,
          tipoOperacao: 'CRIA_ATRIBUTO',
          valorAnterior: null,
          valorNovo: assinaturaAtributo(atributo),
        });
        await carregar();
        notify('Atributo adicionado e impacto registrado', 'success');
      } else if (alterandoAtributo) {
        // Atualiza o atributo de verdade (mesmo endpoint da tela Modelo de
        // Dados) e registra o impacto com a assinatura antes/depois
        // calculada automaticamente — sem texto livre.
        const atributoOriginal = modelo.atributos.find((a) => a.id === form.atributoId);
        const assinaturaAntes = atributoOriginal ? assinaturaAtributo(atributoOriginal) : null;
        await atualizarAtributo(projetoId, form.atributoId, {
          nome: form.edicaoAtributo.nome.trim(),
          tipo: form.edicaoAtributo.tipo,
          obrigatorio: form.edicaoAtributo.obrigatorio,
          chavePrimaria: form.edicaoAtributo.chavePrimaria,
          chaveEstrangeira: form.edicaoAtributo.chaveEstrangeira,
          entidadeReferenciadaId: form.edicaoAtributo.chaveEstrangeira ? form.edicaoAtributo.entidadeReferenciadaId : null,
          tipoRelacionamento: form.edicaoAtributo.chaveEstrangeira ? form.edicaoAtributo.tipoRelacionamento : null,
        });
        const entidadeReferenciadaNomeDepois = form.edicaoAtributo.chaveEstrangeira
          ? modelo.entidades.find((e) => e.id === form.edicaoAtributo.entidadeReferenciadaId)?.nome ?? null
          : null;
        await criarImpacto(projetoId, {
          requisitoId,
          entidadeId: form.entidadeId,
          atributoId: form.atributoId,
          tipoOperacao: 'ALTERA_ATRIBUTO',
          valorAnterior: assinaturaAntes,
          valorNovo: assinaturaAtributo({
            tipo: form.edicaoAtributo.tipo,
            obrigatorio: form.edicaoAtributo.obrigatorio,
            chavePrimaria: form.edicaoAtributo.chavePrimaria,
            chaveEstrangeira: form.edicaoAtributo.chaveEstrangeira,
            entidadeReferenciadaNome: entidadeReferenciadaNomeDepois,
          }),
        });
        await carregar();
        notify('Atributo atualizado e impacto registrado', 'success');
      } else if (alterandoEntidade) {
        const entidadeOriginal = modelo.entidades.find((e) => e.id === form.entidadeId);
        await atualizarEntidade(projetoId, form.entidadeId, {
          nome: form.edicaoEntidadeNome.trim(),
          descricao: form.edicaoEntidadeDescricao.trim() || null,
        });
        await criarImpacto(projetoId, {
          requisitoId,
          entidadeId: form.entidadeId,
          atributoId: null,
          tipoOperacao: 'ALTERA_ENTIDADE',
          valorAnterior: entidadeOriginal?.nome ?? null,
          valorNovo: form.edicaoEntidadeNome.trim(),
        });
        await carregar();
        notify('Entidade atualizada e impacto registrado', 'success');
      } else if (removendoAtributo) {
        // Só registra o plano de remoção — o atributo continua existindo no
        // modelo para preservar o histórico (o backend bloqueia excluir um
        // atributo que já tem impacto vinculado).
        const atributo = modelo.atributos.find((a) => a.id === form.atributoId);
        const criado = await criarImpacto(projetoId, {
          requisitoId,
          entidadeId: form.entidadeId,
          atributoId: form.atributoId,
          tipoOperacao: 'REMOVE_ATRIBUTO',
          valorAnterior: atributo ? assinaturaAtributo(atributo) : null,
          valorNovo: null,
        });
        setModelo((atual) => ({ ...atual, impactos: [...atual.impactos, criado] }));
        notify('Impacto de remoção de atributo registrado', 'success');
      } else if (removendoEntidade) {
        const entidade = modelo.entidades.find((e) => e.id === form.entidadeId);
        const criado = await criarImpacto(projetoId, {
          requisitoId,
          entidadeId: form.entidadeId,
          atributoId: null,
          tipoOperacao: 'REMOVE_ENTIDADE',
          valorAnterior: entidade?.nome ?? null,
          valorNovo: null,
        });
        setModelo((atual) => ({ ...atual, impactos: [...atual.impactos, criado] }));
        notify('Impacto de remoção de entidade registrado', 'success');
      }
      fecharDialog();
      aoAlterar?.();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erro ao registrar impacto no modelo de dados.'), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function removerImpacto(impactoId: string) {
    try {
      await deletarImpacto(projetoId, impactoId);
      setModelo((atual) => ({ ...atual, impactos: atual.impactos.filter((i) => i.id !== impactoId) }));
      notify('Impacto removido', 'info');
      aoAlterar?.();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erro ao remover impacto.'), 'error');
    }
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
                        bgcolor: alpha(CORES_OPERACAO.CRIA_ENTIDADE, 0.12),
                        color: CORES_OPERACAO.CRIA_ENTIDADE,
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
      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {criandoEntidade
            ? 'Criar entidade impactada pelo requisito'
            : criandoAtributo
              ? 'Adicionar atributo a uma entidade'
              : alterandoAtributo
                ? 'Alterar atributo existente'
                : alterandoEntidade
                  ? 'Alterar entidade existente'
                  : removendoAtributo
                    ? 'Remover atributo'
                    : removendoEntidade
                      ? 'Remover entidade'
                      : 'Registrar impacto no modelo de dados'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Operação</InputLabel>
            <Select
              label="Operação"
              value={form.tipoOperacao}
              onChange={(e) => {
                const tipoOperacao = e.target.value as TipoOperacaoImpacto;
                setForm({ ...formInicial(), tipoOperacao });
              }}
            >
              {(Object.keys(ROTULOS_OPERACAO) as TipoOperacaoImpacto[]).map((operacao) => (
                <MenuItem key={operacao} value={operacao}>
                  {ROTULOS_OPERACAO[operacao]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {criandoEntidade ? (
            <>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
                A entidade e os atributos abaixo são criados no modelo do projeto e ficam vinculados a
                este requisito como uma criação de entidade.
              </Typography>

              <TextField
                label="Nome da entidade"
                value={form.novaEntidadeNome}
                onChange={(e) => setForm((f) => ({ ...f, novaEntidadeNome: e.target.value }))}
                fullWidth
                size="small"
                autoFocus
                placeholder="Ex.: Cliente"
              />
              <TextField
                label="Descrição (opcional)"
                value={form.novaEntidadeDescricao}
                onChange={(e) => setForm((f) => ({ ...f, novaEntidadeDescricao: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="O que esta entidade representa no domínio do projeto"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
                  Atributos
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={adicionarAtributo}>
                  Adicionar
                </Button>
              </Box>

              {form.novosAtributos.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Nenhum atributo ainda — você pode adicionar agora ou depois, pela tela Modelo de Dados.
                </Typography>
              ) : (
                form.novosAtributos.map((atributo, indice) => (
                  <Box
                    key={indice}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      p: 1,
                    }}
                  >
                    <TextField
                      label="Nome"
                      value={atributo.nome}
                      onChange={(e) => atualizarAtributoDaLista(indice, { nome: e.target.value })}
                      size="small"
                      sx={{ flex: '1 1 120px' }}
                      placeholder="Ex.: cpf"
                    />
                    <FormControl size="small" sx={{ flex: '1 1 120px' }}>
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        label="Tipo"
                        value={atributo.tipo}
                        onChange={(e) => atualizarAtributoDaLista(indice, { tipo: e.target.value })}
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
                          size="small"
                          checked={atributo.obrigatorio}
                          onChange={(e) => atualizarAtributoDaLista(indice, { obrigatorio: e.target.checked })}
                        />
                      }
                      label="NOT NULL"
                      sx={{ mr: 0 }}
                    />
                    <Tooltip
                      title={
                        !atributo.chavePrimaria && form.novosAtributos.some((a, i) => a.chavePrimaria && i !== indice)
                          ? 'Já existe outro atributo marcado como chave primária nesta lista'
                          : ''
                      }
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={atributo.chavePrimaria}
                            disabled={form.novosAtributos.some((a, i) => a.chavePrimaria && i !== indice)}
                            onChange={(e) => atualizarAtributoDaLista(indice, { chavePrimaria: e.target.checked })}
                          />
                        }
                        label="PK"
                        sx={{ mr: 0 }}
                      />
                    </Tooltip>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={atributo.chaveEstrangeira}
                          onChange={(e) => atualizarAtributoDaLista(indice, { chaveEstrangeira: e.target.checked })}
                        />
                      }
                      label="FK"
                      sx={{ mr: 0 }}
                    />
                    <IconButton size="small" color="error" onClick={() => removerAtributoForm(indice)}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    {atributo.chaveEstrangeira && (
                      <>
                        <FormControl size="small" sx={{ flex: '1 1 160px' }}>
                          <InputLabel>Entidade referenciada</InputLabel>
                          <Select
                            label="Entidade referenciada"
                            value={atributo.entidadeReferenciadaId}
                            onChange={(e) => atualizarAtributoDaLista(indice, { entidadeReferenciadaId: e.target.value })}
                          >
                            {modelo.entidades.map((e) => (
                              <MenuItem key={e.id} value={e.id}>
                                {e.nome}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ flex: '1 1 120px' }}>
                          <InputLabel>Cardinalidade</InputLabel>
                          <Select
                            label="Cardinalidade"
                            value={atributo.tipoRelacionamento}
                            onChange={(e) =>
                              atualizarAtributoDaLista(indice, {
                                tipoRelacionamento: e.target.value as TipoRelacionamentoEntidade,
                              })
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
                  </Box>
                ))
              )}
            </>
          ) : (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>Entidade</InputLabel>
                <Select
                  label="Entidade"
                  value={form.entidadeId}
                  onChange={(e) => selecionarEntidadeImpacto(e.target.value)}
                >
                  {modelo.entidades.length === 0 && (
                    <MenuItem value="" disabled>
                      <em>Nenhuma entidade — use a operação "Criação de entidade"</em>
                    </MenuItem>
                  )}
                  {modelo.entidades.map((entidade) => (
                    <MenuItem key={entidade.id} value={entidade.id}>
                      {entidade.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {criandoAtributo ? (
                <>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
                    O atributo é criado na entidade selecionada. O estado atual continua mostrando a
                    entidade como está; o estado proposto e o diagrama passam a exibi-la com a coluna nova.
                  </Typography>

                  <TextField
                    label="Nome do atributo"
                    value={form.novoAtributo.nome}
                    onChange={(e) => atualizarNovoAtributo({ nome: e.target.value })}
                    fullWidth
                    size="small"
                    placeholder="Ex.: cpf"
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      label="Tipo"
                      value={form.novoAtributo.tipo}
                      onChange={(e) => atualizarNovoAtributo({ tipo: e.target.value })}
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
                        checked={form.novoAtributo.obrigatorio}
                        onChange={(e) => atualizarNovoAtributo({ obrigatorio: e.target.checked })}
                      />
                    }
                    label="Obrigatório (NOT NULL)"
                  />
                  <Tooltip
                    title={
                      atributosDaEntidadeSelecionada.some((a) => a.chavePrimaria)
                        ? 'Esta entidade já tem um atributo marcado como chave primária'
                        : ''
                    }
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.novoAtributo.chavePrimaria}
                          disabled={atributosDaEntidadeSelecionada.some((a) => a.chavePrimaria)}
                          onChange={(e) => atualizarNovoAtributo({ chavePrimaria: e.target.checked })}
                        />
                      }
                      label="Chave primária (PK)"
                    />
                  </Tooltip>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.novoAtributo.chaveEstrangeira}
                        onChange={(e) => atualizarNovoAtributo({ chaveEstrangeira: e.target.checked })}
                      />
                    }
                    label="Chave estrangeira (FK)"
                  />
                  {form.novoAtributo.chaveEstrangeira && (
                    <>
                      <FormControl fullWidth size="small">
                        <InputLabel>Entidade referenciada</InputLabel>
                        <Select
                          label="Entidade referenciada"
                          value={form.novoAtributo.entidadeReferenciadaId}
                          onChange={(e) => atualizarNovoAtributo({ entidadeReferenciadaId: e.target.value })}
                        >
                          {modelo.entidades
                            .filter((e) => e.id !== form.entidadeId)
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
                          value={form.novoAtributo.tipoRelacionamento}
                          onChange={(e) =>
                            atualizarNovoAtributo({ tipoRelacionamento: e.target.value as TipoRelacionamentoEntidade })
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
                </>
              ) : alterandoAtributo ? (
                <>
                  <FormControl fullWidth size="small" disabled={!form.entidadeId}>
                    <InputLabel>Atributo</InputLabel>
                    <Select
                      label="Atributo"
                      value={form.atributoId}
                      onChange={(e) => selecionarAtributoParaAlterar(e.target.value)}
                    >
                      {atributosDaEntidadeSelecionada.map((atributo) => (
                        <MenuItem key={atributo.id} value={atributo.id}>
                          {atributo.nome} ({atributo.tipo})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {form.atributoId && (
                    <>
                      <TextField
                        label="Nome do atributo"
                        value={form.edicaoAtributo.nome}
                        onChange={(e) => atualizarEdicaoAtributo({ nome: e.target.value })}
                        fullWidth
                        size="small"
                      />
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          label="Tipo"
                          value={form.edicaoAtributo.tipo}
                          onChange={(e) => atualizarEdicaoAtributo({ tipo: e.target.value })}
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
                            checked={form.edicaoAtributo.obrigatorio}
                            onChange={(e) => atualizarEdicaoAtributo({ obrigatorio: e.target.checked })}
                          />
                        }
                        label="Obrigatório (NOT NULL)"
                      />
                      <Tooltip
                        title={
                          atributosDaEntidadeSelecionada.some((a) => a.chavePrimaria && a.id !== form.atributoId)
                            ? 'Esta entidade já tem um atributo marcado como chave primária'
                            : ''
                        }
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={form.edicaoAtributo.chavePrimaria}
                              disabled={atributosDaEntidadeSelecionada.some((a) => a.chavePrimaria && a.id !== form.atributoId)}
                              onChange={(e) => atualizarEdicaoAtributo({ chavePrimaria: e.target.checked })}
                            />
                          }
                          label="Chave primária (PK)"
                        />
                      </Tooltip>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.edicaoAtributo.chaveEstrangeira}
                            onChange={(e) => atualizarEdicaoAtributo({ chaveEstrangeira: e.target.checked })}
                          />
                        }
                        label="Chave estrangeira (FK)"
                      />
                      {form.edicaoAtributo.chaveEstrangeira && (
                        <>
                          <FormControl fullWidth size="small">
                            <InputLabel>Entidade referenciada</InputLabel>
                            <Select
                              label="Entidade referenciada"
                              value={form.edicaoAtributo.entidadeReferenciadaId}
                              onChange={(e) => atualizarEdicaoAtributo({ entidadeReferenciadaId: e.target.value })}
                            >
                              {modelo.entidades
                                .filter((e) => e.id !== form.entidadeId)
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
                              value={form.edicaoAtributo.tipoRelacionamento}
                              onChange={(e) =>
                                atualizarEdicaoAtributo({
                                  tipoRelacionamento: e.target.value as TipoRelacionamentoEntidade,
                                })
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
                    </>
                  )}
                </>
              ) : alterandoEntidade ? (
                <>
                  <TextField
                    label="Nome da entidade"
                    value={form.edicaoEntidadeNome}
                    onChange={(e) => setForm((f) => ({ ...f, edicaoEntidadeNome: e.target.value }))}
                    fullWidth
                    size="small"
                    disabled={!form.entidadeId}
                  />
                  <TextField
                    label="Descrição"
                    value={form.edicaoEntidadeDescricao}
                    onChange={(e) => setForm((f) => ({ ...f, edicaoEntidadeDescricao: e.target.value }))}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    disabled={!form.entidadeId}
                  />
                </>
              ) : removendoAtributo ? (
                <FormControl fullWidth size="small" disabled={!form.entidadeId}>
                  <InputLabel>Atributo</InputLabel>
                  <Select
                    label="Atributo"
                    value={form.atributoId}
                    onChange={(e) => setForm((f) => ({ ...f, atributoId: e.target.value }))}
                  >
                    {atributosDaEntidadeSelecionada.map((atributo) => (
                      <MenuItem key={atributo.id} value={atributo.id}>
                        {atributo.nome} ({atributo.tipo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={fecharDialog} color="inherit" size="small" disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvarImpacto} variant="contained" size="small" disabled={salvando || !podeSalvar}>
            {salvando
              ? 'Salvando...'
              : criandoEntidade
                ? 'Criar entidade'
                : criandoAtributo
                  ? 'Adicionar atributo'
                  : alterandoAtributo || alterandoEntidade
                    ? 'Salvar'
                    : 'Registrar'}
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
