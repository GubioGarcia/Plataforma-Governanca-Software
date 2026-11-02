import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FONTE_DADOS } from '../../theme/tokens';
import Secao from './Secao';
import { corDestaque } from './cores';

// Números da monografia, com a fonte citada (sem métricas próprias ou inventadas)
const DADOS = [
  { valor: '48%', texto: 'das empresas apontam requisitos incompletos ou ocultos entre os problemas mais críticos.' },
  { valor: '41%', texto: 'citam falhas de comunicação entre a equipe do projeto e o cliente.' },
];

export default function SecaoProblema() {
  return (
    <Secao
      id="problema"
      etiqueta="O problema"
      titulo="Informação espalhada e stakeholders de fora das decisões"
      descricao="Nas fases iniciais, a visão do produto, os requisitos e as decisões ficam em documentos, conversas e planilhas separados. Quem conhece o negócio participa pouco da validação, e os desencontros só aparecem no desenvolvimento, quando corrigir custa caro."
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, md: 3 }, maxWidth: 880 }}>
        {DADOS.map((d) => (
          <Box key={d.valor} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography sx={{ fontFamily: FONTE_DADOS, fontSize: { xs: 40, md: 48 }, fontWeight: 700, color: corDestaque, lineHeight: 1 }}>
              {d.valor}
            </Typography>
            <Typography sx={{ mt: 1.5, fontSize: 16, lineHeight: 1.6 }}>{d.texto}</Typography>
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 2.5, fontSize: 13, color: 'text.secondary' }}>
        Fonte: levantamento com 228 empresas de 10 países — Méndez Fernández et al., 2017.
      </Typography>
    </Secao>
  );
}
