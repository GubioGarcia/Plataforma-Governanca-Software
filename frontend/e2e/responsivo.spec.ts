import { devices, expect, test, type Page } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, rota } from './support/ui';

/**
 * Celular: o menu do projeto vira gaveta (abaixo de 900px) e nenhuma tela pode
 * rolar na horizontal — o sintoma clássico de layout quebrado em tela estreita.
 */
test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' });

test.describe('Responsividade no celular', () => {
  let c: Cenario;

  test.beforeAll(async () => { c = await montarCenario('responsivo'); });
  test.afterAll(async () => { await desmontarCenario(c); });

  /**
   * Nenhum elemento pode passar da borda da tela. Não basta medir o documento: o
   * AppShell corta o excesso (overflow hidden), então o estouro some da rolagem mas
   * o conteúdo fica cortado. Ficam de fora o que está dentro de uma área com rolagem
   * horizontal própria (tabelas, matriz) e as barras de progresso (usam transform).
   */
  async function semRolagemHorizontal(page: Page) {
    const fora = await page.evaluate(() => {
      const tela = document.documentElement.clientWidth;
      const rolaSozinho = (el: Element) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const st = getComputedStyle(p);
          if ((st.overflowX === 'auto' || st.overflowX === 'scroll') && p.scrollWidth > p.clientWidth) return true;
        }
        return false;
      };
      return [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0 || el.closest('.MuiLinearProgress-root')) return false;
          // ocultos não contam (ex.: a gaveta pré-montada, fechada fora da tela)
          if (getComputedStyle(el).visibility === 'hidden') return false;
          return (r.right > tela + 1 || r.left < -1) && !rolaSozinho(el);
        })
        .slice(0, 3)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${(el.className?.toString() ?? '').split(' ')[0]} [${Math.round(r.left)}..${Math.round(r.right)}] "${(el as HTMLElement).innerText?.trim().slice(0, 30) ?? ''}"`;
        });
    });
    expect(fora, 'elementos passando da borda da tela').toEqual([]);
  }

  test('menu do projeto em gaveta: abre, navega e fecha', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.projeto(c));

    // Menu lateral fixo escondido; no lugar, a barra do projeto com o botão de menu
    await expect(page.getByRole('navigation')).toBeHidden();
    const abrirMenu = page.getByRole('button', { name: 'Abrir o menu do projeto' });
    await expect(abrirMenu).toBeVisible();

    await abrirMenu.click();
    const gaveta = page.locator('.MuiDrawer-paper');
    await expect(gaveta.getByText(c.projetoA.nome)).toBeVisible();
    await gaveta.getByRole('link', { name: 'Requisitos', exact: true }).click();

    await expect(page).toHaveURL(/\/requirements$/);
    await expect(gaveta).toBeHidden(); // a gaveta fecha ao navegar
    await expect(page.getByRole('heading', { name: 'Requisitos' })).toBeVisible();
  });

  test('telas principais sem rolagem horizontal', async ({ page }) => {
    await entrar(page, c.dono);
    const telas = [
      '/organizations',
      rota.projetos(c),
      rota.projeto(c),
      rota.modulo(c, 'wiki'),
      rota.modulo(c, 'requirements'),
      rota.modulo(c, 'traceability'),
      rota.modulo(c, 'data-model'),
      rota.modulo(c, 'events'),
      rota.modulo(c, 'stakeholders'),
      rota.modulo(c, 'audit'),
      rota.modulo(c, 'analytics'),
    ];
    for (const tela of telas) {
      await test.step(tela, async () => {
        await page.goto(tela);
        await page.waitForLoadState('networkidle');
        await semRolagemHorizontal(page);
      });
    }
  });

  test('meu perfil: card na largura da tela, edição sem estouro e Voltar', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Meu Perfil' })).toBeVisible();

    // O card do perfil acompanha a largura dos demais cards (empilhados no celular)
    const larguras = await page.locator('.MuiCard-root').evaluateAll((cards) =>
      cards.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(larguras[0]).toBe(larguras[larguras.length - 1]);
    await semRolagemHorizontal(page);

    await page.getByRole('button', { name: 'Editar perfil' }).click();
    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await semRolagemHorizontal(page);
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL(/\/organizations$/);
  });

  test('arquivos: com arquivo enviado a lista vira cartões e cabe na tela', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.modulo(c, 'files'));
    const nome = 'especificacao_de_requisitos_versao_final_revisada_pelo_cliente.pdf';
    await page.locator('input[type="file"]').setInputFiles({ name: nome, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 teste') });

    await expect(page.getByText(nome)).toBeVisible();
    await expect(page.getByText(`Enviado por ${c.dono.nome}`)).toBeVisible();
    await expect(page.getByRole('button', { name: `Baixar ${nome}` })).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
    await semRolagemHorizontal(page);
  });
});
