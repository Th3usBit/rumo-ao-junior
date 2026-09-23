// Progresso de exemplo (como se você estivesse no Dia 11 do plano),
// usado nos testes de acessibilidade e nas capturas de tela.
export function estadoDeExemplo() {
  const semana1 = ['s1d1-rh', 's1d1-diag', 's1d1-alg', 's1d1-est', 's1d1-rev', 's1d2-alg', 's1d2-est', 's1d2-rev', 's1d3-alg', 's1d3-est', 's1d3-rev', 's1d4-alg', 's1d4-est', 's1d4-rev', 's1d5-alg', 's1d5-est', 's1d5-quiz', 's1d5-rev', 's1d6-alg', 's1d6-est', 's1d6-quiz', 's1d6-rev', 's1d7-desc', 's2d1-alg', 's2d1-est', 's2d1-rev', 's2d2-alg', 's2d2-est'];
  const feitas = Object.fromEntries(semana1.map((id) => [id, '2026-09-25']));
  const itens = ['git-01', 'git-02', 'git-03', 'git-04', 'git-06', 'log-01', 'log-02', 'log-03', 'est-01', 'est-02', 'est-03', 'http-01', 'http-02', 'http-03', 'oop-01', 'oop-02'];
  const feitos = Object.fromEntries(itens.map((id) => [id, '2026-09-24']));
  const cartao = (proxima: string, intervalo: number, rep: number) => ({ rep, ef: 2.5, intervalo, proxima, revisoes: rep, lapsos: 0, ultima: '2026-09-27' });
  const progresso: Record<string, unknown> = {};
  ['js-ts-001', 'js-ts-002', 'js-ts-003', 'sql-001', 'sql-002', 'http-001'].forEach((id) => (progresso[id] = cartao('2026-09-28', 1, 1)));
  ['git-001', 'git-002', 'git-003', 'git-004', 'oop-001', 'java-001'].forEach((id) => (progresso[id] = cartao('2026-10-03', 6, 2)));
  const atividade = Object.fromEntries(
    ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30'].map((d) => [d, 5])
  );
  const sessao = (data: string, minutos: number, origem: string, descricao: string) => ({ id: `s-${data}-${minutos}`, data, inicio: `${data}T12:00:00.000Z`, minutos, origem, descricao });
  return {
    versao: 1,
    config: { tema: 'sistema', dataInicio: '2026-09-21', dataProva: '2026-11-03', novosPorDia: 15, metaHorasSemana: 8, pomodoro: { foco: 25, pausa: 5, pausaLonga: 15, ciclosAteLonga: 4, som: true, autoIniciarPausa: true }, notificacoes: false },
    trilhas: { feitos, notas: { 'nucleo-git': 'Rebase reescreve os commits (novos hashes); merge preserva o histórico.' } },
    cronograma: { feitas },
    flashcards: { progresso, novosHoje: { data: null, qtd: 0, extra: 0 }, reforco: { data: null, ids: [] }, meus: [] },
    quiz: {
      questoes: {},
      porTema: {
        sql: { total: 10, acertos: 4, recentes: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0] },
        http: { total: 8, acertos: 6, recentes: [1, 1, 0, 1, 1, 1, 0, 1] },
        git: { total: 6, acertos: 6, recentes: [1, 1, 1, 1, 1, 1] },
        'js-ts': { total: 3, acertos: 2, recentes: [1, 0, 1] }
      },
      tentativas: [
        { id: 'q1', data: '2026-09-21', modo: 'prova', tema: 'misto', total: 20, respondidas: 20, acertos: 11, duracaoSeg: 1620 },
        { id: 'q2', data: '2026-09-26', modo: 'treino', tema: 'misto', total: 15, respondidas: 15, acertos: 10, duracaoSeg: 840 }
      ]
    },
    simulados: {
      ativo: null,
      historico: [
        { id: 'sim1', desafioId: 'live-algoritmo', titulo: 'Live coding: agrupar e ranquear pedidos', data: '2026-09-26', minutosPlanejados: 40, minutosUsados: 38, esgotado: false, pausas: 0, requisitosAtendidos: [0, 1, 2], criteriosAtendidos: [0, 1, 2, 3, 4], totalRequisitos: 6, totalCriterios: 8, nota: 3, bem: 'Expliquei a complexidade.', melhorar: 'Testar casos de borda antes.' }
      ]
    },
    pomodoro: { ativo: null, ciclos: 2 },
    sessoes: [
      sessao('2026-09-24', 100, 'pomodoro', 'SQL: JOINs'),
      sessao('2026-09-28', 50, 'pomodoro', 'Maximum Subarray'),
      sessao('2026-09-28', 25, 'manual', 'Leitura: SOLID'),
      sessao('2026-09-29', 95, 'pomodoro', 'Group Anagrams + SQLBolt'),
      sessao('2026-09-30', 70, 'pomodoro', 'Modelagem da biblioteca')
    ],
    diario: {
      '2026-09-29': { estudei: 'SQLBolt lições 1 a 8 e Group Anagrams.', dificil: 'Diferença entre WHERE e HAVING com agregações.', proximo: 'Refazer a lição 6 sem dica.', atualizadoEm: '2026-09-29T22:00:00.000Z' },
      '2026-09-30': { estudei: 'Modelagem 1:N e N:N; índices.', dificil: 'Quando um índice piora a escrita.', proximo: 'pgexercises — Joins.', atualizadoEm: '2026-09-30T22:00:00.000Z' }
    },
    atividade,
    ultimoBackup: '2026-09-27T21:00:00.000Z'
  };
}
