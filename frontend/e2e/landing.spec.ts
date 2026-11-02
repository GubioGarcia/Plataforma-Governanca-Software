import { expect, test } from '@playwright/test';
import { cadastrar, keycloak, psql, sufixo, type Pessoa } from './support/api';
import { entrar } from './support/ui';

/** Landing pública: conteúdo, entradas, redirecionamentos e o ?next= seguro. */
test.describe('Landing', () => {
  let tag: string;
  let pessoa: Pessoa;

  test.beforeAll(async () => {
    tag = sufixo();
    pessoa = await cadastrar('landing', tag);
  });

  test.afterAll(async () => {
    if (!pessoa) return;
    await keycloak('DELETE', `/users/${pessoa.kc}`);
    psql(`delete from usuario where email like '%.ui.${tag}@exemplo.com'`);
  });

  test('abre sem login e sem chamar a API', async ({ page }) => {
    const chamadasApi: string[] = [];
    const erros: string[] = [];
    page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) chamadasApi.push(r.url()); });
    page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Gestão das fases iniciais/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Telas reais da plataforma' })).toBeVisible();
    await expect(page.getByText('Méndez Fernández et al., 2017', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Política de privacidade' }).scrollIntoViewIfNeeded();

    expect(chamadasApi).toEqual([]);
    expect(erros).toEqual([]);
  });

  test('os botões levam ao login e ao cadastro', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: 'Criar conta' }).click();
    await expect(page).toHaveURL(/\/cadastro$/);
    await expect(page.getByRole('button', { name: 'Criar conta' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

    await page.getByRole('link', { name: 'Voltar ao início' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('política de privacidade é pública', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Política de privacidade' }).click();
    await expect(page).toHaveURL(/\/privacidade$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeVisible();
  });

  test('área administrativa sem sessão pede login e guarda o destino', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Área administrativa' }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
  });

  test('usuário logado vai da landing e do login direto para a plataforma', async ({ page }) => {
    await entrar(page, pessoa);
    await page.goto('/');
    await expect(page).toHaveURL(/\/organizations$/);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/organizations$/);
    await page.goto('/cadastro');
    await expect(page).toHaveURL(/\/organizations$/);
  });

  for (const next of ['https://exemplo.com', '//exemplo.com', '/\\exemplo.com', 'javascript:alert(1)']) {
    test(`?next=${next} não redireciona para fora`, async ({ page }) => {
      await page.context().clearCookies();
      await page.goto(`/login?next=${encodeURIComponent(next)}`);
      await page.getByLabel('E-mail').fill(pessoa.email);
      await page.getByLabel('Senha', { exact: true }).fill(pessoa.senha);
      await page.getByRole('button', { name: 'Entrar' }).click();
      await expect(page).toHaveURL(/^http:\/\/[^/]+\/organizations$/);
    });
  }
});

