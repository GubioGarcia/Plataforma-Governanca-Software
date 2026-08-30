import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
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
  const tamanhoNatural = useRef({ largura: 0, altura: 0 });
  const idBase = useId().replace(/[^a-zA-Z0-9]/g, '');

  const [svg, setSvg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const destaquesSerializados = entidadesDestacadas.join(',');

  const ajustarZoom = useCallback((delta: number) => {
    setZoom((atual) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((atual + delta).toFixed(2)))));
  }, []);

  /** Escala que faz o diagrama caber na largura visível. */
  const calcularEscalaDeAjuste = useCallback(() => {
    const area = areaRef.current;
    const { largura } = tamanhoNatural.current;
    if (!area || largura <= 0) return 1;
    const disponivel = area.clientWidth - 32;
    return Math.min(1, Math.max(ZOOM_MIN, Number((disponivel / largura).toFixed(2))));
  }, []);

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
        tamanhoNatural.current = medirViewBox(renderizado);
        setSvg(renderizado);
        setZoom(calcularEscalaDeAjuste());
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
  }, [codigo, theme.palette.mode, idBase, calcularEscalaDeAjuste]);

  // Destaque das entidades em foco: aplicado sobre o SVG já renderizado,
  // porque o Mermaid não expõe estilo por entidade no `erDiagram`.
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const alvos = destaquesSerializados ? destaquesSerializados.split(',') : [];
    if (alvos.length === 0) return;

    // O Mermaid identifica cada entidade como `<id>-entity-<NOME>-<indice>` e
    // desenha a caixa com <path> dentro de `g.outer-path`.
    const nos = containerRef.current.querySelectorAll<SVGGElement>('g[id*="-entity-"]');
    nos.forEach((no) => {
      const nome = /-entity-(.+)-\d+$/.exec(no.id)?.[1]?.toUpperCase();
      if (!nome || !alvos.includes(nome)) return;
      no.querySelectorAll('.outer-path path').forEach((contorno) => {
        contorno.setAttribute('stroke', theme.palette.primary.main);
        contorno.setAttribute('stroke-width', '2.5');
      });
    });
  }, [svg, destaquesSerializados, theme.palette.primary.main]);

  useEffect(() => {
    const desenho = containerRef.current?.querySelector('svg');
    const { largura, altura: alturaNatural } = tamanhoNatural.current;
    if (!desenho || largura <= 0) return;
    desenho.setAttribute('width', String(Math.round(largura * zoom)));
    desenho.setAttribute('height', String(Math.round(alturaNatural * zoom)));
  }, [svg, zoom]);

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

  return (
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
            <IconButton size="small" onClick={() => setZoom(calcularEscalaDeAjuste())}>
              <CenterFocusStrongIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box
        ref={areaRef}
        sx={{
          height: altura,
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
          <Box
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svg }}
            sx={{
              '& svg': { maxWidth: 'none' },
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
        ) : (
          <CircularProgress size={24} />
        )}
      </Box>
    </Box>
  );
}
