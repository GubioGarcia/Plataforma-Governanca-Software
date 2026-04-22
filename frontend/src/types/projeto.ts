export interface StatusProjetoAPI {
  id: string;
  nome: string;
  descricao?: string;
  ordem?: number;
}

export interface ProjetoAPI {
  id: string;
  organizacaoId: string;
  organizacaoNome?: string;
  nome: string;
  descricao?: string | null;
  status?: StatusProjetoAPI | null;
  ativo?: boolean;
  criadoPorId?: string;
  criadoPorNome?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}
