/**
 * API simulada do modo `/demo/`.
 *
 * Substitui o adapter do Axios por um roteador em memória, para que o app
 * inteiro — e não só as telas novas — possa ser navegado sem backend e sem
 * Keycloak. As leituras vêm de `dados.ts`; as escritas alteram o mesmo
 * estado em memória, então criar, editar e excluir funcionam durante a
 * sessão e se perdem ao recarregar.
 *
 * Não faz parte do produto.
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import api from '../src/config/axios';
import * as dados from './dados';

type Metodo = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface Requisicao {
  caminho: string;
  params: Record<string, unknown>;
  corpo: Record<string, unknown>;
  partes: string[];
}

interface Rota {
  metodo: Metodo;
  padrao: RegExp;
  responder: (req: Requisicao) => unknown;
}

/** Estado mutável da sessão de demonstração. */
const estado = {
  organizacoes: [...dados.organizacoes],
  projetos: [...dados.projetos],
  requisitos: [...dados.requisitos],
  criterios: [...dados.criterios],
  eventos: [...dados.eventos],
  arquivos: [...dados.arquivos],
  auditoria: [...dados.auditoria],
  comentarios: [...dados.comentarios],
  usuarios: [...dados.usuarios],
  wiki: { ...dados.wiki },
};

function novoId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}`;
}

const agora = () => new Date().toISOString();

// ── Rotas ───────────────────────────────────────────────────────────────────
// A ordem importa: a primeira que casar responde, então as mais específicas
// vêm antes das genéricas.

const rotas: Rota[] = [
  // Organizações
  { metodo: 'get', padrao: /^\/organizacao$/, responder: () => estado.organizacoes },
  {
    metodo: 'post',
    padrao: /^\/organizacao$/,
    responder: ({ corpo }) => {
      const nova = {
        id: novoId('org'),
        ativo: true,
        criadoPor: 'Thiago Falcone',
        dataCriacao: agora(),
        dataAtualizacao: agora(),
        totalProjetosAtivos: 0,
        ...corpo,
      } as (typeof estado.organizacoes)[number];
      estado.organizacoes.push(nova);
      return nova;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/organizacao\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.organizacoes.find((o) => o.id === partes[0]);
      if (alvo) Object.assign(alvo, corpo, { dataAtualizacao: agora() });
      return alvo;
    },
  },
  {
    metodo: 'delete',
    padrao: /^\/organizacao\/([^/]+)$/,
    responder: ({ partes }) => {
      estado.organizacoes = estado.organizacoes.filter((o) => o.id !== partes[0]);
      return null;
    },
  },
  {
    metodo: 'patch',
    padrao: /^\/organizacao\/([^/]+)\/ativar$/,
    responder: ({ partes }) => {
      const alvo = estado.organizacoes.find((o) => o.id === partes[0]);
      if (alvo) alvo.ativo = !alvo.ativo;
      return alvo;
    },
  },

  // Projetos
  { metodo: 'get', padrao: /^\/status-projeto$/, responder: () => dados.statusProjeto },
  {
    metodo: 'get',
    padrao: /^\/projeto\/organizacao\/([^/?]+)/,
    responder: ({ partes }) => estado.projetos.filter((p) => p.organizacaoId === partes[0]),
  },
  {
    metodo: 'get',
    padrao: /^\/projeto\/([^/?]+)\/wiki$/,
    responder: () => estado.wiki,
  },
  {
    metodo: 'put',
    padrao: /^\/projeto\/([^/?]+)\/wiki$/,
    responder: ({ corpo }) => {
      Object.assign(estado.wiki, corpo, { dataAtualizacao: agora() });
      return estado.wiki;
    },
  },
  {
    metodo: 'get',
    padrao: /^\/projeto\/([^/?]+)$/,
    responder: ({ partes }) => estado.projetos.find((p) => p.id === partes[0]),
  },
  {
    metodo: 'post',
    padrao: /^\/projeto$/,
    responder: ({ corpo }) => {
      const organizacao = estado.organizacoes.find((o) => o.id === corpo.organizacaoId);
      const novo = {
        id: novoId('proj'),
        organizacaoNome: organizacao?.nome,
        status: dados.statusProjeto[0],
        ativo: true,
        criadoPorId: 'u1',
        criadoPorNome: 'Thiago Falcone',
        dataCriacao: agora(),
        dataAtualizacao: agora(),
        ...corpo,
      } as (typeof estado.projetos)[number];
      estado.projetos.push(novo);
      return novo;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/projeto\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.projetos.find((p) => p.id === partes[0]);
      if (alvo) Object.assign(alvo, corpo, { dataAtualizacao: agora() });
      return alvo;
    },
  },
  {
    metodo: 'delete',
    padrao: /^\/projeto\/([^/]+)$/,
    responder: ({ partes }) => {
      estado.projetos = estado.projetos.filter((p) => p.id !== partes[0]);
      return null;
    },
  },
  {
    metodo: 'patch',
    padrao: /^\/projeto\/([^/]+)\/ativar$/,
    responder: ({ partes }) => {
      const alvo = estado.projetos.find((p) => p.id === partes[0]);
      if (alvo) alvo.ativo = !alvo.ativo;
      return alvo;
    },
  },

  // Wiki por id
  { metodo: 'get', padrao: /^\/wiki\/([^/]+)$/, responder: () => estado.wiki },

  // Requisitos
  { metodo: 'get', padrao: /^\/status-requisito$/, responder: () => dados.statusRequisito },
  { metodo: 'get', padrao: /^\/prioridade\/ativas$/, responder: () => dados.prioridades },
  {
    metodo: 'get',
    padrao: /^\/requisito\/projeto\/([^/?]+)/,
    // Todos os requisitos da demonstração pertencem ao projeto principal.
    responder: () => estado.requisitos,
  },
  {
    metodo: 'get',
    padrao: /^\/requisito\/([^/]+)$/,
    responder: ({ partes }) => estado.requisitos.find((r) => r.id === partes[0]),
  },
  {
    metodo: 'post',
    padrao: /^\/requisito\/projeto\/([^/]+)$/,
    responder: ({ corpo }) => {
      const status = dados.statusRequisito.find((s) => s.id === corpo.statusId) ?? dados.statusRequisito[0];
      const prioridade = dados.prioridades.find((p) => p.id === corpo.prioridadeId);
      const numero = String(estado.requisitos.length + 1).padStart(3, '0');
      const novo = {
        id: novoId('req'),
        codigo: `REQ-${numero}`,
        tipoRequisito: 'FUNCIONAL',
        statusId: status.id,
        statusNome: status.nome,
        prioridadeId: prioridade?.id ?? null,
        prioridadeNome: prioridade?.nome ?? null,
        versao: 1,
        criadoPorId: 'u1',
        criadoPorNome: 'Thiago Falcone',
        solicitadoPorId: null,
        solicitadoPorNome: null,
        aprovadoPorId: null,
        aprovadoPorNome: null,
        dataCriacao: agora(),
        dataAtualizacao: agora(),
        dataSolicitacao: null,
        dataAprovacao: null,
        ...corpo,
      } as (typeof estado.requisitos)[number];
      estado.requisitos.push(novo);
      return novo;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/requisito\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.requisitos.find((r) => r.id === partes[0]);
      if (!alvo) return undefined;
      Object.assign(alvo, corpo, { dataAtualizacao: agora() });
      if (corpo.statusId) {
        alvo.statusNome = dados.statusRequisito.find((s) => s.id === corpo.statusId)?.nome ?? alvo.statusNome;
      }
      if (corpo.prioridadeId) {
        alvo.prioridadeNome = dados.prioridades.find((p) => p.id === corpo.prioridadeId)?.nome ?? alvo.prioridadeNome;
      }
      return alvo;
    },
  },
  {
    metodo: 'delete',
    padrao: /^\/requisito\/([^/]+)$/,
    responder: ({ partes }) => {
      estado.requisitos = estado.requisitos.filter((r) => r.id !== partes[0]);
      return null;
    },
  },

  // Critérios de aceite
  {
    metodo: 'get',
    padrao: /^\/criterio-aceite\/requisito\/([^/]+)$/,
    responder: ({ partes }) => estado.criterios.filter((c) => c.requisitoId === partes[0]),
  },
  {
    metodo: 'post',
    padrao: /^\/criterio-aceite\/requisito\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const novo = {
        id: novoId('ca'),
        requisitoId: partes[0],
        criadoPorId: 'u1',
        criadoPorNome: 'Thiago Falcone',
        dataCriacao: agora(),
        dataAtualizacao: agora(),
        ...corpo,
      } as (typeof estado.criterios)[number];
      estado.criterios.push(novo);
      return novo;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/criterio-aceite\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.criterios.find((c) => c.id === partes[0]);
      if (alvo) Object.assign(alvo, corpo, { dataAtualizacao: agora() });
      return alvo;
    },
  },
  {
    metodo: 'delete',
    padrao: /^\/criterio-aceite\/([^/]+)$/,
    responder: ({ partes }) => {
      estado.criterios = estado.criterios.filter((c) => c.id !== partes[0]);
      return null;
    },
  },

  // Eventos
  {
    metodo: 'get',
    padrao: /^\/evento\/projeto\/([^/?]+)/,
    responder: () => estado.eventos,
  },
  {
    metodo: 'get',
    padrao: /^\/evento\/([^/]+)$/,
    responder: ({ partes }) => estado.eventos.find((e) => e.id === partes[0]),
  },
  {
    metodo: 'post',
    padrao: /^\/evento$/,
    responder: ({ corpo }) => {
      const novo = {
        id: novoId('ev'),
        projetoId: dados.PROJ_ID,
        organizacaoId: dados.ORG_ID,
        criadoPorId: 'u1',
        criadoPorNome: 'Thiago Falcone',
        dataCriacao: agora(),
        ...corpo,
      } as (typeof estado.eventos)[number];
      estado.eventos.push(novo);
      return novo;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/evento\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.eventos.find((e) => e.id === partes[0]);
      if (alvo) Object.assign(alvo, corpo);
      return alvo;
    },
  },
  {
    metodo: 'delete',
    padrao: /^\/evento\/([^/]+)$/,
    responder: ({ partes }) => {
      estado.eventos = estado.eventos.filter((e) => e.id !== partes[0]);
      return null;
    },
  },

  // Arquivos
  { metodo: 'get', padrao: /^\/projects\/([^/]+)\/files$/, responder: () => estado.arquivos },

  // Auditoria
  {
    metodo: 'get',
    padrao: /^\/auditoria\/projeto\/([^/?]+)/,
    responder: ({ params }) =>
      estado.auditoria.filter(
        (a) => !params.entidadeTipo || a.entidadeTipo === params.entidadeTipo,
      ),
  },
  {
    metodo: 'get',
    padrao: /^\/auditoria$/,
    responder: ({ params }) =>
      estado.auditoria.filter(
        (a) =>
          (!params.entidadeTipo || a.entidadeTipo === params.entidadeTipo) &&
          (!params.entidadeId || a.entidadeId === params.entidadeId),
      ),
  },
  {
    metodo: 'get',
    padrao: /^\/auditoria\/([^/]+)$/,
    responder: ({ partes }) => estado.auditoria.find((a) => a.id === partes[0]),
  },

  // Interações (analytics e stakeholders)
  {
    metodo: 'get',
    padrao: /^\/interacao\/projeto\/([^/?]+)\/resumo/,
    responder: () => dados.resumoInteracoes,
  },
  {
    metodo: 'get',
    padrao: /^\/interacao\/projeto\/([^/?]+)\/usuario\/([^/?]+)/,
    responder: () => [],
  },
  { metodo: 'get', padrao: /^\/interacao\/projeto\/([^/?]+)/, responder: () => [] },

  // Usuários
  { metodo: 'get', padrao: /^\/usuario$/, responder: () => estado.usuarios },
  {
    metodo: 'post',
    padrao: /^\/usuario\/cadastrar$/,
    responder: ({ corpo }) => {
      const novo = {
        id: novoId('u'),
        ativo: true,
        roles: ['STAKEHOLDER'],
        urlMidiaPerfil: null,
        dataCriacao: agora(),
        ...corpo,
      } as (typeof estado.usuarios)[number];
      estado.usuarios.push(novo);
      return novo;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/usuario\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.usuarios.find((u) => u.id === partes[0]);
      if (alvo) Object.assign(alvo, corpo);
      return alvo;
    },
  },

  // Comentários
  {
    metodo: 'get',
    padrao: /^\/comentario$/,
    responder: ({ params }) =>
      estado.comentarios.filter(
        (c) =>
          c.ativo &&
          (!params.entidadeTipo || c.entidadeTipo === params.entidadeTipo) &&
          (!params.entidadeId || c.entidadeId === params.entidadeId),
      ),
  },
  {
    metodo: 'post',
    padrao: /^\/comentario$/,
    responder: ({ corpo }) => {
      const novo = {
        id: novoId('c'),
        usuarioId: 'u1',
        usuarioNome: 'Thiago Falcone',
        usuarioAvatarUrl: null,
        ativo: true,
        editado: false,
        dataCriacao: agora(),
        dataAtualizacao: agora(),
        ...corpo,
      } as (typeof estado.comentarios)[number];
      estado.comentarios.push(novo);
      return novo;
    },
  },
  {
    metodo: 'put',
    padrao: /^\/comentario\/([^/]+)$/,
    responder: ({ partes, corpo }) => {
      const alvo = estado.comentarios.find((c) => c.id === partes[0]);
      if (alvo) Object.assign(alvo, corpo, { editado: true, dataAtualizacao: agora() });
      return alvo;
    },
  },
  {
    metodo: 'delete',
    padrao: /^\/comentario\/([^/]+)$/,
    responder: ({ partes }) => {
      estado.comentarios = estado.comentarios.filter((c) => c.id !== partes[0]);
      return null;
    },
  },
];

function resolver(config: AxiosRequestConfig): unknown {
  const metodo = (config.method ?? 'get').toLowerCase() as Metodo;
  const caminho = (config.url ?? '').split('?')[0];
  const params = (config.params ?? {}) as Record<string, unknown>;
  const corpo =
    typeof config.data === 'string'
      ? (JSON.parse(config.data) as Record<string, unknown>)
      : ((config.data ?? {}) as Record<string, unknown>);

  for (const rota of rotas) {
    if (rota.metodo !== metodo) continue;
    const casou = rota.padrao.exec(caminho);
    if (!casou) continue;
    return rota.responder({ caminho, params, corpo, partes: casou.slice(1) });
  }

  // Rota não simulada: devolve vazio para a tela exibir seu estado vazio em
  // vez de quebrar com erro de rede.
  console.warn(`[demo] rota não simulada: ${metodo.toUpperCase()} ${caminho}`);
  return metodo === 'get' ? [] : {};
}

/** Troca o transporte do Axios pelo roteador em memória. */
export function instalarApiDemo(): void {
  api.defaults.adapter = async (config): Promise<AxiosResponse> => {
    const data = resolver(config);
    await new Promise((resolve) => setTimeout(resolve, 90));
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse;
  };
}
