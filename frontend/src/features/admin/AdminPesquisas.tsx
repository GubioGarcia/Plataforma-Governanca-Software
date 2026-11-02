import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import TablePagination from '@mui/material/TablePagination';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MetricBand from '../../components/common/MetricBand';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  baixarCsvPesquisa, configurarPesquisa, listarRespostasAbertas, obterResumoPesquisa,
} from '../../services/adminService';
import { PADDING_PAGINA } from '../../theme/responsivo';
import type {
  ContagemPesquisa, DistribuicaoPesquisa, ItemResumoPesquisa, Pagina, RespostaAbertaPesquisa, ResumoPesquisa,
} from '../../types/admin';
import { extractApiErrorMessage } from '../../utils/apiError';

/** Cores da escala de 1 (discordo totalmente) a 5 (concordo totalmente). */
const CORES_ESCALA = ['#DC2626', '#F59E0B', '#9CA3AF', '#60A5FA', '#2563EB'];
const ROTULOS_ESCALA = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];

function formatarData(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function formatarMediana(m: number | null): string {
  return m === null ? '—' : m.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/**
 * Painel da pesquisa do TCC: coleta (abrir/encerrar e intervalo mínimo), contagens,
 * comparação antes/depois por item, respostas abertas só com o código do
 * participante e exportação do CSV anonimizado.
 */
export default function AdminPesquisas() {
  const { notify } = useSnackbar();
  const [resumo, setResumo] = useState<ResumoPesquisa | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [intervalo, setIntervalo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmarColeta, setConfirmarColeta] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let ativo = true;
    obterResumoPesquisa()
      .then((dados) => {
        if (!ativo) return;
        setResumo(dados);
        setIntervalo(String(dados.intervaloMinimoMin));
      })
      .catch((err) => {
        if (!ativo) return;
        setErro(true);
        notify(extractApiErrorMessage(err, 'Não foi possível carregar a pesquisa.'), 'error');
      });
    return () => { ativo = false; };
  }, [tentativa, notify]);

  const intervaloNumero = Number(intervalo);
  const intervaloValido = intervalo.trim() !== '' && Number.isInteger(intervaloNumero) && intervaloNumero >= 0 && intervaloNumero <= 1440;

  async function salvar(coletaAberta: boolean, mensagem: string) {
    if (!resumo) return;
    setSalvando(true);
    try {
      const novo = await configurarPesquisa({
        coletaAberta, intervaloMinimoMin: intervaloValido ? intervaloNumero : resumo.intervaloMinimoMin,
      });
      setResumo(novo);
      setIntervalo(String(novo.intervaloMinimoMin));
      notify(mensagem, 'success');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível salvar a configuração.'), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function exportar() {
    setExportando(true);
    try {
      await baixarCsvPesquisa();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível exportar o CSV.'), 'error');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Box sx={{ p: PADDING_PAGINA, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h2" component="h1">Pesquisa do TCC</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Questionário antes e depois do uso da plataforma. Os participantes aparecem só pelo código; nome e e-mail
        não saem do banco. Testes estatísticos são feitos sobre o CSV exportado.
      </Typography>

      {!resumo && !erro && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {erro && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Não foi possível carregar a pesquisa.</Typography>
          <Button variant="outlined" onClick={() => { setErro(false); setTentativa((t) => t + 1); }}>Tentar novamente</Button>
        </Box>
      )}

      {resumo && (
        <>
          {/* Coleta */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Coleta</Typography>
                  <Chip size="small" label={resumo.coletaAberta ? 'Aberta' : 'Encerrada'}
                    color={resumo.coletaAberta ? 'success' : 'default'} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {resumo.coletaAberta
                    ? `Aberta em ${formatarData(resumo.abertaEm)}`
                    : resumo.encerradaEm ? `Encerrada em ${formatarData(resumo.encerradaEm)}` : 'Ainda não foi aberta'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <TextField
                  label="Intervalo mínimo (min)"
                  type="number"
                  size="small"
                  value={intervalo}
                  onChange={(e) => setIntervalo(e.target.value)}
                  error={!intervaloValido}
                  helperText={intervaloValido ? 'Entre o "antes" e o "depois"' : 'De 0 a 1440'}
                  slotProps={{ htmlInput: { min: 0, max: 1440 } }}
                  sx={{ width: 190 }}
                />
                <Button
                  size="small"
                  sx={{ mt: 0.5 }}
                  disabled={salvando || !intervaloValido || intervaloNumero === resumo.intervaloMinimoMin}
                  onClick={() => salvar(resumo.coletaAberta, 'Intervalo mínimo atualizado.')}
                >
                  Salvar
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color={resumo.coletaAberta ? 'error' : 'primary'}
                  disabled={salvando}
                  onClick={() => setConfirmarColeta(true)}
                >
                  {resumo.coletaAberta ? 'Encerrar coleta' : 'Abrir coleta'}
                </Button>
                <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportar} disabled={exportando}>
                  Exportar CSV
                </Button>
              </Box>
            </CardContent>
          </Card>

          <MetricBand
            leituras={[
              { rotulo: 'Participantes', valor: resumo.participantes, cor: '#2563EB',
                detalhe: `${resumo.antesRespondidos} antes · ${resumo.depoisRespondidos} depois` },
              { rotulo: 'Pares completos', valor: resumo.paresCompletos, cor: '#16A34A', detalhe: 'as duas etapas' },
              { rotulo: 'Recusas', valor: resumo.recusas, cor: '#9CA3AF' },
              { rotulo: 'Retiradas', valor: resumo.retiradas, cor: '#D97706', detalhe: 'respostas apagadas' },
            ]}
          />

          {/* Comparação por item */}
          <Typography variant="h4" component="h2" sx={{ mb: 0.5 }}>Comparação por item</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            {ROTULOS_ESCALA.map((r, i) => (
              <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: CORES_ESCALA[i] }} />
                <Typography variant="caption" color="text.secondary">{i + 1} – {r}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            {resumo.itens.map((item) => <CartaoItem key={item.numero} item={item} />)}
          </Box>

          <RespostasAbertas />

          {/* Caracterização */}
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Caracterização</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <ListaContagem titulo="Função atual" contagens={resumo.funcoes} />
            <ListaContagem titulo="Tempo de experiência" contagens={resumo.temposExperiencia} />
            <ListaContagem titulo="Ferramentas" contagens={resumo.ferramentas} />
          </Box>

          <ConfirmDialog
            open={confirmarColeta}
            title={resumo.coletaAberta ? 'Encerrar a coleta?' : 'Abrir a coleta?'}
            message={resumo.coletaAberta
              ? 'Ninguém mais poderá responder. As respostas já enviadas continuam valendo e os participantes ainda podem retirar a participação.'
              : 'Quem entrar e ainda não usou a plataforma verá o questionário "antes". Quem já respondeu passa a ver o botão "Nos ajude a melhorar" depois do intervalo mínimo.'}
            confirmLabel={resumo.coletaAberta ? 'Encerrar coleta' : 'Abrir coleta'}
            confirmColor={resumo.coletaAberta ? 'error' : 'primary'}
            onConfirm={() => {
              setConfirmarColeta(false);
              salvar(!resumo.coletaAberta, resumo.coletaAberta ? 'Coleta encerrada.' : 'Coleta aberta.');
            }}
            onCancel={() => setConfirmarColeta(false)}
          />
        </>
      )}
    </Box>
  );
}

function CartaoItem({ item }: { item: ItemResumoPesquisa }) {
  const { pareado } = item;
  const diferenca = pareado.medianaDiferenca;
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Item {item.numero}</Typography>
        <Tooltip title={`Depois: ${item.textoDepois}`} placement="bottom-start">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{item.textoAntes}</Typography>
        </Tooltip>
        <BarraDistribuicao rotulo="Antes" dados={item.antes} />
        <BarraDistribuicao rotulo="Depois" dados={item.depois} />
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" color="text.secondary">
          {pareado.n === 0
            ? 'Sem pares completos ainda.'
            : `Pareado (${pareado.n}): mediana da diferença ${diferenca !== null && diferenca > 0 ? '+' : ''}${formatarMediana(diferenca)}`
              + ` · melhoraram ${pareado.melhoraram} · iguais ${pareado.iguais} · pioraram ${pareado.pioraram}`}
        </Typography>
      </CardContent>
    </Card>
  );
}

function BarraDistribuicao({ rotulo, dados }: { rotulo: string; dados: DistribuicaoPesquisa }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
      <Typography variant="caption" sx={{ width: 48, flexShrink: 0, fontWeight: 600 }}>{rotulo}</Typography>
      <Box
        role="img"
        aria-label={`${rotulo}: ${dados.distribuicao.map((q, i) => `${q} marcaram ${i + 1}`).join(', ')}`}
        sx={{ flex: 1, minWidth: 0, height: 18, display: 'flex', borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}
      >
        {dados.n > 0 && dados.distribuicao.map((q, i) => q > 0 && (
          <Tooltip key={i} title={`${i + 1} – ${ROTULOS_ESCALA[i]}: ${q}`}>
            <Box sx={{ width: `${(q / dados.n) * 100}%`, bgcolor: CORES_ESCALA[i] }} />
          </Tooltip>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ width: 104, flexShrink: 0, textAlign: 'right' }}>
        n {dados.n} · mediana {formatarMediana(dados.mediana)}
      </Typography>
    </Box>
  );
}

function ListaContagem({ titulo, contagens }: { titulo: string; contagens: ContagemPesquisa[] }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{titulo}</Typography>
        {contagens.map((c) => (
          <Box key={c.valor} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.25 }}>
            <Typography variant="body2" sx={{ minWidth: 0 }}>{c.rotulo}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.quantidade}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

/** Respostas abertas por etapa, paginadas; o texto é sempre exibido como texto puro. */
function RespostasAbertas() {
  const { notify } = useSnackbar();
  const [etapa, setEtapa] = useState<'ANTES' | 'DEPOIS'>('ANTES');
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(10);
  const [dados, setDados] = useState<Pagina<RespostaAbertaPesquisa> | null>(null);

  useEffect(() => {
    let ativo = true;
    listarRespostasAbertas({ etapa, pagina, tamanho })
      .then((d) => { if (ativo) setDados(d); })
      .catch((err) => { if (ativo) notify(extractApiErrorMessage(err, 'Não foi possível carregar as respostas.'), 'error'); });
    return () => { ativo = false; };
  }, [etapa, pagina, tamanho, notify]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" sx={{ mb: 1 }}>Respostas abertas</Typography>
      <Paper variant="outlined">
        <Tabs
          value={etapa}
          onChange={(_, v) => { setEtapa(v); setPagina(0); }}
          sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab value="ANTES" label="Antes" />
          <Tab value="DEPOIS" label="Depois" />
        </Tabs>
        {dados && dados.itens.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            Nenhuma resposta aberta nesta etapa.
          </Typography>
        )}
        {dados?.itens.map((r, i) => (
          <Box key={`${r.codigo}-${r.etapa}`} sx={{ px: 2, py: 1.5, borderTop: i === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>{r.codigo}</strong> · {formatarData(r.respondidaEm)}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 0.5 }}>{r.texto}</Typography>
          </Box>
        ))}
        <TablePagination
          component="div"
          count={dados?.total ?? 0}
          page={pagina}
          onPageChange={(_, p) => setPagina(p)}
          rowsPerPage={tamanho}
          onRowsPerPageChange={(e) => { setTamanho(Number(e.target.value)); setPagina(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>
    </Box>
  );
}
