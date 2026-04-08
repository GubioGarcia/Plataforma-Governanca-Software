import { useAuth } from '../context/UseAuth';
import type { PapelProjeto } from '../types/stakeholder';

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: PapelProjeto): boolean => user?.role === role;

  const isGestor = hasRole('GESTOR');
  const isStakeholder = hasRole('STAKEHOLDER');
  const isAnalista = hasRole('ANALISTA');

  // Pode criar/editar conteúdo
  const canEdit = isGestor || isAnalista;

  // Pode enviar seção/requisito para validação
  const canSendToValidation = isGestor;

  // Pode aprovar ou reprovar (stakeholders e gestor)
  const canVote = isStakeholder || isGestor;

  // Pode realizar validação final
  const canValidateFinal = isGestor;

  // Pode gerenciar membros do projeto
  const canManageMembers = isGestor;

  // Pode ver auditoria
  const canViewAudit = isGestor || isAnalista;

  return {
    user,
    hasRole,
    isGestor,
    isStakeholder,
    isAnalista,
    canEdit,
    canSendToValidation,
    canVote,
    canValidateFinal,
    canManageMembers,
    canViewAudit,
  };
}
