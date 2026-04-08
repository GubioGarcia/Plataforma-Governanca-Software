import { createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export function createAppTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  return createTheme({
  palette: {
    mode,
    background: {
      default: isDark ? '#0D1117' : '#F4F6F8',
      paper:   isDark ? '#161B27' : '#FFFFFF',
    },
    primary: {
      main: '#3F51B5',
      light: '#6573C3',
      dark: '#303F9F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3AED',
      light: '#9461F7',
      dark: '#5B21B6',
      contrastText: '#FFFFFF',
    },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    success: { main: '#16A34A' },
    info: { main: '#3B82F6' },
    text: {
      primary:   isDark ? '#F1F5F9' : '#1A1D23',
      secondary: isDark ? '#94A3B8' : '#6B7280',
      disabled:  isDark ? '#4B5563' : '#9CA3AF',
    },
    divider: isDark ? '#2D3348' : '#E8EAED',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontSize: '24px', fontWeight: 700, lineHeight: 1.3 },
    h2: { fontSize: '20px', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '15px', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '14px', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '14px', lineHeight: 1.6 },
    body2: { fontSize: '13px', lineHeight: 1.6, color: '#6B7280' },
    subtitle1: { fontSize: '14px', fontWeight: 500 },
    caption: { fontSize: '12px', color: '#6B7280' },
    button: { fontSize: '13px', fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
    '0 4px 12px rgba(0,0,0,0.08)',
    '0 8px 24px rgba(0,0,0,0.08)',
    '0 12px 32px rgba(0,0,0,0.10)',
    '0 16px 40px rgba(0,0,0,0.10)',
    '0 20px 48px rgba(0,0,0,0.12)',
    '0 24px 56px rgba(0,0,0,0.12)',
    '0 28px 64px rgba(0,0,0,0.14)',
    '0 32px 72px rgba(0,0,0,0.14)',
    '0 36px 80px rgba(0,0,0,0.16)',
    '0 40px 88px rgba(0,0,0,0.16)',
    '0 44px 96px rgba(0,0,0,0.18)',
    '0 48px 104px rgba(0,0,0,0.18)',
    '0 52px 112px rgba(0,0,0,0.20)',
    '0 56px 120px rgba(0,0,0,0.20)',
    '0 60px 128px rgba(0,0,0,0.22)',
    '0 64px 136px rgba(0,0,0,0.22)',
    '0 68px 144px rgba(0,0,0,0.24)',
    '0 72px 152px rgba(0,0,0,0.24)',
    '0 76px 160px rgba(0,0,0,0.26)',
    '0 80px 168px rgba(0,0,0,0.26)',
    '0 84px 176px rgba(0,0,0,0.28)',
    '0 88px 184px rgba(0,0,0,0.28)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: isDark ? '#0D1117' : '#F4F6F8' },
        '*::-webkit-scrollbar': { width: '6px', height: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': { background: isDark ? '#374151' : '#CBD5E1', borderRadius: '3px' },
        '*::-webkit-scrollbar-thumb:hover': { background: isDark ? '#4B5563' : '#94A3B8' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '7px 16px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          '&:hover': { boxShadow: '0 2px 8px rgba(63,81,181,0.30)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
          borderRadius: 12,
          border: `1px solid ${isDark ? '#2D3348' : '#E8EAED'}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: isDark ? '#1E2334' : '#F8FAFC',
          fontWeight: 600,
          fontSize: '12px',
          color: isDark ? '#94A3B8' : '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '11px',
          height: 24,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: isDark ? '#1E2334' : '#FFFFFF',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { boxShadow: '2px 0 16px rgba(0,0,0,0.06)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: isDark ? `0 1px 0 #2D3348` : '0 1px 0 #E8EAED',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 0',
          '&.Mui-selected': {
            backgroundColor: isDark ? '#1E2A4A' : '#EEF2FF',
            color: '#3F51B5',
            borderLeft: '3px solid #3F51B5',
            '&:hover': { backgroundColor: isDark ? '#253258' : '#E8EDFF' },
            '& .MuiListItemIcon-root': { color: '#3F51B5' },
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '16px', fontWeight: 600 },
      },
    },
  },
  });
}

export default createAppTheme('light');
