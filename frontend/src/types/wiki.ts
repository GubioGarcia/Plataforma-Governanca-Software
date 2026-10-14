export interface WikiProjetoApi {
  id: string;
  projetoId: string;
  projetoNome?: string;
  projetoDescricao?: string;
  projetoCriadoPorId?: string;
  projetoCriadoPorNome?: string;
  projetoStatus?: string;
  projetoDataCriacao?: string;
  projetoDataAtualizacao?: string;
  descricaoProblema?: string;
  publicoAlvo?: string;
  objetivoGeral?: string;
  objetivosEspecificos?: string;
  kpis?: string;
  restricoesPrazo?: string;
  restricoesOrcamento?: string;
  tecnologiasObrigatorias?: string;
  regulamentacoes?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface WikiProjetoUpdateRequest {
  descricaoProblema?: string;
  publicoAlvo?: string;
  objetivoGeral?: string;
  objetivosEspecificos?: string;
  kpis?: string;
  restricoesPrazo?: string;
  restricoesOrcamento?: string;
  tecnologiasObrigatorias?: string;
  regulamentacoes?: string;
}
