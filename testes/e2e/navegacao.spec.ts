import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect, abrir, menu } from './apoio';

const PAGINAS = [
  { link: 'Painel', h1: 'Painel de estudo', titulo: 'Painel' },
  { link: 'Trilhas', h1: 'Trilhas de estudo', titulo: 'Trilhas' },
  { link: 'Cronograma', h1: 'Cronograma de 6 semanas', titulo: 'Cronograma' },
  { link: /^Flashcards/, h1: 'Flashcards', titulo: 'Flashcards' },
  { link: 'Quiz', h1: 'Quiz', titulo: 'Quiz' },
  { link: 'Simulado', h1: 'Simulados', titulo: 'Simulado' },
  { link: 'Pomodoro', h1: 'Pomodoro', titulo: 'Pomodoro' },
  { link: 'Diário', h1: 'Diário de estudo', titulo: 'Diário' },
  { link: 'Recursos', h1: 'Recursos gratuitos', titulo: 'Recursos' },
  { link: 'Ajustes e backup', h1: 'Ajustes e backup', titulo: 'Ajustes e backup' }
];

async function abrirMenuSeCelular(page) {
  const botao = page.getByRole('button', { name: 'Abrir menu' });
  if (await botao.isVisible()) await botao.click();
}

test.describe('Navegação', () => {
  test('todas as páginas abrem pelo menu, com h1, título da aba e link ativo', async ({ page }) => {
    await abrir(page);
    for (const p of PAGINAS) {
      await abrirMenuSeCelular(page);
      await menu(page).getByRole('link', { name: p.link }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
      await expect(page).toHaveTitle(`${p.titulo} · Rumo ao Júnior`);
      // no celular a gaveta fecha ao navegar, por isso incluímos elementos ocultos
      const lateral = page.locator('#menu-lateral');
      await expect(lateral.getByRole('link', { name: p.link, includeHidden: true })).toHaveAttribute('aria-current', 'page');
      await expect(lateral.locator('[aria-current="page"]')).toHaveCount(1);
    }
  });

  test('botões voltar e avançar do navegador funcionam', async ({ page }) => {
    await abrir(page, 'quiz');
    await abrir(page, 'recursos');
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quiz');
    await page.goForward();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recursos gratuitos');
  });

  test('rota inexistente redireciona para o Painel', async ({ page }) => {
    await page.goto('/#/pagina-que-nao-existe');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Painel de estudo');
    await expect(page).toHaveURL(/#\/dashboard$/);
  });

  test('ao trocar de página o foco vai para o título (leitor de tela anuncia)', async ({ page }) => {
    await abrir(page);
    await abrirMenuSeCelular(page);
    await menu(page).getByRole('link', { name: 'Quiz' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  });

  test('link "Pular para o conteúdo" leva o foco ao conteúdo principal', async ({ page }) => {
    await abrir(page);
    await page.keyboard.press('Tab');
    const pular = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(pular).toBeFocused();
    await expect(pular).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#conteudo')).toBeFocused();
  });

  test('menu em gaveta no celular abre, fecha com Esc e fecha ao navegar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Só existe gaveta em telas pequenas');
    await abrir(page);
    const botao = page.getByRole('button', { name: 'Abrir menu' });
    await expect(menu(page)).toBeHidden();
    await botao.click();
    await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toBeHidden();
    await expect(botao).toBeFocused();
    await botao.click();
    await menu(page).getByRole('link', { name: 'Diário' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Diário de estudo');
    await expect(menu(page)).toBeHidden();
  });

  test('abrir pelo disco (file://) mostra a instrução de usar servidor local', async ({ page, errosDoConsole }) => {
    await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
    await expect(page.getByRole('heading', { name: 'Abra pelo servidor local' })).toBeVisible();
    await expect(page.getByText('Live Server').first()).toBeVisible();
    // Em file:// o navegador bloqueia o módulo JS (é exatamente o que o aviso explica): erro esperado
    const inesperados = errosDoConsole.filter((e) => !/CORS|file:|Failed to load/i.test(e));
    expect(inesperados).toEqual([]);
    errosDoConsole.length = 0;
  });
});
