// Responsividade: nenhuma página rola na horizontal e os alvos de toque têm tamanho mínimo.
import { test, expect, abrir, semearEstado } from './apoio';
import { estadoDeExemplo } from './exemplo';

const ROTAS = ['dashboard', 'trilhas', 'cronograma', 'flashcards', 'flashcards?aba=lista', 'quiz', 'simulado', 'simulado?desafio=review-codigo', 'pomodoro', 'diario', 'recursos', 'ajustes'];
const LARGURAS = [320, 375, 768, 1024, 1440];

test.describe('Responsividade', () => {
  for (const largura of LARGURAS) {
    test(`sem rolagem horizontal em ${largura}px`, async ({ page }) => {
      await semearEstado(page, estadoDeExemplo());
      await page.setViewportSize({ width: largura, height: 900 });
      for (const rota of ROTAS) {
        await abrir(page, rota);
        await page.locator('details').evaluateAll((els) => els.forEach((d) => ((d as HTMLDetailsElement).open = true)));
        const excesso = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(excesso, `#/${rota} rola na horizontal em ${largura}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('alvos de toque (botões, chips, abas, links do menu) têm pelo menos 24×24 px (WCAG 2.2)', async ({ page }) => {
    await semearEstado(page, estadoDeExemplo());
    await page.setViewportSize({ width: 375, height: 800 });
    const pequenos: string[] = [];
    for (const rota of ROTAS) {
      await abrir(page, rota);
      const achados = await page.evaluate(() =>
        Array.from(document.querySelectorAll('main .btn, main .chip, main .aba, main summary, main .alternativa, .topo .btn'))
          .filter((el) => (el as HTMLElement).offsetParent !== null)
          .map((el) => ({ texto: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30), r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width < 24 || r.height < 24)
          .map(({ texto, r }) => `${texto} (${Math.round(r.width)}×${Math.round(r.height)})`)
      );
      pequenos.push(...achados.map((a) => `#/${rota}: ${a}`));
    }
    expect(pequenos).toEqual([]);
  });

  test('no celular o flashcard aparece sem rolar (chips de tema em faixa horizontal)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrir(page, 'flashcards?tema=sql');
    await expect(page.getByRole('button', { name: /Mostrar resposta/ })).toBeInViewport();
    // o chip do tema escolhido fica visível dentro da faixa
    await expect(page.getByRole('navigation', { name: 'Filtrar por tema' }).getByRole('link', { name: /^SQL/ })).toBeInViewport();
  });

  test('no celular o conteúdo usa a largura toda e o menu vira gaveta', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await abrir(page);
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible();
    const larguraMain = await page.locator('main').evaluate((m) => m.getBoundingClientRect().width);
    expect(larguraMain).toBeGreaterThan(360);
  });
});
