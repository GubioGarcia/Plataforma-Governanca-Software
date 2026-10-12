import { expect, type Page } from '@playwright/test';
import type { Pessoa } from './api';
import type { Cenario } from './cenario';

/**
 * Entra pela tela de login e espera a lista de organizações. Apaga antes o cookie
 * de sessão: permite trocar de pessoa na mesma aba.
 */
export async function entrar(page: Page, p: Pessoa): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(p.email);
  await page.getByLabel('Senha').fill(p.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/organizations$/);
}

/** Rotas do cenário. */
export const rota = {
  organizacao: (c: Cenario) => `/organizations/${c.org.id}`,
  projetos: (c: Cenario) => `/organizations/${c.org.id}/projects`,
  projeto: (c: Cenario, id = c.projetoA.id) => `/organizations/${c.org.id}/projects/${id}`,
  modulo: (c: Cenario, modulo: string, id = c.projetoA.id) => `/organizations/${c.org.id}/projects/${id}/${modulo}`,
  requisito: (c: Cenario, reqId: string) => `/organizations/${c.org.id}/projects/${c.projetoA.id}/requirements/${reqId}`,
};

/** Item do menu lateral do projeto. */
export function menuProjeto(page: Page, nome: string) {
  return page.getByRole('link', { name: nome, exact: true });
}

/** Espera a mensagem de sucesso/erro (snackbar) com o texto. */
export async function esperarAviso(page: Page, texto: string | RegExp): Promise<void> {
  await expect(page.getByRole('alert').filter({ hasText: texto }).first()).toBeVisible();
}
