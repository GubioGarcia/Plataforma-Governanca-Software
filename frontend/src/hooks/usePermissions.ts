import { matchPath, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { OrganizacaoAcesso, Permissao, ProjetoAcesso } from '../types/acesso';
import type { PapelProjeto } from '../types/stakeholder';

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
 * Mantém os nomes antigos (isGestor, isStakeholder, canEdit...) usados pelas telas.
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

  // Dono/Gestor no contexto atual → visão de gestão; qualquer outro participante → visão de stakeholder
  const isGestor = projectId
    ? (projetoAtual?.papeis.some((p) => p === 'DONO' || p === 'GESTOR') ?? false)
    : (organizacaoAtual?.papel === 'DONO' || organizacaoAtual?.papel === 'GESTOR');
  const participa = projectId ? (projetoAtual?.papeis.length ?? 0) > 0 : !!organizacaoAtual;
  const isStakeholder = participa && !isGestor;
  const isAnalista = false; // papel da simulação antiga; não existe no modelo de autorização

  const hasRole = (role: PapelProjeto): boolean =>
    (role === 'GESTOR' && isGestor) || (role === 'STAKEHOLDER' && isStakeholder);

  return {
    user,
    adminPlataforma,
    organizacaoAtual,
    projetoAtual,
    pode,
    podeNaOrganizacao,
    podeNoProjeto,
    hasRole,
    isGestor,
    isStakeholder,
    isAnalista,
    // Pode criar/editar conteúdo do projeto
    canEdit: isGestor,
    // Pode enviar requisito para validação
    canSendToValidation: isGestor,
    // Pode se manifestar sobre requisitos (aprovar como gestor ou solicitar como stakeholder)
    canVote: participa,
    // Pode aprovar/reprovar em definitivo
    canValidateFinal: pode('REQ_APPROVE'),
    // Pode gerenciar participantes do projeto
    canManageMembers: pode('PROJETO_INVITE_USER'),
    // Pode ver a tela completa de auditoria
    canViewAudit: pode('AUDIT_VIEW'),
  };
}
