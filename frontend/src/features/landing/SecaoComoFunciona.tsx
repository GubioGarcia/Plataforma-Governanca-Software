import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FONTE_DADOS } from '../../theme/tokens';
import Secao from './Secao';
import { corDestaque } from './cores';

const PASSOS = [
  {
    papel: 'Dono',
    titulo: 'Cria a organização e os projetos',
    texto: 'Cadastra a organização, abre os projetos e convida a equipe e os stakeholders, cada um com seu papel.',
  },
  {
    papel: 'Gestor',
    titulo: 'Conduz o discovery',
    texto: 'Registra a visão do produto e os requisitos, liga requisitos aos dados que eles alteram e decide as aprovações.',
  },
  {
    papel: 'Stakeholder Técnico',
    titulo: 'Valida a viabilidade',
    texto: 'Comenta os requisitos, aponta impactos técnicos e pede mudanças por solicitação formal.',
  },
  {
    papel: 'Stakeholder Cliente',
    titulo: 'Confirma o que precisa',
    texto: 'Acompanha o que foi acordado, participa dos eventos de validação e registra dúvidas e pedidos.',
  },
];

export default function SecaoComoFunciona() {
  return (
    <Secao
      id="como-funciona"
      etiqueta="Como funciona"
      titulo="Cada pessoa no seu papel"
      descricao="O acesso é por organização e por projeto: cada um vê e faz o que o papel permite, e toda ação fica registrada."
    >
      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
        {PASSOS.map((p, i) => (
          <Box component="li" key={p.papel} sx={{ position: 'relative', pt: 2, borderTop: '3px solid', borderColor: corDestaque }}>
            <Typography sx={{ fontFamily: FONTE_DADOS, fontSize: 13, fontWeight: 600, color: corDestaque, mb: 1 }}>
              {String(i + 1).padStart(2, '0')} · {p.papel}
            </Typography>
            <Typography component="h3" sx={{ fontWeight: 700, fontSize: 17, mb: 1 }}>{p.titulo}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 15, lineHeight: 1.6 }}>{p.texto}</Typography>
          </Box>
        ))}
      </Box>
    </Secao>
  );
}
