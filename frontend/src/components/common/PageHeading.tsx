import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ETIQUETA } from '../../theme/tokens';

interface PageHeadingProps {
  /** Rótulo curto acima do título — o eixo em que a tela vive. */
  etiqueta: string;
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
}

/**
 * Cabeçalho das telas de rastreabilidade e modelagem: etiqueta em versalete
 * sobre uma régua fina, título em peso alto e ações à direita.
 */
export default function PageHeading({ etiqueta, titulo, descricao, acoes }: PageHeadingProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ width: 18, height: 2, bgcolor: 'primary.main' }} />
        <Typography component="span" sx={{ ...ETIQUETA, color: 'primary.main' }}>
          {etiqueta}
        </Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 26, md: 32 },
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'text.primary',
            }}
          >
            {titulo}
          </Typography>
          {descricao && (
            <Typography variant="body2" sx={{ maxWidth: 680, mt: 1 }}>
              {descricao}
            </Typography>
          )}
        </Box>
        {acoes && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>{acoes}</Box>}
      </Box>
    </Box>
  );
}
