import { expect, test } from '@playwright/test';
import { cadastrar, keycloak, psql, sufixo, tornarAdminDaPlataforma, type Pessoa } from './support/api';
import { entrar, esperarAviso } from './support/ui';

/** Área administrativa: acesso só do Admin da Plataforma, as quatro telas e a proteção dos status de sistema. */
test.describe('Área administrativa', () => {
  let tag: string;
  let admin: Pessoa;
  let comum: Pessoa;

  test.beforeAll(async () => {
    tag = sufixo();
    admin = await cadastrar('admin', tag);
    comum = await cadastrar('comum', tag);
    await tornarAdminDaPlataforma(admin);
  });

  test.afterAll(async () => {
    for (const p of [admin, comum].filter(Boolean)) await keycloak('DELETE', `/users/${p.kc}`);
    psql(`delete from auditoria where usuario_id in (select id from usuario where email like '%.ui.${tag}@exemplo.com')
      or entidade_id in (select id from usuario where email like '%.ui.${tag}@exemplo.com')`);
    psql(`delete from prioridade where codigo = 'E2E_${tag.toUpperCase()}'`);
    psql(`delete from usuario where email like '%.ui.${tag}@exemplo.com'`);
  });

  test('sem sessão, /admin pede login e volta para a área depois', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
    await page.getByLabel('E-mail').fill(admin.email);
    await page.getByLabel('Senha', { exact: true }).fill(admin.senha);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  });

  test('quem não é admin vê "sem acesso" e não tem o item no menu', async ({ page }) => {
    await entrar(page, comum);
    await page.getByRole('button', { name: comum.nome }).click();
    await expect(page.getByRole('menuitem', { name: 'Área administrativa' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.goto('/admin/usuarios');
    await expect(page.getByText('Você não tem acesso a esta área')).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('admin navega pelas telas da área administrativa', async ({ page }) => {
    await entrar(page, admin);
    await page.getByRole('button', { name: admin.nome }).click();
    await page.getByRole('menuitem', { name: 'Área administrativa' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Usuários ativos')).toBeVisible();

    const menu = page.getByRole('navigation').getByRole('list', { name: 'Área administrativa' });
    await menu.getByRole('link', { name: 'Usuários' }).click();
    await expect(page.getByRole('heading', { name: 'Usuários', exact: true })).toBeVisible();
    await page.getByLabel('Buscar por nome ou e-mail').fill(tag);
    await expect(page.getByText(comum.email)).toBeVisible();

    await menu.getByRole('link', { name: 'Dados de referência' }).click();
    await expect(page.getByRole('heading', { name: 'Dados de referência' })).toBeVisible();

    await menu.getByRole('link', { name: 'Auditoria' }).click();
    await expect(page.getByRole('heading', { name: 'Auditoria administrativa' })).toBeVisible();

    await menu.getByRole('link', { name: 'Pesquisas' }).click();
    await expect(page.getByRole('heading', { name: 'Pesquisa do TCC' })).toBeVisible();
  });

  test('status de sistema: APROVADO não pode ser renomeado nem excluído', async ({ page }) => {
    await entrar(page, admin);
    await page.goto('/admin/dados-referencia');
    await page.getByRole('tab', { name: 'Status de requisito' }).click();

    const linha = page.locator('tr[data-nome="APROVADO"]');
    await expect(linha.getByText('Sistema')).toBeVisible();
    await expect(linha.getByRole('button', { name: 'Excluir APROVADO' })).toBeDisabled();

    await linha.getByRole('button', { name: 'Editar APROVADO' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByLabel('Nome')).toBeDisabled();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
  });

  test('nova prioridade aparece na lista e na auditoria administrativa', async ({ page }) => {
    const codigo = `E2E_${tag.toUpperCase()}`;
    await entrar(page, admin);
    await page.goto('/admin/dados-referencia');
    await page.getByRole('tab', { name: 'Prioridades' }).click();
    await page.getByRole('button', { name: 'Nova prioridade' }).click();
    const dialogo = page.getByRole('dialog');
    await dialogo.getByLabel('Código').fill(codigo);
    await dialogo.getByLabel('Nome').fill('Prioridade e2e');
    await dialogo.getByRole('button', { name: 'Salvar' }).click();
    await esperarAviso(page, 'Prioridade criada');
    await expect(page.locator(`tr[data-nome="${codigo}"]`)).toBeVisible();

    await page.goto('/admin/auditoria');
    await expect(page.getByText(codigo).first()).toBeVisible();
    await expect(page.getByText(admin.nome).first()).toBeVisible();
  });
});
