import { expect, test, type Page } from '@playwright/test';
import { cadastrar, keycloak, psql, sufixo, tornarAdminDaPlataforma, type Pessoa } from './support/api';
import { entrar, esperarAviso } from './support/ui';

/**
 * Pesquisa do TCC: o admin abre a coleta; o participante vê o modal "antes" no
 * primeiro login, depois o botão "Nos ajude a melhorar"; o admin vê o par completo
 * e exporta o CSV; a retirada no Meu Perfil apaga as respostas; a recusa não volta.
 *
 * Abre a coleta no banco compartilhado: roda no projeto "pesquisa" do Playwright,
 * depois dos demais arquivos, para o modal não aparecer para as contas deles.
 */
test.describe('Pesquisa do TCC', () => {
  test.describe.configure({ mode: 'serial' });

  let tag: string;
  let participante: Pessoa;
  let recusante: Pessoa;
  let celular: Pessoa;
  let admin: Pessoa;
  /** Pares completos já existentes no banco antes deste arquivo. */
  let paresAntes: number;

  test.beforeAll(async () => {
    tag = sufixo();
    [participante, recusante, celular, admin] = await Promise.all(
      ['participante', 'recusante', 'celular', 'admin'].map((a) => cadastrar(a, tag)));
    await tornarAdminDaPlataforma(admin);
    psql('update pesquisa_configuracao set coleta_aberta = false, intervalo_minimo_min = 15');
    paresAntes = Number(psql(`select count(*) from pesquisa_participacao p where p.situacao = 'PARTICIPANDO'
      and (select count(*) from pesquisa_resposta r where r.participacao_id = p.id) = 2`));
  });

  test.afterAll(async () => {
    psql('update pesquisa_configuracao set coleta_aberta = false, intervalo_minimo_min = 15');
    for (const p of [participante, recusante, celular, admin].filter(Boolean)) await keycloak('DELETE', `/users/${p.kc}`);
    const contas = `(select id from usuario where email like '%.ui.${tag}@exemplo.com')`;
    psql(`delete from pesquisa_participacao where usuario_id in ${contas}`);
    psql(`update pesquisa_configuracao set atualizado_por = null where atualizado_por in ${contas}`);
    psql(`delete from auditoria where usuario_id in ${contas}`);
    psql(`delete from usuario where email like '%.ui.${tag}@exemplo.com'`);
  });

  async function responderItens(page: Page, valores: number[]) {
    for (const [i, v] of valores.entries()) {
      await page.getByRole('radiogroup').nth(i).getByRole('radio').nth(v - 1).check();
    }
  }

  async function abrirPainel(page: Page) {
    await entrar(page, admin);
    await page.goto('/admin/pesquisas');
    await expect(page.getByRole('heading', { name: 'Pesquisa do TCC' })).toBeVisible();
  }

  function leitura(page: Page, rotulo: string) {
    return page.getByText(rotulo, { exact: true }).locator('xpath=../following-sibling::*[1]');
  }

  test('admin: abre a coleta com intervalo 0 e o admin não vê o questionário', async ({ page }) => {
    await abrirPainel(page);
    await expect(page.getByText('Encerrada', { exact: true })).toBeVisible();
    await page.getByLabel('Intervalo mínimo (min)').fill('0');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await esperarAviso(page, 'Intervalo mínimo atualizado.');
    await page.getByRole('button', { name: 'Abrir coleta' }).click();
    await page.getByRole('dialog', { name: 'Abrir a coleta?' }).getByRole('button', { name: 'Abrir coleta' }).click();
    await esperarAviso(page, 'Coleta aberta.');
    await expect(page.getByText('Aberta', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('antes: o modal abre no primeiro login, não fecha com Esc e registra as respostas', async ({ page }) => {
    await entrar(page, participante);
    const modal = page.getByRole('dialog', { name: 'Pesquisa do TCC — Discovery Platform' });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(`Respondendo como ${participante.nome} (${participante.email})`)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeVisible();

    const continuar = modal.getByRole('button', { name: 'Continuar' });
    await expect(continuar).toBeDisabled();
    await modal.getByLabel('Li e concordo em participar.').check();
    await continuar.click();

    await responderItens(page, [2, 2, 1, 3, 2]);
    await modal.getByRole('textbox').fill('=HYPERLINK("x") retrabalho por falta de registro');
    await continuar.click();

    await modal.getByLabel('Desenvolvedor(a)').check();
    await modal.getByLabel('6 a 10 anos').check();
    await modal.getByLabel('Jira').check();
    await modal.getByLabel('Outra', { exact: true }).last().check();
    await modal.getByLabel('Qual outra ferramenta?').fill('Notion');
    await modal.getByRole('button', { name: 'Enviar respostas' }).click();

    await expect(modal.getByText('Obrigado!')).toBeVisible();
    await modal.getByRole('button', { name: 'Fechar' }).click();
    await expect(modal).toBeHidden();
  });

  test('depois: o botão do cabeçalho abre a segunda etapa e conclui a participação', async ({ page }) => {
    await entrar(page, participante);
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.getByRole('button', { name: 'Nos ajude a melhorar' }).click();

    const modal = page.getByRole('dialog', { name: 'Nos ajude a melhorar' });
    await expect(modal.getByText('Nos ajude a melhorar: agora, avalie a plataforma.')).toBeVisible();
    await modal.getByRole('button', { name: 'Continuar' }).click();
    await responderItens(page, [5, 4, 5, 4, 5]);
    await modal.getByRole('button', { name: 'Enviar respostas' }).click();
    await expect(modal.getByText('Obrigado!')).toBeVisible();
    await modal.getByRole('button', { name: 'Fechar' }).click();

    await expect(page.getByRole('button', { name: 'Nos ajude a melhorar' })).toHaveCount(0);
  });

  test('admin: vê o par completo, a resposta aberta só com o código e exporta o CSV sem e-mail', async ({ page }) => {
    await abrirPainel(page);
    await expect(leitura(page, 'Pares completos')).toHaveText(String(paresAntes + 1));
    await expect(page.getByText('=HYPERLINK("x") retrabalho por falta de registro')).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const caminho = await (await download).path();
    const csv = (await import('node:fs')).readFileSync(caminho, 'utf-8');
    expect(csv).toContain('codigo;versao;funcao');
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).not.toContain(participante.email);
    expect(csv).not.toContain(participante.nome);
  });

  test('perfil: mostra o código e a retirada apaga as respostas', async ({ page }) => {
    await entrar(page, participante);
    await page.goto('/profile');
    await expect(page.getByText('Pesquisa do TCC')).toBeVisible();
    await expect(page.getByText('Concluída')).toBeVisible();
    await expect(page.getByText(/Código do participante: P-\d{3,}/)).toBeVisible();

    await page.getByRole('button', { name: 'Retirar minha participação' }).click();
    await page.getByRole('button', { name: 'Retirar e apagar' }).click();
    await esperarAviso(page, 'Participação retirada');
    await expect(page.getByText('Retirada', { exact: true })).toBeVisible();
    expect(psql(`select count(*) from pesquisa_resposta r join pesquisa_participacao p on p.id = r.participacao_id
      where p.usuario_id = '${participante.id}'`)).toBe('0');

    await abrirPainel(page);
    await expect(leitura(page, 'Pares completos')).toHaveText(String(paresAntes));
  });

  test('recusa: "Não quero participar" fecha o modal e ele não volta', async ({ page }) => {
    await entrar(page, recusante);
    const modal = page.getByRole('dialog', { name: 'Pesquisa do TCC — Discovery Platform' });
    await modal.getByRole('button', { name: 'Não quero participar' }).click();
    await page.getByRole('dialog', { name: 'Não participar da pesquisa?' })
      .getByRole('button', { name: 'Não quero participar' }).click();
    await expect(modal).toBeHidden();

    const situacao = page.waitForResponse((r) => r.url().endsWith('/api/pesquisa/situacao'));
    await page.reload();
    expect((await (await situacao).json()).estado).toBe('RECUSOU');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });

    test('o modal ocupa a tela e a segunda etapa fica no menu do usuário', async ({ page }) => {
      await entrar(page, celular);
      const modal = page.getByRole('dialog', { name: 'Pesquisa do TCC — Discovery Platform' });
      await modal.getByLabel('Li e concordo em participar.').check();
      await modal.getByRole('button', { name: 'Continuar' }).click();
      await responderItens(page, [3, 3, 3, 3, 3]);
      await modal.getByRole('button', { name: 'Continuar' }).click();
      await modal.getByLabel('Cliente ou stakeholder').check();
      await modal.getByLabel('Até 5 anos').check();
      await modal.getByRole('button', { name: 'Enviar respostas' }).click();
      await modal.getByRole('button', { name: 'Fechar' }).click();

      const largura = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(largura).toBeLessThanOrEqual(390);

      await expect(page.getByRole('button', { name: 'Nos ajude a melhorar' })).toBeHidden();
      await page.getByRole('button', { name: celular.nome }).click();
      await page.getByRole('menuitem', { name: /Nos ajude a melhorar/ }).click();
      await expect(page.getByRole('dialog', { name: 'Nos ajude a melhorar' })).toBeVisible();
    });
  });
});
