/** Tipos alinhados com o backend Spring Boot */

export type PlanoAPI = 'BASICO' | 'PREMIUM' | string;

export interface OrganizacaoAPI {
  id: string;                  // UUID
  nome: string;
  descricao: string;
  plano: PlanoAPI;
  ativo: boolean;
  criadoPor: string;           // UUID do usuário criador
  dataCriacao: string;         // ISO 8601
  dataAtualizacao: string;     // ISO 8601
  totalProjetosAtivos: number;
}

export interface CriarOrganizacaoRequest {
  nome: string;
  descricao: string;
  plano: PlanoAPI;
}

export interface AtualizarOrganizacaoRequest {
  nome: string;
  descricao: string;
  plano: PlanoAPI;
}
