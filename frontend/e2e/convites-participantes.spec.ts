import { expect, test, type Page } from '@playwright/test';
import { cadastrar, tornarAdminDaPlataforma, type Pessoa } from './support/api';
import { montarCenario, desmontarCenario, type Cenario } from './support/cenario';
import { entrar, esperarAviso, rota } from './support/ui';

/**
 * Convites recebidos (aceitar/recusar), participantes do projeto (promover/remover)
 * e perfil — com a revogação refletindo na tela de quem foi afetado.
 */
test.describe('Convites, participantes e perfil', () => {
  let c: Cenario;
  let novo: Pessoa;
  let recusa: Pessoa;

  test.beforeAll(async () => {
    c = await montarCenario('convites');
    novo = await cadastrar('novo', c.tag);
    recusa = await cadastrar('recusa', c.tag);
    c.extras.push(novo, recusa);
  });
  test.afterAll(async () => { await desmontarCenario(c); });

  // Cartão da organização na lista (não o de convites, que também cita o nome)
  const cartaoDaOrg = (page: Page) => page.locator('.MuiCard-root', { hasText: c.org.nome }).filter({ hasText: 'Acessar' });
  const participante = (page: Page, email: string) => page.locator(`[data-participante="${email}"]`);

  test('convite aparece no sino e na lista; ao aceitar a organização surge com o papel', async ({ page }) => {
    await c.api.dono.ok('POST', `/organizacao/${c.org.id}/convites`, { email: novo.email, papel: 'MEMBRO' });

    await entrar(page, novo);
    await expect(page.getByRole('button', { name: 'Pendências' }).locator('.MuiBadge-badge')).toHaveText('1');
    const convites = page.locator('.MuiCard-root', { hasText: 'Convites pendentes' });
    await expect(convites).toContainText(`Organização ${c.org.nome}`);
    await expect(cartaoDaOrg(page)).toHaveCount(0);

    await convites.getByRole('button', { name: 'Aceitar' }).click();
    await esperarAviso(page, 'Você agora participa de');
    await expect(cartaoDaOrg(page)).toContainText('Você: Membro');
  });

  test('convite recusado some e não dá acesso', async ({ page }) => {
    await c.api.dono.ok('POST', `/projeto/${c.projetoB.id}/convites`, { email: recusa.email, papel: 'STAKEHOLDER' });

    await entrar(page, recusa);
    const convites = page.locator('.MuiCard-root', { hasText: 'Convites pendentes' });
    await expect(convites).toContainText(`Projeto ${c.projetoB.nome}`);
    await convites.getByRole('button', { name: 'Recusar' }).click();
    await esperarAviso(page, 'Convite recusado');
    await expect(convites).toHaveCount(0);

    await page.goto(rota.projeto(c, c.projetoB.id));
    await expect(page.getByText('Você não tem acesso a este projeto')).toBeVisible();
  });

  test('participantes: herança da organização, promover e remover o convidado', async ({ page, browser }) => {
    await entrar(page, c.dono);
    await page.goto(rota.modulo(c, 'stakeholders'));

    // Papel repetido (direto e herdado) aparece uma vez só
    await expect(participante(page, c.dono.email).locator('.MuiChip-root', { hasText: /^Dono$/ })).toHaveCount(1);
    await expect(participante(page, c.membro.email)).toContainText('Stakeholder Técnico');
    // Papel herdado da organização não se remove pelo projeto
    await expect(participante(page, c.membro.email).getByRole('button', { name: 'Remover do projeto' })).toHaveCount(0);
    await expect(participante(page, c.convidado.email)).toContainText('Stakeholder Cliente');

    // O convidado, logado em outro navegador
    const outro = await browser.newContext();
    const pagConvidado = await outro.newPage();
    await entrar(pagConvidado, c.convidado);

    await participante(page, c.convidado.email).getByRole('button', { name: 'Elevar a Gestor do projeto' }).click();
    await esperarAviso(page, 'agora é Gestor do projeto');
    await expect(participante(page, c.convidado.email)).toContainText('Gestor');

    // Na próxima navegação o convidado já tem os botões de gestão
    await pagConvidado.goto(rota.modulo(c, 'requirements'));
    await expect(pagConvidado.getByRole('button', { name: 'Novo Requisito' })).toBeVisible();

    await participante(page, c.convidado.email).getByRole('button', { name: 'Remover do projeto' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remover' }).click();
    await esperarAviso(page, 'foi removido do projeto');
    await expect(participante(page, c.convidado.email)).toHaveCount(0);

    await pagConvidado.goto(rota.projeto(c));
    await expect(pagConvidado.getByText('Você não tem acesso a este projeto')).toBeVisible();
    await outro.close();
  });

  test('perfil mostra onde a pessoa atua e salva o nome', async ({ page }) => {
    await entrar(page, c.gestor);
    await page.getByRole('button', { name: c.gestor.nome }).click();
    await page.getByRole('menuitem', { name: 'Meu Perfil' }).click();

    await expect(page.getByText('Onde você atua')).toBeVisible();
    await expect(page.getByText(c.org.nome)).toBeVisible();
    await expect(page.getByText(c.projetoA.nome)).toBeVisible();

    const nomeNovo = `${c.gestor.nome} Editado`;
    await page.getByRole('button', { name: 'Editar perfil' }).click();
    await page.getByLabel('Nome completo').fill(nomeNovo);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await esperarAviso(page, 'Perfil atualizado');

    await page.reload(); // persistiu no backend, não só na tela
    await expect(page.getByRole('heading', { name: nomeNovo })).toBeVisible();
    c.gestor.nome = nomeNovo;
  });

  test('Admin da Plataforma abre a tela de usuários', async ({ page }) => {
    const admin = await cadastrar('admin', c.tag);
    c.extras.push(admin);
    await tornarAdminDaPlataforma(admin);

    await entrar(page, admin);
    await page.goto('/users');
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(c.dono.email)).toBeVisible();
  });
});
