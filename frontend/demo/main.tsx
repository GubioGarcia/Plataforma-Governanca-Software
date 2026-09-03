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
import App from '../src/App';
import { AppThemeProvider } from '../src/context/ThemeContext';
import { SnackbarProvider } from '../src/context/SnackbarContext';
import { AuthContext, type AuthUser } from '../src/context/AuthContext';
import type { PapelProjeto } from '../src/types/stakeholder';
import { instalarApiDemo } from './api';
import { ORG_ID } from './dados';

instalarApiDemo();

const USUARIO_DEMO: AuthUser = {
  id: 'u1',
  nome: 'Thiago Falcone',
  email: 'thiago@discovery.dev',
  ativo: true,
  roles: ['GESTOR'],
  urlMidiaPerfil: null,
  role: 'GESTOR',
};

/**
 * Entra no lugar do AuthProvider real: já devolve alguém autenticado, para
 * que a demonstração comece dentro do sistema em vez da tela de login.
 */
function AuthDemoProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(USUARIO_DEMO);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login: async () => {},
        logout: () => {},
        switchRole: (role: PapelProjeto) => setUser((atual) => ({ ...atual, role })),
      }}
    >
      {children}
    </AuthContext.Provider>
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
