import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps } from '@mui/material/styles';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  sx?: SxProps;
}

export default function EmptyState({ icon, title, description, action, sx }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: '#CBD5E1', fontSize: 64, lineHeight: 1 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ color: '#374151', mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3, maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
