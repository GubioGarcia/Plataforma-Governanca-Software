import { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  const [zoom, setZoom] = useState(1);
  const [telaCheia, setTelaCheia] = useState(false);
  const [tamanhoNatural, setTamanhoNatural] = useState({ largura: 0, altura: 0 });

  const destaquesSerializados = entidadesDestacadas.join(',');

  const ajustarZoom = useCallback((delta: number) => {
    setZoom((atual) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((atual + delta).toFixed(2)))));
  }, []);

  /** Escala que faz o diagrama caber na largura visível. */
  const calcularEscalaDeAjuste = useCallback(() => {
    const area = areaRef.current;
    if (!area) return 1;
    return escalaDeAjuste(area.clientWidth - 32, tamanhoNatural.largura);
  }, [tamanhoNatural]);

  /** Restaura o zoom de ajuste e a rolagem original — usado pelo botão de reset. */
  const ajustarEReenquadrar = useCallback(() => {
    setZoom(calcularEscalaDeAjuste());
    areaRef.current?.scrollTo({ left: 0, top: 0 });
  }, [calcularEscalaDeAjuste]);

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
        // assim o enquadramento já entra no primeiro render, sem repintura. O
        // zoom inicial é calculado direto da medida (não do estado, que ainda
        // não foi atualizado nesta mesma volta do event loop).
        const medida = medirViewBox(renderizado);
        setTamanhoNatural(medida);
        setSvg(renderizado);
        setZoom(escalaDeAjuste((areaRef.current?.clientWidth ?? 0) - 32, medida.largura));
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

  // Destaque e foco da entidade selecionada: aplicados sobre o SVG já
  // renderizado, porque o Mermaid não expõe estilo ou navegação por entidade
  // no `erDiagram`. Além do contorno, centraliza a área visível sobre o nó
  // encontrado, para que "focar" realmente traga a entidade para a tela.
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const alvos = destaquesSerializados ? destaquesSerializados.split(',') : [];
    if (alvos.length === 0) return;

    // O Mermaid identifica cada entidade como `<id>-entity-<NOME>-<indice>` e
    // desenha a caixa com <path> dentro de `g.outer-path`.
    const nos = containerRef.current.querySelectorAll<SVGGElement>('g[id*="-entity-"]');
    let noFocado: SVGGElement | null = null;
    nos.forEach((no) => {
      const nome = /-entity-(.+)-\d+$/.exec(no.id)?.[1]?.toUpperCase();
      if (!nome || !alvos.includes(nome)) return;
      noFocado = no;
      no.querySelectorAll('.outer-path path').forEach((contorno) => {
        contorno.setAttribute('stroke', theme.palette.primary.main);
        contorno.setAttribute('stroke-width', '2.5');
      });
    });

    const area = areaRef.current;
    if (noFocado && area) {
      // `getBoundingClientRect` já reflete o zoom aplicado via `transform`,
      // então a matemática de centralização funciona em qualquer nível de zoom.
      const retanguloArea = area.getBoundingClientRect();
      const retanguloNo = (noFocado as SVGGElement).getBoundingClientRect();
      const alvoEsquerda = area.scrollLeft + (retanguloNo.left - retanguloArea.left) + retanguloNo.width / 2 - area.clientWidth / 2;
      const alvoTopo = area.scrollTop + (retanguloNo.top - retanguloArea.top) + retanguloNo.height / 2 - area.clientHeight / 2;
      area.scrollTo({
        left: Math.max(0, alvoEsquerda),
        top: Math.max(0, alvoTopo),
        behavior: 'smooth',
      });
    }
  }, [svg, destaquesSerializados, theme.palette.primary.main]);

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
              <IconButton size="small" onClick={() => ajustarZoom(ZOOM_PASSO)} disabled={zoom >= ZOOM_MAX}>
                <AddIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Afastar" placement="left">
            <span>
              <IconButton size="small" onClick={() => ajustarZoom(-ZOOM_PASSO)} disabled={zoom <= ZOOM_MIN}>
                <RemoveIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ajustar à área visível" placement="left">
            <IconButton size="small" onClick={ajustarEReenquadrar}>
              <CenterFocusStrongIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={telaCheia ? 'Sair da tela cheia' : 'Expandir diagrama'} placement="left">
            <IconButton size="small" onClick={() => setTelaCheia((v) => !v)}>
              {telaCheia ? <CloseIcon sx={{ fontSize: 16 }} /> : <FullscreenIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box
        ref={areaRef}
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
          justifyContent: 'center',
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
      <Dialog fullScreen open onClose={() => setTelaCheia(false)}>
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
          <IconButton onClick={() => setTelaCheia(false)} aria-label="Sair da tela cheia">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>{corpo}</Box>
      </Dialog>
    );
  }

  return corpo;
}
