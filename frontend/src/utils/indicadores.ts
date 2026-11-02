import type { RequisitoAPI, StatusRequisitoAPI, TipoRequisito } from '../types/requirementAPI';
import type { ResumoInteracaoUsuario } from '../types/interacao';

/**
 * Fonte única dos contadores de Visão geral, Analytics e Stakeholders: todas as
 * opções aparecem (inclusive com zero) e os nomes batem com os do backend.
 */

export interface Fatia {
  chave: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}

// ─── Status de requisito (vêm da API: /status-requisito) ─────────────────────

const STATUS_VISUAL: Record<string, { label: string; color: string; bg: string }> = {
  RASCUNHO:   { label: 'Rascunho',   color: '#6B7280', bg: '#F3F4F6' },
  EM_REVISAO: { label: 'Em Revisão', color: '#3B82F6', bg: '#EFF6FF' },
  APROVADO:   { label: 'Aprovado',   color: '#16A34A', bg: '#DCFCE7' },
  REPROVADO:  { label: 'Reprovado',  color: '#DC2626', bg: '#FEE2E2' },
  ARQUIVADO:  { label: 'Arquivado',  color: '#475569', bg: '#F1F5F9' },
};

/** Status cadastrado depois (sem cor definida): rótulo a partir do nome, cor neutra. */
export function statusVisual(nome: string) {
  return STATUS_VISUAL[nome] ?? {
    label: nome.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    color: '#6B7280',
    bg: '#F3F4F6',
  };
}

/** Requisitos por status, na ordem do cadastro; inclui "Sem status" só se houver. */
export function requisitosPorStatus(reqs: RequisitoAPI[], statuses: StatusRequisitoAPI[]): Fatia[] {
  const fatias = [...statuses]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((s) => ({ chave: s.nome, ...statusVisual(s.nome), value: reqs.filter((r) => r.statusNome === s.nome).length }));
  const conhecidos = new Set(statuses.map((s) => s.nome));
  const semStatus = reqs.filter((r) => !r.statusNome || !conhecidos.has(r.statusNome)).length;
  if (semStatus > 0) fatias.push({ chave: '_SEM_STATUS', label: 'Sem status', value: semStatus, color: '#9CA3AF', bg: '#F3F4F6' });
  return fatias;
}

/** Ainda sem decisão: nem aprovado, nem reprovado, nem arquivado. */
export const STATUS_DECIDIDOS = ['APROVADO', 'REPROVADO', 'ARQUIVADO'];

// ─── Tipos de requisito (enum TipoRequisito do backend) ─────────────────────

const TIPOS: { chave: TipoRequisito; label: string; color: string; bg: string }[] = [
  { chave: 'FUNCIONAL',     label: 'Funcional',        color: '#3B82F6', bg: '#EFF6FF' },
  { chave: 'NAO_FUNCIONAL', label: 'Não Funcional',    color: '#9333EA', bg: '#FDF4FF' },
  { chave: 'REGRA_NEGOCIO', label: 'Regra de Negócio', color: '#EA580C', bg: '#FFF7ED' },
  { chave: 'TECNICO',       label: 'Técnico',          color: '#16A34A', bg: '#F0FDF4' },
];

export function requisitosPorTipo(reqs: RequisitoAPI[]): Fatia[] {
  return TIPOS.map((t) => ({ ...t, value: reqs.filter((r) => r.tipoRequisito === t.chave).length }));
}

// ─── Módulos de interação (enum ModuloInteracao do backend) ─────────────────

type CampoModulo = Exclude<keyof ResumoInteracaoUsuario,
  'usuarioId' | 'usuarioNome' | 'usuarioEmail' | 'usuarioUrlFoto' | 'totalInteracoes'>;

export const MODULOS_INTERACAO: { chave: string; campo: CampoModulo; label: string; sigla: string; color: string; bg: string }[] = [
  { chave: 'WIKI',            campo: 'interacoesWiki',            label: 'Wiki',             sigla: 'W',  color: '#0891B2', bg: '#E0F2FE' },
  { chave: 'REQUISITO',       campo: 'interacoesRequisito',       label: 'Requisitos',       sigla: 'R',  color: '#7C3AED', bg: '#EDE9FE' },
  { chave: 'COMENTARIO',      campo: 'interacoesComentario',      label: 'Comentários',      sigla: 'C',  color: '#059669', bg: '#DCFCE7' },
  { chave: 'EVENTO',          campo: 'interacoesEvento',          label: 'Eventos',          sigla: 'E',  color: '#D97706', bg: '#FEF3C7' },
  { chave: 'ARQUIVO',         campo: 'interacoesArquivo',         label: 'Arquivos',         sigla: 'A',  color: '#BE185D', bg: '#FCE7F3' },
  { chave: 'MODELAGEM_DADOS', campo: 'interacoesModelagemDados',  label: 'Modelo de Dados',  sigla: 'MD', color: '#4338CA', bg: '#E0E7FF' },
  { chave: 'RASTREABILIDADE', campo: 'interacoesRastreabilidade', label: 'Rastreabilidade',  sigla: 'RT', color: '#0F766E', bg: '#CCFBF1' },
];

export function interacoesPorModulo(porModulo: Record<string, number> | undefined): Fatia[] {
  return MODULOS_INTERACAO.map((m) => ({
    chave: m.chave, label: m.label, color: m.color, bg: m.bg, value: Number(porModulo?.[m.chave] ?? 0),
  }));
}
