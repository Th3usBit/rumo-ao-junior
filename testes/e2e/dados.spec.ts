// Robustez: o que acontece quando você edita um JSON e erra algo.
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, abrir, menu } from './apoio';

const DATA = path.resolve(__dirname, '../../data');

test.describe('Arquivos de dados editados à mão', () => {
  test('vírgula sobrando no JSON: aviso com arquivo, linha e coluna; o resto continua funcionando', async ({ page, errosDoConsole }) => {
    // quiz.json com uma vírgula a mais antes do "]" na linha 3
    await page.route('**/data/quiz.json', (rota) => rota.fulfill({ contentType: 'application/json', body: '{\n  "temas": [\n    { "id": "sql", "nome": "SQL" },\n  ],\n  "questoes": []\n}' }));
    await abrir(page, 'quiz');
    const alerta = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar alguns arquivos de dados.' });
    await expect(alerta).toBeVisible();
    await expect(alerta).toContainText(/JSON inválido em data\/quiz\.json \(linha 4, coluna 3\)/);
    await expect(page.getByText('O arquivo data/quiz.json não pôde ser carregado.')).toBeVisible();
    // outras páginas seguem funcionando
    await menu(page).getByRole('link', { name: /^Flashcards/ }).click();
    await expect(page.getByRole('button', { name: /Mostrar resposta/ })).toBeVisible();
    expect(errosDoConsole.every((e) => e.includes('quiz.json'))).toBe(true);
    errosDoConsole.length = 0; // erro esperado neste cenário
  });

  test('questão com índice "correta" inválido é ignorada e listada nos avisos', async ({ page, errosDoConsole }) => {
    const quiz = JSON.parse(fs.readFileSync(path.join(DATA, 'quiz.json'), 'utf8'));
    quiz.questoes[0].correta = 7;
    await page.route('**/data/quiz.json', (rota) => rota.fulfill({ contentType: 'application/json', body: JSON.stringify(quiz) }));
    await abrir(page, 'ajustes');
    await expect(page.getByRole('row', { name: 'Questões de quiz 129' })).toBeVisible();
    await page.getByText('1 aviso(s) de validação nos dados').click();
    await expect(page.getByText(/quiz\.json: questão "q-js-ts-001" inválida/)).toBeVisible();
    errosDoConsole.length = 0; // o aviso também vai para o console (console.warn), de propósito
  });

  test('ids duplicados geram aviso', async ({ page, errosDoConsole }) => {
    const fc = JSON.parse(fs.readFileSync(path.join(DATA, 'flashcards.json'), 'utf8'));
    fc.cartoes[1].id = fc.cartoes[0].id;
    await page.route('**/data/flashcards.json', (rota) => rota.fulfill({ contentType: 'application/json', body: JSON.stringify(fc) }));
    await abrir(page, 'ajustes');
    await page.getByText(/aviso\(s\) de validação nos dados/).click();
    await expect(page.getByText(`flashcards.json: id duplicado "${fc.cartoes[0].id}"`, { exact: false })).toBeVisible();
    errosDoConsole.length = 0;
  });

  test('arquivo ausente (404) mostra o status e a página correspondente explica', async ({ page, errosDoConsole }) => {
    await page.route('**/data/desafios.json', (rota) => rota.fulfill({ status: 404, body: 'não encontrado' }));
    await abrir(page, 'simulado');
    await expect(page.getByRole('alert')).toContainText('data/desafios.json respondeu com status 404.');
    await expect(page.getByText('O arquivo data/desafios.json não pôde ser carregado.')).toBeVisible();
    errosDoConsole.length = 0;
  });

  test('HTML dentro do conteúdo é exibido como texto (sem injeção de script)', async ({ page }) => {
    const fc = JSON.parse(fs.readFileSync(path.join(DATA, 'flashcards.json'), 'utf8'));
    fc.cartoes = [{ id: 'xss-1', tema: fc.temas[0].id, pergunta: '<img src=x onerror="window.__xss=1"> Pergunta', resposta: '<script>window.__xss=1</script>' }];
    await page.route('**/data/flashcards.json', (rota) => rota.fulfill({ contentType: 'application/json', body: JSON.stringify(fc) }));
    await abrir(page, 'flashcards');
    await expect(page.getByText('<img src=x onerror="window.__xss=1"> Pergunta')).toBeVisible();
    await page.getByRole('button', { name: /Mostrar resposta/ }).click();
    await expect(page.getByText('<script>window.__xss=1</script>')).toBeVisible();
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  });
});
