import type { DadosAuditoria } from './common';

export interface Arquivo extends DadosAuditoria {
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  projetoId: number;
  uploadadoPor: string;
}
