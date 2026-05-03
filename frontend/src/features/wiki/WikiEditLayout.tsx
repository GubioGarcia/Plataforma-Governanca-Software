import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface WikiEditLayoutProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}

export default function WikiEditLayout({ title, subtitle, onBack, children }: WikiEditLayoutProps) {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ color: '#3F51B5', fontWeight: 600, mb: 2, px: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
      >
        Voltar
      </Button>

      <Typography variant="h2" sx={{ fontWeight: 700, fontSize: '28px', color: '#111827', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', mb: 1 }}>
        {subtitle}
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {children}
    </Box>
  );
}