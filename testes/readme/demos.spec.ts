// =====================================================================
// demos.spec.ts — grava as demonstrações animadas do README.
// Regras: progresso ZERADO (como quem acabou de receber o projeto),
// interações reais e nenhum dado inventado. Os textos digitados vêm do
// próprio conteúdo (data/*.json). O relógio anda em tempo real; ele só é
// adiantado no Pomodoro e no Simulado, e a legenda avisa quando isso acontece.
// Saída: docs/readme/demo-*.svg
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';
import { Filme } from './filme';

const RAIZ = path.resolve(__dirname, '../..');
const SAIDA = path.join(RAIZ, 'docs/readme');
const ler = (rel: string) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const quiz = ler('data/quiz.json');
const cronograma = ler('data/cronograma.json');
const flashcards = ler('data/flashcards.json');
const dia1 = cronograma.semanas[0].dias[0];

// Mesmo critério dos testes: qualquer erro ou aviso no console reprova a gravação.
const test = base.extend<{ guarda: void }>({
  guarda: [
    async ({ page }, use) => {
      const erros: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning') erros.push(`[console.${m.type()}] ${m.text()}`);
      });
      page.on('pageerror', (e) => erros.push(`[exceção] ${e.message}`));
      await page.clock.install(); // hora real; só é adiantada onde a legenda diz
      await use();
      expect(erros, 'Não deve haver erros nem avisos no console').toEqual([]);
    },
    { auto: true }
  ]
});

const relatorio: string[] = [];
test.afterAll(() => {
  fs.writeFileSync(path.join(SAIDA, 'dados/demos.txt'), relatorio.join('\n') + '\n');
});

async function abrir(page: Page, rota: string) {
  await page.goto(`/#/${rota}`);
  await expect(page.locator('main h1')).toBeVisible();
  await page.addStyleTag({ content: '*{caret-color:transparent!important}' });
}

function gravar(filme: Filme) {
  const r = filme.salvar(SAIDA);
  relatorio.push(`demo-${filme.nome}.svg: ${r.quadros} quadros, ${r.kb} KB`);
}

const semMd = (s: string) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();
// chave de comparação: só letras e números (a tela não mostra crases, cercas de código nem quebras iguais ao JSON)
const chave = (s: string) => s.replace(/```[\w-]*/g, '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
function questaoNaTela(texto: string) {
  const alvo = chave(texto);
  const q = quiz.questoes.find((x: { enunciado: string }) => chave(x.enunciado) === alvo)
    ?? quiz.questoes.find((x: { enunciado: string }) => alvo.includes(chave(x.enunciado).slice(0, 60)));
  expect(q, `questão da tela encontrada em data/quiz.json: "${texto.slice(0, 80)}"`).toBeTruthy();
  return q;
}

test.describe.configure({ mode: 'serial' });

test('primeiro dia', async ({ page }) => {
  const filme = new Filme(page, 'primeiro-dia', 'Primeiro dia: do Painel vazio ao diagnóstico');
  await abrir(page, 'dashboard');
  await filme.quadro('Primeiro acesso: o Painel convida a começar o plano de 6 semanas.', page.getByRole('button', { name: 'Começar plano' }));
  await page.getByRole('button', { name: 'Começar plano' }).click();
  await expect(page.getByText(/Dia 1 de \d+ do plano/)).toBeVisible();
  await filme.quadro(`Plano iniciado: hoje é o Dia 1, e a próxima tarefa é "${dia1.tarefas[0].titulo}".`, page.getByRole('button', { name: 'Concluir' }));
  await page.getByRole('button', { name: 'Concluir' }).click();
  const acao = dia1.tarefas[1].acao;
  await expect(page.getByRole('link', { name: acao.rotulo })).toBeVisible();
  await filme.quadro('Concluir marca a tarefa no cronograma e já mostra a seguinte: o quiz diagnóstico.', page.getByRole('link', { name: acao.rotulo }));
  await page.getByRole('link', { name: acao.rotulo }).click();
  await expect(page.getByRole('button', { name: 'Começar' })).toBeVisible();
  await filme.quadro('O botão da tarefa abre o quiz já configurado: 20 questões misturadas, no modo prova.', page.getByRole('button', { name: 'Começar' }));
  await page.getByRole('button', { name: 'Começar' }).click();
  await expect(page.getByRole('button', { name: 'Finalizar prova' })).toBeVisible();
  await filme.quadro('Modo prova: cronômetro, navegador de questões e correção só no final.');
  gravar(filme);
});

test('flashcards', async ({ page }) => {
  const filme = new Filme(page, 'flashcards', 'Flashcards com repetição espaçada (SM-2)');
  await abrir(page, 'flashcards');
  const resposta = page.locator('.flashcard-resposta');
  await filme.quadro('A fila de hoje mostra só a pergunta: tente lembrar antes de ver a resposta.', 'Espaço');
  await page.keyboard.press(' ');
  await expect(resposta).toBeVisible();
  await filme.quadro('Espaço revela a resposta. Cada botão de nota já mostra quando o cartão volta; Bom = tecla 3.', page.locator('.nota-bom'));
  await page.keyboard.press('3');
  await expect(resposta).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await filme.quadro('Bom (tecla 3): o cartão volta amanhã, e o próximo aparece.', 'Espaço');
  await page.keyboard.press(' ');
  await expect(resposta).toBeVisible();
  await filme.quadro('Não lembrou? Errei (tecla 1) recomeça o cartão.', page.locator('.nota-errei'));
  await page.keyboard.press('1');
  await expect(resposta).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  // segue a fila de verdade até o cartão errado voltar como reforço
  const reforco = page.locator('.flashcard .selo', { hasText: 'Reforço' });
  for (let i = 0; i < 40 && !(await reforco.count()); i++) {
    await page.keyboard.press(' ');
    await expect(resposta).toBeVisible();
    await page.keyboard.press('3');
    await expect(resposta).toBeHidden();
  }
  await expect(reforco).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await filme.quadro('No fim da fila, o cartão errado volta como Reforço, no mesmo dia.', 'Espaço');
  await page.keyboard.press(' ');
  await page.keyboard.press('3');
  await expect(page.getByRole('heading', { name: 'Sessão concluída!' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await filme.quadro('Sessão concluída: o resumo mostra o que você revisou e quantos cartões vencem amanhã.');
  gravar(filme);
});

test('quiz', async ({ page }) => {
  const filme = new Filme(page, 'quiz', 'Quiz com correção e explicação');
  await abrir(page, 'quiz');
  await page.locator('#quiz-tema').selectOption('sql');
  await page.locator('#quiz-qtd').selectOption('5');
  await filme.quadro('Monte um quiz: tema, quantidade e modo. Aqui, 5 questões de SQL no modo treino.', page.getByRole('button', { name: 'Começar' }));
  await page.getByRole('button', { name: 'Começar' }).click();
  // descobre a questão na tela e escolhe uma alternativa ERRADA, de propósito
  const questao = questaoNaTela(await page.locator('#enunciado-atual').innerText());
  const errada = page.locator(`.alternativa:has(input:not([value="${questao.correta}"]))`).first();
  await filme.quadro('Uma questão real do banco, com as alternativas embaralhadas. Vamos errar de propósito.', errada);
  await errada.click();
  await page.getByRole('button', { name: 'Responder' }).click();
  await expect(page.locator('.alternativa.errada')).toBeVisible();
  await filme.quadro('A correção mostra a certa, a sua e a explicação de cada alternativa.', page.getByRole('button', { name: 'Transformar em flashcard' }));
  await page.getByRole('button', { name: 'Transformar em flashcard' }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await filme.quadro('O erro vira um flashcard seu, já preenchido com a pergunta e a resposta.', dialogo.getByRole('button', { name: /Criar/ }));
  await dialogo.getByRole('button', { name: /Criar/ }).click();
  await expect(dialogo).toBeHidden();
  // responde as outras 4 com a alternativa certa, também de verdade
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /Próxima/ }).click();
    const q = questaoNaTela(await page.locator('#enunciado-atual').innerText());
    await page.locator(`.alternativa:has(input[value="${q.correta}"])`).click();
    await page.getByRole('button', { name: 'Responder' }).click();
  }
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByRole('region', { name: 'Resultado' })).toBeVisible();
  await filme.quadro('Resultado: acertos por tema e atalhos para refazer os erros ou virar tudo em flashcards.');
  gravar(filme);
});

test('simulado', async ({ page }) => {
  const filme = new Filme(page, 'simulado', 'Simulado cronometrado com autoavaliação');
  await abrir(page, 'simulado');
  const card = page.locator('.desafio-card').filter({ hasText: 'Buscador de CEP com histórico' });
  await filme.quadro('Desafios no formato de testes técnicos reais, com área, formato, nível e tempo.', card.getByRole('link', { name: 'Ver desafio' }));
  await card.getByRole('link', { name: 'Ver desafio' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Buscador de CEP com histórico' })).toBeVisible();
  await filme.quadro('Cada desafio traz o contexto da empresa (fictícia), o enunciado, os requisitos e os critérios.');
  const comecar = page.getByRole('button', { name: 'Começar agora' });
  await filme.quadro('No fim do enunciado, escolha a duração e comece: o tempo sugerido vem preenchido.', comecar);
  await comecar.click();
  const cronometro = page.getByRole('timer', { name: 'Tempo restante' });
  await expect(cronometro).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await cronometro.scrollIntoViewIfNeeded();
  await filme.quadro('Cronômetro regressivo: ele aparece também no menu e continua se você trocar de página.');
  await page.clock.fastForward('52:00');
  const desafio = ler('data/desafios.json').desafios.find((d: { id: string }) => d.id === 'front-cep');
  await page.getByLabel('Rascunho e decisões (salvo automaticamente)').fill(`Requisitos:\n- ${desafio.requisitos.slice(0, 3).map(semMd).join('\n- ')}`);
  await filme.quadro('52 minutos depois (relógio adiantado na gravação): o rascunho guarda o plano e as decisões.', page.getByRole('button', { name: 'Terminei — avaliar' }));
  await page.getByRole('button', { name: 'Terminei — avaliar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Encerrar e avaliar' }).click();
  const criterios = page.getByRole('group', { name: 'Critérios de avaliação atendidos' }).getByRole('checkbox');
  await criterios.nth(0).check();
  await criterios.nth(1).check();
  await page.getByRole('radio', { name: '3 · Funciona, com ressalvas' }).check();
  await page.getByRole('group', { name: 'Critérios de avaliação atendidos' }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await filme.quadro('Autoavaliação: marque os critérios que um avaliador marcaria e dê uma nota de 1 a 5.', page.getByRole('button', { name: 'Salvar avaliação' }), { rolar: false });
  await page.getByRole('button', { name: 'Salvar avaliação' }).click();
  const tentativas = page.getByRole('heading', { name: 'Suas tentativas neste desafio' });
  await expect(tentativas).toBeVisible();
  await tentativas.scrollIntoViewIfNeeded();
  await filme.quadro('A tentativa fica salva com a nota e os critérios, e o tempo conta como horas estudadas.');
  gravar(filme);
});

test('pomodoro', async ({ page }) => {
  const filme = new Filme(page, 'pomodoro', 'Pomodoro que registra as horas estudadas');
  await abrir(page, 'pomodoro');
  const tarefa = dia1.tarefas[2].titulo;
  await page.getByLabel('No que você vai focar?').fill(tarefa);
  await filme.quadro(`Escolha no que focar (as sugestões vêm do cronograma) e inicie: "${tarefa}".`, page.getByRole('button', { name: 'Iniciar foco' }));
  await page.getByRole('button', { name: 'Iniciar foco' }).click();
  await page.clock.fastForward('00:05');
  await filme.quadro('25 minutos de foco: o tempo aparece no anel, no título da aba e no menu.');
  await page.clock.fastForward('12:00');
  await filme.quadro('12 minutos depois (relógio adiantado na gravação): o anel mostra quanto falta.');
  await page.clock.fastForward('13:00');
  await expect(page.locator('.relogio-fase')).toHaveText(/Pausa curta/);
  await filme.quadro('Fim do foco: os 25 minutos vão para "Seu tempo" e a pausa começa sozinha.', page.getByRole('link', { name: 'Painel' }).first());
  await page.getByRole('link', { name: 'Painel' }).first().click();
  await expect(page.locator('main h1')).toBeVisible();
  await filme.quadro('No Painel, as horas da semana e a sequência de dias já contam esse foco.');
  gravar(filme);
});

test('tour', async ({ page }) => {
  const filme = new Filme(page, 'tour', 'Trilhas, Cronograma, Diário, Recursos e Ajustes');
  await abrir(page, 'trilhas');
  const git = page.locator('#topico-nucleo-git');
  await git.locator('summary').click();
  await git.locator('label.check').first().click();
  await git.locator('summary').scrollIntoViewIfNeeded();
  await filme.quadro('Trilhas: cada tópico tem prioridade, links "Onde estudar", checklist e anotações.');
  await abrir(page, 'cronograma');
  await filme.quadro('Cronograma: 6 semanas, dia a dia, com tarefas marcáveis e botões que abrem a página certa.');
  await abrir(page, 'diario');
  const primeira = dia1.tarefas.find((t: { titulo: string }) => /Git/.test(t.titulo)) ?? dia1.tarefas[0];
  const cartao = flashcards.cartoes.find((c: { tema: string }) => c.tema === 'git');
  await page.getByLabel('O que estudei hoje').fill(primeira.titulo);
  await page.getByLabel('O que ficou difícil').fill(semMd(cartao.pergunta));
  await filme.quadro('Diário: o que estudou e o que ficou difícil. Salva sozinho e o "difícil" vira flashcard.');
  await abrir(page, 'recursos');
  await page.locator('#busca-recursos').fill('Spring');
  await filme.quadro('Recursos: links gratuitos da pesquisa, com busca e filtro por idioma.');
  await abrir(page, 'ajustes');
  await page.getByRole('region', { name: 'Conteúdo carregado' }).scrollIntoViewIfNeeded();
  await filme.quadro('Ajustes: metas, backup em .json e a validação do conteúdo carregado dos arquivos JSON.');
  gravar(filme);
});

test('tema', async ({ page }) => {
  const filme = new Filme(page, 'tema', 'Tema claro e escuro');
  await abrir(page, 'flashcards');
  await page.keyboard.press(' ');
  await expect(page.locator('.flashcard-resposta')).toBeVisible();
  await filme.quadro('Tema claro: o app segue o tema do sistema na primeira vez.', page.locator('#botao-tema'));
  await page.locator('#botao-tema').click();
  await filme.quadro('Um clique em "Tema escuro", no rodapé do menu, e todas as páginas mudam.', page.locator('#botao-tema'));
  await abrir(page, 'quiz');
  await filme.quadro('A escolha fica salva. Os contrastes seguem o WCAG AA nos dois temas.');
  gravar(filme);
});

test('celular', async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  const page = await contexto.newPage();
  const erros: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(e.message));
  const filme = new Filme(page, 'celular', 'No celular', { celular: true });
  await abrir(page, 'dashboard');
  await filme.quadro('O layout se adapta a telas pequenas; o menu vira uma gaveta.', page.getByRole('button', { name: 'Abrir menu' }));
  await page.getByRole('button', { name: 'Abrir menu' }).tap();
  const link = page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: /Flashcards/ });
  await expect(link).toBeVisible();
  await filme.quadro('A gaveta tem todas as páginas, o tema e o backup. Esc ou um toque fora fecha.', link);
  await link.tap();
  await expect(page.locator('.flashcard')).toBeVisible();
  await filme.quadro('O flashcard cabe na tela sem rolar.', page.getByRole('button', { name: /Mostrar resposta/ }));
  await page.getByRole('button', { name: /Mostrar resposta/ }).tap();
  await expect(page.locator('.flashcard-resposta')).toBeVisible();
  await filme.quadro('Os botões de nota têm alvo de toque confortável.');
  gravar(filme);
  expect(erros).toEqual([]);
  await contexto.close();
});
