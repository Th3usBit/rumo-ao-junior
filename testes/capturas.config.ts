// Gera as capturas de tela do manual (manual/img/*.webp).
// Rode dentro de testes/:  npm run manual:capturas
import { defineConfig } from '@playwright/test';

const PORTA = 4174;

export default defineConfig({
  testDir: './manual',
  workers: 1,
  timeout: 90_000,
  reporter: [['list']],
  outputDir: 'resultados-capturas',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    channel: 'chrome',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
    colorScheme: 'light'
  },
  webServer: {
    command: `npx serve -l ${PORTA} ..`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: true,
    timeout: 60_000
  }
});
