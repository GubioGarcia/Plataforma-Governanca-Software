/**
 * Modo de demonstração — `http://localhost:5173/demo/`.
 *
 * Monta o app inteiro (mesmo cabeçalho, mesmo menu lateral, mesmas rotas)
 * com a API simulada e um usuário já autenticado, para navegar por todas as
 * telas sem subir backend e Keycloak. Não faz parte do produto.
 */
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '../src/index.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import App from '../src/App';
import { AppThemeProvider } from '../src/context/ThemeContext';
import { SnackbarProvider } from '../src/context/SnackbarContext';
import { AuthContext, type AuthUser } from '../src/context/AuthContext';
import { PERMISSOES, type Permissao } from '../src/types/acesso';
import { instalarApiDemo } from './api';
import { ORG_ID, organizacoes, projetos } from './dados';

instalarApiDemo();

type PerfilDemo = 'GESTOR' | 'STAKEHOLDER';

// Permissões do Stakeholder (Técnico + Cliente) segundo a matriz do backend (MatrizPermissoes)
const PERMISSOES_STAKEHOLDER: Permissao[] = [
  'REQ_VIEW', 'REQ_COMMENT', 'REQ_REQUEST_CHANGE', 'REQ_REQUEST_REJECTION', 'REQ_REQUEST_APPROVAL',
  'WIKI_VIEW', 'WIKI_COMMENT', 'AUDIT_HISTORICO_VIEW',
  'PROJETO_VIEW_USERS', 'EVENTO_VIEW', 'EVENTO_REQUEST', 'ARQUIVO_VIEW', 'ARQUIVO_DOWNLOAD',
  'ANALYTICS_VIEW', 'MER_VIEW', 'MER_EXPORT_REQUEST', 'RASTREABILIDADE_VIEW', 'RASTREABILIDADE_EXPORT_REQUEST',
];

/** Usuário simulado: Dono de todas as organizações da demonstração, ou stakeholder convidado aos projetos. */
function usuarioDemo(perfil: PerfilDemo): AuthUser {
  const gestor = perfil === 'GESTOR';
  return {
    id: 'u1',
    externalIdentityId: 'u1',
    nome: 'Thiago Falcone',
    email: 'thiago@discovery.dev',
    ativo: true,
    dataCriacao: new Date().toISOString(),
    urlMidiaPerfil: null,
    adminPlataforma: gestor,
    organizacoes: organizacoes.map((o) => ({
      id: o.id,
      nome: o.nome,
      ativo: o.ativo ?? true,
      papel: gestor ? 'DONO' : null,
      permissoes: gestor ? PERMISSOES.filter((p) => p.startsWith('ORG_')) : [],
      projetos: projetos
        .filter((p) => p.organizacaoId === o.id)
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          ativo: p.ativo ?? true,
          papeis: gestor ? ['DONO'] : ['STAKEHOLDER_TECNICO', 'STAKEHOLDER_CLIENTE'],
          permissoes: gestor ? PERMISSOES.filter((x) => !x.startsWith('ORG_')) : PERMISSOES_STAKEHOLDER,
        })),
    })),
  };
}

/**
 * Entra no lugar do AuthProvider real: já devolve alguém autenticado, para
 * que a demonstração comece dentro do sistema em vez da tela de login.
 * O seletor de perfil (canto inferior esquerdo) alterna a visão Gestor/Stakeholder.
 */
function AuthDemoProvider({ children }: { children: React.ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilDemo>('GESTOR');

  return (
    <AuthContext.Provider
      value={{
        user: usuarioDemo(perfil),
        isAuthenticated: true,
        carregando: false,
        login: async () => {},
        logout: async () => {},
        recarregarPermissoes: async () => {},
      }}
    >
      {children}
      <SeletorPerfilDemo perfil={perfil} onTrocar={setPerfil} />
    </AuthContext.Provider>
  );
}

function SeletorPerfilDemo({ perfil, onTrocar }: { perfil: PerfilDemo; onTrocar: (p: PerfilDemo) => void }) {
  return (
    <Box sx={{ position: 'fixed', left: 12, bottom: 44, zIndex: 2000, display: 'flex', gap: 0.5 }}>
      {(['GESTOR', 'STAKEHOLDER'] as PerfilDemo[]).map((p) => (
        <Chip
          key={p}
          size="small"
          label={p === 'GESTOR' ? 'Gestor' : 'Stakeholder'}
          color={perfil === p ? 'primary' : 'default'}
          onClick={() => onTrocar(p)}
        />
      ))}
    </Box>
  );
}

/** Selo discreto lembrando que os dados são simulados. */
function SeloDemo() {
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 2000,
        px: 1.25,
        py: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.14em',
        color: 'text.disabled',
        pointerEvents: 'none',
      }}
    >
      DEMONSTRAÇÃO · DADOS SIMULADOS
    </Box>
  );
}

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={[`/organizations/${ORG_ID}/projects`]}>
    <AppThemeProvider>
      <AuthDemoProvider>
        <SnackbarProvider>
          <App />
          <SeloDemo />
        </SnackbarProvider>
      </AuthDemoProvider>
    </AppThemeProvider>
  </MemoryRouter>,
);
