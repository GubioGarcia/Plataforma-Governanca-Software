import { expect, test, type Page } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, menuProjeto, rota } from './support/ui';

/**
 * Matriz RBAC na interface: dentro do projeto, cada papel vê só as ações que pode
 * executar. Dono/Gestor da organização herdam o papel no projeto; o Membro herda
 * Stakeholder Técnico; o convidado é Técnico + Cliente.
 */
test.describe('Projeto — o que cada papel vê', () => {
  let c: Cenario;

  test.beforeAll(async () => { c = await montarCenario('papeis'); });
  test.afterAll(async () => { await desmontarCenario(c); });

  const papeis = () => [
    { quem: 'dono', pessoa: c.dono, chip: 'Dono', gestao: true },
    { quem: 'gestor', pessoa: c.gestor, chip: 'Gestor', gestao: true },
    { quem: 'membro', pessoa: c.membro, chip: 'Stakeholder Técnico', gestao: false },
    { quem: 'convidado', pessoa: c.convidado, chip: 'Stakeholder Técnico + Stakeholder Cliente', gestao: false },
  ];

  /** Visível (gestão) ou ausente/oculto (stakeholder). */
  async function soParaGestao(page: Page, gestao: boolean, alvo: ReturnType<Page['getByRole']>) {
    if (gestao) await expect(alvo).toBeVisible();
    else await expect(alvo).toBeHidden();
  }

  test('menu, papel no topo e visão geral', async ({ page }) => {
    for (const p of papeis()) {
      await test.step(p.quem, async () => {
        await entrar(page, p.pessoa);
        await page.goto(rota.projeto(c));
        await expect(page.getByText(c.projetoA.nome).first()).toBeVisible(); // nome real no menu lateral
        await expect(page.locator('header').getByText(p.chip, { exact: true })).toBeVisible(); // papel real no topo
        await expect(menuProjeto(page, 'Solicitações')).toBeVisible();
        await soParaGestao(page, p.gestao, menuProjeto(page, 'Auditoria'));
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Log completo' }));
        // Stakeholder vê a atividade pelas interações (não recebe 403 da auditoria)
        await expect(page.getByText('Atividade Recente')).toBeVisible();
        await expect(page.getByText('Nenhuma atividade registrada')).toHaveCount(0);
      });
    }
  });

  test('requisitos: criar só na gestão; aprovar x solicitar conforme o papel', async ({ page }) => {
    for (const p of papeis()) {
      await test.step(p.quem, async () => {
        await entrar(page, p.pessoa);
        await page.goto(rota.modulo(c, 'requirements'));
        await expect(page.getByText(c.reqRascunho.titulo).first()).toBeVisible();
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Novo Requisito' }));

        // Requisito em rascunho
        await page.goto(rota.requisito(c, c.reqRascunho.id));
        await expect(page.getByText(c.reqRascunho.titulo).first()).toBeVisible();
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Aprovar' }));
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Reprovar' }));
        const pedeAprovacao = page.getByRole('button', { name: 'Solicitar aprovação' });
        if (p.quem === 'convidado') await expect(pedeAprovacao).toBeVisible(); // só o Stakeholder Cliente
        else await expect(pedeAprovacao).toHaveCount(0);

        // Requisito aprovado: stakeholder pede alteração/reprovação; gestão só pode reprovar
        await page.goto(rota.requisito(c, c.reqAprovado.id));
        await expect(page.getByText(c.reqAprovado.titulo).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Aprovar' })).toHaveCount(0);
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Reprovar' }));
        await soParaGestao(page, !p.gestao, page.getByRole('button', { name: 'Solicitar alteração' }));
        await soParaGestao(page, !p.gestao, page.getByRole('button', { name: 'Solicitar reprovação' }));
      });
    }
  });

  test('eventos, arquivos, modelo de dados, wiki e stakeholders', async ({ page }) => {
    for (const p of papeis()) {
      await test.step(p.quem, async () => {
        await entrar(page, p.pessoa);

        await page.goto(rota.modulo(c, 'events'));
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Novo Evento' }));
        await soParaGestao(page, !p.gestao, page.getByRole('button', { name: 'Solicitar Evento' }));

        await page.goto(rota.modulo(c, 'files'));
        await expect(page.getByRole('heading', { name: 'Arquivos' })).toBeVisible();
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Enviar Arquivo' }));

        await page.goto(rota.modulo(c, 'data-model'));
        await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeVisible();
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Nova entidade' }).first());

        await page.goto(rota.modulo(c, 'wiki/objetivos'));
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Salvar' }));

        await page.goto(rota.modulo(c, 'stakeholders'));
        await expect(page.locator(`[data-participante="${c.dono.email}"]`)).toBeVisible();
        await soParaGestao(page, p.gestao, page.getByRole('button', { name: 'Convidar' }));
      });
    }
  });

  test('stakeholder que tenta exportar recebe a oferta de solicitar', async ({ page }) => {
    await entrar(page, c.membro);
    await page.goto(rota.modulo(c, 'data-model'));
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    await expect(page.getByRole('dialog', { name: 'Exportação não liberada' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  });

  test('gestão exporta direto (download do CSV)', async ({ page }) => {
    await entrar(page, c.gestor);
    await page.goto(rota.modulo(c, 'data-model'));
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    expect((await download).suggestedFilename()).toMatch(/^modelagem-.*\.csv$/);
  });
});
