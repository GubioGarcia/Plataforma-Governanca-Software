import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

/**
 * Vocabulário visual das telas de rastreabilidade e modelagem de dados.
 *
 * A direção é a de um instrumento de leitura: papel milimetrado, coordenadas
 * em monoespaçada e marcadores plotados. Toda informação técnica — códigos de
 * requisito, tipos de coluna, contagens — é escrita na fonte de dados; texto
 * corrido continua na tipografia da plataforma.
 */

export const FONTE_DADOS = '"JetBrains Mono", "SFMono-Regular", Consolas, monospace';

/** Rótulo curto em versalete, usado acima dos títulos e nas legendas de eixo. */
export const ETIQUETA = {
  fontFamily: FONTE_DADOS,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
};

/** Papel milimetrado do fundo da matriz e do diagrama. */
export function papelMilimetrado(theme: Theme, passo = 22): Record<string, string> {
  const linha = alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.07 : 0.05);
  return {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.6)
        : alpha(theme.palette.common.white, 0.5),
    backgroundImage: `linear-gradient(${linha} 1px, transparent 1px), linear-gradient(90deg, ${linha} 1px, transparent 1px)`,
    backgroundSize: `${passo}px ${passo}px`,
  };
}

/** Nomes das animações declaradas em `AnimacoesGlobais`. */
export const ANIMACAO = {
  plotagem: 'discovery-plotagem',
  propagacao: 'discovery-propagacao',
  entradaLateral: 'discovery-entrada-lateral',
  varredura: 'discovery-varredura',
};
