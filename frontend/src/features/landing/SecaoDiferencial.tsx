import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Secao from './Secao';

// Resumo da lacuna identificada no capítulo de Estado da Arte da monografia
const ITENS = [
  'Visão do produto, especificação e aprovação de requisitos no mesmo ambiente',
  'Participação dos stakeholders por comentários e solicitações formais à gestão',
  'Rastreabilidade entre requisitos combinada à modelagem de dados',
  'Relações indiretas derivadas automaticamente entre requisitos que alteram as mesmas entidades',
];

export default function SecaoDiferencial() {
  return (
    <Secao
      id="diferencial"
      etiqueta="Diferencial"
      titulo="Feita para a fase em que o projeto ainda está sendo definido"
      descricao="Ferramentas de gestão tratam requisitos como itens de trabalho da equipe, e as especializadas miram produtos complexos e ambientes regulados. Nas soluções analisadas no estudo que originou a plataforma, não foi encontrado um ambiente que reunisse, nas fases iniciais:"
      destacada
    >
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5, maxWidth: 820 }}>
        {ITENS.map((item) => (
          <Box component="li" key={item} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <CheckCircleOutlineIcon aria-hidden sx={{ color: 'success.main', mt: '2px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 16, lineHeight: 1.6 }}>{item}</Typography>
          </Box>
        ))}
      </Box>
    </Secao>
  );
}
