import GlobalStyles from '@mui/material/GlobalStyles';
import { ANIMACAO } from '../../theme/tokens';

/**
 * Animações compartilhadas pelas telas de rastreabilidade e modelagem.
 *
 * Ficam em folha global porque são referenciadas pelo nome dentro de `sx`,
 * onde não há como interpolar keyframes do Emotion. Quem pediu menos
 * movimento no sistema operacional recebe as telas paradas.
 */
export default function AnimacoesGlobais() {
  return (
    <GlobalStyles
      styles={{
        [`@keyframes ${ANIMACAO.plotagem}`]: {
          from: { opacity: 0, transform: 'scale(0.6)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        [`@keyframes ${ANIMACAO.propagacao}`]: {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.22)' },
          '100%': { transform: 'scale(1)' },
        },
        [`@keyframes ${ANIMACAO.entradaLateral}`]: {
          from: { opacity: 0, transform: 'translateX(14px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        [`@keyframes ${ANIMACAO.varredura}`]: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      }}
    />
  );
}
