import api from '../config/axios';

// ── Participantes (membros de organização/projeto) ─────────────────────────────

export interface VinculoParticipante {
  /** Organização: DONO | GESTOR | MEMBRO. Projeto: DONO | GESTOR | STAKEHOLDER_TECNICO | STAKEHOLDER_CLIENTE. */
  papel: string;
  /** ORGANIZACAO = herdado da organização; PROJETO = direto no projeto. */
  origem: 'ORGANIZACAO' | 'PROJETO';
}

export interface Participante {
  usuarioId: string;
  nome: string;
  email: string;
  urlMidiaPerfil: string | null;
  vinculos: VinculoParticipante[];
}

export async function listarParticipantesProjeto(projetoId: string): Promise<Participante[]> {
  return (await api.get<Participante[]>(`/projeto/${projetoId}/participantes`)).data;
}

export async function promoverNoProjeto(projetoId: string, usuarioId: string): Promise<void> {
  await api.post(`/projeto/${projetoId}/participantes/${usuarioId}/promover`);
}

export async function removerDoProjeto(projetoId: string, usuarioId: string): Promise<void> {
  await api.delete(`/projeto/${projetoId}/participantes/${usuarioId}`);
}

export async function listarMembrosOrganizacao(orgId: string): Promise<Participante[]> {
  return (await api.get<Participante[]>(`/organizacao/${orgId}/membros`)).data;
}

export async function promoverNaOrganizacao(orgId: string, usuarioId: string): Promise<void> {
  await api.post(`/organizacao/${orgId}/membros/${usuarioId}/promover`);
}

export async function removerDaOrganizacao(orgId: string, usuarioId: string): Promise<void> {
  await api.delete(`/organizacao/${orgId}/membros/${usuarioId}`);
}

// ── Convites ───────────────────────────────────────────────────────────────────

export type PapelConvite = 'GESTOR' | 'MEMBRO' | 'STAKEHOLDER';

export interface Convite {
  id: string;
  email: string;
  organizacaoId: string;
  organizacaoNome: string;
  projetoId: string | null;
  projetoNome: string | null;
  papel: PapelConvite;
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'CANCELADO' | 'EXPIRADO';
  convidadoPorNome: string | null;
  dataCriacao: string;
  expiraEm: string;
}

export async function convidarParaProjeto(projetoId: string, email: string, papel: PapelConvite): Promise<Convite> {
  return (await api.post<Convite>(`/projeto/${projetoId}/convites`, { email, papel })).data;
}

export async function listarConvitesProjeto(projetoId: string): Promise<Convite[]> {
  return (await api.get<Convite[]>(`/projeto/${projetoId}/convites`)).data;
}

export async function convidarParaOrganizacao(orgId: string, email: string, papel: PapelConvite): Promise<Convite> {
  return (await api.post<Convite>(`/organizacao/${orgId}/convites`, { email, papel })).data;
}

export async function listarConvitesOrganizacao(orgId: string): Promise<Convite[]> {
  return (await api.get<Convite[]>(`/organizacao/${orgId}/convites`)).data;
}

export async function listarMeusConvites(): Promise<Convite[]> {
  return (await api.get<Convite[]>('/convites/meus')).data;
}

export async function aceitarConvite(id: string): Promise<Convite> {
  return (await api.post<Convite>(`/convites/${id}/aceitar`)).data;
}

export async function recusarConvite(id: string): Promise<Convite> {
  return (await api.post<Convite>(`/convites/${id}/recusar`)).data;
}

export async function cancelarConvite(id: string): Promise<void> {
  await api.delete(`/convites/${id}`);
}

// ── Solicitações ───────────────────────────────────────────────────────────────

export type TipoSolicitacao =
  | 'ALTERACAO_REQUISITO'
  | 'REPROVACAO_REQUISITO'
  | 'APROVACAO_REQUISITO'
  | 'EVENTO'
  | 'EXPORT_MER'
  | 'EXPORT_RASTREABILIDADE';

export type StatusSolicitacao = 'PENDENTE' | 'ATENDIDA' | 'RECUSADA' | 'CANCELADA';

export interface Solicitacao {
  id: string;
  projetoId: string;
  tipo: TipoSolicitacao;
  alvoId: string | null;
  alvoDescricao: string | null;
  status: StatusSolicitacao;
  solicitanteId: string;
  solicitanteNome: string;
  justificativa: string | null;
  respondidoPorNome: string | null;
  resposta: string | null;
  dataCriacao: string;
  dataResposta: string | null;
}

export interface CriarSolicitacaoRequest {
  tipo: TipoSolicitacao;
  alvoId?: string;
  justificativa?: string;
  evento?: { nome: string; descricao?: string; dataHoraInicio: string; dataHoraFim?: string };
}

export const TIPO_SOLICITACAO_LABEL: Record<TipoSolicitacao, string> = {
  ALTERACAO_REQUISITO: 'Alteração de requisito',
  REPROVACAO_REQUISITO: 'Reprovação de requisito',
  APROVACAO_REQUISITO: 'Aprovação de requisito',
  EVENTO: 'Evento',
  EXPORT_MER: 'Exportação da modelagem de dados',
  EXPORT_RASTREABILIDADE: 'Exportação da matriz de rastreabilidade',
};

export async function criarSolicitacao(projetoId: string, dados: CriarSolicitacaoRequest): Promise<Solicitacao> {
  return (await api.post<Solicitacao>(`/projeto/${projetoId}/solicitacoes`, dados)).data;
}

export async function listarSolicitacoes(projetoId: string, status?: StatusSolicitacao): Promise<Solicitacao[]> {
  return (await api.get<Solicitacao[]>(`/projeto/${projetoId}/solicitacoes`, { params: status ? { status } : {} })).data;
}

export async function atenderSolicitacao(id: string, resposta?: string): Promise<Solicitacao> {
  return (await api.post<Solicitacao>(`/solicitacoes/${id}/atender`, { resposta })).data;
}

export async function recusarSolicitacao(id: string, resposta?: string): Promise<Solicitacao> {
  return (await api.post<Solicitacao>(`/solicitacoes/${id}/recusar`, { resposta })).data;
}

export async function cancelarSolicitacao(id: string): Promise<Solicitacao> {
  return (await api.post<Solicitacao>(`/solicitacoes/${id}/cancelar`)).data;
}

// ── Exportação ─────────────────────────────────────────────────────────────────

/**
 * Baixa o CSV gerado pelo backend. 403 = sem permissão ou exportação ainda não
 * liberada (stakeholder precisa de uma solicitação atendida) — tratado por quem chama.
 */
export async function baixarExportacao(projetoId: string, tipo: 'mer' | 'rastreabilidade'): Promise<void> {
  const res = await api.get<Blob>(`/projeto/${projetoId}/exportar/${tipo}`, { responseType: 'blob' });
  const disposicao = String(res.headers['content-disposition'] ?? '');
  const nome = /filename="?([^";]+)"?/.exec(disposicao)?.[1] ?? `${tipo}.csv`;
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}
