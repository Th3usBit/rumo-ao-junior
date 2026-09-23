// Flashcards (SM-2) e Quiz.
import { test, expect, abrir, lerEstado, avisos, confirmarDialogo, HOJE } from './apoio';

test.describe('Flashcards', () => {
  test('active recall: a resposta só aparece depois de revelar (clique ou Espaço)', async ({ page }) => {
    await abrir(page, 'flashcards');
    await expect(page.getByText('Resposta', { exact: true })).toBeHidden();
    await page.getByRole('button', { name: /Mostrar resposta/ }).click();
    await expect(page.getByRole('heading', { name: 'Resposta' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Como foi lembrar?' }).getByRole('button')).toHaveCount(4);
    await page.getByRole('button', { name: /^Bom/ }).click();
    await expect(page.getByText('Cartão 2 de 15')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('heading', { name: 'Resposta' })).toBeVisible();
  });

  test('SM-2: notas geram os intervalos corretos e "Errei" entra no reforço do dia', async ({ page }) => {
    await abrir(page, 'flashcards');
    // novo cartão: Bom → 1 dia
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: /^Bom/ })).toContainText('1 dia');
    await page.keyboard.press('3');
    // Errei → reinicia e volta hoje
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: /^Errei/ })).toContainText('reforço hoje');
    await page.keyboard.press('1');
    const estado = await lerEstado(page);
    const revisados = Object.values(estado.flashcards.progresso) as Array<{ intervalo: number; ef: number; proxima: string; lapsos: number }>;
    expect(revisados).toHaveLength(2);
    expect(revisados.every((c) => c.intervalo === 1 && c.proxima === '2026-09-29')).toBe(true);
    expect(revisados.filter((c) => c.lapsos === 1)).toHaveLength(1);
    expect(estado.flashcards.reforco).toEqual({ data: HOJE, ids: [expect.any(String)] });
    // a fila continua com 15 cartões: o errado voltou para o fim como reforço
    await expect(page.getByText('14 na fila')).toBeVisible();
  });

  test('ao terminar a fila mostra o resumo e permite estudar mais novos', async ({ page }) => {
    // limite de 2 novos por dia para chegar rápido ao fim
    await page.addInitScript(() => {
      if (!localStorage.getItem('rumo-junior:estado')) {
        localStorage.setItem('rumo-junior:estado', JSON.stringify({ config: { novosPorDia: 2 } }));
      }
    });
    await abrir(page, 'flashcards');
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Space');
      await page.keyboard.press('4');
    }
    await expect(page.getByRole('heading', { name: 'Sessão concluída!' })).toBeVisible();
    await expect(page.getByText(/Você revisou 2 cartão/)).toBeVisible();
    await page.getByRole('button', { name: 'Estudar mais 10 novos hoje' }).click();
    await expect(page.getByText('Cartão 1 de 10')).toBeVisible();
  });

  test('criar, validar, editar e excluir um cartão próprio', async ({ page }) => {
    await abrir(page, 'flashcards');
    await page.getByRole('button', { name: 'Novo cartão' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Novo flashcard' });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Criar cartão' }).click();
    await expect(dialogo.getByRole('alert')).toHaveText('Escreva a pergunta.');
    await dialogo.getByLabel('Tema').selectOption('http');
    await dialogo.getByLabel('Pergunta').fill('O que significa um método **idempotente**?');
    await dialogo.getByLabel('Resposta').fill('Repetir a requisição produz o mesmo efeito no servidor (ex.: `PUT`, `DELETE`).');
    await dialogo.getByRole('button', { name: 'Criar cartão' }).click();
    await expect(dialogo).toBeHidden();
    await expect(avisos(page)).toContainText('Cartão criado!');

    await page.getByRole('navigation', { name: 'Modo' }).getByRole('link', { name: /Todos os cartões/ }).click();
    await page.getByRole('searchbox', { name: 'Buscar cartões' }).pressSequentially('idempotente');
    const meu = page.locator('.selo', { hasText: /^Meu$/ });
    const cartao = page.locator('details.cartao-lista').filter({ has: meu });
    await expect(cartao).toHaveCount(1);
    await cartao.locator('summary').click();
    // o mini-markdown vira negrito e código
    await expect(cartao.locator('code', { hasText: 'PUT' })).toBeVisible();

    await cartao.getByRole('button', { name: 'Editar' }).click();
    const edicao = page.getByRole('dialog', { name: 'Editar cartão' });
    await edicao.getByLabel('Resposta').fill('O mesmo efeito, não importa quantas vezes.');
    await edicao.getByRole('button', { name: 'Salvar' }).click();
    expect((await lerEstado(page)).flashcards.meus[0].resposta).toBe('O mesmo efeito, não importa quantas vezes.');

    await page.locator('details.cartao-lista').filter({ has: meu }).locator('summary').click();
    await page.getByRole('button', { name: 'Excluir' }).click();
    await confirmarDialogo(page, 'Excluir');
    expect((await lerEstado(page)).flashcards.meus).toHaveLength(0);
  });

  test('busca na lista não embaralha o texto digitado e filtro por tema funciona', async ({ page }) => {
    await abrir(page, 'flashcards?aba=lista');
    const busca = page.getByRole('searchbox', { name: 'Buscar cartões' });
    await busca.pressSequentially('closure');
    await expect(busca).toHaveValue('closure');
    await expect(page.locator('details.cartao-lista').first()).toBeVisible();
    await busca.fill('');
    await page.getByRole('navigation', { name: 'Filtrar por tema' }).getByRole('link', { name: /^Git/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: /^Git/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /^Vue 3/ })).toHaveCount(0);
  });

  test('treino livre não altera o agendamento', async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem('rumo-junior:estado')) localStorage.setItem('rumo-junior:estado', JSON.stringify({ config: { novosPorDia: 0 } }));
    });
    await abrir(page, 'flashcards?tema=sql');
    await expect(page.getByRole('heading', { name: 'Nada para revisar agora' })).toBeVisible();
    await page.getByRole('button', { name: /Treino livre/ }).click();
    await expect(page.getByText(/Modo treino livre/)).toBeVisible();
    await page.keyboard.press('Space');
    await page.keyboard.press('1');
    expect(Object.keys((await lerEstado(page)).flashcards.progresso)).toHaveLength(0);
  });
});

test.describe('Quiz', () => {
  test('modo treino: correção imediata com explicação, resultado e histórico', async ({ page }) => {
    await abrir(page, 'quiz');
    await page.getByLabel('Quantidade de questões').selectOption('5');
    await page.getByRole('button', { name: 'Começar' }).click();
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByRole('heading', { name: `Questão ${i} de 5` })).toBeVisible();
      await page.keyboard.press('2'); // escolhe a 2ª alternativa pelo teclado
      await expect(page.getByRole('radio').nth(1)).toBeChecked();
      await page.getByRole('button', { name: 'Responder' }).click();
      await expect(page.getByText(/^(Correto!|Incorreto\.)$/)).toBeVisible();
      await expect(page.getByRole('radio').first()).toBeDisabled();
      await page.getByRole('button', { name: i < 5 ? /Próxima/ : 'Ver resultado' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Resultado' })).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Revisão das questões' })).toBeVisible();
    const estado = await lerEstado(page);
    expect(estado.quiz.tentativas).toHaveLength(1);
    expect(Object.values(estado.quiz.porTema).reduce((a: number, t: any) => a + t.total, 0)).toBe(5);
  });

  test('responder sem escolher mostra aviso', async ({ page }) => {
    await abrir(page, 'quiz');
    await page.getByRole('button', { name: 'Começar' }).click();
    await page.getByRole('button', { name: 'Responder' }).click();
    await expect(avisos(page)).toContainText('Escolha uma alternativa antes de responder.');
  });

  test('modo prova: sem correção antes do fim, navegação entre questões e tempo esgotado', async ({ page }) => {
    await abrir(page, 'quiz?modo=prova&qtd=5');
    await page.getByRole('button', { name: 'Começar' }).click();
    await expect(page.getByText(/^07:(30|29)$/)).toBeVisible(); // 5 questões × 1,5 min
    await page.keyboard.press('1');
    await page.getByRole('button', { name: /Próxima/ }).click();
    await page.keyboard.press('3');
    await expect(page.getByText(/^(Correto!|Incorreto\.)$/)).toHaveCount(0);
    const navegador = page.getByRole('navigation', { name: 'Ir para a questão' });
    await navegador.getByRole('button', { name: 'Questão 1 (respondida)' }).click();
    await expect(page.getByRole('heading', { name: 'Questão 1 de 5' })).toBeVisible();
    await expect(page.getByRole('radio').first()).toBeChecked();
    // avança o relógio além dos 7min30 da prova
    await page.clock.fastForward('08:00');
    await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible();
    await expect(avisos(page)).toContainText('Tempo esgotado!');
    await expect(page.getByText(/não respondidas: 3/)).toBeVisible();
  });

  test('finalizar prova com questões em branco pede confirmação', async ({ page }) => {
    await abrir(page, 'quiz?modo=prova&qtd=5');
    await page.getByRole('button', { name: 'Começar' }).click();
    await page.getByRole('button', { name: 'Finalizar prova' }).click();
    await expect(page.getByRole('dialog')).toContainText('Ainda há 5 questão(ões) sem resposta');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Questão 1 de 5' })).toBeVisible();
    await page.getByRole('button', { name: 'Finalizar prova' }).click();
    await confirmarDialogo(page, 'Finalizar');
    await expect(page.getByRole('heading', { name: 'Resultado' })).toBeVisible();
    await expect(page.locator('.valor-heroi')).toHaveText('0%');
  });

  test('erros viram flashcards e "Refazer as que errei" reinicia só com os erros', async ({ page }) => {
    await abrir(page, 'quiz?modo=prova&qtd=5');
    await page.getByRole('button', { name: 'Começar' }).click();
    await page.getByRole('button', { name: 'Finalizar prova' }).click();
    await confirmarDialogo(page, 'Finalizar');
    await page.getByRole('button', { name: 'Criar flashcards dos erros' }).click();
    await expect(avisos(page)).toContainText('5 flashcard(s) criado(s)');
    expect((await lerEstado(page)).flashcards.meus).toHaveLength(5);
    await page.getByRole('button', { name: /Refazer as 5 que errei/ }).click();
    await expect(page.getByRole('heading', { name: 'Questão 1 de 5' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Responder' })).toBeVisible(); // refazer é em modo treino
  });

  test('histórico mostra o desempenho por tema e a tabela equivalente', async ({ page }) => {
    await abrir(page, 'quiz?tema=git&qtd=5');
    await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('git');
    await page.getByRole('button', { name: 'Começar' }).click();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('1');
      await page.getByRole('button', { name: 'Responder' }).click();
      await page.getByRole('button', { name: /Próxima|Ver resultado/ }).click();
    }
    await page.getByRole('button', { name: 'Voltar ao início' }).click();
    const linhaGit = page.locator('.barra-h').filter({ has: page.getByRole('link', { name: 'Git', exact: true }) });
    await expect(linhaGit).toContainText(/\d+%/);
    await expect(linhaGit).toContainText(/Ponto fraco|Atenção|Bom/);
    await page.getByText('Ver como tabela').first().click();
    await expect(page.getByRole('table').first().getByRole('row', { name: /^Git/ })).toBeVisible();
  });
});
