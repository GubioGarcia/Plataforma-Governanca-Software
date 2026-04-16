import Chip from '@mui/material/Chip';
import type { StatusRequisito } from '../../types/requirement';
import type { StatusWikiSection } from '../../types/wiki';
import type { StatusProjeto } from '../../types/project';
import type { PlanoOrganizacao } from '../../types/organization';
import type { PapelProjeto } from '../../types/stakeholder';
import type { TipoEventoProjeto } from '../../types/event';
import type { TipoEntidadeAuditoria } from '../../types/audit';

type AnyStatus =
  | StatusRequisito
  | StatusWikiSection
  | StatusProjeto
  | PlanoOrganizacao
  | PapelProjeto
  | TipoEventoProjeto
  | TipoEntidadeAuditoria;

const CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  // Requisito / Wiki
  RASCUNHO:       { label: 'Rascunho',      bg: '#F3F4F6', color: '#6B7280' },
  EM_ANALISE:     { label: 'Em Análise',    bg: '#EFF6FF', color: '#3B82F6' },
  EM_VALIDACAO:   { label: 'Em Validação',  bg: '#FFFBEB', color: '#D97706' },
  APROVADO:       { label: 'Aprovado',      bg: '#F0FDF4', color: '#16A34A' },
  REPROVADO:      { label: 'Reprovado',     bg: '#FEF2F2', color: '#DC2626' },
  VALIDADO:       { label: 'Validado',      bg: '#EDE9FE', color: '#7C3AED' },
  // Projeto
  PLANEJAMENTO:       { label: 'Planejamento',       bg: '#EFF6FF', color: '#3B82F6' },
  EM_DESENVOLVIMENTO: { label: 'Em Desenvolvimento', bg: '#FFFBEB', color: '#D97706' },
  CONCLUIDO:          { label: 'Concluído',           bg: '#F0FDF4', color: '#16A34A' },
  CANCELADO:          { label: 'Cancelado',           bg: '#FEF2F2', color: '#DC2626' },
  // Plano
  FREE:       { label: 'Free',       bg: '#F3F4F6', color: '#6B7280' },
  PRO:        { label: 'Pro',        bg: '#EFF6FF', color: '#3B82F6' },
  ENTERPRISE: { label: 'Enterprise', bg: '#EDE9FE', color: '#7C3AED' },
  // Plano (backend)
  BASICO:     { label: 'Básico',     bg: '#F3F4F6', color: '#6B7280' },
  PREMIUM:    { label: 'Premium',    bg: '#EDE9FE', color: '#7C3AED' },
  // Projeto status (backend)
  ATIVO:      { label: 'Ativo',      bg: '#F0FDF4', color: '#16A34A' },
  ARQUIVADO:  { label: 'Arquivado',  bg: '#F3F4F6', color: '#6B7280' },
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
  status: AnyStatus;
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
