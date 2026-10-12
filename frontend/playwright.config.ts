import { defineConfig, devices } from '@playwright/test';

/**
 * Testes ponta a ponta da interface (e2e/) contra o ambiente Docker
 * (`docker compose up -d` em infrastructure/).
 *
 * Cada arquivo monta, pela API, o próprio cenário descartável (organização,
 * projeto e pessoas) e o apaga no fim — os arquivos rodam em paralelo sem
 * interferir entre si nem nos dados da demo.
 *
 *   npx playwright test            # todos, sem janela
 *   npx playwright test --headed   # vendo o navegador
 *   npx playwright test --ui       # modo interativo
 *   npx playwright show-report e2e-report
 */
export default defineConfig({
  testDir: './e2e',
  // Dentro de um arquivo os testes seguem em ordem (compartilham o cenário)
  fullyParallel: false,
  workers: process.env.CI ? 1 : 3,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } },
  ],
});
