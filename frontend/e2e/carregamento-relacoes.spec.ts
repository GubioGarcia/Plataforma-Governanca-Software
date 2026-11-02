import { expect, test } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { AMBIENTE, chamar, type Sessao } from './support/api';

/**
 * Leituras que dependem de relações LAZY (PR #19). Com open-in-view=false, uma
 * relação lida fora de transação vira 500 (LazyInitializationException), então
 * cada leitura confere o status e os nomes que o DTO busca nas relações.
 *
 * Cobre o que os outros arquivos não passam: comentários, arquivos, eventos,
 * visão do produto, convites pendentes, exportações e telas de consulta.
 */
test.describe('Carregamento de relações (LAZY)', () => {
  let c: Cenario;

  test.beforeAll(async () => { c = await montarCenario('relacoes'); });
  test.afterAll(async () => { await desmontarCenario(c); });

  async function ler<T>(quem: Sessao, caminho: string): Promise<T> {
    return quem.ok<T>('GET', caminho, undefined, [200]);
  }

  test('requisitos: lista e detalhe trazem status, prioridade e autores', async () => {
    type Req = { id: string; statusNome: string; criadoPorNome: string; aprovadoPorNome: string | null };
    for (const quem of [c.api.dono, c.api.gestor, c.api.convidado]) {
      const lista = await ler<Req[]>(quem, `/requisito/projeto/${c.projetoA.id}`);
      const aprovado = lista.find((r) => r.id === c.reqAprovado.id)!;
      expect(aprovado.statusNome).toBeTruthy();
      expect(aprovado.criadoPorNome).toBe(c.dono.nome);
      expect(aprovado.aprovadoPorNome).toBe(c.dono.nome);

      const detalhe = await ler<Req>(quem, `/requisito/${c.reqRascunho.id}`);
      expect(detalhe.criadoPorNome).toBe(c.dono.nome);
    }
  });

  test('projeto e visão do produto trazem organização, status e criador', async () => {
    const projeto = await ler<{ organizacaoNome: string; criadoPorNome: string; status: { nome: string } }>(
      c.api.convidado, `/projeto/${c.projetoA.id}`);
    expect(projeto.organizacaoNome).toBe(c.org.nome);
    expect(projeto.criadoPorNome).toBe(c.dono.nome);
    expect(projeto.status?.nome).toBeTruthy();

    const lista = await ler<{ id: string; criadoPorNome: string }[]>(c.api.membro, `/projeto/organizacao/${c.org.id}`);
    expect(lista.map((p) => p.criadoPorNome)).toContain(c.dono.nome);

    await c.api.dono.ok('PUT', `/projeto/${c.projetoA.id}/wiki`, { descricaoProblema: 'Problema de teste', publicoAlvo: 'Equipe' });
    const wiki = await ler<{ id: string; projetoNome: string; projetoCriadoPorNome: string }>(
      c.api.convidado, `/projeto/${c.projetoA.id}/wiki`);
    expect(wiki.projetoNome).toBe(c.projetoA.nome);
    expect(wiki.projetoCriadoPorNome).toBe(c.dono.nome);
    expect((await ler<{ projetoNome: string }>(c.api.gestor, `/wiki/${wiki.id}`)).projetoNome).toBe(c.projetoA.nome);
  });

  test('comentários trazem o nome do autor', async () => {
    const base = { entidadeTipo: 'REQUISITO', entidadeId: c.reqAprovado.id, projetoId: c.projetoA.id, organizacaoId: c.org.id };
    const criado = await c.api.convidado.ok<{ id: string; usuarioNome: string }>('POST', '/comentario', { ...base, conteudo: 'Comentário do cliente' });
    expect(criado.usuarioNome).toBe(c.convidado.nome);

    const lista = await ler<{ usuarioNome: string }[]>(c.api.gestor,
      `/comentario?entidadeTipo=REQUISITO&entidadeId=${c.reqAprovado.id}`);
    expect(lista.map((x) => x.usuarioNome)).toContain(c.convidado.nome);

    const editado = await c.api.convidado.ok<{ usuarioNome: string; editado: boolean }>('PATCH', `/comentario/${criado.id}`, { conteudo: 'Comentário revisto' });
    expect(editado.usuarioNome).toBe(c.convidado.nome);
  });

  test('arquivos: envio, lista e download trazem quem enviou', async () => {
    const login = await chamar<{ token: string }>('POST', `${AMBIENTE.api}/auth/login`,
      { corpo: { email: c.gestor.email, senha: c.gestor.senha } });
    const form = new FormData();
    form.append('file', new Blob(['conteúdo de teste'], { type: 'text/plain' }), 'relacoes.txt');
    const envio = await fetch(`${AMBIENTE.api}/projects/${c.projetoA.id}/files/upload`,
      { method: 'POST', headers: { Authorization: `Bearer ${login.corpo.token}` }, body: form });
    expect(envio.status).toBe(201);
    const arquivo = await envio.json() as { id: string; usuarioUpload: string };
    expect(arquivo.usuarioUpload).toBe(c.gestor.nome);

    const lista = await ler<{ id: string; usuarioUpload: string }[]>(c.api.convidado, `/projects/${c.projetoA.id}/files`);
    expect(lista.find((a) => a.id === arquivo.id)?.usuarioUpload).toBe(c.gestor.nome);

    const download = await c.api.convidado.req('GET', `/files/${arquivo.id}/download`);
    expect(download.status).toBe(200);
  });

  test('eventos trazem projeto, organização e criador', async () => {
    const inicio = new Date(Date.now() + 86_400_000);
    const criado = await c.api.dono.ok<{ id: string; projetoNome: string; organizacaoNome: string; criadoPorNome: string }>('POST', '/evento', {
      nome: 'Reunião de validação', projetoId: c.projetoA.id, organizacaoId: c.org.id,
      dataHoraInicio: inicio.toISOString(), dataHoraFim: new Date(inicio.getTime() + 3_600_000).toISOString(),
    });
    expect(criado.criadoPorNome).toBe(c.dono.nome);

    for (const caminho of [`/evento/${criado.id}`, `/evento/projeto/${c.projetoA.id}`, `/evento/organizacao/${c.org.id}`]) {
      const corpo = await ler<unknown>(c.api.gestor, caminho);
      const ev = (Array.isArray(corpo) ? corpo.find((e: { id: string }) => e.id === criado.id) : corpo) as typeof criado;
      expect(ev.projetoNome).toBe(c.projetoA.nome);
      expect(ev.organizacaoNome).toBe(c.org.nome);
      expect(ev.criadoPorNome).toBe(c.dono.nome);
    }
  });

  test('solicitações trazem solicitante e quem respondeu', async () => {
    type Sol = { id: string; solicitanteNome: string; respondidoPorNome: string | null; alvoDescricao: string | null };
    const criada = await c.api.convidado.ok<Sol>('POST', `/projeto/${c.projetoA.id}/solicitacoes`,
      { tipo: 'ALTERACAO_REQUISITO', alvoId: c.reqAprovado.id, justificativa: 'Ajustar o texto' });
    expect(criada.solicitanteNome).toBe(c.convidado.nome);

    const lista = await ler<Sol[]>(c.api.gestor, `/projeto/${c.projetoA.id}/solicitacoes`);
    expect(lista.find((s) => s.id === criada.id)?.alvoDescricao).toBeTruthy();

    const atendida = await c.api.gestor.ok<Sol>('POST', `/solicitacoes/${criada.id}/atender`, { resposta: 'Feito' });
    expect(atendida.respondidoPorNome).toBe(c.gestor.nome);
    expect(atendida.solicitanteNome).toBe(c.convidado.nome);
  });

  test('convites pendentes trazem organização, projeto e quem convidou', async () => {
    type Conv = { id: string; organizacaoNome: string; projetoNome: string; convidadoPorNome: string };
    const convite = await c.api.dono.ok<Conv>('POST', `/projeto/${c.projetoB.id}/convites`, { email: c.estranho.email, papel: 'STAKEHOLDER' });

    const doProjeto = await ler<Conv[]>(c.api.dono, `/projeto/${c.projetoB.id}/convites`);
    expect(doProjeto.find((x) => x.id === convite.id)?.convidadoPorNome).toBe(c.dono.nome);

    const meus = await ler<Conv[]>(c.api.estranho, '/convites/meus');
    const meu = meus.find((x) => x.id === convite.id)!;
    expect(meu.organizacaoNome).toBe(c.org.nome);
    expect(meu.projetoNome).toBe(c.projetoB.nome);
    expect(meu.convidadoPorNome).toBe(c.dono.nome);

    await c.api.estranho.ok('POST', `/convites/${convite.id}/recusar`);
  });

  test('consultas do projeto respondem sem erro', async () => {
    const p = c.projetoA.id;
    for (const caminho of [
      `/auditoria/projeto/${p}`, `/interacao/projeto/${p}`, `/interacao/projeto/${p}/resumo`,
      `/rastreabilidade/projeto/${p}/matriz`, `/rastreabilidade/requisito/${c.reqAprovado.id}/impacto`,
      `/vinculo-requisito/projeto/${p}`, `/impacto-dados/projeto/${p}`, `/entidade-dados/projeto/${p}/diagrama`,
      `/projeto/${p}/participantes`, `/organizacao/${c.org.id}/membros`, `/organizacao/${c.org.id}/convites`,
      `/projeto/${p}/exportar/mer`, `/projeto/${p}/exportar/rastreabilidade`, '/auth/me',
    ]) {
      const r = await c.api.dono.req('GET', caminho);
      expect(r.status, caminho).toBe(200);
    }
  });
});
