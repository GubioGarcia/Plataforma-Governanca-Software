import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LandingCabecalho from '../features/landing/LandingCabecalho';
import LandingRodape from '../features/landing/LandingRodape';
import { ETIQUETA } from '../theme/tokens';
import { corDestaque } from '../features/landing/cores';

const SECOES: { titulo: string; paragrafos: string[] }[] = [
  {
    titulo: 'Quais dados coletamos',
    paragrafos: [
      'Nome e e-mail, informados no cadastro, e a senha, guardada apenas pelo servidor de autenticação, protegida por hash (nem a plataforma consegue lê-la).',
      'O conteúdo que você registra nos projetos: visão do produto, requisitos, comentários, solicitações, eventos, arquivos e modelagem de dados.',
      'O histórico das suas ações nos projetos (auditoria e interações), usado nos indicadores de participação.',
      'Se você aceitar participar, as respostas ao questionário da pesquisa e a caracterização que você informar nele (função, tempo de experiência e ferramentas que você usa).',
    ],
  },
  {
    titulo: 'Para que usamos',
    paragrafos: [
      'Para o funcionamento da plataforma: identificar você, controlar o acesso por organização e projeto e manter o histórico das decisões.',
      'Para a pesquisa acadêmica do Trabalho de Conclusão de Curso que originou a plataforma, sempre de forma agregada. O questionário da pesquisa é opcional e só é aplicado com o seu consentimento.',
      'Não vendemos nem compartilhamos dados com terceiros, e a plataforma não usa rastreadores nem ferramentas de analytics externas.',
    ],
  },
  {
    titulo: 'Quem tem acesso',
    paragrafos: [
      'O conteúdo de um projeto só é visto pelas pessoas convidadas para a organização ou para o projeto, conforme o papel de cada uma.',
      'O administrador da plataforma vê a lista de contas (nome e e-mail) e contagens gerais. Ele não tem acesso ao conteúdo dos projetos.',
      'Ele também vê as respostas do questionário da pesquisa, associadas apenas a um código (como P-001), sem nome nem e-mail. Você pode retirar as suas respostas a qualquer momento em Meu Perfil.',
    ],
  },
  {
    titulo: 'Como pedir a exclusão',
    paragrafos: [
      'Você pode pedir a exclusão da sua conta e dos seus dados aos autores do projeto, na Faculdade SENAI Fatesg. A conta é inativada e deixa de ter acesso; o conteúdo que você criou dentro de projetos de outras pessoas pode ser mantido para preservar o histórico desses projetos.',
    ],
  },
];

/** Política de privacidade, pública e em linguagem simples. */
export default function PrivacidadePage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <LandingCabecalho />
      <Container component="main" maxWidth="md" sx={{ flex: 1, py: { xs: 5, md: 8 } }}>
        <Typography sx={{ ...ETIQUETA, color: corDestaque, mb: 1.5 }}>Privacidade</Typography>
        <Typography component="h1" sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
          Política de privacidade
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 16, lineHeight: 1.7, mb: 5 }}>
          A Discovery Platform é um projeto de TCC. Esta página explica, em poucas palavras, quais dados a
          plataforma guarda, para quê e como pedir a exclusão.
        </Typography>
        {SECOES.map((s) => (
          <Box component="section" key={s.titulo} sx={{ mb: 4 }}>
            <Typography component="h2" sx={{ fontSize: 20, fontWeight: 700, mb: 1.5 }}>{s.titulo}</Typography>
            {s.paragrafos.map((p) => (
              <Typography key={p} sx={{ fontSize: 16, lineHeight: 1.7, mb: 1.5 }}>{p}</Typography>
            ))}
          </Box>
        ))}
      </Container>
      <LandingRodape />
    </Box>
  );
}
