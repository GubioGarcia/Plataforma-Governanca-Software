export type TipoEventoProjeto =
  | 'REUNIAO'
  | 'WORKSHOP'
  | 'ENTREGA'
  | 'REVISAO'
  | 'DEMO';

export interface EventoProjeto {
  id: string;
  nome: string;
  descricao?: string;
  tipo?: TipoEventoProjeto;
  projetoId: string;
  projetoNome?: string;
  organizacaoId: string;
  organizacaoNome?: string;
  criadoPorId?: string;
  criadoPorNome?: string;
  dataHoraInicio?: string;
  dataHoraFim?: string;
  dataCriacao?: string;
  /** SOLICITADO = pedido por stakeholder, aguardando o gestor; REJEITADO = pedido recusado. */
  status?: StatusEvento;
}

export type StatusEvento = 'SOLICITADO' | 'APROVADO' | 'REJEITADO';