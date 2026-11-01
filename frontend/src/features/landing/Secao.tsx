import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { ETIQUETA } from '../../theme/tokens';
import { corDestaque } from './cores';

interface SecaoProps {
  id: string;
  etiqueta: string;
  titulo: string;
  descricao?: string;
  /** Fundo alternado entre as seções (papel x fundo da página). */
  destacada?: boolean;
  children: React.ReactNode;
}

/** Bloco de conteúdo da landing: etiqueta, título, descrição e corpo. */
export default function Secao({ id, etiqueta, titulo, descricao, destacada, children }: SecaoProps) {
  const idTitulo = `${id}-titulo`;
  return (
    <Box
      component="section"
      id={id}
      aria-labelledby={idTitulo}
      sx={{
        py: { xs: 7, md: 10 },
        bgcolor: destacada ? 'background.paper' : 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 720, mb: { xs: 4, md: 6 } }}>
          <Typography sx={{ ...ETIQUETA, color: corDestaque, mb: 1.5 }}>{etiqueta}</Typography>
          <Typography id={idTitulo} component="h2" sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
            {titulo}
          </Typography>
          {descricao && (
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 16, md: 17 }, lineHeight: 1.7 }}>
              {descricao}
            </Typography>
          )}
        </Box>
        {children}
      </Container>
    </Box>
  );
}
