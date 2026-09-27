import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import SemAcesso from '../common/SemAcesso';
import { usePermissions } from '../../hooks/usePermissions';
import { useAcessoRota } from '../../hooks/useAcessoRota';

/**
 * Só renderiza telas de /organizations/:orgId para quem tem vínculo com a organização
 * (papel nela ou participação em algum projeto dela), conforme o /me.
 */
export default function GuardaOrganizacao({ children }: { children: ReactNode }) {
  const { orgId } = useParams<{ orgId: string }>();
  const { organizacaoAtual } = usePermissions();
  const acesso = useAcessoRota(!!organizacaoAtual, orgId);

  if (acesso !== 'ok') return <SemAcesso situacao={acesso} alvo="organização" />;
  return <>{children}</>;
}
