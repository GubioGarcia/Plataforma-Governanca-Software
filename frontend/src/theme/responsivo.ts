import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Padrões de layout responsivo compartilhados pelas telas (mobile-first).
 *
 * Breakpoints do MUI: xs < 600 (celular), sm ≥ 600 (celular grande deitado,
 * tablet pequeno), md ≥ 900 (tablet deitado/notebook — o menu do projeto fica
 * fixo a partir daqui), lg ≥ 1200 e xl ≥ 1536.
 */

/** Respiro da página: 16px no celular, 24px no tablet, 32px no notebook. */
export const PADDING_PAGINA = { xs: 2, sm: 3, md: 4 } as const;

/**
 * Cabeçalho de página (título + descrição à esquerda, ações à direita).
 * No celular empilha: o título ocupa a linha toda e as ações vão para baixo.
 */
export const cabecalhoPagina: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: { xs: 'stretch', sm: 'flex-end' },
  justifyContent: 'space-between',
  gap: 2,
};

/**
 * Grupo de botões do cabeçalho: no celular os botões dividem a largura (alvos
 * de toque grandes) e quebram de linha se não couberem; o texto não quebra.
 */
export const acoesCabecalho: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
  flexShrink: 0,
  '& > .MuiButton-root': { flex: { xs: '1 1 auto', sm: '0 0 auto' }, whiteSpace: 'nowrap' },
};

/** Linha de busca + filtros: os campos quebram de linha e crescem até preencher. */
export const linhaFiltros: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
  alignItems: 'center',
};
