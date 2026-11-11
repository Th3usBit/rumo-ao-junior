// Acessibilidade automática (axe-core, WCAG 2.1 AA) + checagens de teclado e foco.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, abrir, semearEstado } from './apoio';
import { estadoDeExemplo } from './exemplo';

const ROTAS = ['dashboard', 'trilhas', 'cronograma', 'flashcards', 'flashcards?aba=lista', 'quiz', 'simulado', 'simulado?desafio=front-cep', 'pomodoro', 'diario', 'recursos', 'ajustes'];

async function verificar(page, contexto: string) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const resumo = resultado.violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(resumo, `Violações de acessibilidade em ${contexto}`).toEqual([]);
}

test.describe('Acessibilidade (axe-core)', () => {
  for (const rota of ROTAS) {
    test(`página ${rota} sem violações WCAG 2.1 AA (com dados)`, async ({ page }) => {
      // a lista abre todos os cartões: sozinho leva ~15 s, com a suíte em paralelo passa de 45 s
      test.slow(rota === 'flashcards?aba=lista');
      await semearEstado(page, estadoDeExemplo());
      await abrir(page, rota);
      await page.locator('details').evaluateAll((els) => els.forEach((d) => ((d as HTMLDetailsElement).open = true)));
      await verificar(page, rota);
    });
  }

  test('estados interativos: flashcard revelado, questão respondida, simulado rodando e diálogo aberto', async ({ page }) => {
    test.slow(); // seis análises do axe em sequência
    await abrir(page, 'flashcards');
    await page.getByRole('button', { name: /Mostrar resposta/ }).click();
    await verificar(page, 'flashcard revelado');

    await abrir(page, 'quiz');
    await page.getByRole('button', { name: 'Começar' }).click();
    await page.keyboard.press('1');
    await page.getByRole('button', { name: 'Responder' }).click();
    await verificar(page, 'questão respondida');

    await abrir(page, 'simulado?desafio=live-senha');
    await page.getByRole('button', { name: 'Começar agora' }).click();
    await verificar(page, 'simulado rodando');
    await page.getByRole('button', { name: 'Terminei — avaliar' }).click();
    await verificar(page, 'diálogo de confirmação');
    await page.getByRole('dialog').getByRole('button', { name: 'Encerrar e avaliar' }).click();
    await verificar(page, 'autoavaliação');

    await abrir(page, 'pomodoro');
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await verificar(page, 'pomodoro rodando');
  });
});

test.describe('Teclado e foco', () => {
  test('dá para começar o plano só com o teclado e o foco é sempre visível', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Fluxo de teclado físico');
    await abrir(page);
    let alcancou = false;
    for (let i = 0; i < 40 && !alcancou; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const estilo = getComputedStyle(el);
        const classes = el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : '';
        const descricao = `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${classes}> "${(el.textContent || '').trim().slice(0, 30)}"`;
        return { texto: el.textContent?.trim() ?? '', descricao, contorno: estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) >= 2 };
      });
      expect(info.contorno, `Foco sem contorno visível em: ${info.descricao}`).toBe(true);
      alcancou = info.texto === 'Começar plano';
    }
    expect(alcancou, 'O botão "Começar plano" deve ser alcançável com Tab').toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Dia 1 de 42 do plano.')).toBeVisible();
  });

  test('diálogo prende o foco, fecha com Esc e devolve o foco a quem abriu', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Fluxo de teclado físico');
    await abrir(page, 'flashcards');
    const botao = page.getByRole('button', { name: 'Novo cartão' });
    await botao.focus();
    await page.keyboard.press('Enter');
    const dialogo = page.getByRole('dialog', { name: 'Novo flashcard' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByLabel('Pergunta')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(botao).toBeFocused();
  });

  test('gráfico de horas tem alternativa em tabela e colunas focáveis com nome', async ({ page }) => {
    await semearEstado(page, estadoDeExemplo());
    await abrir(page);
    const colunas = page.getByRole('img', { name: /^(segunda|terça|quarta|quinta|sexta|sábado|domingo)-feira|^(sábado|domingo), / });
    await expect(colunas).toHaveCount(7);
    await page.getByText('Ver como tabela').click();
    await expect(page.getByRole('table').getByRole('row')).toHaveCount(8); // cabeçalho + 7 dias
  });
});
