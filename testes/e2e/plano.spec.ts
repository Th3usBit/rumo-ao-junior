// Painel, Trilhas e Cronograma.
import { test, expect, abrir, lerEstado, avisos, HOJE } from './apoio';

test.describe('Painel', () => {
  test('começar o plano define o Dia 1 e mostra a próxima tarefa', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('heading', { name: 'Comece seu plano de 6 semanas' })).toBeVisible();
    await expect(page.getByLabel('Data de início')).toHaveValue(HOJE);
    await page.getByRole('button', { name: 'Começar plano' }).click();
    await expect(page.getByText('Dia 1 de 42 do plano.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comece seu plano de 6 semanas' })).toBeHidden();
    expect((await lerEstado(page)).config.dataInicio).toBe(HOJE);
  });

  test('concluir a próxima tarefa avança o plano e mantém o foco no botão', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Começar plano' }).click();
    const proxima = page.getByRole('region', { name: 'Próxima tarefa' });
    await expect(proxima.getByRole('heading', { name: 'Perguntar o formato da prova ao RH/gestor' })).toBeVisible();
    await proxima.getByRole('button', { name: 'Concluir' }).click();
    await expect(avisos(page)).toContainText('Tarefa concluída');
    await expect(proxima.getByRole('heading', { name: /Diagnóstico: quiz misto/ })).toBeVisible();
    await expect(proxima.getByRole('button', { name: 'Concluir' })).toBeFocused();
    await expect(page.getByText(/1 de \d+ itens \(trilhas \+ cronograma\)/)).toBeVisible();
  });

  test('"Focar com Pomodoro" inicia o timer com o nome da tarefa', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Focar com Pomodoro' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pomodoro');
    await expect(page.getByLabel('No que você vai focar?')).toHaveValue('Perguntar o formato da prova ao RH/gestor');
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
    // indicador global do cronômetro no menu
    await expect(page.locator('#indicadores-lateral')).toContainText('Foco');
  });

  test('o botão da ação da tarefa leva ao quiz já configurado', async ({ page }) => {
    await abrir(page);
    await page.getByRole('button', { name: 'Começar plano' }).click();
    await page.getByRole('button', { name: 'Concluir' }).click();
    await page.getByRole('link', { name: 'Abrir o quiz diagnóstico' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quiz');
    await expect(page.getByLabel('Quantidade de questões')).toHaveValue('20');
    await expect(page.getByRole('radio', { name: /Prova cronometrada/ })).toBeChecked();
  });
});

test.describe('Trilhas', () => {
  test('troca de trilha pelas abas', async ({ page }) => {
    await abrir(page, 'trilhas');
    const abas = page.getByRole('navigation', { name: 'Trilhas' });
    for (const nome of ['Front-end', 'Back-end', 'Fullstack', 'Núcleo Comum']) {
      await abas.getByRole('link', { name: new RegExp(`^${nome}`) }).click();
      await expect(page.getByRole('heading', { level: 2, name: nome })).toBeVisible();
      await expect(abas.getByRole('link', { name: new RegExp(`^${nome}`) })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('marcar item do checklist atualiza o progresso e persiste após recarregar', async ({ page }) => {
    await abrir(page, 'trilhas?trilha=nucleo&topico=nucleo-git');
    const item = page.getByRole('checkbox', { name: 'Explicar working tree, staging area e commit' });
    await expect(item).toBeVisible();
    await item.check();
    await expect(item).toBeChecked();
    await expect(item).toBeFocused();
    await expect(page.locator('[data-contagem="nucleo-git"]')).toHaveText('1/8 itens');
    await expect(page.getByRole('navigation', { name: 'Trilhas' }).getByRole('link', { name: /Núcleo Comum 2%/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Explicar working tree, staging area e commit' })).toBeChecked();
  });

  test('anotações são salvas enquanto você digita', async ({ page }) => {
    await abrir(page, 'trilhas?trilha=nucleo&topico=nucleo-sql');
    const topico = page.locator('#topico-nucleo-sql');
    const nota = topico.getByLabel('Minhas anotações');
    await nota.pressSequentially('LEFT JOIN mantém as linhas da esquerda.');
    await expect(topico.getByText('Anotação salva.')).toBeVisible();
    expect((await lerEstado(page)).trilhas.notas['nucleo-sql']).toBe('LEFT JOIN mantém as linhas da esquerda.');
    await page.reload();
    await expect(page.locator('#topico-nucleo-sql').getByLabel('Minhas anotações')).toHaveValue('LEFT JOIN mantém as linhas da esquerda.');
  });

  test('busca, filtro de prioridade, ocultar concluídos e expandir/recolher', async ({ page }) => {
    await abrir(page, 'trilhas?trilha=back');
    const topicos = page.locator('details.topico');
    await expect(topicos).toHaveCount(8);
    const busca = page.getByRole('searchbox', { name: 'Buscar tópicos' });
    await busca.pressSequentially('N+1');
    await expect(busca).toHaveValue('N+1'); // o texto não se embaralha ao redesenhar a lista
    await expect(topicos).toHaveCount(1);
    await expect(topicos.first()).toContainText('Persistência: JPA, PostgreSQL e Flyway');
    await busca.fill('zzz-inexistente');
    await expect(page.getByText('Nenhum tópico encontrado com esses filtros.')).toBeVisible();
    await busca.fill('');
    await page.getByLabel('Prioridade').selectOption('media');
    await expect(topicos).toHaveCount(3);
    await page.getByLabel('Prioridade').selectOption('todas');
    await page.getByRole('button', { name: 'Expandir todos' }).click();
    await expect(page.locator('details.topico[open]')).toHaveCount(8);
    await page.getByRole('button', { name: 'Recolher todos' }).click();
    await expect(page.locator('details.topico[open]')).toHaveCount(0);
  });

  test('links de estudo abrem em nova aba com rel seguro', async ({ page }) => {
    await abrir(page, 'trilhas?trilha=nucleo&topico=nucleo-git');
    const link = page.locator('#topico-nucleo-git').getByRole('link', { name: /Learn Git Branching/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });
});

test.describe('Cronograma', () => {
  test('sem data de início, os dias aparecem sem datas; com data, mostra "Hoje"', async ({ page }) => {
    await abrir(page, 'cronograma');
    await expect(page.getByText('Defina a data de início para ver as datas de cada dia.')).toBeVisible();
    await page.getByLabel('Data de início (Dia 1)').fill(HOJE);
    await expect(page.getByText('Hoje é o Dia 1 (Semana 1).')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Dia 1 · seg, 28\/09/ })).toBeVisible();
    await expect(page.locator('.dia-hoje')).toHaveCount(1);
  });

  test('marcar tarefa, filtro "só pendentes" e navegação entre semanas', async ({ page }) => {
    await abrir(page, 'cronograma?semana=1');
    const tarefa = page.getByRole('checkbox', { name: /Perguntar o formato da prova ao RH\/gestor/ });
    await tarefa.check();
    await expect(avisos(page)).toContainText('Tarefa concluída!');
    await expect(tarefa).toBeChecked();
    await page.getByRole('checkbox', { name: 'Mostrar só pendentes' }).check();
    await expect(page.getByRole('checkbox', { name: /Perguntar o formato da prova/ })).toHaveCount(0);
    await page.getByRole('checkbox', { name: 'Mostrar só pendentes' }).uncheck();
    const semanas = page.getByRole('navigation', { name: 'Semanas do plano' });
    await semanas.getByRole('link', { name: /Semana 5/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: /Semana 5 — Simulados I/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir o simulado de front' })).toHaveAttribute('href', '#/simulado?desafio=front-cep');
    expect(Object.keys((await lerEstado(page)).cronograma.feitas)).toContain('s1d1-rh');
  });

  test('desmarcar tarefa remove a conclusão', async ({ page }) => {
    await abrir(page, 'cronograma?semana=1');
    const tarefa = page.getByRole('checkbox', { name: /Two Sum/ });
    await tarefa.check();
    await tarefa.uncheck();
    await expect(tarefa).not.toBeChecked();
    expect((await lerEstado(page)).cronograma.feitas['s1d2-alg']).toBeUndefined();
  });
});
