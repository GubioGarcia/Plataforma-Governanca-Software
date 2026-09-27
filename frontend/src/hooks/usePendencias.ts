import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { listarMeusConvites, listarSolicitacoes, type Convite, type Solicitacao } from '../services/acessoService';

/** Solicitação com o contexto necessário para exibir e navegar até ela. */
export interface SolicitacaoPendente extends Solicitacao {
  orgId: string;
  projetoNome: string;
}

export interface Pendencias {
  convites: Convite[];
  /** Pedidos de stakeholders nos projetos em que o usuário responde (SOLICITACAO_RESPONDER). */
  aResponder: SolicitacaoPendente[];
  /** Pedidos do próprio usuário ainda sem resposta (projetos em que ele é stakeholder). */
  minhas: SolicitacaoPendente[];
  total: number;
  carregando: boolean;
  recarregar: () => void;
}

/**
 * Pendências reais do usuário, a partir do /me: convites recebidos e solicitações
 * PENDENTES dos projetos ativos em que ele participa. Recarrega quando o /me muda
 * (ex.: aceitou um convite, foi promovido).
 */
export function usePendencias(): Pendencias {
  const { user } = useAuth();
  const [convites, setConvites] = useState<Convite[]>([]);
  const [aResponder, setAResponder] = useState<SolicitacaoPendente[]>([]);
  const [minhas, setMinhas] = useState<SolicitacaoPendente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    const projetos = user.organizacoes
      .filter((o) => o.ativo)
      .flatMap((o) => o.projetos.filter((p) => p.ativo).map((p) => ({ ...p, orgId: o.id })));

    (async () => {
      setCarregando(true);
      const [meusConvites, porProjeto] = await Promise.all([
        listarMeusConvites().catch(() => [] as Convite[]),
        Promise.all(projetos.map(async (p) => {
          const lista = await listarSolicitacoes(p.id, 'PENDENTE').catch(() => [] as Solicitacao[]);
          return {
            responde: p.permissoes.includes('SOLICITACAO_RESPONDER'),
            lista: lista.map((s): SolicitacaoPendente => ({ ...s, orgId: p.orgId, projetoNome: p.nome })),
          };
        })),
      ]);
      if (!ativo) return;
      const recentes = (l: SolicitacaoPendente[]) => l.sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
      setConvites(meusConvites);
      setAResponder(recentes(porProjeto.filter((x) => x.responde).flatMap((x) => x.lista)));
      setMinhas(recentes(porProjeto.filter((x) => !x.responde).flatMap((x) => x.lista)
        .filter((s) => s.solicitanteId === user.id)));
      setCarregando(false);
    })();

    return () => { ativo = false; };
  }, [user, versao]);

  return {
    convites,
    aResponder,
    minhas,
    total: convites.length + aResponder.length,
    carregando,
    recarregar,
  };
}
