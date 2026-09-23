// Utilitários compartilhados pelos testes.
import { test as base, expect, type Page } from '@playwright/test';

/** Segunda-feira, 28/09/2026, 10h (horário de Brasília) — datas determinísticas. */
export const AGORA = new Date('2026-09-28T10:00:00-03:00');
export const HOJE = '2026-09-28';

type Fixtures = { errosDoConsole: string[] };

/**
 * `test` com duas garantias automáticas em TODOS os testes:
 * 1. o relógio do navegador começa em AGORA (e segue correndo normalmente);
 * 2. o teste falha se aparecer erro/aviso no console ou exceção não tratada.
 */
export const test = base.extend<Fixtures>({
  errosDoConsole: [
    async ({ page }, use) => {
      const erros: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') erros.push(`[console.${msg.type()}] ${msg.text()}`);
      });
      page.on('pageerror', (erro) => erros.push(`[exceção] ${erro.message}`));
      await page.clock.install({ time: AGORA });
      await use(erros);
      expect(erros, 'Não deve haver erros nem avisos no console').toEqual([]);
    },
    { auto: true }
  ]
});

export { expect };

/** Abre uma rota do app (#/rota) e espera o título da página. */
export async function abrir(page: Page, rota = 'dashboard') {
  await page.goto(`/#/${rota}`);
  await expect(page.locator('main h1')).toBeVisible();
}

/** Lê o progresso salvo no localStorage. */
export async function lerEstado(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('rumo-junior:estado') || '{}'));
}

/** Grava um progresso inicial ANTES de o app carregar (útil para montar cenários). */
export async function semearEstado(page: Page, estado: Record<string, unknown>) {
  await page.addInitScript((valor) => {
    if (!sessionStorage.getItem('semeado')) {
      localStorage.setItem('rumo-junior:estado', JSON.stringify(valor));
      sessionStorage.setItem('semeado', '1');
    }
  }, estado);
}

/** Menu lateral principal. */
export function menu(page: Page) {
  return page.getByRole('navigation', { name: 'Principal' });
}

/** Área de avisos flutuantes (toasts). */
export function avisos(page: Page) {
  return page.locator('#avisos');
}

/** Confirma o diálogo aberto clicando no botão principal. */
export async function confirmarDialogo(page: Page, textoBotao: string | RegExp) {
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('button', { name: textoBotao }).click();
  await expect(dialogo).toBeHidden();
}
