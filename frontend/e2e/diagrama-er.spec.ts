import { expect, test, type Page } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, rota } from './support/ui';

/**
 * Diagrama entidade-relacionamento da tela Modelo de Dados: zoom, reenquadramento,
 * tela cheia e foco na entidade selecionada. O modelo é largo de propósito (muitas
 * entidades ligadas a uma central), para o desenho passar da área visível.
 */
const ENTIDADES = Array.from({ length: 12 }, (_, i) => `ENTIDADE_${String(i).padStart(2, '0')}`);

/** Estado da área de rolagem do diagrama e posição do desenho dentro dela. */
async function estado(page: Page) {
  return page.locator('svg[id^="er-"]').evaluate((svg) => {
    let area = svg.parentElement!;
    while (getComputedStyle(area).overflow !== 'auto') area = area.parentElement!;
    const caixaArea = area.getBoundingClientRect();
    const caixaSvg = svg.getBoundingClientRect();
    return {
      rolagem: [area.scrollLeft, area.scrollTop],
      larguraRolavel: area.scrollWidth,
      larguraVisivel: area.clientWidth,
      // Posição do desenho no conteúdo rolável: negativa = vazou para a esquerda,
      // fora do alcance da barra de rolagem.
      inicioDesenho: Math.round(caixaSvg.left - caixaArea.left - area.clientLeft + area.scrollLeft),
      larguraDesenho: Math.round(caixaSvg.width),
    };
  });
}

/** Estado depois que a rolagem suave termina (duas leituras iguais seguidas). */
async function estadoAssentado(page: Page) {
  let anterior = JSON.stringify(await estado(page));
  for (;;) {
    await page.waitForTimeout(150);
    const atual = JSON.stringify(await estado(page));
    if (atual === anterior) return JSON.parse(atual) as Awaited<ReturnType<typeof estado>>;
    anterior = atual;
  }
}

/** A caixa da entidade está inteira dentro da área visível do diagrama? */
async function entidadeVisivel(page: Page, nome: string) {
  return page.locator('svg[id^="er-"]').evaluate((svg, n) => {
    let area = svg.parentElement!;
    while (getComputedStyle(area).overflow !== 'auto') area = area.parentElement!;
    const a = area.getBoundingClientRect();
    const no = [...svg.querySelectorAll('g[id*="-entity-"]')].find((g) => g.id.includes(`-entity-${n}-`))!;
    const r = no.getBoundingClientRect();
    const esq = a.left + area.clientLeft;
    const topo = a.top + area.clientTop;
    return r.left >= esq - 1 && r.right <= esq + area.clientWidth + 1
      && r.top >= topo - 1 && r.bottom <= topo + area.clientHeight + 1;
  }, nome);
}

const botao = (page: Page, nome: string) => page.getByRole('button', { name: nome, exact: true });

test.describe('Diagrama entidade-relacionamento', () => {
  let c: Cenario;

  test.beforeAll(async () => {
    c = await montarCenario('diagrama');
    const ids: string[] = [];
    for (const nome of ENTIDADES) {
      const e = await c.api.dono.ok<{ id: string }>('POST', `/entidade-dados/projeto/${c.projetoA.id}`, { nome, descricao: null });
      ids.push(e.id);
      await c.api.dono.ok('POST', `/atributo-entidade/entidade/${e.id}`, {
        nome: 'id', tipo: 'UUID', obrigatorio: true, chavePrimaria: true, ordem: null,
        chaveEstrangeira: false, entidadeReferenciadaId: null, tipoRelacionamento: null,
      });
      for (let k = 0; k < 5; k++) {
        await c.api.dono.ok('POST', `/atributo-entidade/entidade/${e.id}`, {
          nome: `campo_descritivo_${k}`, tipo: 'VARCHAR', obrigatorio: false, chavePrimaria: false, ordem: null,
          chaveEstrangeira: false, entidadeReferenciadaId: null, tipoRelacionamento: null,
        });
      }
    }
    // Todas apontam para a primeira: o Mermaid as enfileira lado a lado
    for (const id of ids.slice(1)) {
      await c.api.dono.ok('POST', `/atributo-entidade/entidade/${id}`, {
        nome: 'entidade_00_id', tipo: 'UUID', obrigatorio: true, chavePrimaria: false, ordem: null,
        chaveEstrangeira: true, entidadeReferenciadaId: ids[0], tipoRelacionamento: 'UM_PARA_MUITOS',
      });
    }
  });
  test.afterAll(async () => { await desmontarCenario(c); });

  test.beforeEach(async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.modulo(c, 'data-model'));
    await expect(page.locator('g[id*="-entity-"]').first()).toBeVisible();
  });

  test('ampliar não esconde a esquerda e o ajuste volta ao tamanho e posição originais', async ({ page }) => {
    // Sem seleção, o enquadramento inicial é o início do desenho
    const inicial = await estado(page);
    expect(inicial.inicioDesenho).toBeGreaterThanOrEqual(0);

    for (let i = 0; i < 5; i++) await botao(page, 'Aproximar').click();
    const ampliado = await estado(page);
    expect(ampliado.larguraDesenho).toBeGreaterThan(inicial.larguraDesenho);
    expect(ampliado.larguraDesenho).toBeGreaterThan(ampliado.larguraVisivel);
    // Nada vaza para a esquerda: a rolagem alcança o desenho inteiro
    expect(ampliado.inicioDesenho).toBeGreaterThanOrEqual(0);
    expect(ampliado.larguraRolavel).toBeGreaterThanOrEqual(ampliado.inicioDesenho + ampliado.larguraDesenho);

    await botao(page, 'Ajustar à área visível').click();
    await expect.poll(() => estado(page)).toEqual(inicial);
  });

  test('selecionar uma entidade traz a caixa inteira para a área visível', async ({ page }) => {
    for (const nome of ['ENTIDADE_11', 'ENTIDADE_00', 'ENTIDADE_06', 'ENTIDADE_01']) {
      await page.getByText(nome, { exact: true }).first().click();
      await expect.poll(() => entidadeVisivel(page, nome)).toBe(true);
    }
    // Também com zoom alto
    for (let i = 0; i < 4; i++) await botao(page, 'Aproximar').click();
    await page.getByText('ENTIDADE_09', { exact: true }).first().click();
    await expect.poll(() => entidadeVisivel(page, 'ENTIDADE_09')).toBe(true);
    // Só a selecionada fica destacada
    await expect(page.locator('g[id*="-entity-"]:has(.outer-path path[stroke-width="2.5"])')).toHaveCount(1);
  });

  test('a tela cheia reenquadra ao entrar e o diagrama volta igual ao sair', async ({ page }) => {
    await page.getByText('ENTIDADE_08', { exact: true }).first().click();
    await expect.poll(() => entidadeVisivel(page, 'ENTIDADE_08')).toBe(true);
    const antes = await estadoAssentado(page);

    for (let i = 0; i < 3; i++) await botao(page, 'Aproximar').click();
    await botao(page, 'Expandir diagrama').click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await expect.poll(() => entidadeVisivel(page, 'ENTIDADE_08')).toBe(true);

    await dialogo.getByRole('button', { name: 'Sair da tela cheia' }).first().click();
    await expect(dialogo).toBeHidden();
    await expect.poll(() => estado(page)).toEqual(antes);
  });
});
