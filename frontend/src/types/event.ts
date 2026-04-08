import type { DadosAuditoria } from './common';

export type TipoEventoProjeto =
  | 'REUNIAO'
  | 'WORKSHOP'
  | 'ENTREGA'
  | 'REVISAO'
  | 'DEMO';

export interface EventoProjeto extends DadosAuditoria {
  nome: string;
  descricao?: string;
  tipo: TipoEventoProjeto;
  data: string;
  projetoId: number;
}
