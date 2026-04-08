import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { WikiVoto } from '../../types/wiki';

interface ValidationBarProps {
  participacao: number; // 0-100
  totalStakeholders: number;
  responderam: number;
  votos?: WikiVoto[];
}

export default function ValidationBar({ participacao, totalStakeholders, responderam, votos }: ValidationBarProps) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: '#F8FAFC',
        borderRadius: 2,
        border: '1px solid #E8EAED',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151' }}>
          Participação dos Stakeholders
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: participacao >= 60 ? '#16A34A' : '#D97706' }}>
          {responderam}/{totalStakeholders} responderam ({participacao}%)
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={participacao}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: '#E8EAED',
          mb: 1.5,
          '& .MuiLinearProgress-bar': {
            bgcolor: participacao >= 60 ? '#16A34A' : '#D97706',
            borderRadius: 3,
          },
        }}
      />

      {/* Avatar list */}
      {votos && votos.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {votos.map((v) => (
            <Tooltip
              key={v.userId}
              title={`${v.userName}: ${v.voto ?? 'Pendente'}`}
              arrow
            >
              <Box sx={{ position: 'relative', cursor: 'default' }}>
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    fontSize: '11px',
                    fontWeight: 700,
                    bgcolor:
                      v.voto === 'APROVADO'
                        ? '#16A34A'
                        : v.voto === 'REPROVADO'
                        ? '#DC2626'
                        : '#E8EAED',
                    color: v.voto ? '#fff' : '#9CA3AF',
                  }}
                >
                  {v.userName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {v.voto === 'APROVADO' ? (
                    <CheckCircleIcon sx={{ fontSize: 10, color: '#16A34A' }} />
                  ) : v.voto === 'REPROVADO' ? (
                    <CancelIcon sx={{ fontSize: 10, color: '#DC2626' }} />
                  ) : (
                    <HourglassEmptyIcon sx={{ fontSize: 10, color: '#D97706' }} />
                  )}
                </Box>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}
    </Box>
  );
}
