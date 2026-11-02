import { useContext } from 'react';
import { PesquisaContext, type PesquisaContextValue } from './PesquisaContext';

export function usePesquisa(): PesquisaContextValue {
  const ctx = useContext(PesquisaContext);
  if (!ctx) throw new Error('usePesquisa deve ser usado dentro de PesquisaProvider');
  return ctx;
}

/** "14:35", ou "02/11 14:35" quando não é hoje. */
export function formatarDisponivelEm(iso: string): string {
  const data = new Date(iso);
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (data.toDateString() === new Date().toDateString()) return hora;
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hora}`;
}

/** O botão "Nos ajude a melhorar" aparece só entre o "antes" e o "depois". */
export function mostraBotaoPesquisa(estado: string | undefined): boolean {
  return estado === 'AGUARDANDO_DEPOIS' || estado === 'PENDENTE_DEPOIS';
}
