import { expect, test, type Page } from '@playwright/test';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, esperarAviso, rota } from './support/ui';

/**
 * Organização: o que cada papel vê na lista de organizações e na tela da
 * organização (membros, convites, promover, remover) e o bloqueio de quem não participa.
 */
test.describe('Organização e membros', () => {
  let c: Cenario;

  test.beforeAll(async () => { c = await montarCenario('organizacao'); });
  test.afterAll(async () => { await desmontarCenario(c); });

  // Cartão da organização na lista (não o de convites, que também cita o nome)
  const cartaoDaOrg = (page: Page) => page.locator('.MuiCard-root', { hasText: c.org.nome }).filter({ hasText: 'Acessar' });
  const linhaDoMembro = (page: Page, email: string) => page.locator(`[data-membro="${email}"]`);

  test('lista de organizações mostra o papel e só as ações permitidas', async ({ page }) => {
    await entrar(page, c.dono);
    await expect(cartaoDaOrg(page)).toContainText('Você: Dono');
    await cartaoDaOrg(page).getByRole('button', { name: 'Mais opções' }).click();
    await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Inativar' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Gestor inativa, mas não edita (ORG_EDIT é só do Dono)
    await entrar(page, c.gestor);
    await expect(cartaoDaOrg(page)).toContainText('Você: Gestor');
    await cartaoDaOrg(page).getByRole('button', { name: 'Mais opções' }).click();
    await expect(page.getByRole('menuitem', { name: 'Inativar' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Editar' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await entrar(page, c.membro);
    await expect(cartaoDaOrg(page)).toContainText('Você: Membro');
    await expect(cartaoDaOrg(page).getByRole('button', { name: 'Mais opções' })).toHaveCount(0);

    await entrar(page, c.convidado);
    await expect(cartaoDaOrg(page)).toContainText('Convidado em projetos');
  });

  test('quem não participa não vê a organização nem abre pela URL', async ({ page }) => {
    await entrar(page, c.estranho);
    await expect(page.getByText('Suas Organizações')).toBeVisible();
    await expect(cartaoDaOrg(page)).toHaveCount(0);

    await page.goto(rota.organizacao(c));
    await expect(page.getByText('Você não tem acesso a esta organização')).toBeVisible();
    await page.goto(rota.projetos(c));
    await expect(page.getByText('Você não tem acesso a esta organização')).toBeVisible();
  });

  test('Dono vê membros, convida e cancela convite', async ({ page }) => {
    await entrar(page, c.dono);
    await page.goto(rota.projetos(c));
    await page.getByRole('button', { name: 'Organização e membros' }).click();
    await expect(page).toHaveURL(new RegExp(`${rota.organizacao(c)}$`));

    for (const p of [c.dono, c.gestor, c.membro]) await expect(linhaDoMembro(page, p.email)).toBeVisible();
    await expect(linhaDoMembro(page, c.convidado.email)).toHaveCount(0); // convidado é só do projeto
    await expect(linhaDoMembro(page, c.dono.email)).toContainText('Dono');
    await expect(linhaDoMembro(page, c.dono.email).getByRole('button', { name: 'Remover da organização' })).toHaveCount(0);
    await expect(linhaDoMembro(page, c.gestor.email).getByRole('button', { name: 'Remover da organização' })).toBeVisible();
    await expect(linhaDoMembro(page, c.membro.email).getByRole('button', { name: 'Elevar a Gestor da organização' })).toBeVisible();
    await expect(linhaDoMembro(page, c.gestor.email).getByRole('button', { name: 'Elevar a Gestor da organização' })).toHaveCount(0);

    const emailNovo = `novo.ui.${c.tag}@exemplo.com`;
    await page.getByRole('button', { name: 'Convidar' }).click();
    await page.getByRole('dialog').getByLabel('E-mail').fill(emailNovo);
    await page.getByRole('dialog').getByRole('button', { name: 'Convidar' }).click();
    await esperarAviso(page, 'Convite enviado');
    const chip = page.locator('.MuiChip-root', { hasText: emailNovo });
    await expect(chip).toBeVisible();

    await chip.locator('.MuiChip-deleteIcon').click();
    await esperarAviso(page, 'Convite cancelado');
    await expect(chip).toHaveCount(0);
  });

  test('Gestor convida e promove, mas não remove; Membro só vê', async ({ page }) => {
    await entrar(page, c.gestor);
    await page.goto(rota.organizacao(c));
    await expect(page.getByRole('button', { name: 'Convidar' })).toBeVisible();
    await expect(linhaDoMembro(page, c.membro.email).getByRole('button', { name: 'Elevar a Gestor da organização' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remover da organização' })).toHaveCount(0);

    await entrar(page, c.membro);
    await page.goto(rota.organizacao(c));
    await expect(linhaDoMembro(page, c.dono.email)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convidar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Elevar a Gestor da organização' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remover da organização' })).toHaveCount(0);
  });

  test('convidado vê só o próprio projeto e não vê os membros', async ({ page }) => {
    await entrar(page, c.convidado);
    await page.goto(rota.organizacao(c));
    await expect(page.getByText('Seus projetos nesta organização')).toBeVisible();
    await expect(page.getByText(c.projetoA.nome)).toBeVisible();
    await expect(page.getByText(c.projetoB.nome)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Membros' })).toHaveCount(0);

    await page.goto(rota.projeto(c, c.projetoB.id));
    await expect(page.getByText('Você não tem acesso a este projeto')).toBeVisible();
  });

  test('Gestor eleva o Membro; Dono remove e a pessoa perde o acesso', async ({ page, browser }) => {
    await entrar(page, c.gestor);
    await page.goto(rota.organizacao(c));
    await linhaDoMembro(page, c.membro.email).getByRole('button', { name: 'Elevar a Gestor da organização' }).click();
    await esperarAviso(page, 'agora é Gestor da organização');
    await expect(linhaDoMembro(page, c.membro.email)).toContainText('Gestor');

    // A pessoa afetada, já logada em outro navegador, vê o papel novo sem sair
    const outro = await browser.newContext();
    const pagMembro = await outro.newPage();
    await entrar(pagMembro, c.membro);
    await expect(pagMembro.locator('.MuiCard-root', { hasText: c.org.nome })).toContainText('Você: Gestor');

    await entrar(page, c.dono);
    await page.goto(rota.organizacao(c));
    await linhaDoMembro(page, c.membro.email).getByRole('button', { name: 'Remover da organização' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remover' }).click();
    await esperarAviso(page, 'foi removido da organização');
    await expect(linhaDoMembro(page, c.membro.email)).toHaveCount(0);

    // Na próxima navegação o token dela é recusado, renovado, e o acesso some
    await pagMembro.goto(rota.projeto(c));
    await expect(pagMembro.getByText('Você não tem acesso a este projeto')).toBeVisible();
    await outro.close();
  });
});
