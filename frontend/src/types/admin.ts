/** Página de resultados da API (número a partir de 0). */
export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  total: number;
  totalPaginas: number;
}

/** GET /api/admin/resumo — só contagens (as contas de admin não entram). */
export interface ResumoAdmin {
  usuariosAtivos: number;
  usuariosInativos: number;
  organizacoes: number;
  projetos: number;
  requisitosPorStatus: Record<string, number>;
  solicitacoesPendentes: number;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  dataCriacao: string;
  adminPlataforma: boolean;
  /** A conta de quem está consultando. */
  propria: boolean;
}

/** Status de projeto ou de requisito. `sistema`: usado pelas regras, nome fixo e sem exclusão. */
export interface StatusReferencia {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  sistema: boolean;
}

export interface PrioridadeReferencia {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}
