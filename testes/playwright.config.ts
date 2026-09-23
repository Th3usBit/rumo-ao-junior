// Configuração do Playwright para os testes de ponta a ponta do Rumo ao Júnior.
// Rode dentro da pasta `testes/`:  npm install  →  npm test
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'relatorio' }]],
  outputDir: 'resultados',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    channel: 'chrome', // usa o Google Chrome já instalado (não baixa navegador)
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1366, height: 900 } } },
    {
      name: 'celular',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
      // no celular rodamos só navegação, responsividade, acessibilidade e o manual
      testMatch: /(navegacao|responsivo|acessibilidade|visual|manual)\.spec\.ts/
    },
    {
      name: 'escuro',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1366, height: 900 }, colorScheme: 'dark' },
      testMatch: /(acessibilidade|visual|manual)\.spec\.ts/
    }
  ],
  // Sobe um servidor estático na pasta do projeto (um nível acima de testes/)
  webServer: {
    command: `npx serve -l ${PORTA} ..`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
