import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../../context/useAuth';
import ModalPesquisa from './ModalPesquisa';
import { obterSituacaoPesquisa } from './pesquisaService';
import type { EtapaPesquisa, SituacaoPesquisa } from './types';

export interface PesquisaContextValue {
  /** Nulo para o Admin da Plataforma (não participa) e enquanto carrega. */
  situacao: SituacaoPesquisa | null;
  /** Aplica a situação devolvida por um envio. */
  atualizar: (situacao: SituacaoPesquisa) => void;
  recarregar: () => void;
  abrirAntes: () => void;
  abrirDepois: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const PesquisaContext = createContext<PesquisaContextValue | null>(null);

/** Maior atraso aceito pelo setTimeout (~24,8 dias). */
const ATRASO_MAXIMO = 2 ** 31 - 1;

/**
 * Situação do usuário na pesquisa do TCC, compartilhada pelo cabeçalho (botão "Nos
 * ajude a melhorar") e pelo Meu Perfil. Abre o questionário "antes" sozinho quando o
 * usuário está PENDENTE_ANTES (Dono ou Gestor que ainda não respondeu) — a cada
 * login, até responder: o "Responder depois" só vale nesta sessão. Recarrega quando
 * os papéis mudam (ex.: criou uma organização) e quando o "depois" fica disponível.
 */
export default function PesquisaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const admin = !!user?.adminPlataforma;
  // Muda quando a pessoa vira (ou deixa de ser) Dono/Gestor em algum lugar
  const papeis = JSON.stringify(user?.organizacoes.map((o) => [o.id, o.papel, o.projetos.map((p) => [p.id, p.papeis])]) ?? []);
  const [situacao, setSituacao] = useState<SituacaoPesquisa | null>(null);
  const [etapaAberta, setEtapaAberta] = useState<EtapaPesquisa | null>(null);
  const [versao, setVersao] = useState(0);
  // "Responder depois": não reabre o "antes" até o próximo login (o provider é montado de novo)
  const adiado = useRef(false);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    if (!userId || admin) return;
    let ativo = true;
    obterSituacaoPesquisa()
      .then((s) => {
        if (!ativo) return;
        setSituacao(s);
        if (s.estado === 'PENDENTE_ANTES' && !adiado.current) setEtapaAberta('ANTES');
      })
      .catch(() => { /* a pesquisa é opcional: sem situação, nada aparece */ });
    return () => { ativo = false; };
  }, [userId, admin, papeis, versao]);

  // "Depois" liberado pelo tempo: recarrega a situação no horário informado pelo backend
  useEffect(() => {
    if (situacao?.estado !== 'AGUARDANDO_DEPOIS' || !situacao.depoisDisponivelEm) return;
    const atraso = new Date(situacao.depoisDisponivelEm).getTime() - Date.now() + 1000;
    const t = setTimeout(recarregar, Math.min(Math.max(atraso, 1000), ATRASO_MAXIMO));
    return () => clearTimeout(t);
  }, [situacao, recarregar]);

  const abrirAntes = useCallback(() => setEtapaAberta('ANTES'), []);
  const abrirDepois = useCallback(() => setEtapaAberta('DEPOIS'), []);

  function fechar() {
    if (etapaAberta === 'ANTES' && situacao?.estado === 'PENDENTE_ANTES') adiado.current = true;
    setEtapaAberta(null);
  }
  const visivel = admin ? null : situacao;

  return (
    <PesquisaContext.Provider value={{ situacao: visivel, atualizar: setSituacao, recarregar, abrirAntes, abrirDepois }}>
      {children}
      {visivel && etapaAberta && user && (
        <ModalPesquisa
          key={etapaAberta}
          etapa={etapaAberta}
          instrumento={visivel.instrumento}
          nome={user.nome}
          email={user.email}
          onAtualizar={setSituacao}
          onConflito={() => { setEtapaAberta(null); recarregar(); }}
          onFechar={fechar}
        />
      )}
    </PesquisaContext.Provider>
  );
}
