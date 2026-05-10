import Chip from '@mui/material/Chip';
// Aceita qualquer texto de status (string) para simplificar compatibilidade

const CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  // Requisito / Wiki / Projeto
  RASCUNHO:       { label: 'Rascunho',      bg: '#F3F4F6', color: '#6B7280' },
  EM_ANALISE:     { label: 'Em Análise',    bg: '#EFF6FF', color: '#3B82F6' },
  EM_VALIDACAO:   { label: 'Em Validação',  bg: '#FFFBEB', color: '#D97706' },
  APROVADO:       { label: 'Aprovado',      bg: '#F0FDF4', color: '#16A34A' },
  REPROVADO:      { label: 'Reprovado',     bg: '#FEF2F2', color: '#DC2626' },
  VALIDADO:       { label: 'Validado',      bg: '#EDE9FE', color: '#7C3AED' },
  EM_REVISAO:     { label: 'Em Revisão',    bg: '#EFF6FF', color: '#3B82F6' },
  EM_ANDAMENTO:   { label: 'Em Andamento',  bg: '#FEF3C7', color: '#D97706' },
  EM_TESTE:       { label: 'Em Teste',      bg: '#E0E7FF', color: '#4338CA' },
  CONCLUIDO:      { label: 'Concluído',     bg: '#ECFDF5', color: '#15803D' },
  ARQUIVADO:      { label: 'Arquivado',     bg: '#F8FAFC', color: '#475569' },
  CANCELADO:      { label: 'Cancelado',     bg: '#FEE2E2', color: '#991B1B' },
  // Plano
  FREE:       { label: 'Free',       bg: '#F3F4F6', color: '#6B7280' },
  PRO:        { label: 'Pro',        bg: '#EFF6FF', color: '#3B82F6' },
  ENTERPRISE: { label: 'Enterprise', bg: '#EDE9FE', color: '#7C3AED' },
  // Papel
  GESTOR:        { label: 'Gestor',         bg: '#EDE9FE', color: '#7C3AED' },
  STAKEHOLDER:   { label: 'Stakeholder',    bg: '#F0FDF4', color: '#16A34A' },
  ANALISTA:      { label: 'Analista',       bg: '#EFF6FF', color: '#3B82F6' },
  // Evento
  REUNIAO:  { label: 'Reunião',   bg: '#EFF6FF', color: '#3B82F6' },
  WORKSHOP: { label: 'Workshop',  bg: '#F0FDF4', color: '#16A34A' },
  ENTREGA:  { label: 'Entrega',   bg: '#EDE9FE', color: '#7C3AED' },
  REVISAO:  { label: 'Revisão',   bg: '#FFFBEB', color: '#D97706' },
  DEMO:     { label: 'Demo',      bg: '#FEF2F2', color: '#DC2626' },
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const cfg = CONFIG[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280' };
  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: size === 'small' ? '11px' : '12px',
        height: size === 'small' ? 22 : 26,
        borderRadius: '6px',
        border: `1px solid ${cfg.color}22`,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
