// Simulado, Pomodoro, Diário, Recursos e Ajustes/backup.
import fs from 'node:fs';
import { test, expect, abrir, lerEstado, avisos, confirmarDialogo, menu } from './apoio';

test.describe('Simulado', () => {
  test('filtros por área, nível e formato', async ({ page }) => {
    await abrir(page, 'simulado');
    const cards = page.locator('.desafio-card');
    await expect(cards).toHaveCount(17);
    await page.getByRole('button', { name: /^Front-end/ }).click();
    await expect(page.getByRole('button', { name: /^Front-end/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(cards).toHaveCount(5);
    await page.getByRole('button', { name: /^Núcleo comum/ }).click();
    await expect(cards).toHaveCount(4);
    await page.getByLabel('Formato').selectOption('live-coding');
    await expect(cards).toHaveCount(2);
    await expect(page.getByText('2 desafio(s)')).toBeVisible();
  });

  test('fluxo completo: iniciar (pausando o Pomodoro), pausar, retomar, encerrar e avaliar', async ({ page }) => {
    // Pomodoro rodando antes
    await abrir(page, 'pomodoro');
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await abrir(page, 'simulado');
    await page.locator('.desafio-card').filter({ hasText: 'Buscador de CEP com histórico' }).getByRole('link', { name: 'Ver desafio' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Buscador de CEP com histórico' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Como você será avaliado' })).toBeVisible();
    await expect(page.getByLabel('Duração (minutos)')).toHaveValue('90');
    await page.getByRole('button', { name: 'Começar agora' }).click();
    // o relógio do teste anda de verdade: numa máquina lenta o aviso (6 s) pode já ter sumido,
    // então confere o estado (Pomodoro pausado no menu) e aceita alguns segundos corridos
    await expect(page.getByRole('link', { name: /^Pomodoro: .*\(pausado\)$/ }).first()).toBeVisible();
    const timer = page.getByRole('timer', { name: 'Tempo restante' });
    await expect(timer).toHaveText(/1:(30:00|29:[0-5]\d)/);

    await page.clock.fastForward('10:00');
    await expect(timer).toHaveText(/1:(19|20):\d\d/);
    // o cronômetro é global: aparece no menu e no Painel
    await menu(page).getByRole('link', { name: 'Painel' }).click();
    await expect(page.getByText('Simulado em andamento:')).toBeVisible();
    await expect(page.locator('#indicadores-lateral')).toContainText('Simulado');
    await page.getByRole('link', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Pausar' }).click();
    const parado = await timer.textContent();
    await page.clock.fastForward('05:00');
    await expect(timer).toHaveText(parado!);
    await page.getByRole('button', { name: 'Retomar' }).click();

    await page.getByLabel('Rascunho e decisões (salvo automaticamente)').pressSequentially('Usar ViaCEP; tratar erro=true.');
    await page.getByRole('button', { name: 'Terminei — avaliar' }).click();
    await confirmarDialogo(page, 'Encerrar e avaliar');

    await expect(page.getByRole('heading', { level: 2, name: 'Buscador de CEP com histórico' })).toBeFocused();
    const criterios = page.getByRole('group', { name: 'Critérios de avaliação atendidos' }).getByRole('checkbox');
    await criterios.nth(0).check();
    await criterios.nth(1).check();
    await page.getByRole('radio', { name: '4 · Bom' }).check();
    await page.getByLabel('O que foi bem').fill('Estados de carregamento e erro.');
    await page.getByLabel('O que melhorar / estudar').fill('Máscara de CEP acessível.');
    await page.getByRole('button', { name: 'Salvar avaliação' }).click();
    await expect(avisos(page)).toContainText('Autoavaliação salva no histórico.');

    const historico = page.getByRole('region', { name: 'Histórico de simulados' });
    await expect(historico).toContainText('Buscador de CEP com histórico');
    await expect(historico).toContainText('Nota 4/5');
    const estado = await lerEstado(page);
    expect(estado.simulados.historico[0]).toMatchObject({ nota: 4, criteriosAtendidos: [0, 1], notasDuranteProva: 'Usar ViaCEP; tratar erro=true.' });
    expect(estado.sessoes.some((s: any) => s.origem === 'simulado' && s.minutos === 10)).toBe(true);
    expect(estado.diario['2026-09-28'].dificil).toContain('Máscara de CEP acessível.');
  });

  test('quando o tempo acaba, vai direto para a autoavaliação', async ({ page }) => {
    await abrir(page, 'simulado?desafio=live-senha');
    await page.getByRole('button', { name: 'Começar agora' }).click();
    await page.clock.fastForward('46:00');
    await expect(avisos(page)).toContainText('Tempo esgotado!');
    await expect(page.getByText(/\(tempo esgotado\)/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar avaliação' })).toBeVisible();
  });

  test('desistir descarta o simulado sem registrar nada', async ({ page }) => {
    await abrir(page, 'simulado?desafio=review-codigo');
    await page.getByRole('button', { name: 'Começar agora' }).click();
    await page.getByRole('button', { name: 'Desistir' }).click();
    await confirmarDialogo(page, 'Descartar');
    const estado = await lerEstado(page);
    expect(estado.simulados.ativo).toBeNull();
    expect(estado.simulados.historico).toHaveLength(0);
  });

  test('gabarito fica recolhido até você pedir', async ({ page }) => {
    await abrir(page, 'simulado?desafio=sql-ecommerce');
    const gabarito = page.locator('details').filter({ hasText: 'abra só depois de tentar' });
    await expect(gabarito).not.toHaveAttribute('open', '');
    await gabarito.locator('summary').click();
    await expect(gabarito.locator('pre.codigo').first()).toBeVisible();
  });
});

test.describe('Pomodoro', () => {
  test('foco de 25 min registra a sessão e inicia a pausa automaticamente', async ({ page }) => {
    await abrir(page, 'pomodoro');
    const timer = page.getByRole('timer', { name: 'Tempo restante' });
    await expect(timer).toHaveText('25:00');
    await page.getByLabel('No que você vai focar?').fill('Two Sum com HashMap');
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await expect(page).toHaveTitle(/^\d\d:\d\d Foco · Pomodoro · Rumo ao Júnior$/);
    await page.clock.fastForward('25:01');
    await expect(avisos(page)).toContainText('Pomodoro concluído! 25 min registrados.');
    await expect(page.getByRole('button', { name: 'Pausa curta' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
    await expect(page.getByText('1/4 até a pausa longa')).toBeVisible();
    const registros = page.getByRole('region', { name: 'Registros dos últimos 7 dias' });
    await expect(registros.getByRole('row', { name: /Pomodoro.*Two Sum com HashMap.*25 min/ })).toBeVisible();
    // fim da pausa: volta para foco, parado
    await page.clock.fastForward('05:01');
    await expect(avisos(page)).toContainText('Pausa encerrada');
    await expect(page.getByRole('button', { name: 'Iniciar foco' })).toBeVisible();
  });

  test('pular e zerar registram o foco parcial', async ({ page }) => {
    await abrir(page, 'pomodoro');
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await page.clock.fastForward('03:00');
    await page.getByRole('button', { name: 'Pular' }).click();
    await expect(avisos(page)).toContainText('Foco interrompido: 3 min registrados.');
    await page.getByRole('button', { name: 'Foco', exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await page.clock.fastForward('07:00');
    await page.getByRole('button', { name: 'Zerar' }).click();
    await confirmarDialogo(page, 'Zerar');
    await expect(avisos(page)).toContainText('7 min de foco registrados.');
    const minutos = (await lerEstado(page)).sessoes.map((s: any) => s.minutos).sort();
    expect(minutos).toEqual([3, 7]);
  });

  test('configurações: durações, pausa longa e voltar ao 25/5', async ({ page }) => {
    await abrir(page, 'pomodoro');
    await page.getByLabel('Foco (min)').fill('50');
    await page.getByLabel('Pausa curta', { exact: true }).fill('10');
    await page.getByLabel('Focos até a pausa longa').fill('1');
    await page.getByRole('button', { name: 'Salvar configurações' }).click();
    await expect(page.getByRole('timer', { name: 'Tempo restante' })).toHaveText('50:00');
    await page.getByRole('button', { name: 'Iniciar foco' }).click();
    await page.clock.fastForward('50:01');
    await expect(avisos(page)).toContainText('Hora da pausa longa.');
    await expect(page.getByRole('button', { name: 'Pausa longa' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Zerar' }).click();
    await confirmarDialogo(page, 'Zerar');
    await page.getByRole('button', { name: 'Voltar ao 25/5 clássico' }).click();
    await expect(page.getByRole('timer', { name: 'Tempo restante' })).toHaveText('25:00');
  });

  test('registro manual valida os campos e pode ser apagado', async ({ page }) => {
    await abrir(page, 'pomodoro');
    await page.getByLabel('Minutos').fill('');
    await page.getByRole('button', { name: 'Registrar tempo' }).click();
    // o campo é obrigatório: o navegador bloqueia o envio
    expect((await lerEstado(page)).sessoes ?? []).toHaveLength(0);
    await page.getByLabel('Minutos').fill('40');
    await page.getByLabel('O que você estudou').fill('Leitura do guia de JPA');
    await page.getByRole('button', { name: 'Registrar tempo' }).click();
    await expect(avisos(page)).toContainText('40 min registrados.');
    const registros = page.getByRole('region', { name: 'Registros dos últimos 7 dias' });
    await expect(registros.getByRole('row', { name: /Manual.*Leitura do guia de JPA.*40 min/ })).toBeVisible();
    await registros.getByRole('button', { name: /Apagar registro de 40 min/ }).click();
    await confirmarDialogo(page, 'Apagar');
    await expect(registros).toContainText('Nenhum registro ainda.');
  });
});

test.describe('Diário', () => {
  test('salva sozinho enquanto digita e com Ctrl+Enter', async ({ page }) => {
    await abrir(page, 'diario');
    await page.getByLabel('O que estudei hoje').pressSequentially('Two Sum e SM-2.');
    await expect(page.getByText(/^Salvo às \d\d:\d\d$/)).toBeVisible();
    const entrada = page.getByRole('article').filter({ hasText: 'segunda-feira, 28 de setembro de 2026' });
    await expect(entrada).toContainText('Two Sum e SM-2.');
    await page.getByLabel('O que ficou difícil').fill('Quando usar LEFT JOIN.');
    await page.keyboard.press('Control+Enter');
    await expect(avisos(page)).toContainText('Diário salvo.');
    await page.reload();
    await expect(page.getByLabel('O que ficou difícil')).toHaveValue('Quando usar LEFT JOIN.');
  });

  test('editar outro dia, buscar e excluir', async ({ page }) => {
    await abrir(page, 'diario');
    await page.getByLabel('O que estudei hoje').fill('Hoje: Git.');
    await page.getByRole('button', { name: /Salvar/ }).click();
    await page.getByLabel('Dia', { exact: true }).fill('2026-09-27');
    await expect(page.getByRole('heading', { name: /Editando — domingo, 27 de setembro/ })).toBeVisible();
    await expect(page.getByLabel('O que estudei hoje')).toHaveValue('');
    await page.getByLabel('O que estudei hoje').fill('Ontem: SQL.');
    await page.getByRole('button', { name: /Salvar/ }).click();
    await expect(page.getByRole('article')).toHaveCount(2);
    await page.getByRole('searchbox', { name: 'Buscar no diário' }).pressSequentially('sql');
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('searchbox', { name: 'Buscar no diário' }).fill('');
    const ontem = page.getByRole('article').filter({ hasText: 'domingo, 27 de setembro' });
    await ontem.getByRole('button', { name: /Excluir anotação/ }).click();
    await confirmarDialogo(page, 'Excluir');
    await expect(page.getByRole('article')).toHaveCount(1);
  });

  test('"o que ficou difícil" vira um flashcard pré-preenchido', async ({ page }) => {
    await abrir(page, 'diario');
    await page.getByLabel('O que ficou difícil').fill('Diferença entre 401 e 403');
    await page.getByRole('button', { name: /Transformar o "difícil" em flashcard/ }).click();
    const dialogo = page.getByRole('dialog', { name: 'Novo flashcard' });
    await expect(dialogo.getByLabel('Pergunta')).toHaveValue('Diferença entre 401 e 403');
    await dialogo.getByLabel('Resposta').fill('401 = não autenticado; 403 = autenticado, mas sem permissão.');
    await dialogo.getByRole('button', { name: 'Criar cartão' }).click();
    expect((await lerEstado(page)).flashcards.meus).toHaveLength(1);
  });
});

test.describe('Recursos', () => {
  test('busca, filtro de idioma e atalho para categoria', async ({ page }) => {
    await abrir(page, 'recursos');
    await expect(page.getByText(/138 links da pesquisa/)).toBeVisible();
    const cartoes = page.locator('a.recurso');
    await expect(cartoes).toHaveCount(138);
    await page.getByRole('searchbox', { name: 'Buscar recursos' }).pressSequentially('cep');
    await expect(cartoes.filter({ hasText: 'ViaCEP' })).toHaveCount(1);
    await page.getByRole('searchbox', { name: 'Buscar recursos' }).fill('');
    await page.getByRole('button', { name: 'Em português' }).click();
    await expect(page.getByRole('button', { name: 'Em português' })).toHaveAttribute('aria-pressed', 'true');
    const idiomas = await page.locator('a.recurso .selo').allTextContents();
    expect(idiomas.every((t) => t.startsWith('Português'))).toBe(true);
    await page.getByRole('button', { name: 'Todos' }).click();
    await page.getByRole('navigation', { name: 'Categorias' }).getByRole('link', { name: 'Testes' }).click();
    await expect(page.getByRole('heading', { level: 2, name: /^Testes/ })).toBeFocused();
    await expect(page.getByRole('heading', { level: 2, name: /^Testes/ })).toBeInViewport();
  });

  test('todos os links externos abrem em nova aba com rel="noopener noreferrer"', async ({ page }) => {
    await abrir(page, 'recursos');
    const links = page.locator('a.recurso');
    const n = await links.count();
    for (let i = 0; i < n; i++) {
      await expect(links.nth(i)).toHaveAttribute('target', '_blank');
      await expect(links.nth(i)).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(links.nth(i)).toHaveAttribute('href', /^https:\/\//);
    }
  });
});

test.describe('Ajustes e backup', () => {
  test('tema escuro persiste após recarregar e o botão do menu alterna', async ({ page }) => {
    await abrir(page, 'ajustes');
    await page.getByRole('radio', { name: 'Escuro' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Mudar para o tema claro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('plano: data da prova e limite de flashcards novos', async ({ page }) => {
    await abrir(page, 'ajustes');
    await page.getByLabel('Data da prova (opcional)').fill('2026-10-08');
    await page.getByLabel('Flashcards novos por dia').fill('5');
    await page.getByRole('button', { name: 'Salvar plano' }).click();
    await expect(avisos(page)).toContainText('Plano salvo.');
    await menu(page).getByRole('link', { name: 'Painel' }).click();
    await expect(page.getByText(/Faltam 10 dias para a prova\./)).toBeVisible();
    await menu(page).getByRole('link', { name: /^Flashcards/ }).click();
    await expect(page.getByRole('link', { name: /Todos os temas 5/ })).toBeVisible();
  });

  test('exportar, apagar tudo e importar o backup de volta', async ({ page }, testInfo) => {
    // gera algum progresso
    await abrir(page, 'flashcards');
    await page.keyboard.press('Space');
    await page.keyboard.press('3');
    await abrir(page, 'ajustes');
    await expect(page.getByText('Você ainda não exportou nenhum backup.')).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar backup (.json)' }).click();
    const arquivo = await download;
    expect(arquivo.suggestedFilename()).toBe('rumo-ao-junior-backup-2026-09-28.json');
    const caminho = testInfo.outputPath('backup.json');
    await arquivo.saveAs(caminho);
    const backup = JSON.parse(fs.readFileSync(caminho, 'utf8'));
    expect(backup.app).toBe('rumo-ao-junior');
    expect(Object.keys(backup.estado.flashcards.progresso)).toHaveLength(1);
    await expect(page.getByText(/Último backup exportado:/)).toBeVisible();

    await page.getByRole('button', { name: 'Apagar todo o progresso' }).click();
    await confirmarDialogo(page, 'Apagar tudo');
    expect(Object.keys((await lerEstado(page)).flashcards.progresso)).toHaveLength(0);

    const seletor = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Importar backup' }).click();
    await (await seletor).setFiles(caminho);
    await confirmarDialogo(page, 'Substituir e importar');
    await expect(avisos(page)).toContainText('Backup importado com sucesso.');
    expect(Object.keys((await lerEstado(page)).flashcards.progresso)).toHaveLength(1);
  });

  test('importar arquivo inválido mostra erro e não altera nada', async ({ page }, testInfo) => {
    await abrir(page, 'ajustes');
    for (const [nome, conteudo, mensagem] of [
      ['quebrado.json', '{ "config": ', 'o arquivo não é um JSON válido.'],
      ['outro.json', '{ "x": 1 }', 'não parece ser um backup do Rumo ao Júnior']
    ]) {
      const caminho = testInfo.outputPath(nome);
      fs.writeFileSync(caminho, conteudo);
      const seletor = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Importar backup' }).click();
      await (await seletor).setFiles(caminho);
      await expect(avisos(page)).toContainText(mensagem);
      await expect(page.getByRole('dialog')).toBeHidden();
    }
  });

  test('mostra a contagem do conteúdo carregado e nenhum problema nos dados', async ({ page }) => {
    await abrir(page, 'ajustes');
    const tabela = page.getByRole('region', { name: 'Conteúdo carregado' }).getByRole('table');
    await expect(tabela.getByRole('row', { name: 'Flashcards (arquivo) 241' })).toBeVisible();
    await expect(tabela.getByRole('row', { name: 'Questões de quiz 130' })).toBeVisible();
    await expect(tabela.getByRole('row', { name: 'Desafios de simulado 17' })).toBeVisible();
    await expect(page.getByText('Nenhum problema encontrado nos arquivos de dados.')).toBeVisible();
  });
});
