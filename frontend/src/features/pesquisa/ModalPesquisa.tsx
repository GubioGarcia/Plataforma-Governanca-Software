import { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from '../../context/SnackbarContext';
import { extractApiErrorMessage } from '../../utils/apiError';
import EscalaConcordancia from './EscalaConcordancia';
import { responderAntes, responderDepois } from './pesquisaService';
import {
  TAMANHO_MAXIMO_ABERTA, TAMANHO_MAXIMO_FERRAMENTA_OUTRO,
  type EtapaPesquisa, type Instrumento, type SituacaoPesquisa,
} from './types';

interface Props {
  etapa: EtapaPesquisa;
  instrumento: Instrumento;
  nome: string;
  email: string;
  /** Recebe a situação devolvida pelo backend depois de um envio. */
  onAtualizar: (situacao: SituacaoPesquisa) => void;
  /** Envio recusado pelo backend por mudança de estado (409): recarregar a situação. */
  onConflito: () => void;
  /** Fechar sem enviar: no "antes" adia para o próximo login ("Responder depois"). */
  onFechar: () => void;
}

const PASSOS: Record<EtapaPesquisa, string[]> = {
  ANTES: ['Consentimento', 'Perguntas', 'Caracterização', 'Obrigado'],
  DEPOIS: ['Contexto', 'Perguntas', 'Obrigado'],
};

/**
 * Questionário do TCC. "Antes": não fecha clicando fora nem com Esc — as saídas são
 * concluir ou "Responder depois" (volta no próximo login até ser respondido).
 * "Depois": pode ser fechado sem enviar.
 * Os textos vêm do instrumento entregue pelo backend.
 */
export default function ModalPesquisa({ etapa, instrumento, nome, email, onAtualizar, onConflito, onFechar }: Props) {
  const theme = useTheme();
  const telaCheia = useMediaQuery(theme.breakpoints.down('sm'));
  const { notify } = useSnackbar();
  const passos = PASSOS[etapa];
  const textos = etapa === 'ANTES' ? instrumento.antes : instrumento.depois;

  const [passo, setPasso] = useState(0);
  const conteudoRef = useRef<HTMLDivElement>(null);

  // Cada passo começa do topo (no celular o conteúdo rola dentro do modal)
  function irPara(novo: number) {
    setPasso(novo);
    conteudoRef.current?.scrollTo({ top: 0 });
  }
  const [consentimento, setConsentimento] = useState(false);
  const [itens, setItens] = useState<(number | null)[]>(() => instrumento.itens.map(() => null));
  const [aberta, setAberta] = useState('');
  const [funcao, setFuncao] = useState('');
  const [tempoExperiencia, setTempoExperiencia] = useState('');
  const [ferramentas, setFerramentas] = useState<string[]>([]);
  const [ferramentaOutro, setFerramentaOutro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const concluido = passo === passos.length - 1;
  const passoPerguntas = 1;
  const ultimoPassoComDados = passos.length - 2;
  const outraMarcada = ferramentas.includes('OUTRA');

  const abertaLonga = aberta.trim().length > TAMANHO_MAXIMO_ABERTA;
  const outroLongo = ferramentaOutro.trim().length > TAMANHO_MAXIMO_FERRAMENTA_OUTRO;
  const podeAvancar = (() => {
    if (etapa === 'ANTES' && passo === 0) return consentimento;
    if (passo === passoPerguntas) return itens.every((v) => v !== null) && !abertaLonga;
    if (etapa === 'ANTES' && passo === 2) return !!funcao && !!tempoExperiencia && !outroLongo;
    return true;
  })();

  function alternarFerramenta(valor: string) {
    setFerramentas((atual) => (atual.includes(valor) ? atual.filter((f) => f !== valor) : [...atual, valor]));
  }

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      const respostaAberta = aberta.trim() || null;
      const valores = itens.map((v) => v ?? 0);
      const situacao = etapa === 'ANTES'
        ? await responderAntes({
            consentimento, itens: valores, respostaAberta, funcao, tempoExperiencia,
            ferramentas, ferramentaOutro: outraMarcada ? ferramentaOutro.trim() || null : null,
          })
        : await responderDepois({ itens: valores, respostaAberta });
      onAtualizar(situacao);
      irPara(passos.length - 1);
    } catch (err) {
      const mensagem = extractApiErrorMessage(err, 'Não foi possível enviar as respostas. Tente novamente.');
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        notify(mensagem, 'error');
        onConflito();
      } else {
        setErro(mensagem);
      }
    } finally {
      setEnviando(false);
    }
  }

  function avancar() {
    if (passo === ultimoPassoComDados) enviar();
    else irPara(passo + 1);
  }

  const podeFechar = etapa === 'DEPOIS' || concluido;

  return (
    <Dialog
      open
      fullScreen={telaCheia}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={!podeFechar}
      onClose={() => { if (podeFechar && !enviando) onFechar(); }}
      aria-labelledby="pesquisa-titulo"
    >
      <DialogTitle id="pesquisa-titulo" sx={{ pb: 1 }}>
        {etapa === 'ANTES' ? instrumento.tituloTermo : 'Nos ajude a melhorar'}
      </DialogTitle>
      <DialogContent dividers ref={conteudoRef}>
        <Stepper activeStep={passo} alternativeLabel sx={{ mb: 3 }}>
          {passos.map((p) => (
            <Step key={p}><StepLabel><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{p}</Box></StepLabel></Step>
          ))}
        </Stepper>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center', mt: -2, mb: 2 }}>
          Passo {passo + 1} de {passos.length} · {passos[passo]}
        </Typography>

        {/* Contexto e consentimento */}
        {passo === 0 && etapa === 'ANTES' && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>{textos.cabecalho}</Typography>
            {instrumento.termo.map((p) => (
              <Typography key={p} variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>{p}</Typography>
            ))}
            <FormControlLabel
              control={<Checkbox checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} />}
              label={instrumento.textoConcordo}
              sx={{ mt: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Respondendo como <strong>{nome}</strong> ({email})
            </Typography>
          </Box>
        )}
        {passo === 0 && etapa === 'DEPOIS' && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>{textos.cabecalho}</Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              São as mesmas 5 afirmações da primeira etapa, agora sobre a plataforma, e uma pergunta aberta opcional.
              Leva cerca de 3 minutos.
            </Typography>
          </Box>
        )}

        {/* Perguntas */}
        {passo === passoPerguntas && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>{textos.instrucao}</Typography>
            {instrumento.itens.map((item, i) => (
              <EscalaConcordancia
                key={item.numero}
                id={`pesquisa-item-${item.numero}`}
                numero={item.numero}
                texto={etapa === 'ANTES' ? item.textoAntes : item.textoDepois}
                escala={instrumento.escala}
                valor={itens[i]}
                onChange={(v) => setItens((atual) => atual.map((x, j) => (j === i ? v : x)))}
              />
            ))}
            <Typography id="pesquisa-aberta" variant="body2" sx={{ mt: 2.5, mb: 1, fontWeight: 500, lineHeight: 1.5 }}>
              {textos.perguntaAberta}{' '}
              <Typography component="span" variant="body2" color="text.secondary">(opcional)</Typography>
            </Typography>
            <TextField
              value={aberta}
              onChange={(e) => setAberta(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              error={abertaLonga}
              helperText={`${aberta.trim().length}/${TAMANHO_MAXIMO_ABERTA}`}
              slotProps={{ htmlInput: { 'aria-labelledby': 'pesquisa-aberta' } }}
            />
          </Box>
        )}

        {/* Caracterização */}
        {passo === 2 && etapa === 'ANTES' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl>
              <FormLabel id="pesquisa-funcao" sx={{ mb: 0.5 }}>{instrumento.perguntaFuncao}</FormLabel>
              <RadioGroup aria-labelledby="pesquisa-funcao" value={funcao} onChange={(e) => setFuncao(e.target.value)}>
                {instrumento.funcoes.map((o) => (
                  <FormControlLabel key={o.valor} value={o.valor} control={<Radio size="small" />} label={o.rotulo} />
                ))}
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel id="pesquisa-tempo" sx={{ mb: 0.5 }}>{instrumento.perguntaTempoExperiencia}</FormLabel>
              <RadioGroup aria-labelledby="pesquisa-tempo" value={tempoExperiencia} onChange={(e) => setTempoExperiencia(e.target.value)}>
                {instrumento.temposExperiencia.map((o) => (
                  <FormControlLabel key={o.valor} value={o.valor} control={<Radio size="small" />} label={o.rotulo} />
                ))}
              </RadioGroup>
            </FormControl>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 0.5 }}>{instrumento.perguntaFerramentas}</FormLabel>
              <FormGroup>
                {instrumento.ferramentas.map((o) => (
                  <FormControlLabel
                    key={o.valor}
                    control={<Checkbox size="small" checked={ferramentas.includes(o.valor)} onChange={() => alternarFerramenta(o.valor)} />}
                    label={o.rotulo}
                  />
                ))}
              </FormGroup>
              {outraMarcada && (
                <TextField
                  label="Qual outra ferramenta?"
                  value={ferramentaOutro}
                  onChange={(e) => setFerramentaOutro(e.target.value)}
                  size="small"
                  sx={{ mt: 1, maxWidth: 400 }}
                  error={outroLongo}
                  helperText={`${ferramentaOutro.trim().length}/${TAMANHO_MAXIMO_FERRAMENTA_OUTRO}`}
                />
              )}
            </FormControl>
          </Box>
        )}

        {/* Obrigado */}
        {concluido && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h4" sx={{ mb: 1.5 }}>Obrigado!</Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, maxWidth: 520, mx: 'auto' }}>
              {etapa === 'ANTES'
                ? 'Suas respostas foram registradas. Depois de usar a plataforma, o botão "Nos ajude a melhorar", no topo da tela, vai pedir a segunda parte.'
                : 'Suas respostas foram registradas. A sua participação na pesquisa está concluída.'}
            </Typography>
          </Box>
        )}

        {erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
        {concluido ? (
          <Button variant="contained" onClick={onFechar}>Fechar</Button>
        ) : (
          <>
            <Button color="inherit" onClick={onFechar} disabled={enviando} sx={{ mr: 'auto' }}>
              {etapa === 'ANTES' ? 'Responder depois' : 'Agora não'}
            </Button>
            {passo > 0 && (
              <Button onClick={() => irPara(passo - 1)} disabled={enviando}>Voltar</Button>
            )}
            <Button
              variant="contained"
              onClick={avancar}
              disabled={!podeAvancar || enviando}
              startIcon={enviando ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {passo === ultimoPassoComDados ? 'Enviar respostas' : 'Continuar'}
            </Button>
          </>
        )}
      </DialogActions>

    </Dialog>
  );
}
