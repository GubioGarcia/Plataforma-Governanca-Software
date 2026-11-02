import api from '../../config/axios';
import type { RespostaAntes, RespostaDepois, SituacaoPesquisa } from './types';

/** Pesquisa do TCC (participante). Cada envio devolve a situação atualizada. */

export async function obterSituacaoPesquisa(): Promise<SituacaoPesquisa> {
  const res = await api.get<SituacaoPesquisa>('/pesquisa/situacao');
  return res.data;
}

export async function responderAntes(dados: RespostaAntes): Promise<SituacaoPesquisa> {
  const res = await api.post<SituacaoPesquisa>('/pesquisa/antes', dados);
  return res.data;
}

export async function responderDepois(dados: RespostaDepois): Promise<SituacaoPesquisa> {
  const res = await api.post<SituacaoPesquisa>('/pesquisa/depois', dados);
  return res.data;
}

export async function retirarParticipacao(): Promise<SituacaoPesquisa> {
  const res = await api.delete<SituacaoPesquisa>('/pesquisa/minha-participacao');
  return res.data;
}
