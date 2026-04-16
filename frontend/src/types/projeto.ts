/** Tipos alinhados com o backend Spring Boot */

export interface StatusProjetoAPI {
  id: string;
  nome: string;
  descricao: string;
  ordem: number;
}

export interface ProjetoAPI {
  id: string;                  // UUID
  organizacaoId: string;       // UUID
  organizacaoNome: string;
  nome: string;
  descricao: string;
  status: StatusProjetoAPI;
  ativo: boolean;
  criadoPorId: string;
  criadoPorNome: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface CriarProjetoRequest {
  organizacaoId: string;
  nome: string;
  descricao: string;
}

export interface AtualizarProjetoRequest {
  nome: string;
  descricao: string;
  statusId?: string;
}
