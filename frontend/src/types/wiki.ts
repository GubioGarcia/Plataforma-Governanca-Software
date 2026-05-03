export interface WikiProjetoApi {
  id: string;
  projetoId: string;
  projetoNome?: string;
  projetoDescricao?: string;
  projetoCriadoPorId?: string;
  projetoCriadoPorNome?: string;
  projetoStatus?: string;
  descricaoProblema?: string;
  publicoAlvo?: string;
  objetivoGeral?: string;
  objetivosEspecificos?: string;
  kpis?: string;
  restricoesPrazo?: string;
  restricoesOrcamento?: string;
  tecnologiasObrigatorias?: string;
  regulamentacoes?: string;
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

export type StatusWikiSection = 'RASCUNHO' | 'EM_VALIDACAO' | 'APROVADO' | 'REPROVADO' | 'VALIDADO';

export interface WikiVoto {
  userId: string;
  userName: string;
  voto: 'APROVADO' | 'REPROVADO' | null;
  votadoEm?: string;
}

export interface WikiSection {
  id: string;
  conteudo: string;
  status: StatusWikiSection;
  votos: WikiVoto[];
  totalStakeholders: number;
  aprovacoes: number;
  reprovacoes: number;
}