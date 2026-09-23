// Capturas de tela das principais telas e estados, para revisão visual (UI/UX).
// Ficam em testes/prints/<projeto>/. Não são comparadas pixel a pixel: servem para olhar.
import path from 'node:path';
import { test, expect, abrir, semearEstado } from './apoio';
import { estadoDeExemplo } from './exemplo';

const QUINTA = new Date('2026-10-01T10:00:00-03:00'); // Dia 11 do plano de exemplo

test.describe('Capturas de tela', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setSystemTime(QUINTA);
    await semearEstado(page, estadoDeExemplo());
  });

  const salvar = (page, nome: string) =>
    page.screenshot({ path: path.join(__dirname, '..', 'prints', test.info().project.name, `${nome}.png`), fullPage: true });

  test('páginas com dados', async ({ page }) => {
    for (const rota of ['dashboard', 'trilhas', 'cronograma', 'flashcards', 'quiz', 'simulado', 'pomodoro', 'diario', 'recursos', 'ajustes']) {
      await abrir(page, rota);
      await expect(page.locator('main h1')).toBeVisible();
      await salvar(page, rota);
    }
  });

  test('estados de interação', async ({ page }) => {
    await abrir(page, 'trilhas?trilha=nucleo&topico=nucleo-git');
    await salvar(page, 'trilhas-topico-aberto');

    await abrir(page, 'flashcards');
    await page.getByRole('button', { name: /Mostrar resposta/ }).click();
    await salvar(page, 'flashcard-resposta');

    await page.getByRole('button', { name: 'Novo cartão' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Criar cartão' }).click();
    await salvar(page, 'dialogo-validacao');
    await page.keyboard.press('Escape');

    await abrir(page, 'quiz');
    await page.getByRole('button', { name: 'Começar' }).click();
    await page.keyboard.press('1');
    await page.getByRole('button', { name: 'Responder' }).click();
    await salvar(page, 'quiz-correcao');
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();

    await abrir(page, 'quiz?modo=prova&qtd=5');
    await page.getByRole('button', { name: 'Começar' }).click();
    await page.keyboard.press('2');
    await salvar(page, 'quiz-prova');
    await page.getByRole('button', { name: 'Finalizar prova' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click();
    await salvar(page, 'quiz-resultado');

    await abrir(page, 'simulado?desafio=front-cep');
    await salvar(page, 'simulado-detalhe');
    await page.getByRole('button', { name: 'Começar agora' }).click();
    await page.clock.fastForward('12:34');
    await salvar(page, 'simulado-rodando');
    await page.clock.fastForward(90 * 60 * 1000);
    await expect(page.getByRole('button', { name: 'Salvar avaliação' })).toBeVisible();
    await salvar(page, 'simulado-avaliacao');
    await page.getByRole('button', { name: 'Descartar sem salvar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Descartar' }).click();

    await abrir(page, 'pomodoro');
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await page.clock.fastForward('08:20');
    await salvar(page, 'pomodoro-rodando');
  });
});
