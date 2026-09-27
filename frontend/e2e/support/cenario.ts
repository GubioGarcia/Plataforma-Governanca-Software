import { cadastrar, keycloak, psql, sufixo, Sessao, type Pessoa } from './api';

interface Id { id: string; nome: string }
interface Requisito { id: string; codigo: string; titulo: string }

/**
 * Cenário padrão de um arquivo de testes:
 *
 *   organização  "Org UI <nome> <tag>"          — dono (Dono), gestor (Gestor), membro (Membro)
 *   projeto A    "Projeto A <tag>"              — convidado (Stakeholder técnico + cliente, só neste projeto)
 *   projeto B    "Projeto B <tag>"              — sem convidado
 *   requisitos em A: um RASCUNHO e um APROVADO
 *   estranho: usuário sem vínculo nenhum
 */
export interface Cenario {
  tag: string;
  dono: Pessoa;
  gestor: Pessoa;
  membro: Pessoa;
  convidado: Pessoa;
  estranho: Pessoa;
  org: Id;
  projetoA: Id;
  projetoB: Id;
  reqRascunho: Requisito;
  reqAprovado: Requisito;
  /** Sessões de API de cada pessoa (preparar dados sem passar pela tela). */
  api: Record<'dono' | 'gestor' | 'membro' | 'convidado' | 'estranho', Sessao>;
  /** Pessoas criadas depois pelo teste — entram na limpeza. */
  extras: Pessoa[];
}

async function convidarEAceitar(quem: Sessao, rota: string, convidado: Sessao, papel: string) {
  const c = await quem.ok<{ id: string }>('POST', rota, { email: convidado.pessoa.email, papel });
  await convidado.ok('POST', `/convites/${c.id}/aceitar`);
}

export async function montarCenario(nome: string): Promise<Cenario> {
  const tag = sufixo();
  const [dono, gestor, membro, convidado, estranho] = await Promise.all(
    ['dono', 'gestor', 'membro', 'convidado', 'estranho'].map((a) => cadastrar(a, tag)),
  );
  const api = {
    dono: new Sessao(dono), gestor: new Sessao(gestor), membro: new Sessao(membro),
    convidado: new Sessao(convidado), estranho: new Sessao(estranho),
  };

  const org = await api.dono.ok<Id>('POST', '/organizacao', { nome: `Org UI ${nome} ${tag}`, descricao: 'Cenário de teste da interface', plano: 'FREE' });
  const projetoA = await api.dono.ok<Id>('POST', '/projeto', { organizacaoId: org.id, nome: `Projeto A ${tag}`, descricao: 'Projeto com convidado' });
  const projetoB = await api.dono.ok<Id>('POST', '/projeto', { organizacaoId: org.id, nome: `Projeto B ${tag}`, descricao: 'Projeto sem convidado' });

  await convidarEAceitar(api.dono, `/organizacao/${org.id}/convites`, api.gestor, 'GESTOR');
  await convidarEAceitar(api.dono, `/organizacao/${org.id}/convites`, api.membro, 'MEMBRO');
  await convidarEAceitar(api.dono, `/projeto/${projetoA.id}/convites`, api.convidado, 'STAKEHOLDER');

  const novoRequisito = (titulo: string) => api.dono.ok<Requisito>('POST', `/requisito/projeto/${projetoA.id}`,
    { titulo, descricao: `Descrição de ${titulo}`, tipoRequisito: 'FUNCIONAL' });
  const reqRascunho = await novoRequisito('Requisito em rascunho');
  const reqAprovado = await novoRequisito('Requisito aprovado');
  await api.dono.ok('PATCH', `/requisito/${reqAprovado.id}/aprovar`);

  return { tag, dono, gestor, membro, convidado, estranho, org, projetoA, projetoB, reqRascunho, reqAprovado, api, extras: [] };
}

/** Apaga tudo o que o cenário criou: grupos e usuários no Keycloak, linhas no banco. */
export async function desmontarCenario(c: Cenario | undefined): Promise<void> {
  if (!c) return;
  try {
    const g = await keycloak<{ id: string }>('GET', `/group-by-path/org-${c.org.id}`);
    if (g.status === 200) await keycloak('DELETE', `/groups/${g.corpo.id}`);
    for (const p of [c.dono, c.gestor, c.membro, c.convidado, c.estranho, ...c.extras]) {
      await keycloak('DELETE', `/users/${p.kc}`);
    }
  } catch (e) {
    console.warn('limpeza do Keycloak falhou:', e);
  }
  const projetos = `(select id from projeto where organizacao_id='${c.org.id}')`;
  const requisitos = `(select id from requisito where projeto_id in ${projetos})`;
  const entidades = `(select id from entidade_dados where projeto_id in ${projetos})`;
  psql(`
    delete from solicitacao where projeto_id in ${projetos};
    delete from evento where organizacao_id='${c.org.id}' or projeto_id in ${projetos};
    delete from comentario where projeto_id in ${projetos};
    delete from criterio_aceite where requisito_id in ${requisitos};
    delete from vinculo_requisito where requisito_origem_id in ${requisitos};
    delete from impacto_dados where requisito_id in ${requisitos};
    delete from relacionamento_entidade where entidade_origem_id in ${entidades} or entidade_destino_id in ${entidades};
    delete from atributo_entidade where entidade_id in ${entidades};
    delete from entidade_dados where projeto_id in ${projetos};
    delete from arquivo_projeto where projeto_id in ${projetos};
    delete from interacao where projeto_id in ${projetos};
    delete from auditoria where organizacao_id='${c.org.id}' or projeto_id in ${projetos};
    delete from requisito where projeto_id in ${projetos};
    delete from visao_produto where projeto_id in ${projetos};
    delete from convite where organizacao_id='${c.org.id}' or projeto_id in ${projetos};
    delete from projeto where organizacao_id='${c.org.id}';
    delete from organizacao where id='${c.org.id}';
    delete from usuario where email like '%.ui.${c.tag}@exemplo.com';`);
}
