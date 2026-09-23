// Grava as demonstrações animadas do README (docs/readme/demo-*.svg)
// usando o app de verdade, com progresso zerado e interações reais.
// Rode dentro de testes/:  npm run readme:demos
import { defineConfig } from '@playwright/test';

const PORTA = 4175;

export default defineConfig({
  testDir: './readme',
  testMatch: /demos\.spec\.ts/,
  workers: 1,
  timeout: 180_000,
  reporter: [['list']],
  outputDir: 'resultados-readme',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    channel: 'chrome',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  },
  webServer: {
    command: `npx serve -l ${PORTA} ..`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: true,
    timeout: 60_000
  }
});
