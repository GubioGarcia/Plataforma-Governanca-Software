export type PlanoAPI = 'BASICO' | 'PREMIUM' | 'FREE' | 'PRO' | 'ENTERPRISE';

export interface OrganizacaoAPI {
  id: string;
  nome: string;
  descricao?: string | null;
  plano: PlanoAPI;
  ativo?: boolean;
  criadoPor?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
  totalProjetosAtivos?: number;
}
