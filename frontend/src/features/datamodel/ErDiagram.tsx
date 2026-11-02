import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import mermaid from 'mermaid';
import { papelMilimetrado } from '../../theme/tokens';

interface ErDiagramProps {
  /** Código `erDiagram` gerado por `utils/dataModel.gerarErDiagram`. */
  codigo: string;
  /** Nomes das entidades a destacar no diagrama (formato do Mermaid). */
  entidadesDestacadas?: string[];
  /** Altura da área de visualização. */
  altura?: number | string;
  /** Esconde os controles de zoom (usado nas versões compactas). */
  semControles?: boolean;
}

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const ZOOM_PASSO = 0.2;
/** Tamanho de fonte usado pelo Mermaid ao medir e desenhar os rótulos. */
const TAMANHO_FONTE = 12;

/** Extrai o tamanho natural do desenho a partir do `viewBox` do SVG. */
function medirViewBox(svg: string): { largura: number; altura: number } {
  const caixa = /viewBox="([^"]+)"/.exec(svg)?.[1]?.trim().split(/[\s,]+/).map(Number);
  return caixa && caixa.length === 4 && caixa.every(Number.isFinite)
    ? { largura: caixa[2], altura: caixa[3] }
    : { largura: 0, altura: 0 };
}

/** Escala que faz uma largura natural caber na largura disponível, dentro dos limites de zoom. */
function escalaDeAjuste(larguraDisponivel: number, larguraNatural: number): number {
  if (larguraNatural <= 0) return 1;
  return Math.min(1, Math.max(ZOOM_MIN, Number((larguraDisponivel / larguraNatural).toFixed(2))));
}

/** Folga, em px, entre a entidade focada e a borda da área visível. */
const MARGEM_FOCO = 24;

/**
 * Rolagem que traz o retângulo `alvo` para dentro da `area`: centraliza quando
 * ele cabe e, quando não cabe, encosta o início (esquerda/topo) com uma folga —
 * centralizar um nó maior que a área cortaria justamente o cabeçalho dele.
 */
function rolagemParaFocar(area: HTMLElement, alvo: DOMRect): { left: number; top: number } {
  const caixaArea = area.getBoundingClientRect();
  const eixo = (inicioAlvo: number, tamanhoAlvo: number, inicioArea: number, visivel: number, rolagem: number, total: number) => {
    const posicao = rolagem + (inicioAlvo - inicioArea);
    const desejado = tamanhoAlvo + 2 * MARGEM_FOCO <= visivel
      ? posicao + tamanhoAlvo / 2 - visivel / 2
      : posicao - MARGEM_FOCO;
    return Math.min(Math.max(0, total - visivel), Math.max(0, desejado));
  };
  return {
    left: eixo(alvo.left, alvo.width, caixaArea.left + area.clientLeft, area.clientWidth, area.scrollLeft, area.scrollWidth),
    top: eixo(alvo.top, alvo.height, caixaArea.top + area.clientTop, area.clientHeight, area.scrollTop, area.scrollHeight),
  };
}

/**
 * Renderiza o diagrama entidade-relacionamento do projeto.
 *
 * O desenho é derivado do estado atual do modelo a cada render — não existe
 * imagem salva que possa divergir dos dados.
 */
export default function ErDiagram({
  codigo,
  entidadesDestacadas = [],
  altura = 460,
  semControles = false,
}: ErDiagramProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const idBase = useId().replace(/[^a-zA-Z0-9]/g, '');

  const [svg, setSvg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // `null` = modo "ajustado": o zoom acompanha a largura da área visível. Só
  // vira um número fixo quando o usuário aproxima ou afasta.
  const [zoomManual, setZoomManual] = useState<number | null>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [tamanhoNatural, setTamanhoNatural] = useState({ largura: 0, altura: 0 });
  const [larguraArea, setLarguraArea] = useState(0);
  // Elemento da área de rolagem em estado (além da ref): na tela cheia ele é
  // montado pelo portal do Dialog depois do commit deste componente, e os
  // efeitos de destaque e enquadramento precisam rodar de novo quando chega.
  const [areaMontada, setAreaMontada] = useState<HTMLDivElement | null>(null);
  // Incrementado a cada reenquadramento (render novo, botão de ajuste, entrada
  // ou saída da tela cheia): dispara a volta à posição inicial — ou ao foco da
  // entidade selecionada — depois que o novo zoom já está no DOM.
  const [enquadramento, setEnquadramento] = useState(0);

  const destaquesSerializados = entidadesDestacadas.join(',');
  const zoom = zoomManual ?? escalaDeAjuste(larguraArea - 32, tamanhoNatural.largura);

  // A área de rolagem muda de elemento ao entrar/sair da tela cheia; a ref de
  // callback acompanha a troca e mede a largura de cada uma.
  const observadorArea = useRef<ResizeObserver | null>(null);
  const refArea = useCallback((elemento: HTMLDivElement | null) => {
    areaRef.current = elemento;
    setAreaMontada(elemento);
    observadorArea.current?.disconnect();
    observadorArea.current = null;
    if (!elemento) return;
    setLarguraArea(elemento.clientWidth);
    const observador = new ResizeObserver(() => setLarguraArea(elemento.clientWidth));
    observador.observe(elemento);
    observadorArea.current = observador;
  }, []);
  useEffect(() => () => observadorArea.current?.disconnect(), []);

  const ajustarZoom = useCallback((delta: number) => {
    setZoomManual(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((zoom + delta).toFixed(2)))));
  }, [zoom]);

  /** Volta ao zoom de ajuste e à posição original. */
  const reenquadrar = useCallback(() => {
    setZoomManual(null);
    setEnquadramento((n) => n + 1);
  }, []);

  /** Entra/sai da tela cheia já reenquadrado na nova área. */
  const alternarTelaCheia = useCallback((valor: boolean) => {
    setTelaCheia(valor);
    reenquadrar();
  }, [reenquadrar]);

  useEffect(() => {
    let ativo = true;

    async function renderizar() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme.palette.mode === 'dark' ? 'dark' : 'default',
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          er: { useMaxWidth: false, entityPadding: 12, fontSize: TAMANHO_FONTE },
        });
        const { svg: renderizado } = await mermaid.render(`er-${idBase}`, codigo);
        if (!ativo) return;
        // O tamanho natural sai do próprio `viewBox`, antes de inserir o SVG:
        // assim o enquadramento já entra no primeiro render, sem repintura.
        setTamanhoNatural(medirViewBox(renderizado));
        setSvg(renderizado);
        setZoomManual(null);
        setEnquadramento((n) => n + 1);
        setErro(null);
      } catch {
        if (!ativo) return;
        setSvg(null);
        setErro('Não foi possível renderizar o diagrama com o modelo atual.');
      }
    }

    renderizar();
    return () => {
      ativo = false;
    };
  }, [codigo, theme.palette.mode, idBase]);

  /** Nó `<g>` de cada entidade destacada, na ordem em que aparecem no SVG. */
  const nosDestacados = useCallback((): SVGGElement[] => {
    if (!containerRef.current || !destaquesSerializados) return [];
    const alvos = destaquesSerializados.split(',');
    // O Mermaid identifica cada entidade como `<id>-entity-<NOME>-<indice>`.
    return Array.from(containerRef.current.querySelectorAll<SVGGElement>('g[id*="-entity-"]')).filter((no) => {
      const nome = /-entity-(.+)-\d+$/.exec(no.id)?.[1]?.toUpperCase();
      return !!nome && alvos.includes(nome);
    });
  }, [destaquesSerializados]);

  // Destaque da entidade selecionada: aplicado sobre o SVG já renderizado,
  // porque o Mermaid não expõe estilo por entidade no `erDiagram`. Como o
  // React não reinsere o SVG quando só a seleção muda, o contorno anterior é
  // restaurado antes de destacar a nova entidade. Ao trocar de área (tela
  // cheia), o SVG é reinserido limpo e o destaque é reaplicado.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!svg || !container) return;
    container.querySelectorAll<SVGPathElement>('.outer-path path[data-destaque]').forEach((contorno) => {
      const [stroke, largura] = JSON.parse(contorno.dataset.destaque ?? '[null,null]') as [string | null, string | null];
      if (stroke === null) contorno.removeAttribute('stroke');
      else contorno.setAttribute('stroke', stroke);
      if (largura === null) contorno.removeAttribute('stroke-width');
      else contorno.setAttribute('stroke-width', largura);
      delete contorno.dataset.destaque;
    });
    nosDestacados().forEach((no) => {
      no.querySelectorAll<SVGPathElement>('.outer-path path').forEach((contorno) => {
        contorno.dataset.destaque = JSON.stringify([contorno.getAttribute('stroke'), contorno.getAttribute('stroke-width')]);
        contorno.setAttribute('stroke', theme.palette.primary.main);
        contorno.setAttribute('stroke-width', '2.5');
      });
    });
  }, [svg, areaMontada, nosDestacados, theme.palette.primary.main]);

  // Enquadramento: leva a área visível até a entidade destacada ou, sem
  // seleção, de volta ao início. Roda depois do layout com o zoom novo, então
  // `getBoundingClientRect` (que já reflete o `transform`) mede a posição final.
  // Mudança de seleção rola suavemente; reenquadramento (e ajuste automático
  // a uma nova largura, como ao abrir a tela cheia) posiciona direto.
  const ultimo = useRef({ enquadramento, zoom, destaquesSerializados });
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!svg || !area) return;
    const anterior = ultimo.current;
    ultimo.current = { enquadramento, zoom, destaquesSerializados };
    const mudouSelecao = anterior.destaquesSerializados !== destaquesSerializados;
    const reenquadrou = anterior.enquadramento !== enquadramento
      || (zoomManual === null && anterior.zoom !== zoom);
    if (!mudouSelecao && !reenquadrou) return;

    const nos = nosDestacados();
    if (nos.length === 0) {
      if (reenquadrou) area.scrollTo({ left: 0, top: 0 });
      return;
    }
    const caixas = nos.map((no) => no.getBoundingClientRect());
    const esquerda = Math.min(...caixas.map((c) => c.left));
    const topo = Math.min(...caixas.map((c) => c.top));
    const uniao = new DOMRect(
      esquerda,
      topo,
      Math.max(...caixas.map((c) => c.right)) - esquerda,
      Math.max(...caixas.map((c) => c.bottom)) - topo,
    );
    area.scrollTo({ ...rolagemParaFocar(area, uniao), behavior: reenquadrou ? 'auto' : 'smooth' });
  }, [svg, areaMontada, enquadramento, zoom, zoomManual, destaquesSerializados, nosDestacados]);

  if (erro) {
    return (
      <Box
        sx={{
          height: altura,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          px: 3,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {erro}
        </Typography>
      </Box>
    );
  }

  const { largura: naturalW, altura: naturalH } = tamanhoNatural;
  const temTamanhoNatural = naturalW > 0 && naturalH > 0;
  const alturaEfetiva = telaCheia ? 'calc(100vh - 140px)' : altura;

  const corpo = (
    <Box sx={{ position: 'relative' }}>
      {!semControles && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Tooltip title="Aproximar" placement="left">
            <span>
              <IconButton size="small" aria-label="Aproximar" onClick={() => ajustarZoom(ZOOM_PASSO)} disabled={zoom >= ZOOM_MAX}>
                <AddIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Afastar" placement="left">
            <span>
              <IconButton size="small" aria-label="Afastar" onClick={() => ajustarZoom(-ZOOM_PASSO)} disabled={zoom <= ZOOM_MIN}>
                <RemoveIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ajustar à área visível" placement="left">
            <IconButton size="small" aria-label="Ajustar à área visível" onClick={reenquadrar}>
              <CenterFocusStrongIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={telaCheia ? 'Sair da tela cheia' : 'Expandir diagrama'} placement="left">
            <IconButton
              size="small"
              aria-label={telaCheia ? 'Sair da tela cheia' : 'Expandir diagrama'}
              onClick={() => alternarTelaCheia(!telaCheia)}
            >
              {telaCheia ? <CloseIcon sx={{ fontSize: 16 }} /> : <FullscreenIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box
        ref={refArea}
        sx={{
          height: alturaEfetiva,
          overflow: 'auto',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          ...papelMilimetrado(theme, 24),
          p: 2,
          display: 'flex',
          alignItems: svg ? 'flex-start' : 'center',
          // Sem `justifyContent: center` com o diagrama presente: num contêiner
          // rolável, o excedente de um item centralizado vaza para a esquerda,
          // fora do alcance da barra de rolagem. A margem automática do
          // envelope centraliza quando cabe e encosta à esquerda quando não.
          justifyContent: svg ? 'flex-start' : 'center',
        }}
      >
        {svg ? (
          // Envelope com o tamanho visual real (natural × zoom): é ele que
          // define a área de rolagem. O miolo mantém o tamanho natural fixo e
          // é escalado via `transform`, para que o zoom nunca derive do valor
          // anterior — reduzir sempre volta ao mesmo tamanho e posição.
          <Box
            sx={{
              width: temTamanhoNatural ? naturalW * zoom : undefined,
              height: temTamanhoNatural ? naturalH * zoom : undefined,
              flexShrink: 0,
              mx: 'auto',
            }}
          >
            <Box
              ref={containerRef}
              dangerouslySetInnerHTML={{ __html: svg }}
              sx={{
                width: temTamanhoNatural ? naturalW : undefined,
                height: temTamanhoNatural ? naturalH : undefined,
                transform: temTamanhoNatural ? `scale(${zoom})` : undefined,
                transformOrigin: 'top left',
                '& svg': {
                  display: 'block',
                  maxWidth: 'none',
                  width: temTamanhoNatural ? naturalW : undefined,
                  height: temTamanhoNatural ? naturalH : undefined,
                },
                // O Mermaid calcula a largura de cada rótulo com `er.fontSize`.
                // Sem fixar o mesmo tamanho aqui, o texto herda a tipografia da
                // aplicação (14px), fica maior que a caixa medida e é cortado.
                '& foreignObject div, & foreignObject span, & foreignObject p': {
                  fontSize: `${TAMANHO_FONTE}px`,
                  lineHeight: 1.35,
                  margin: 0,
                },
              }}
            />
          </Box>
        ) : (
          <CircularProgress size={24} />
        )}
      </Box>
    </Box>
  );

  if (telaCheia) {
    return (
      <Dialog fullScreen open onClose={() => alternarTelaCheia(false)}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Diagrama entidade-relacionamento
          </Typography>
          <IconButton onClick={() => alternarTelaCheia(false)} aria-label="Sair da tela cheia">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>{corpo}</Box>
      </Dialog>
    );
  }

  return corpo;
}
