import { matchPath, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { OrganizacaoAcesso, Permissao, ProjetoAcesso } from '../types/acesso';

/**
 * Ids da organização/projeto a partir da URL. Usa matchPath (e não useParams) para
 * funcionar também em layouts de nível superior, como o AppShell.
 */
function idsDaRota(pathname: string): { orgId?: string; projectId?: string } {
  const projeto = matchPath('/organizations/:orgId/projects/:projectId/*', pathname);
  if (projeto) return { orgId: projeto.params.orgId, projectId: projeto.params.projectId };
  const org = matchPath('/organizations/:orgId/*', pathname);
  return { orgId: org?.params.orgId };
}

/**
 * Permissões reais do usuário (GET /api/auth/me) no contexto da rota atual:
 * dentro de /organizations/:orgId/projects/:projectId vale o papel no projeto;
 * em /organizations/:orgId vale o papel na organização.
 *
 * Serve só para decidir o que mostrar — o backend checa tudo de novo (403).
 * Cada ação da tela usa `pode(...)` com a mesma permissão que o backend exige.
 */
export function usePermissions() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { orgId, projectId } = idsDaRota(pathname);

  const organizacoes = user?.organizacoes ?? [];

  const buscarOrganizacao = (id?: string): OrganizacaoAcesso | undefined =>
    id ? organizacoes.find((o) => o.id === id) : undefined;

  const buscarProjeto = (id?: string): ProjetoAcesso | undefined =>
    id ? organizacoes.flatMap((o) => o.projetos).find((p) => p.id === id) : undefined;

  const organizacaoAtual = buscarOrganizacao(orgId);
  const projetoAtual = buscarProjeto(projectId);

  /** Permissão em uma organização específica (ex.: ações de cada item de uma lista). */
  const podeNaOrganizacao = (id: string, permissao: Permissao): boolean =>
    buscarOrganizacao(id)?.permissoes.includes(permissao) ?? false;

  /** Permissão em um projeto específico. */
  const podeNoProjeto = (id: string, permissao: Permissao): boolean =>
    buscarProjeto(id)?.permissoes.includes(permissao) ?? false;

  /** Permissão no contexto da rota atual (projeto, senão organização). */
  const pode = (permissao: Permissao): boolean => {
    if (projectId) return projetoAtual?.permissoes.includes(permissao) ?? false;
    if (orgId) return organizacaoAtual?.permissoes.includes(permissao) ?? false;
    return false;
  };

  const adminPlataforma = user?.adminPlataforma ?? false;

  // Dono/Gestor no contexto atual (só para apresentação, ex.: cor do papel no cabeçalho)
  const isGestor = projectId
    ? (projetoAtual?.papeis.some((p) => p === 'DONO' || p === 'GESTOR') ?? false)
    : (organizacaoAtual?.papel === 'DONO' || organizacaoAtual?.papel === 'GESTOR');

  return {
    user,
    adminPlataforma,
    organizacaoAtual,
    projetoAtual,
    pode,
    podeNaOrganizacao,
    podeNoProjeto,
    isGestor,
  };
}
