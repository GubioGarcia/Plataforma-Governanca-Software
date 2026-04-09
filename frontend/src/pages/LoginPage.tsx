import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import HubIcon from '@mui/icons-material/Hub';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { cadastrarUsuario, isApiError } from '../services/userService';

// Critério de senha: mínimo 8 caracteres, ao menos 1 letra e 1 número
const SENHA_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validarSenha(senha: string): string | undefined {
  if (!senha) return 'Senha obrigatória';
  if (senha.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
  if (!SENHA_REGEX.test(senha)) return 'A senha deve conter letras e números';
  return undefined;
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const inputBg = isDark ? '#1E2334' : '#FFFFFF';
  const inputText = isDark ? '#F1F5F9' : '#1A1D23';

  const [modo, setModo] = useState<'login' | 'cadastro'>('login');

  // login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // cadastro
  const [cadNome, setCadNome]   = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadErros, setCadErros] = useState<{ nome?: string; email?: string; senha?: string }>({});
  const [cadSucesso, setCadSucesso] = useState(false);

  // Redireciona para a rota de origem após login (ou para /organizations)
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/organizations';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  function alternarModo(m: 'login' | 'cadastro') {
    setModo(m);
    setErro('');
    setCadErros({});
    setCadSucesso(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha para continuar.');
      return;
    }

    setErro('');
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível realizar seu login. Verifique os dados informados e tente novamente.';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();

    const erros: typeof cadErros = {};
    if (!cadNome.trim()) erros.nome = 'Nome obrigatório';
    if (!cadEmail.trim()) {
      erros.email = 'E-mail obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cadEmail)) {
      erros.email = 'E-mail inválido';
    }
    const senhaErro = validarSenha(cadSenha);
    if (senhaErro) erros.senha = senhaErro;

    if (Object.keys(erros).length) { setCadErros(erros); return; }

    setLoading(true);
    setCadErros({});
    try {
      await cadastrarUsuario({ nome: cadNome.trim(), email: cadEmail.trim(), senha: cadSenha });
      setCadSucesso(true);
      setCadNome(''); setCadEmail(''); setCadSenha('');
    } catch (err) {
      if (isApiError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setCadErros({ email: 'Já existe uma conta com este e-mail' });
        } else if (status === 422) {
          setCadErros({ senha: 'A senha não atende aos requisitos mínimos' });
        } else {
          setCadErros({ nome: err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.' });
        }
      } else {
        setCadErros({ nome: 'Erro ao criar conta. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  }

  const inputSx = {
    borderRadius: 2.5,
    height: 52,
    fontSize: 17,
    background: inputBg,
    color: inputText,
    boxShadow: 'none',
    px: 2,
  };

  const autoFillSx = {
    '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus': {
      WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset`,
      WebkitTextFillColor: inputText,
      caretColor: inputText,
    },
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch', bgcolor: 'background.default' }}>

      {/* Painel esquerdo */}
      <Box
        sx={{
          flex: 1,
          bgcolor: 'primary.main',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
            opacity: 0.07,
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <Box sx={{ position: 'relative', maxWidth: 440 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HubIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>Discovery Platform</Typography>
          </Box>
          <Typography variant="h1" sx={{ color: '#fff', mb: 2, lineHeight: 1.2 }}>
            Centralize. Valide. Entregue.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.7 }}>
            Plataforma colaborativa para apoio à gestão da fase de Discovery e Elicitação de Requisitos,
            com foco na interação contínua dos stakeholders.
          </Typography>
          <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { icon: '📖', text: 'WIKI estruturada com validação formal de stakeholders' },
              { icon: '📋', text: 'Requisitos com fluxo de aprovação e rastreabilidade' },
              { icon: '📊', text: 'Métricas de engajamento em tempo real' },
              { icon: '🔐', text: 'RBAC contextual por organização e projeto' },
            ].map((f) => (
              <Box key={f.text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Typography sx={{ fontSize: '18px', lineHeight: 1 }}>{f.icon}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', lineHeight: 1.5 }}>
                  {f.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Painel direito */}
      <Box
        sx={{
          width: { xs: '100%', md: 480 },
          minWidth: { md: 480 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 380,
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          {/* Logo mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HubIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700 }}>Discovery Platform</Typography>
          </Box>

          {/* ── MODO LOGIN ── */}
          {modo === 'login' && (
            <>
              <Typography variant="h3" sx={{ mb: 0.5 }}>Bem-vindo de volta</Typography>
              <Typography variant="body2" sx={{ mb: 2.5 }}>
                Faça login com sua conta para continuar
              </Typography>

              <Box
                component="form"
                onSubmit={handleLogin}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, mt: 2, mb: 1 }}
              >
                <TextField
                  label="E-mail"
                  type="email"
                  size="medium"
                  fullWidth
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErro(''); }}
                  autoComplete="username"
                  disabled={loading}
                  InputProps={{ sx: inputSx }}
                  slotProps={{ input: { sx: autoFillSx } }}
                />
                <TextField
                  label="Senha"
                  type="password"
                  size="medium"
                  fullWidth
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setErro(''); }}
                  autoComplete="current-password"
                  disabled={loading}
                  error={!!erro}
                  helperText={erro || undefined}
                  InputProps={{ sx: inputSx }}
                  slotProps={{ input: { sx: autoFillSx } }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.7, borderRadius: 2.5, fontSize: 17, height: 52, boxShadow: 'none', fontWeight: 600, letterSpacing: 0.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                </Button>
              </Box>

              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2.5, color: 'text.secondary' }}>
                Não tem uma conta?{' '}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => alternarModo('cadastro')}
                >
                  Criar conta
                </Typography>
              </Typography>
            </>
          )}

          {/* ── MODO CADASTRO ── */}
          {modo === 'cadastro' && (
            <>
              <Typography variant="h3" sx={{ mb: 0.5 }}>Criar conta</Typography>
              <Typography variant="body2" sx={{ mb: 2.5 }}>
                Preencha os dados para acessar a plataforma
              </Typography>

              {cadSucesso ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h2" sx={{ mb: 1 }}>✅</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Conta criada com sucesso!</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Agora faça login para acessar a plataforma.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => alternarModo('login')}
                    sx={{ borderRadius: 2.5, height: 52, fontSize: 16, fontWeight: 600, boxShadow: 'none' }}
                  >
                    Ir para o login
                  </Button>
                </Box>
              ) : (
                <Box
                  component="form"
                  onSubmit={handleCadastro}
                  noValidate
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2, mb: 1 }}
                >
                  <TextField
                    label="Nome completo *"
                    size="medium"
                    fullWidth
                    value={cadNome}
                    onChange={(e) => { setCadNome(e.target.value); setCadErros((p) => ({ ...p, nome: undefined })); }}
                    autoComplete="name"
                    disabled={loading}
                    error={!!cadErros.nome}
                    helperText={cadErros.nome}
                    InputProps={{ sx: inputSx }}
                    slotProps={{ input: { sx: autoFillSx } }}
                  />
                  <TextField
                    label="E-mail *"
                    type="email"
                    size="medium"
                    fullWidth
                    value={cadEmail}
                    onChange={(e) => { setCadEmail(e.target.value); setCadErros((p) => ({ ...p, email: undefined })); }}
                    autoComplete="email"
                    disabled={loading}
                    error={!!cadErros.email}
                    helperText={cadErros.email}
                    InputProps={{ sx: inputSx }}
                    slotProps={{ input: { sx: autoFillSx } }}
                  />
                  <TextField
                    label="Senha *"
                    type="password"
                    size="medium"
                    fullWidth
                    value={cadSenha}
                    onChange={(e) => { setCadSenha(e.target.value); setCadErros((p) => ({ ...p, senha: undefined })); }}
                    autoComplete="new-password"
                    disabled={loading}
                    error={!!cadErros.senha}
                    helperText={cadErros.senha || 'Mínimo 8 caracteres com letras e números'}
                    InputProps={{ sx: { ...inputSx, height: 'auto', py: 1.5 } }}
                    slotProps={{ input: { sx: autoFillSx } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.7, borderRadius: 2.5, fontSize: 17, height: 52, boxShadow: 'none', fontWeight: 600, letterSpacing: 0.5, mt: 0.5 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar conta'}
                  </Button>
                </Box>
              )}

              {!cadSucesso && (
                <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
                  Já tem uma conta?{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => alternarModo('login')}
                  >
                    Fazer login
                  </Typography>
                </Typography>
              )}
            </>
          )}

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'text.secondary' }}>
            © 2026 Discovery Platform — TCC
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}