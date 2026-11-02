import type { Theme } from '@mui/material/styles';

/**
 * Cor de destaque para TEXTO das páginas públicas. O primary (#3F51B5) tem pouco
 * contraste sobre o fundo escuro; no tema escuro usa um índigo claro (AA).
 */
export const corDestaque = (t: Theme) => (t.palette.mode === 'dark' ? '#A5B4FC' : t.palette.primary.main);
