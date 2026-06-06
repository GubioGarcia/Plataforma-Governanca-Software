import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppThemeProvider } from './context/ThemeContext';
import { SnackbarProvider } from './context/SnackbarContext';
import AuthProvider from './context/AuthContext';
import App from './App';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SnackbarProvider>
              <App />
            </SnackbarProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
