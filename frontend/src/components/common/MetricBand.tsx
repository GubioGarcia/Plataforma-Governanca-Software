import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { ETIQUETA, FONTE_DADOS } from '../../theme/tokens';

export interface Leitura {
  rotulo: string;
  valor: string | number;
  /** Texto auxiliar, em caixa baixa, sob o valor. */
  detalhe?: string;
  /** Cor da marca que antecede o rótulo. */
  cor?: string;
}

interface MetricBandProps {
  leituras: Leitura[];
}

/**
 * Faixa de leituras da tela — um painel único dividido por filetes, em vez de
 * cartões repetidos. Os números usam a fonte de dados para alinhar em coluna.
 */
export default function MetricBand({ leituras }: MetricBandProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${leituras.length}, 1fr)` },
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {leituras.map((leitura, indice) => (
        <Box
          key={leitura.rotulo}
          sx={{
            px: 2.5,
            py: 2,
            borderLeft: indice === 0 ? 'none' : '1px solid',
            borderTop: { xs: indice > 1 ? '1px solid' : 'none', md: 'none' },
            borderColor: 'divider',
            // No layout de duas colunas o filete da esquerda só vale na 2ª coluna.
            '&:nth-of-type(odd)': { borderLeft: { xs: 'none', md: indice === 0 ? 'none' : '1px solid' } },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '2px',
                bgcolor: leitura.cor ?? 'text.disabled',
              }}
            />
            <Typography component="span" sx={{ ...ETIQUETA, color: 'text.secondary' }}>
              {leitura.rotulo}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: FONTE_DADOS,
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'text.primary',
            }}
          >
            {leitura.valor}
          </Typography>
          {leitura.detalhe && (
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.75 }}>
              {leitura.detalhe}
            </Typography>
          )}
        </Box>
      ))}
    </Card>
  );
}
