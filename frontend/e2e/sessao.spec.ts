import { expect, test } from '@playwright/test';
import { cadastrar, keycloak, psql, sufixo, type Pessoa } from './support/api';
import { entrar } from './support/ui';

/** Sessão (Fase 5): login, sessão restaurada no F5, rota protegida e logout. */
test.describe('Sessão', () => {
  let tag: string;
  let pessoa: Pessoa;

  test.beforeAll(async () => {
    tag = sufixo();
    pessoa = await cadastrar('sessao', tag);
  });

  test.afterAll(async () => {
    if (!pessoa) return;
    await keycloak('DELETE', `/users/${pessoa.kc}`);
    psql(`delete from usuario where email like '%.ui.${tag}@exemplo.com'`);
  });

  test('sem sessão, qualquer rota leva ao login', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('senha errada mostra erro e não entra', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(pessoa.email);
    await page.getByLabel('Senha').fill('senhaErrada999');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('.MuiFormHelperText-root.Mui-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login entra, o F5 mantém a sessão e o logout encerra', async ({ page }) => {
    await entrar(page, pessoa);
    await expect(page.getByText('Suas Organizações')).toBeVisible();

    // F5: o token fica só em memória; a sessão volta pelo cookie HttpOnly de refresh
    await page.reload();
    await expect(page).toHaveURL(/\/organizations$/);
    await expect(page.getByText('Suas Organizações')).toBeVisible();

    const cookies = await page.context().cookies();
    const refresh = cookies.find((c) => c.name === 'plataforma_refresh');
    expect(refresh?.httpOnly).toBe(true);
    expect(refresh?.path).toBe('/api/auth');

    await page.getByRole('button', { name: pessoa.nome }).click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Depois do logout o F5 não restaura nada
    await page.goto('/organizations');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('usuário sem papel global não abre a tela de usuários', async ({ page }) => {
    await entrar(page, pessoa);
    await page.goto('/users');
    await expect(page).not.toHaveURL(/\/users$/);
  });
});
