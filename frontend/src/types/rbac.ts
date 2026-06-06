export interface Permissao {
  id: number;
  nome: string;
  identifier: string;
}

export interface PapelOrganizacional {
  id: number;
  nome: string;
  extras?: string;
  permissoes: Permissao[];
  organizacaoId: number;
}
