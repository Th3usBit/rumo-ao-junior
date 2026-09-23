// Capturas de tela do manual, com marcações numeradas (laranja) sobre a interface.
// Cada número corresponde a um item da legenda no manual/index.html.
// Saída: manual/img/<nome>.webp + manual/img/capturas.json (dimensões).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { test, abrir, semearEstado } from '../e2e/apoio';
import { estadoDeExemplo } from '../e2e/exemplo';

const SAIDA = path.resolve(__dirname, '../../manual/img');
const MANIFESTO = path.join(SAIDA, 'capturas.json');
const QUINTA = new Date('2026-10-01T10:00:00-03:00'); // Dia 11 do plano de exemplo
fs.mkdirSync(SAIDA, { recursive: true });

const ESTILO = `
  .marca-manual { position: absolute; z-index: 2147483647; width: 28px; height: 28px; border-radius: 50%;
    background: #e8590c; color: #fff; font: 700 15px/28px "Segoe UI", system-ui, sans-serif; text-align: center;
    box-shadow: 0 0 0 3px #fff, 0 2px 8px rgba(0,0,0,.35); pointer-events: none; }
  .realce-manual { position: absolute; z-index: 2147483646; border: 2.5px solid #e8590c; border-radius: 9px; pointer-events: none; }
  .toasts { display: none !important; }
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
`;

type Alvo = string | Locator;

async function preparar(page: Page) {
  // volta ao topo: o menu lateral é sticky e só bate com as coordenadas do documento com a rolagem em 0
  await page.evaluate(() => {
    document.querySelectorAll('.marca-manual, .realce-manual').forEach((el) => el.remove());
    window.scrollTo(0, 0);
  });
  await page.addStyleTag({ content: ESTILO });
  await page.mouse.move(1, 1);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
}

/** Desenha um contorno e um número sobre cada alvo. */
async function marcar(page: Page, itens: Array<[Alvo, number]>, { realce = true } = {}) {
  for (const [alvo, n] of itens) {
    const loc = typeof alvo === 'string' ? page.locator(alvo).first() : alvo.first();
    await loc.waitFor({ state: 'visible' });
    await loc.evaluate(
      (el, { n, realce }) => {
        const r = el.getBoundingClientRect();
        const dialogo = el.closest('dialog[open]') as HTMLElement | null;
        let pai: HTMLElement = document.body;
        let ox = window.scrollX;
        let oy = window.scrollY;
        if (dialogo) {
          pai = dialogo;
          const d = dialogo.getBoundingClientRect();
          ox = -d.left + dialogo.scrollLeft;
          oy = -d.top + dialogo.scrollTop;
        }
        if (realce) {
          const caixa = document.createElement('div');
          caixa.className = 'realce-manual';
          Object.assign(caixa.style, { left: `${r.left + ox - 5}px`, top: `${r.top + oy - 5}px`, width: `${r.width + 10}px`, height: `${r.height + 10}px` });
          pai.appendChild(caixa);
        }
        const marca = document.createElement('div');
        marca.className = 'marca-manual';
        marca.textContent = String(n);
        // em campos de formulário o rótulo fica à esquerda: o número vai para o canto direito
        const campo = el.matches('input, select, textarea');
        const x = campo ? r.right + ox - 14 : r.left + ox - 16;
        Object.assign(marca.style, { left: `${x}px`, top: `${r.top + oy - 16}px` });
        pai.appendChild(marca);
      },
      { n, realce }
    );
  }
}

/** Retângulo (coordenadas do documento) que envolve todos os alvos, com margem. */
async function areaDe(page: Page, alvos: Alvo[], margem = 28) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const alvo of alvos) {
    const loc = typeof alvo === 'string' ? page.locator(alvo).first() : alvo.first();
    const r = await loc.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.left + window.scrollX, y: b.top + window.scrollY, w: b.width, h: b.height };
    });
    x1 = Math.min(x1, r.x); y1 = Math.min(y1, r.y); x2 = Math.max(x2, r.x + r.w); y2 = Math.max(y2, r.y + r.h);
  }
  const largura = await page.evaluate(() => document.documentElement.scrollWidth);
  const x = Math.max(0, Math.floor(x1 - margem));
  const y = Math.max(0, Math.floor(y1 - margem));
  return { x, y, width: Math.min(largura, Math.ceil(x2 + margem)) - x, height: Math.ceil(y2 + margem) - y };
}

/** Salva a captura como WebP (convertida pelo próprio Chrome) e registra as dimensões. */
async function salvar(page: Page, nome: string, clip?: { x: number; y: number; width: number; height: number }) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const png = await page.screenshot(clip ? { clip, fullPage: true } : {});
  const conversor = await page.context().newPage();
  const webp = await conversor.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.9).split(',')[1];
  }, png.toString('base64'));
  await conversor.close();
  fs.writeFileSync(path.join(SAIDA, `${nome}.webp`), Buffer.from(webp, 'base64'));
  const escala = page.viewportSize()!.width <= 500 ? 2 : 1.5;
  const tamanho = clip ? { largura: Math.round(clip.width), altura: Math.round(clip.height) } : { largura: page.viewportSize()!.width, altura: page.viewportSize()!.height };
  const manifesto = fs.existsSync(MANIFESTO) ? JSON.parse(fs.readFileSync(MANIFESTO, 'utf8')) : {};
  manifesto[nome] = { ...tamanho, escala, kb: Math.round(Buffer.from(webp, 'base64').length / 1024) };
  fs.writeFileSync(MANIFESTO, JSON.stringify(manifesto, null, 2));
}

async function comDados(page: Page, rota: string) {
  await page.clock.setSystemTime(QUINTA);
  await semearEstado(page, estadoDeExemplo());
  await abrir(page, rota);
}

test.describe.configure({ mode: 'serial' });

test('painel', async ({ page }) => {
  await comDados(page, 'dashboard');
  await preparar(page);
  await marcar(page, [
    ['#menu-lateral .nav-lista', 1],
    ['section[aria-label="Indicadores"]', 2],
    [page.getByRole('region', { name: 'Próxima tarefa' }), 3],
    ['#menu-lateral .lateral-rodape', 4],
    ['.cabecalho-pagina .linha', 5]
  ]);
  await salvar(page, 'painel-visao-geral');

  await preparar(page);
  const grafico = page.getByRole('region', { name: /Tempo estudado por dia/ });
  const trilhas = page.getByRole('region', { name: 'Progresso por trilha' });
  const fracos = page.getByRole('region', { name: 'Pontos fracos (quiz)' });
  const backup = page.getByRole('region', { name: 'Backup' });
  await marcar(page, [
    [grafico.locator('.colunas'), 1],
    [grafico.locator('summary'), 2],
    [trilhas.locator('.pilha'), 3],
    [fracos.locator('.lista-simples'), 4],
    [backup.getByRole('button'), 5]
  ]);
  await salvar(page, 'painel-detalhes', await areaDe(page, [grafico, trilhas, fracos, backup]));
});

test('painel no primeiro acesso', async ({ page }) => {
  await page.clock.setSystemTime(QUINTA);
  await abrir(page, 'dashboard');
  await preparar(page);
  const card = page.getByRole('region', { name: 'Comece seu plano de 6 semanas' });
  await marcar(page, [
    ['#data-inicio', 1],
    [page.getByRole('button', { name: 'Começar plano' }), 2],
    [page.getByRole('button', { name: /Começar na segunda/ }), 3],
    [card.locator('.faixa-info'), 4]
  ]);
  await salvar(page, 'painel-comecar', await areaDe(page, [card]));
});

test('trilhas', async ({ page }) => {
  await comDados(page, 'trilhas?trilha=nucleo&topico=nucleo-git');
  await preparar(page);
  const topico = page.locator('#topico-nucleo-git');
  await marcar(page, [
    [page.getByRole('navigation', { name: 'Trilhas' }), 1],
    ['.filtros', 2],
    [topico.locator('summary'), 3],
    [topico.locator('.lista-check li').nth(4), 4],
    [topico.locator('.lista-links'), 5],
    ['#nota-nucleo-git', 6]
  ]);
  await salvar(page, 'trilhas', await areaDe(page, [page.getByRole('navigation', { name: 'Trilhas' }), topico]));
});

test('cronograma', async ({ page }) => {
  await comDados(page, 'cronograma?semana=2');
  await preparar(page);
  const topo = page.locator('main .card.card-p').first();
  const semanas = page.getByRole('navigation', { name: 'Semanas do plano' });
  await marcar(page, [
    ['#cron-inicio', 1],
    ['#so-pendentes', 2],
    [semanas, 3]
  ]);
  await salvar(page, 'cronograma-topo', await areaDe(page, [topo, semanas, page.locator('#titulo-semana')]));

  await preparar(page);
  const hoje = page.locator('.dia-hoje');
  await marcar(page, [
    [hoje.locator('.dia-cabecalho'), 1],
    [hoje.locator('.tarefa label.check').first(), 2],
    [hoje.locator('.tarefa-detalhes a.btn').first(), 3],
    [hoje.locator('[data-acao="focar"]').first(), 4]
  ]);
  await salvar(page, 'cronograma-dia', await areaDe(page, [hoje]));
});

test('flashcards', async ({ page }) => {
  await comDados(page, 'flashcards');
  await preparar(page);
  await marcar(page, [
    [page.getByRole('navigation', { name: 'Modo' }), 1],
    [page.getByRole('navigation', { name: 'Filtrar por tema' }), 2],
    ['.sessao-progresso', 3],
    ['.flashcard-topo .linha .selo', 4],
    [page.getByRole('button', { name: /Mostrar resposta/ }), 5],
    [page.getByRole('button', { name: 'Novo cartão' }), 6]
  ]);
  await salvar(page, 'flashcards-pergunta', await areaDe(page, ['main .cabecalho-pagina', '.flashcard']));

  await page.getByRole('button', { name: /Mostrar resposta/ }).click();
  await preparar(page);
  await marcar(page, [
    ['.flashcard-resposta', 1],
    ['.nota-errei', 2],
    ['.nota-dificil', 3],
    ['.nota-bom', 4],
    ['.nota-facil', 5]
  ]);
  await salvar(page, 'flashcards-resposta', await areaDe(page, ['.flashcard']));

  await abrir(page, 'flashcards?aba=lista');
  await page.locator('details.cartao-lista').nth(0).locator('summary').click();
  await preparar(page);
  const primeiro = page.locator('details.cartao-lista').nth(0);
  await marcar(page, [
    ['#busca-cartoes', 1],
    [primeiro.locator('summary .selo').last(), 2],
    [primeiro.locator('.corpo p.mini'), 3],
    [primeiro.getByRole('button', { name: 'Reiniciar progresso' }), 4]
  ]);
  await salvar(page, 'flashcards-lista', await areaDe(page, ['#busca-cartoes', page.locator('details.cartao-lista').nth(2)]));

  await abrir(page, 'flashcards');
  await page.getByRole('button', { name: 'Novo cartão' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Novo flashcard' });
  await dialogo.getByLabel('Tema').selectOption('http');
  await dialogo.getByLabel('Pergunta').fill('O que significa um método HTTP ser **idempotente**?');
  await dialogo.getByLabel('Resposta').fill('Repetir a mesma requisição produz o mesmo efeito no servidor.\nEx.: `PUT` e `DELETE` são idempotentes; `POST` não.');
  await preparar(page);
  await marcar(page, [
    [dialogo.getByLabel('Tema'), 1],
    [dialogo.getByLabel('Pergunta'), 2],
    [dialogo.getByLabel('Resposta'), 3],
    [dialogo.getByRole('button', { name: 'Criar cartão' }), 4]
  ]);
  await salvar(page, 'flashcards-novo', await areaDe(page, [dialogo], 36));
});

test('quiz', async ({ page }) => {
  await comDados(page, 'quiz');
  await preparar(page);
  const form = page.getByRole('region', { name: 'Novo quiz' });
  await marcar(page, [
    ['#quiz-tema', 1],
    ['#quiz-qtd', 2],
    [form.locator('.opcoes'), 3],
    [form.locator('label.check'), 4],
    [form.getByRole('button', { name: 'Começar' }), 5]
  ]);
  await salvar(page, 'quiz-configurar', await areaDe(page, [form]));

  await preparar(page);
  const desempenho = page.getByRole('region', { name: 'Desempenho por tema' });
  await marcar(page, [
    [desempenho.locator('.barra-h').first(), 1],
    [desempenho.locator('.selo-critico').first(), 2],
    [desempenho.locator('summary'), 3]
  ]);
  await salvar(page, 'quiz-desempenho', await areaDe(page, [desempenho]));

  // treino: procura uma questão em que a 1ª alternativa esteja errada, para mostrar a correção completa
  await page.getByRole('button', { name: 'Começar' }).click();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('1');
    await page.getByRole('button', { name: 'Responder' }).click();
    if (await page.locator('.alternativa.errada').count()) break;
    await page.getByRole('button', { name: /Próxima|Ver resultado/ }).click();
  }
  await preparar(page);
  await marcar(page, [
    ['.alternativa.correta', 1],
    ['.alternativa.errada', 2],
    ['.quiz-card .faixa', 3],
    [page.getByRole('button', { name: 'Transformar em flashcard' }), 4],
    [page.getByRole('button', { name: /Próxima|Ver resultado/ }), 5]
  ]);
  await salvar(page, 'quiz-correcao', await areaDe(page, ['.quiz-card']));
});

test('quiz em modo prova', async ({ page }) => {
  await comDados(page, 'quiz?modo=prova&qtd=10');
  await page.getByRole('button', { name: 'Começar' }).click();
  for (const tecla of ['2', '1', '3']) {
    await page.keyboard.press(tecla);
    await page.getByRole('button', { name: /Próxima/ }).click();
  }
  await page.clock.fastForward(3 * 60 * 1000 + 17_000);
  await preparar(page);
  await marcar(page, [
    ['.cronometro-quiz', 1],
    ['.navegador-questoes', 2],
    [page.getByRole('button', { name: 'Finalizar prova' }), 3]
  ]);
  await salvar(page, 'quiz-prova', await areaDe(page, ['.quiz-card']));

  await page.getByRole('button', { name: 'Finalizar prova' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click();
  await preparar(page);
  const resultado = page.getByRole('region', { name: 'Resultado' });
  await marcar(page, [
    ['.valor-heroi', 1],
    [resultado.locator('.tabela-rolagem'), 2],
    [page.getByRole('button', { name: /Refazer as/ }), 3],
    [page.getByRole('button', { name: 'Criar flashcards dos erros' }), 4]
  ]);
  await salvar(page, 'quiz-resultado', await areaDe(page, [resultado]));
});

test('simulado', async ({ page }) => {
  await comDados(page, 'simulado');
  await preparar(page);
  const cards = page.locator('.desafio-card');
  await marcar(page, [
    [page.getByRole('navigation', { name: 'Filtrar por área' }), 1],
    ['#filtro-nivel', 2],
    [cards.first().locator('.linha').first(), 3],
    [cards.first().getByRole('link', { name: 'Ver desafio' }), 4]
  ]);
  await salvar(page, 'simulado-lista', await areaDe(page, [page.getByRole('navigation', { name: 'Filtrar por área' }), cards.nth(2)]));

  await abrir(page, 'simulado?desafio=front-cep');
  await preparar(page);
  const artigo = page.locator('.desafio-detalhe');
  await marcar(page, [
    [artigo.locator('.linha').first(), 1],
    [artigo.locator('blockquote.contexto'), 2],
    [artigo.locator('section').first(), 3]
  ]);
  const topo = await areaDe(page, [artigo.locator('.linha').first(), artigo.locator('section').first()]);
  await salvar(page, 'simulado-desafio', topo);

  await preparar(page);
  const iniciar = page.getByRole('region', { name: 'Iniciar simulado' });
  await marcar(page, [
    ['#duracao-sim', 1],
    [page.getByRole('button', { name: 'Começar agora' }), 2]
  ]);
  await salvar(page, 'simulado-iniciar', await areaDe(page, [iniciar]));

  await page.getByRole('button', { name: 'Começar agora' }).click();
  await page.clock.fastForward(17 * 60 * 1000 + 20_000);
  await page.getByLabel('Rascunho e decisões (salvo automaticamente)').fill('Plano: 1) formulário com máscara 2) ViaCEP 3) histórico no localStorage.\nDeixei a busca por endereço para depois.');
  await preparar(page);
  await marcar(page, [
    ['#indicadores-lateral .indicador', 1],
    ['.cronometro-grande', 2],
    [page.getByRole('button', { name: 'Pausar' }), 3],
    [page.getByRole('button', { name: 'Terminei — avaliar' }), 4],
    ['#notas-sim', 5]
  ]);
  await salvar(page, 'simulado-rodando', { x: 0, y: 0, width: 1280, height: 960 });

  await page.clock.fastForward(80 * 60 * 1000);
  await page.getByRole('button', { name: 'Salvar avaliação' }).waitFor();
  const criterios = page.getByRole('group', { name: 'Critérios de avaliação atendidos' }).getByRole('checkbox');
  for (const i of [0, 1, 2, 4, 5]) await criterios.nth(i).check();
  const requisitos = page.getByRole('group', { name: 'Requisitos obrigatórios que você entregou' }).getByRole('checkbox');
  for (const i of [0, 1, 2, 3]) await requisitos.nth(i).check();
  await page.getByRole('radio', { name: '4 · Bom' }).check();
  await page.getByLabel('O que foi bem').fill('Estados de carregamento e erro bem tratados; README com o passo a passo.');
  await page.getByLabel('O que melhorar / estudar').fill('Não deu tempo de escrever os testes do histórico.');
  await preparar(page);
  const criteriosGrupo = page.getByRole('group', { name: 'Critérios de avaliação atendidos' });
  await marcar(page, [
    [criteriosGrupo, 1],
    [page.getByRole('group', { name: 'Nota geral (autoavaliação)' }), 2],
    ['#av-melhorar', 3],
    [page.getByRole('button', { name: 'Salvar avaliação' }), 4]
  ]);
  await salvar(page, 'simulado-avaliacao', await areaDe(page, [criteriosGrupo, page.getByRole('button', { name: 'Salvar avaliação' })]));
});

test('pomodoro', async ({ page }) => {
  await comDados(page, 'pomodoro');
  await page.getByLabel('No que você vai focar?').fill('Group Anagrams + SQLBolt');
  await page.getByRole('button', { name: 'Iniciar foco' }).click();
  await page.clock.fastForward(8 * 60 * 1000 + 20_000);
  await preparar(page);
  await marcar(page, [
    ['.fases', 1],
    ['.relogio-anel', 2],
    ['.ciclos', 3],
    ['[data-acao="alternar"]', 4],
    ['#rotulo-pomodoro', 5],
    [page.getByRole('region', { name: 'Seu tempo' }).locator('.grafico'), 6]
  ]);
  await salvar(page, 'pomodoro', await areaDe(page, ['.pomodoro-grade']));

  await preparar(page);
  const manual = page.getByRole('region', { name: 'Estudou sem o timer? Registre' });
  const config = page.getByRole('region', { name: 'Configurações do timer' });
  await marcar(page, [
    ['#man-min', 1],
    [manual.getByRole('button', { name: 'Registrar tempo' }), 2],
    [config.locator('.linha-g').first(), 3],
    [config.locator('label.check').nth(1), 4],
    [config.getByRole('button', { name: 'Voltar ao 25/5 clássico' }), 5]
  ]);
  await salvar(page, 'pomodoro-registro', await areaDe(page, [manual, config]));
});

test('diario', async ({ page }) => {
  await comDados(page, 'diario');
  await page.getByLabel('O que estudei hoje').fill('SQL II: modelagem 1:N e N:N, índices e transação de empréstimo.');
  await page.getByLabel('O que ficou difícil').fill('Quando criar um índice composto e em que ordem colocar as colunas.');
  await page.getByLabel('Próximo passo').fill('Fazer a seção Aggregates do pgexercises.');
  await page.getByRole('button', { name: /Salvar/ }).click();
  await preparar(page);
  await marcar(page, [
    ['#diario-data', 1],
    ['#diario-dificil', 2],
    [page.getByRole('button', { name: /Salvar/ }), 3],
    [page.getByRole('button', { name: /Transformar o "difícil"/ }), 4],
    ['#busca-diario', 5]
  ]);
  await salvar(page, 'diario', await areaDe(page, ['#area-form', page.locator('.entrada-diario').first()]));
});

test('recursos', async ({ page }) => {
  await comDados(page, 'recursos');
  await preparar(page);
  await marcar(page, [
    ['#busca-recursos', 1],
    [page.getByRole('group', { name: 'Idioma' }), 2],
    [page.getByRole('navigation', { name: 'Categorias' }), 3],
    [page.locator('a.recurso').first(), 4]
  ]);
  await salvar(page, 'recursos', await areaDe(page, ['#busca-recursos', page.locator('a.recurso').nth(2)]));
});

test('ajustes', async ({ page }) => {
  await comDados(page, 'ajustes');
  await preparar(page);
  await marcar(page, [
    [page.getByRole('group', { name: 'Tema' }), 1],
    [page.locator('[data-form="plano"]'), 2],
    [page.getByRole('button', { name: 'Exportar backup (.json)' }), 3],
    [page.getByRole('button', { name: 'Importar backup' }), 4]
  ]);
  await salvar(page, 'ajustes', await areaDe(page, [page.getByRole('region', { name: 'Aparência' }), page.getByRole('region', { name: 'Backup do progresso' })]));

  await preparar(page);
  const dados = page.getByRole('region', { name: 'Conteúdo carregado' });
  const perigo = page.getByRole('region', { name: 'Zona de perigo' });
  await marcar(page, [
    [dados.locator('.tabela-rolagem'), 1],
    [dados.getByText('Nenhum problema encontrado nos arquivos de dados.'), 2],
    [perigo.getByRole('button'), 3]
  ]);
  await salvar(page, 'ajustes-dados', await areaDe(page, [dados, perigo]));
});

test('celular', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', baseURL: 'http://localhost:4174' });
  const page = await ctx.newPage();
  await page.clock.install({ time: QUINTA });
  await semearEstado(page, estadoDeExemplo());
  await abrir(page, 'dashboard');
  await preparar(page);
  await marcar(page, [['#botao-menu', 1]]);
  await salvar(page, 'celular-painel');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await preparar(page);
  await salvar(page, 'celular-menu');
  await ctx.close();
});

test('tema escuro', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, colorScheme: 'dark', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', baseURL: 'http://localhost:4174' });
  const page = await ctx.newPage();
  await page.clock.install({ time: QUINTA });
  await semearEstado(page, estadoDeExemplo());
  await abrir(page, 'flashcards');
  await page.getByRole('button', { name: /Mostrar resposta/ }).click();
  await preparar(page);
  await salvar(page, 'tema-escuro');
  await ctx.close();
});

test('avisos de problema', async ({ page, errosDoConsole }) => {
  await page.route('**/data/quiz.json', (rota) => rota.fulfill({ contentType: 'application/json', body: '{\n  "temas": [\n    { "id": "sql", "nome": "SQL" },\n  ],\n  "questoes": []\n}' }));
  await abrir(page, 'quiz');
  await preparar(page);
  await salvar(page, 'erro-json', await areaDe(page, [page.getByRole('alert').first()], 20));

  const pagina = await page.context().newPage();
  await pagina.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
  await pagina.addStyleTag({ content: ESTILO });
  await salvar(pagina, 'aviso-file', await areaDe(pagina, ['#aviso-protocolo .card'], 20));
  await pagina.close();
  errosDoConsole.length = 0; // erros esperados nesses cenários
});
