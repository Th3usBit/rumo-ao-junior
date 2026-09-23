// Manual de uso (manual/index.html): carrega, prints existem, links internos, busca, ampliação e acessibilidade.
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect, abrir } from './apoio';

const MANUAL = '/manual/index.html';
const capturas: Record<string, { largura: number; altura: number }> = JSON.parse(
  readFileSync(resolve(__dirname, '../../manual/img/capturas.json'), 'utf8')
);

test.describe('Manual de uso', () => {
  test('carrega com título, sumário e todas as seções', async ({ page }) => {
    await page.goto(MANUAL);
    await expect(page).toHaveTitle('Manual do Rumo ao Júnior');
    await expect(page.getByRole('heading', { level: 1, name: 'Manual do Rumo ao Júnior' })).toBeVisible();
    const secoes = await page.locator('main .secao h2').allTextContents();
    expect(secoes.length).toBeGreaterThanOrEqual(18);
    for (const titulo of ['Painel', 'Trilhas', 'Cronograma', 'Flashcards', 'Quiz', 'Simulado', 'Pomodoro', 'Diário', 'Recursos', 'Ajustes e backup']) {
      expect(secoes, `seção "${titulo}"`).toContain(titulo);
    }
  });

  test('todo print existe, carrega e tem width/height iguais aos da imagem', async ({ page, request }) => {
    await page.goto(MANUAL);
    const imagens = await page.locator('main img').evaluateAll((els) =>
      els.map((el) => {
        const img = el as HTMLImageElement;
        return { src: img.getAttribute('src')!, alt: img.alt, largura: Number(img.getAttribute('width')), altura: Number(img.getAttribute('height')) };
      })
    );
    expect(imagens.length).toBe(Object.keys(capturas).length);
    for (const img of imagens) {
      const nome = img.src.replace(/^img\//, '').replace(/\.webp$/, '');
      expect(capturas[nome], `${img.src} está em capturas.json`).toBeTruthy();
      expect([img.largura, img.altura], `dimensões de ${img.src}`).toEqual([capturas[nome].largura, capturas[nome].altura]);
      expect(img.alt.length, `texto alternativo de ${img.src}`).toBeGreaterThan(10);
      expect(img.alt.length, `texto alternativo curto em ${img.src}`).toBeLessThanOrEqual(150);
      const resposta = await request.get(`/manual/${img.src}`);
      expect(resposta.status(), img.src).toBe(200);
    }
    // força o carregamento das imagens "lazy" (inclusive a que fica dentro de uma pergunta fechada)
    await page.locator('main img').evaluateAll((els) =>
      Promise.all(els.map((el) => { const img = el as HTMLImageElement; img.loading = 'eager'; return img.decode().catch(() => null); }))
    );
    const quebradas = await page.locator('main img').evaluateAll((els) => els.filter((el) => (el as HTMLImageElement).naturalWidth === 0).map((el) => el.getAttribute('src')));
    expect(quebradas).toEqual([]);
  });

  test('todo link interno (#âncora) aponta para um id que existe', async ({ page }) => {
    await page.goto(MANUAL);
    const quebrados = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')!.slice(1)).filter((id) => id && !document.getElementById(id))
    );
    expect(quebrados).toEqual([]);
  });

  test('sumário leva à seção e destaca onde você está', async ({ page, isMobile }) => {
    await page.goto(MANUAL);
    if (isMobile) {
      await page.getByText('Sumário', { exact: true }).click();
    }
    await page.getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Pomodoro' }).click();
    await expect(page).toHaveURL(/#pomodoro$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Pomodoro' })).toBeInViewport();
    if (!isMobile) {
      await expect(page.getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Pomodoro' })).toHaveAttribute('aria-current', 'true');
    }
  });

  test('busca encontra seções, inclusive sem acento', async ({ page, isMobile }) => {
    await page.goto(MANUAL);
    if (isMobile) await page.getByText('Sumário', { exact: true }).click();
    const busca = page.getByRole('searchbox', { name: 'Buscar no manual' });
    await busca.fill('reforco');
    const resultados = page.locator('#resultados-busca a');
    await expect(resultados.first()).toBeVisible();
    await busca.fill('xyzabc');
    await expect(page.locator('#resultados-busca')).toContainText('Nada encontrado');
    await busca.fill('importar backup');
    await resultados.filter({ hasText: 'Fazer e restaurar um backup' }).click();
    await expect(page).toHaveURL(/#fazer-backup$/);
    // no celular, escolher um resultado recolhe o sumário (e a busca junto)
    if (isMobile) {
      await expect(busca).toBeHidden();
      await page.getByText('Sumário', { exact: true }).click();
    }
    await busca.press('Escape');
    await expect(page.locator('#resultados-busca')).toBeHidden();
  });

  test('clicar num print amplia; Esc fecha e devolve o foco', async ({ page }) => {
    await page.goto(MANUAL);
    const botao = page.getByRole('button', { name: /Ampliar imagem: Painel com as áreas principais/ });
    await botao.click();
    const zoom = page.getByRole('dialog', { name: 'Imagem ampliada' });
    await expect(zoom).toBeVisible();
    await expect(zoom.locator('img')).toHaveAttribute('src', /img\/painel-visao-geral\.webp$/);
    await page.keyboard.press('Escape');
    await expect(zoom).toBeHidden();
    await expect(botao).toBeFocused();
  });

  test('sem violações WCAG 2.1 AA (axe-core) e sem rolagem lateral', async ({ page }) => {
    await page.goto(MANUAL);
    await page.locator('details').evaluateAll((els) => els.forEach((d) => ((d as HTMLDetailsElement).open = true)));
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const resumo = resultado.violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(resumo).toEqual([]);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra, 'a página não deve rolar na horizontal').toBeLessThanOrEqual(0);
  });

  test('o app tem o link "Manual de uso" no menu, abrindo em nova aba', async ({ page, request, isMobile }) => {
    await abrir(page, 'dashboard');
    if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).click();
    const link = page.getByRole('link', { name: /Manual de uso/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    const href = await link.getAttribute('href');
    expect((await request.get(`/${href}`)).status()).toBe(200);
  });
});
