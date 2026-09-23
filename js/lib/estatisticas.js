// =========================================================
// estatisticas.js — cálculos compartilhados entre as páginas:
// progresso das trilhas e do cronograma, sequência de dias,
// horas estudadas, fila de flashcards e desempenho no quiz.
// =========================================================

import { somarDias, diasDaSemana, diferencaDias } from './datas.js';
import { estaVencido, situacao } from './sm2.js';
import { pct } from './dom.js';

// ---------- Trilhas ----------

export function progressoTopico(topico, estado) {
  const total = topico.checklist.length;
  const feitos = topico.checklist.filter((c) => estado.trilhas.feitos[c.id]).length;
  return { feitos, total, pct: pct(feitos, total) };
}

export function progressoTrilha(trilha, estado) {
  let feitos = 0;
  let total = 0;
  for (const t of trilha.topicos) {
    const p = progressoTopico(t, estado);
    feitos += p.feitos;
    total += p.total;
  }
  return { feitos, total, pct: pct(feitos, total) };
}

// ---------- Cronograma ----------

/** Lista "achatada" de tarefas, na ordem do plano, com referência à semana e ao dia. */
export function listaTarefas(cronograma) {
  const saida = [];
  if (!cronograma) return saida;
  for (const semana of cronograma.semanas) {
    for (const dia of semana.dias) {
      for (const tarefa of dia.tarefas) saida.push({ semana, dia, tarefa });
    }
  }
  return saida;
}

export function progressoCronograma(cronograma, estado) {
  const tarefas = listaTarefas(cronograma);
  const feitas = tarefas.filter(({ tarefa }) => estado.cronograma.feitas[tarefa.id]).length;
  return { feitas, total: tarefas.length, pct: pct(feitas, tarefas.length) };
}

export function progressoDia(dia, estado) {
  const total = dia.tarefas.length;
  const feitas = dia.tarefas.filter((t) => estado.cronograma.feitas[t.id]).length;
  return { feitas, total, pct: pct(feitas, total) };
}

/** Primeira tarefa ainda não concluída, na ordem do plano. */
export function proximaTarefa(cronograma, estado) {
  return listaTarefas(cronograma).find(({ tarefa }) => !estado.cronograma.feitas[tarefa.id]) ?? null;
}

/** Número do dia do plano para uma data (1 = data de início), ou null se o plano não começou. */
export function diaDoPlano(estado, hoje) {
  const inicio = estado.config.dataInicio;
  if (!inicio) return null;
  return diferencaDias(inicio, hoje) + 1;
}

/** Data (ISO) correspondente ao dia N do plano. */
export function dataDoDia(estado, numero) {
  const inicio = estado.config.dataInicio;
  return inicio ? somarDias(inicio, numero - 1) : null;
}

// ---------- Progresso geral ----------

export function progressoGeral(dados, estado) {
  let feitos = 0;
  let total = 0;
  for (const t of dados.trilhas?.trilhas ?? []) {
    const p = progressoTrilha(t, estado);
    feitos += p.feitos;
    total += p.total;
  }
  const c = progressoCronograma(dados.cronograma, estado);
  feitos += c.feitas;
  total += c.total;
  return { feitos, total, pct: pct(feitos, total) };
}

// ---------- Sequência de dias (streak) ----------

export function sequencia(estado, hoje) {
  const dias = estado.atividade;
  const estudouHoje = Boolean(dias[hoje]);
  let atual = 0;
  let cursor = estudouHoje ? hoje : somarDias(hoje, -1);
  while (dias[cursor]) {
    atual += 1;
    cursor = somarDias(cursor, -1);
  }
  // Recorde: maior sequência de dias consecutivos no histórico
  const ordenados = Object.keys(dias).filter((d) => dias[d]).sort();
  let recorde = 0;
  let corrida = 0;
  let anterior = null;
  for (const d of ordenados) {
    corrida = anterior && diferencaDias(anterior, d) === 1 ? corrida + 1 : 1;
    recorde = Math.max(recorde, corrida);
    anterior = d;
  }
  return { atual, recorde: Math.max(recorde, atual), estudouHoje };
}

// ---------- Horas estudadas ----------

export function minutosPorDia(estado) {
  const mapa = {};
  for (const s of estado.sessoes) mapa[s.data] = (mapa[s.data] ?? 0) + (Number(s.minutos) || 0);
  return mapa;
}

export function resumoSemana(estado, hoje) {
  const mapa = minutosPorDia(estado);
  const dias = diasDaSemana(hoje).map((data) => ({ data, minutos: mapa[data] ?? 0 }));
  return { dias, total: dias.reduce((soma, d) => soma + d.minutos, 0) };
}

export function minutosHoje(estado, hoje) {
  return minutosPorDia(estado)[hoje] ?? 0;
}

// ---------- Flashcards ----------

/** Cartões do JSON + cartões criados por você. */
export function todosCartoes(dados, estado) {
  const doArquivo = dados.flashcards?.cartoes ?? [];
  const meus = (estado.flashcards.meus ?? []).map((c) => ({ ...c, meu: true }));
  return [...doArquivo, ...meus];
}

/** Quantos cartões novos ainda podem ser liberados hoje. */
export function novosRestantesHoje(estado, hoje) {
  const { novosHoje } = estado.flashcards;
  const limite = Number(estado.config.novosPorDia) || 0;
  if (novosHoje.data !== hoje) return limite;
  return Math.max(0, limite + (novosHoje.extra || 0) - novosHoje.qtd);
}

/**
 * Ordena cartões novos intercalando os temas (js-001, vue-001, html-001, …),
 * para praticar de forma intercalada (interleaving) desde o início.
 */
export function intercalarPorTema(cartoes) {
  const grupos = new Map();
  for (const c of cartoes) {
    if (!grupos.has(c.tema)) grupos.set(c.tema, []);
    grupos.get(c.tema).push(c);
  }
  const filas = [...grupos.values()];
  const saida = [];
  let restante = true;
  for (let i = 0; restante; i++) {
    restante = false;
    for (const fila of filas) {
      if (i < fila.length) {
        saida.push(fila[i]);
        restante = true;
      }
    }
  }
  return saida;
}

export function resumoFlashcards(cartoes, estado, hoje) {
  const progresso = estado.flashcards.progresso;
  let vencidos = 0;
  let estudados = 0;
  let maduros = 0;
  let novosTotal = 0;
  const porTema = {};
  for (const c of cartoes) {
    const p = progresso[c.id];
    const t = (porTema[c.tema] ??= { vencidos: 0, novos: 0, total: 0 });
    t.total += 1;
    if (!p || !p.revisoes) {
      novosTotal += 1;
      t.novos += 1;
      continue;
    }
    estudados += 1;
    if (situacao(p) === 'maduro') maduros += 1;
    if (estaVencido(p, hoje)) {
      vencidos += 1;
      t.vencidos += 1;
    }
  }
  const novosDisponiveis = Math.min(novosTotal, novosRestantesHoje(estado, hoje));
  const amanha = somarDias(hoje, 1);
  const venceAmanha = cartoes.filter((c) => progresso[c.id]?.proxima === amanha).length;
  return { total: cartoes.length, vencidos, novosTotal, novosDisponiveis, estudados, maduros, porTema, venceAmanha };
}

// ---------- Quiz ----------

export const MIN_RESPOSTAS_STATUS = 5;

/** Classifica o desempenho recente de um tema. */
export function statusDesempenho(registro) {
  const recentes = registro?.recentes ?? [];
  if (recentes.length < MIN_RESPOSTAS_STATUS) return 'sem-dados';
  const taxa = recentes.reduce((a, b) => a + b, 0) / recentes.length;
  if (taxa < 0.6) return 'fraco';
  if (taxa < 0.8) return 'atencao';
  return 'bom';
}

/** Desempenho por tema, do pior para o melhor. */
export function desempenhoPorTema(estado, temas) {
  return temas
    .map((t) => {
      const r = estado.quiz.porTema[t.id];
      const recentes = r?.recentes ?? [];
      return {
        id: t.id,
        nome: t.nome,
        total: r?.total ?? 0,
        acertos: r?.acertos ?? 0,
        taxaGeral: pct(r?.acertos ?? 0, r?.total ?? 0),
        taxaRecente: pct(recentes.reduce((a, b) => a + b, 0), recentes.length),
        qtdRecentes: recentes.length,
        status: statusDesempenho(r)
      };
    })
    .sort((a, b) => {
      const ordem = { fraco: 0, atencao: 1, bom: 2, 'sem-dados': 3 };
      return ordem[a.status] - ordem[b.status] || a.taxaRecente - b.taxaRecente;
    });
}

/** Dias até a prova (null se não houver data). */
export function diasAteProva(estado, hoje) {
  const d = estado.config.dataProva;
  return d ? diferencaDias(hoje, d) : null;
}

/** Semana atual do plano (1–6) pela data, limitada ao intervalo do cronograma. */
export function semanaAtual(cronograma, estado, hoje) {
  const n = diaDoPlano(estado, hoje);
  if (!n || !cronograma) return null;
  let acumulado = 0;
  for (const s of cronograma.semanas) {
    acumulado += s.dias.length;
    if (n <= acumulado) return s.numero;
  }
  return null;
}
