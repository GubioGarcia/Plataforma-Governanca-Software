import { expect, test, type Locator, type Page } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, rota } from './support/ui';

/**
 * Contadores de Visão geral, Analytics e Stakeholders. O cenário tem 2 requisitos
 * (um em rascunho, um aprovado), criados e aprovados pelo Dono — 3 interações em
 * Requisitos — e o teste acrescenta 1 comentário do convidado: 4 no total.
 */
test.describe('Indicadores do projeto', () => {
  let c: Cenario;

  test.beforeAll(async () => {
    c = await montarCenario('indicadores');
    await c.api.convidado.ok('POST', '/comentario', {
      conteudo: 'Comentário do stakeholder', entidadeTipo: 'REQUISITO', entidadeId: c.reqRascunho.id,
    });
  });
  test.afterAll(async () => { await desmontarCenario(c); });

  /** Card de gráfico de barras pelo título. */
  const secao = (page: Page, titulo: string): Locator =>
    page.locator('.MuiCard-root').filter({ has: page.getByText(titulo, { exact: true }) });

  /** Linha "rótulo ... valor (pct%)" de um gráfico de barras. */
  async function linha(card: Locator, rotulo: string, valor: string) {
    await expect(card.getByText(rotulo, { exact: true })).toBeVisible();
    await expect(card.getByText(rotulo, { exact: true }).locator('xpath=ancestor::div[2]')).toContainText(valor);
  }

  test('analytics: todos os status, tipos e módulos, com as contagens certas', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.modulo(c, 'analytics'));

    const status = secao(page, 'Requisitos por Status');
    await linha(status, 'Rascunho', '1 (50%)');
    await linha(status, 'Em Revisão', '0 (0%)');
    await linha(status, 'Aprovado', '1 (50%)');
    await linha(status, 'Reprovado', '0 (0%)');
    await linha(status, 'Arquivado', '0 (0%)');

    const tipos = secao(page, 'Requisitos por Tipo');
    await linha(tipos, 'Funcional', '2 (100%)');
    for (const t of ['Não Funcional', 'Regra de Negócio', 'Técnico']) await linha(tipos, t, '0 (0%)');

    const modulos = secao(page, 'Interações por Módulo');
    await linha(modulos, 'Requisitos', '3 (75%)');
    await linha(modulos, 'Comentários', '1 (25%)');
    for (const m of ['Wiki', 'Eventos', 'Arquivos', 'Modelo de Dados', 'Rastreabilidade']) await linha(modulos, m, '0 (0%)');

    await expect(page.getByText('1 aguardando decisão')).toBeVisible();
    await expect(page.getByText('4 interações', { exact: true })).toBeVisible();
  });

  test('visão geral: aprovados, em revisão e funil com todos os status', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.projeto(c));

    const kpi = (rotulo: string) => page.locator('.MuiCard-root').filter({ has: page.getByText(rotulo, { exact: true }) });
    await expect(kpi('Aprovados')).toContainText('1');
    await expect(kpi('Em Revisão').first()).toContainText('0');
    await expect(kpi('Total de Interações')).toContainText('4');

    const funil = secao(page, 'Funil de Requisitos');
    for (const s of ['Rascunho', 'Em Revisão', 'Aprovado', 'Reprovado', 'Arquivado']) {
      await expect(funil.getByText(s, { exact: true })).toBeVisible();
    }
  });

  test('stakeholders: média por quem interagiu e barras somando o total da pessoa', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.modulo(c, 'stakeholders'));

    const resumo = (rotulo: string) => page.locator('.MuiCard-root').filter({ has: page.getByText(rotulo, { exact: true }) });
    await expect(resumo('Total de interações')).toContainText('4');
    await expect(resumo('Média por pessoa que interagiu')).toContainText('2'); // 4 interações / 2 pessoas

    const convidado = page.locator(`[data-participante="${c.convidado.email}"]`);
    await expect(convidado).toContainText('1 interações');
    await expect(convidado.getByText('Interações Comentários')).toBeVisible();

    const dono = page.locator(`[data-participante="${c.dono.email}"]`);
    await expect(dono).toContainText('3 interações');
    await expect(dono.getByText('Interações Requisitos')).toBeVisible();
  });
});
