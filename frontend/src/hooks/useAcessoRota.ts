import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';

export type SituacaoAcesso = 'ok' | 'verificando' | 'negado';

/**
 * Decide se o usuário pode abrir a organização/projeto da rota, pelo /me.
 *
 * Quando o item não aparece no /me, recarrega as permissões UMA vez antes de negar:
 * quem acabou de criar um projeto ou aceitar um convite ainda pode estar com o /me
 * anterior. Se continuar ausente (nunca participou ou foi removido), é "negado".
 *
 * @param presente o item da rota está no /me atual
 * @param chave    id da organização/projeto da rota (reinicia a verificação ao trocar)
 */
export function useAcessoRota(presente: boolean, chave: string | undefined): SituacaoAcesso {
  const { recarregarPermissoes } = useAuth();
  const [verificadoPara, setVerificadoPara] = useState<string | null>(null);

  const jaVerificado = verificadoPara === chave;

  useEffect(() => {
    if (presente || !chave || jaVerificado) return;
    let ativo = true;
    recarregarPermissoes()
      .catch(() => {})
      .finally(() => { if (ativo) setVerificadoPara(chave); });
    return () => { ativo = false; };
  }, [presente, chave, jaVerificado, recarregarPermissoes]);

  if (presente) return 'ok';
  return jaVerificado ? 'negado' : 'verificando';
}
