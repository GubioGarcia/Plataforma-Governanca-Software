import { expect, test, type Page } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, esperarAviso, rota } from './support/ui';

/**
 * Solicitações (D12) pela interface: o stakeholder pede, o pedido chega nas
 * pendências da gestão, a gestão responde e o stakeholder vê o resultado.
 */
test.describe('Solicitações', () => {
  let c: Cenario;

  test.beforeAll(async () => { c = await montarCenario('solicitacoes'); });
  test.afterAll(async () => { await desmontarCenario(c); });

  const cartao = (page: Page, texto: string) => page.locator('.MuiCard-root', { hasText: texto });

  async function abrirPendencias(page: Page) {
    await page.getByRole('button', { name: 'Pendências' }).click();
    return page.locator('.MuiPopover-paper');
  }

  test('cliente pede aprovação; a gestão vê no sino e atende', async ({ page }) => {
    await entrar(page, c.convidado);
    await page.goto(rota.requisito(c, c.reqRascunho.id));
    await page.getByRole('button', { name: 'Solicitar aprovação' }).click();
    await page.getByRole('dialog').getByLabel('Justificativa (opcional)').fill('Validado com o cliente na reunião');
    await page.getByRole('dialog').getByRole('button', { name: 'Enviar' }).click();
    await esperarAviso(page, 'Solicitação enviada');

    // Para quem pediu: aparece como "aguardando resposta"
    const minhas = await abrirPendencias(page);
    await expect(minhas.getByText('Seus pedidos aguardando resposta')).toBeVisible();
    await expect(minhas.getByText(/Aprovação de requisito/)).toBeVisible();
    await page.keyboard.press('Escape');

    // Para a gestão: no sino, com link para a tela de solicitações
    await entrar(page, c.gestor);
    const pend = await abrirPendencias(page);
    await expect(pend.getByText('Solicitações para responder')).toBeVisible();
    await pend.getByText(/Aprovação de requisito/).click();
    await expect(page).toHaveURL(/\/solicitations$/);

    const pedido = cartao(page, c.reqRascunho.titulo);
    await expect(pedido).toContainText('Validado com o cliente na reunião');
    await pedido.getByRole('button', { name: 'Atender' }).click();
    await page.getByRole('dialog').getByLabel('Resposta ao solicitante (opcional)').fill('Aprovado na próxima revisão');
    await page.getByRole('dialog').getByRole('button', { name: 'Atender' }).click();
    await esperarAviso(page, 'Solicitação atendida');

    // O stakeholder vê a resposta em "Atendidas"
    await entrar(page, c.convidado);
    await page.goto(rota.modulo(c, 'solicitations'));
    await page.getByRole('button', { name: 'Atendidas' }).click();
    await expect(cartao(page, c.reqRascunho.titulo)).toContainText('Aprovado na próxima revisão');
  });

  test('stakeholder não vê botões de responder e pode cancelar o próprio pedido', async ({ page }) => {
    await c.api.membro.ok('POST', `/projeto/${c.projetoA.id}/solicitacoes`,
      { tipo: 'ALTERACAO_REQUISITO', alvoId: c.reqAprovado.id, justificativa: 'Mudar a regra' });

    await entrar(page, c.membro);
    await page.goto(rota.modulo(c, 'solicitations'));
    const pedido = cartao(page, 'Mudar a regra');
    await expect(pedido).toBeVisible();
    await expect(pedido.getByRole('button', { name: 'Atender' })).toHaveCount(0);
    await expect(pedido.getByRole('button', { name: 'Recusar' })).toHaveCount(0);
    await pedido.getByRole('button', { name: 'Cancelar' }).click();
    await esperarAviso(page, 'Solicitação cancelada');
    await expect(cartao(page, 'Mudar a regra')).toHaveCount(0);
  });

  test('evento pedido fica aguardando e, recusado, aparece como recusado', async ({ page }) => {
    await entrar(page, c.convidado);
    await page.goto(rota.modulo(c, 'events'));
    await page.getByRole('button', { name: 'Solicitar Evento' }).click();
    const dialogo = page.getByRole('dialog');
    await dialogo.getByLabel('Nome do evento').fill('Workshop de validação');
    await dialogo.getByLabel('Data e hora de início').fill('2027-03-10T14:00');
    await dialogo.getByRole('button', { name: 'Criar' }).click();
    await esperarAviso(page, 'Evento solicitado ao gestor do projeto');
    await expect(cartao(page, 'Workshop de validação')).toContainText('Aguardando aprovação');

    await entrar(page, c.dono);
    await page.goto(rota.modulo(c, 'solicitations'));
    await cartao(page, 'Workshop de validação').getByRole('button', { name: 'Recusar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Recusar' }).click();
    await esperarAviso(page, 'Solicitação recusada');

    await entrar(page, c.convidado);
    await page.goto(rota.modulo(c, 'events'));
    await expect(cartao(page, 'Workshop de validação')).toContainText('Recusado');
  });

  test('exportação: stakeholder solicita, gestão atende e o download é liberado', async ({ page }) => {
    await entrar(page, c.membro);
    await page.goto(rota.modulo(c, 'data-model'));
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Solicitar' }).click();
    await esperarAviso(page, 'Exportação solicitada');

    await entrar(page, c.gestor);
    await page.goto(rota.modulo(c, 'solicitations'));
    await cartao(page, 'Exportação da modelagem de dados').getByRole('button', { name: 'Atender' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Atender' }).click();
    await esperarAviso(page, 'Solicitação atendida');

    await entrar(page, c.membro);
    await page.goto(rota.modulo(c, 'data-model'));
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    expect((await download).suggestedFilename()).toMatch(/^modelagem-.*\.csv$/);
  });
});
