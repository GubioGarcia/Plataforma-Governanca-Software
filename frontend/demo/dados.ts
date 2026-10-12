/**
 * Dados de demonstração do modo `/demo/`.
 *
 * São os mesmos formatos que a API real devolve (os DTOs de `src/types`),
 * para que as telas funcionem sem nenhuma adaptação. Não faz parte do
 * produto — existe só para navegar pelo sistema sem subir backend e Keycloak.
 */
import type { OrganizacaoAPI } from '../src/types/organizacao';
import type { ProjetoAPI, StatusProjetoAPI } from '../src/types/projeto';
import type {
  CriterioAceiteAPI,
  PrioridadeAPI,
  RequisitoAPI,
  StatusRequisitoAPI,
} from '../src/types/requirementAPI';
import type { WikiProjetoApi } from '../src/types/wiki';
import type { EventoProjeto } from '../src/types/event';
import type { AuditoriaAPI } from '../src/types/auditoriaAPI';
import type { ResumoInteracaoProjeto } from '../src/types/interacao';
import type { ArquivoProjetoDTO } from '../src/services/fileService';
import type { UsuarioBackend } from '../src/services/userService';
import type { ComentarioAPI } from '../src/features/comments/types';

export const ORG_ID = 'org-1';
export const PROJ_ID = 'proj-1';

export const usuarios: UsuarioBackend[] = [
  { id: 'u1', nome: 'Thiago Falcone', email: 'thiago@discovery.dev', ativo: true, roles: ['GESTOR'], urlMidiaPerfil: null, dataCriacao: '2026-01-05T09:00:00Z' },
  { id: 'u2', nome: 'Ana Lima', email: 'ana@discovery.dev', ativo: true, roles: ['ANALISTA'], urlMidiaPerfil: null, dataCriacao: '2026-01-06T09:00:00Z' },
  { id: 'u3', nome: 'Pedro Costa', email: 'pedro@discovery.dev', ativo: true, roles: ['ANALISTA'], urlMidiaPerfil: null, dataCriacao: '2026-01-06T10:00:00Z' },
  { id: 'u4', nome: 'Maria Souza', email: 'maria@cliente.com', ativo: true, roles: ['STAKEHOLDER'], urlMidiaPerfil: null, dataCriacao: '2026-01-07T09:00:00Z' },
  { id: 'u5', nome: 'Carlos Mendes', email: 'carlos@cliente.com', ativo: true, roles: ['STAKEHOLDER'], urlMidiaPerfil: null, dataCriacao: '2026-01-07T11:00:00Z' },
];

export const organizacoes: OrganizacaoAPI[] = [
  {
    id: ORG_ID,
    nome: 'TechCorp Solutions',
    descricao: 'Empresa de software responsável pela plataforma de e-commerce.',
    plano: 'PRO',
    ativo: true,
    criadoPor: 'Thiago Falcone',
    dataCriacao: '2026-01-05T09:00:00Z',
    dataAtualizacao: '2026-02-20T14:00:00Z',
    totalProjetosAtivos: 2,
  },
  {
    id: 'org-2',
    nome: 'StartupXYZ',
    descricao: 'Startup em fase de descoberta do produto.',
    plano: 'FREE',
    ativo: true,
    criadoPor: 'Thiago Falcone',
    dataCriacao: '2026-01-18T09:00:00Z',
    dataAtualizacao: '2026-02-10T09:00:00Z',
    totalProjetosAtivos: 1,
  },
];

export const statusProjeto: StatusProjetoAPI[] = [
  { id: 'sp1', nome: 'DISCOVERY', ordem: 1 },
  { id: 'sp2', nome: 'EM_ANDAMENTO', ordem: 2 },
  { id: 'sp3', nome: 'CONCLUIDO', ordem: 3 },
];

export const projetos: ProjetoAPI[] = [
  {
    id: PROJ_ID,
    organizacaoId: ORG_ID,
    organizacaoNome: 'TechCorp Solutions',
    nome: 'Plataforma de E-commerce',
    descricao: 'Discovery da nova plataforma de vendas online, com catálogo, carrinho e pedidos.',
    status: statusProjeto[0],
    ativo: true,
    criadoPorId: 'u1',
    criadoPorNome: 'Thiago Falcone',
    dataCriacao: '2026-01-08T09:00:00Z',
    dataAtualizacao: '2026-02-22T10:00:00Z',
  },
  {
    id: 'proj-2',
    organizacaoId: ORG_ID,
    organizacaoNome: 'TechCorp Solutions',
    nome: 'Portal do Cliente',
    descricao: 'Área logada para acompanhamento de pedidos e suporte.',
    status: statusProjeto[1],
    ativo: true,
    criadoPorId: 'u1',
    criadoPorNome: 'Thiago Falcone',
    dataCriacao: '2026-01-20T09:00:00Z',
    dataAtualizacao: '2026-02-18T16:00:00Z',
  },
  {
    id: 'proj-3',
    organizacaoId: 'org-2',
    organizacaoNome: 'StartupXYZ',
    nome: 'App de Delivery',
    descricao: 'Levantamento inicial do aplicativo de entregas.',
    status: statusProjeto[0],
    ativo: true,
    criadoPorId: 'u1',
    criadoPorNome: 'Thiago Falcone',
    dataCriacao: '2026-02-01T09:00:00Z',
    dataAtualizacao: '2026-02-15T09:00:00Z',
  },
];

export const statusRequisito: StatusRequisitoAPI[] = [
  { id: 'st1', nome: 'RASCUNHO', descricao: 'Em elaboração', ordem: 1 },
  { id: 'st2', nome: 'EM_ANALISE', descricao: 'Sob análise da equipe', ordem: 2 },
  { id: 'st3', nome: 'EM_VALIDACAO', descricao: 'Aguardando stakeholders', ordem: 3 },
  { id: 'st4', nome: 'APROVADO', descricao: 'Aprovado pelos stakeholders', ordem: 4 },
  { id: 'st5', nome: 'VALIDADO', descricao: 'Validado e congelado', ordem: 5 },
  { id: 'st6', nome: 'REPROVADO', descricao: 'Reprovado na validação', ordem: 6 },
];

export const prioridades: PrioridadeAPI[] = [
  { id: 'p1', codigo: 'BAIXA', nome: 'Baixa', descricao: null, ordem: 1, ativo: true },
  { id: 'p2', codigo: 'MEDIA', nome: 'Média', descricao: null, ordem: 2, ativo: true },
  { id: 'p3', codigo: 'ALTA', nome: 'Alta', descricao: null, ordem: 3, ativo: true },
  { id: 'p4', codigo: 'CRITICA', nome: 'Crítica', descricao: null, ordem: 4, ativo: true },
];

function requisito(
  id: string,
  codigo: string,
  titulo: string,
  descricao: string,
  status: number,
  prioridade: number,
  criador: string,
): RequisitoAPI {
  return {
    id,
    codigo,
    titulo,
    descricao,
    tipoRequisito: 'FUNCIONAL',
    statusId: statusRequisito[status].id,
    statusNome: statusRequisito[status].nome,
    prioridadeId: prioridades[prioridade].id,
    prioridadeNome: prioridades[prioridade].nome,
    versao: 1,
    criadoPorId: 'u2',
    criadoPorNome: criador,
    solicitadoPorId: 'u4',
    solicitadoPorNome: 'Maria Souza',
    aprovadoPorId: null,
    aprovadoPorNome: null,
    dataCriacao: '2026-01-15T09:00:00Z',
    dataAtualizacao: '2026-02-22T10:00:00Z',
    dataSolicitacao: '2026-01-14T09:00:00Z',
    dataAprovacao: null,
  };
}

export const requisitos: RequisitoAPI[] = [
  requisito('r0', 'REQ-001', 'Cadastro de cliente com CPF', 'O sistema deve registrar o CPF do cliente no cadastro, validando o dígito verificador antes de gravar.', 3, 3, 'Ana Lima'),
  requisito('r1', 'REQ-002', 'Validação de e-mail único', 'Não deve ser possível cadastrar dois clientes com o mesmo e-mail. A verificação ocorre antes da gravação.', 1, 2, 'Ana Lima'),
  requisito('r2', 'REQ-003', 'Acompanhamento de status do pedido', 'O cliente deve acompanhar o pedido pelos estados: recebido, em separação, enviado e entregue.', 0, 2, 'Pedro Costa'),
  requisito('r3', 'REQ-004', 'Registro de data de nascimento', 'A data de nascimento passa a ser registrada no cadastro para campanhas segmentadas por faixa etária.', 4, 1, 'Maria Souza'),
  requisito('r4', 'REQ-005', 'Relatório de vendas por produto', 'O gestor deve extrair o total vendido por produto em um período escolhido.', 0, 1, 'Carlos Mendes'),
  requisito('r5', 'REQ-006', 'Exportação do catálogo em CSV', 'O catálogo completo deve ser exportado em CSV para uso em ferramentas externas.', 0, 0, 'Carlos Mendes'),
];

export const criterios: CriterioAceiteAPI[] = [
  {
    id: 'ca1',
    nome: 'CPF inválido é recusado',
    descricao: 'Dado que informo um CPF com dígito verificador inválido\nQuando salvo o cadastro\nEntão recebo a mensagem "CPF inválido" e nada é gravado.',
    requisitoId: 'r0',
    criadoPorNome: 'Ana Lima',
    criadoPorId: 'u2',
    dataCriacao: '2026-01-16T09:00:00Z',
    dataAtualizacao: '2026-02-10T09:00:00Z',
  },
  {
    id: 'ca2',
    nome: 'CPF duplicado é recusado',
    descricao: 'Dado que já existe um cliente com o CPF informado\nQuando tento salvar\nEntão o cadastro é bloqueado com a mensagem "CPF já cadastrado".',
    requisitoId: 'r0',
    criadoPorNome: 'Ana Lima',
    criadoPorId: 'u2',
    dataCriacao: '2026-01-16T10:00:00Z',
    dataAtualizacao: '2026-02-10T10:00:00Z',
  },
  {
    id: 'ca3',
    nome: 'E-mail repetido é recusado',
    descricao: 'Dado que informo um e-mail já usado por outro cliente\nQuando salvo\nEntão recebo "E-mail já cadastrado".',
    requisitoId: 'r1',
    criadoPorNome: 'Ana Lima',
    criadoPorId: 'u2',
    dataCriacao: '2026-01-18T09:00:00Z',
    dataAtualizacao: '2026-02-11T09:00:00Z',
  },
];

export const wiki: WikiProjetoApi = {
  id: 'wiki-1',
  projetoId: PROJ_ID,
  projetoNome: 'Plataforma de E-commerce',
  projetoDescricao: 'Discovery da nova plataforma de vendas online.',
  projetoCriadoPorId: 'u1',
  projetoCriadoPorNome: 'Thiago Falcone',
  projetoStatus: 'DISCOVERY',
  projetoDataCriacao: '2026-01-08T09:00:00Z',
  projetoDataAtualizacao: '2026-02-22T10:00:00Z',
  descricaoProblema:
    'As vendas hoje acontecem por planilha e WhatsApp. Não há controle de estoque em tempo real, o cliente não acompanha o pedido e o time comercial perde horas consolidando informação manualmente.',
  publicoAlvo:
    'Consumidores finais que compram pelo celular, e o time comercial interno que administra catálogo, estoque e pedidos.',
  objetivoGeral:
    'Disponibilizar uma plataforma de vendas online que cubra o fluxo completo: catálogo, carrinho, pagamento e acompanhamento do pedido.',
  objetivosEspecificos:
    'Reduzir em 70% o tempo de fechamento de um pedido.\nEliminar o retrabalho de consolidação manual de planilhas.\nDar visibilidade do status do pedido ao cliente sem contato com o suporte.',
  kpis: 'Tempo médio de fechamento do pedido.\nTaxa de abandono de carrinho.\nChamados de suporte por pedido.',
  restricoesPrazo: 'Primeira versão em produção até o fim do segundo semestre.',
  restricoesOrcamento: 'Orçamento limitado à equipe interna, sem contratação de terceiros.',
  tecnologiasObrigatorias: 'Java 21 com Spring Boot no backend e PostgreSQL como banco.',
  regulamentacoes: 'Tratamento de dados pessoais conforme a LGPD, incluindo consentimento no cadastro.',
  dataCriacao: '2026-01-08T09:00:00Z',
  dataAtualizacao: '2026-02-20T15:00:00Z',
};

export const eventos: EventoProjeto[] = [
  {
    id: 'ev1',
    nome: 'Kickoff do discovery',
    descricao: 'Alinhamento inicial de escopo com o time comercial.',
    tipo: 'REUNIAO',
    projetoId: PROJ_ID,
    projetoNome: 'Plataforma de E-commerce',
    organizacaoId: ORG_ID,
    organizacaoNome: 'TechCorp Solutions',
    criadoPorId: 'u1',
    criadoPorNome: 'Thiago Falcone',
    dataHoraInicio: '2026-01-10T13:00:00Z',
    dataHoraFim: '2026-01-10T15:00:00Z',
    dataCriacao: '2026-01-08T09:00:00Z',
  },
  {
    id: 'ev2',
    nome: 'Entrevista com stakeholders',
    descricao: 'Levantamento das dores do processo atual de vendas.',
    tipo: 'WORKSHOP',
    projetoId: PROJ_ID,
    projetoNome: 'Plataforma de E-commerce',
    organizacaoId: ORG_ID,
    organizacaoNome: 'TechCorp Solutions',
    criadoPorId: 'u2',
    criadoPorNome: 'Ana Lima',
    dataHoraInicio: '2026-01-22T14:00:00Z',
    dataHoraFim: '2026-01-22T16:00:00Z',
    dataCriacao: '2026-01-15T09:00:00Z',
  },
  {
    id: 'ev3',
    nome: 'Validação dos requisitos com o cliente',
    descricao: 'Revisão dos requisitos aprovados e coleta de ajustes.',
    tipo: 'REVISAO',
    projetoId: PROJ_ID,
    projetoNome: 'Plataforma de E-commerce',
    organizacaoId: ORG_ID,
    organizacaoNome: 'TechCorp Solutions',
    criadoPorId: 'u1',
    criadoPorNome: 'Thiago Falcone',
    dataHoraInicio: '2026-03-05T13:00:00Z',
    dataHoraFim: '2026-03-05T15:00:00Z',
    dataCriacao: '2026-02-20T09:00:00Z',
  },
];

export const arquivos: ArquivoProjetoDTO[] = [
  { id: 'f1', nomeOriginal: 'ata-kickoff.pdf', extensao: 'pdf', mimeType: 'application/pdf', tamanhoBytes: 184320, dataUpload: '2026-01-10T16:00:00Z', usuarioUpload: 'Thiago Falcone' },
  { id: 'f2', nomeOriginal: 'fluxo-pedido-atual.png', extensao: 'png', mimeType: 'image/png', tamanhoBytes: 512000, dataUpload: '2026-01-23T09:00:00Z', usuarioUpload: 'Ana Lima' },
  { id: 'f3', nomeOriginal: 'planilha-vendas-2025.xlsx', extensao: 'xlsx', mimeType: 'application/vnd.ms-excel', tamanhoBytes: 76800, dataUpload: '2026-01-24T11:00:00Z', usuarioUpload: 'Pedro Costa' },
  { id: 'f4', nomeOriginal: 'entrevista-stakeholders.docx', extensao: 'docx', mimeType: 'application/msword', tamanhoBytes: 45056, dataUpload: '2026-01-25T10:00:00Z', usuarioUpload: 'Ana Lima' },
];

export const auditoria: AuditoriaAPI[] = [
  { id: 'a1', organizacaoId: ORG_ID, projetoId: PROJ_ID, entidadeTipo: 'REQUISITO', entidadeId: 'r0', acao: 'EDICAO', campoAlterado: 'status', valorAnterior: 'EM_ANALISE', valorNovo: 'APROVADO', usuarioId: 'u1', usuarioNome: 'Thiago Falcone', usuarioAvatarUrl: null, dataAlteracao: '2026-02-22T10:00:00Z' },
  { id: 'a2', organizacaoId: ORG_ID, projetoId: PROJ_ID, entidadeTipo: 'REQUISITO', entidadeId: 'r1', acao: 'EDICAO', campoAlterado: 'descricao', valorAnterior: 'Validar e-mail no cadastro.', valorNovo: 'Não deve ser possível cadastrar dois clientes com o mesmo e-mail.', usuarioId: 'u2', usuarioNome: 'Ana Lima', usuarioAvatarUrl: null, dataAlteracao: '2026-02-20T14:30:00Z' },
  { id: 'a3', organizacaoId: ORG_ID, projetoId: PROJ_ID, entidadeTipo: 'WIKI', entidadeId: 'wiki-1', acao: 'EDICAO', campoAlterado: 'objetivoGeral', valorAnterior: 'Vender online.', valorNovo: 'Disponibilizar uma plataforma de vendas online que cubra o fluxo completo.', usuarioId: 'u1', usuarioNome: 'Thiago Falcone', usuarioAvatarUrl: null, dataAlteracao: '2026-02-20T15:00:00Z' },
  { id: 'a4', organizacaoId: ORG_ID, projetoId: PROJ_ID, entidadeTipo: 'REQUISITO', entidadeId: 'r3', acao: 'CRIACAO', campoAlterado: 'titulo', valorAnterior: null, valorNovo: 'Registro de data de nascimento', usuarioId: 'u2', usuarioNome: 'Ana Lima', usuarioAvatarUrl: null, dataAlteracao: '2026-02-12T09:00:00Z' },
  { id: 'a5', organizacaoId: ORG_ID, projetoId: PROJ_ID, entidadeTipo: 'CRITERIO_ACEITE', entidadeId: 'ca1', acao: 'CRIACAO', campoAlterado: 'nome', valorAnterior: null, valorNovo: 'CPF inválido é recusado', usuarioId: 'u2', usuarioNome: 'Ana Lima', usuarioAvatarUrl: null, dataAlteracao: '2026-01-16T09:00:00Z' },
  { id: 'a6', organizacaoId: ORG_ID, projetoId: PROJ_ID, entidadeTipo: 'PROJETO', entidadeId: PROJ_ID, acao: 'CRIACAO', campoAlterado: 'nome', valorAnterior: null, valorNovo: 'Plataforma de E-commerce', usuarioId: 'u1', usuarioNome: 'Thiago Falcone', usuarioAvatarUrl: null, dataAlteracao: '2026-01-08T09:00:00Z' },
];

export const resumoInteracoes: ResumoInteracaoProjeto = {
  totalInteracoes: 48,
  totalMembros: 5,
  interacoesPorModulo: { REQUISITO: 21, WIKI: 12, COMENTARIO: 9, EVENTO: 6 },
  porUsuario: [
    { usuarioId: 'u2', usuarioNome: 'Ana Lima', usuarioEmail: 'ana@discovery.dev', usuarioUrlFoto: null, totalInteracoes: 18, interacoesWiki: 4, interacoesRequisito: 9, interacoesComentario: 3, interacoesEvento: 2 },
    { usuarioId: 'u1', usuarioNome: 'Thiago Falcone', usuarioEmail: 'thiago@discovery.dev', usuarioUrlFoto: null, totalInteracoes: 14, interacoesWiki: 5, interacoesRequisito: 5, interacoesComentario: 2, interacoesEvento: 2 },
    { usuarioId: 'u3', usuarioNome: 'Pedro Costa', usuarioEmail: 'pedro@discovery.dev', usuarioUrlFoto: null, totalInteracoes: 9, interacoesWiki: 2, interacoesRequisito: 5, interacoesComentario: 1, interacoesEvento: 1 },
    { usuarioId: 'u4', usuarioNome: 'Maria Souza', usuarioEmail: 'maria@cliente.com', usuarioUrlFoto: null, totalInteracoes: 5, interacoesWiki: 1, interacoesRequisito: 1, interacoesComentario: 2, interacoesEvento: 1 },
    { usuarioId: 'u5', usuarioNome: 'Carlos Mendes', usuarioEmail: 'carlos@cliente.com', usuarioUrlFoto: null, totalInteracoes: 2, interacoesWiki: 0, interacoesRequisito: 1, interacoesComentario: 1, interacoesEvento: 0 },
  ],
};

export const comentarios: ComentarioAPI[] = [
  {
    id: 'c1',
    conteudo: 'Precisamos confirmar com o jurídico se o CPF pode ser obrigatório para pessoa física estrangeira.',
    usuarioId: 'u4',
    usuarioNome: 'Maria Souza',
    usuarioAvatarUrl: null,
    entidadeTipo: 'REQUISITO',
    entidadeId: 'r0',
    organizacaoId: ORG_ID,
    projetoId: PROJ_ID,
    ativo: true,
    editado: false,
    dataCriacao: '2026-02-18T13:00:00Z',
    dataAtualizacao: '2026-02-18T13:00:00Z',
  },
  {
    id: 'c2',
    conteudo: 'Confirmado: para estrangeiro sem CPF, o cadastro fica bloqueado nesta primeira versão.',
    usuarioId: 'u1',
    usuarioNome: 'Thiago Falcone',
    usuarioAvatarUrl: null,
    entidadeTipo: 'REQUISITO',
    entidadeId: 'r0',
    organizacaoId: ORG_ID,
    projetoId: PROJ_ID,
    ativo: true,
    editado: false,
    dataCriacao: '2026-02-19T09:30:00Z',
    dataAtualizacao: '2026-02-19T09:30:00Z',
  },
];
