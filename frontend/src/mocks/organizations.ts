import type { Organizacao } from '../types/organization';

export const mockOrganizations: Organizacao[] = [
  {
    id: 1,
    name: 'TechCorp Solutions',
    description: 'Empresa de soluções tecnológicas para o mercado enterprise, especializada em transformação digital e modernização de sistemas.',
    plano: 'PRO',
    totalProjetos: 5,
    totalMembros: 12,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
    createdBy: 'João Silva',
  },
  {
    id: 2,
    name: 'StartupXYZ',
    description: 'Startup focada em produtos digitais inovadores para o setor educacional e de capacitação profissional.',
    plano: 'FREE',
    totalProjetos: 3,
    totalMembros: 7,
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
    createdBy: 'João Silva',
  },
];
