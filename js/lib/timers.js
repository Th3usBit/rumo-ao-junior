// =========================================================
// timers.js — cronômetros globais (Pomodoro e Simulado).
//
// Eles continuam rodando quando você muda de página: o estado
// fica salvo no localStorage com o horário de término (fimEm),
// então o tempo é sempre calculado a partir do relógio real —
// mesmo que a aba fique em segundo plano ou seja recarregada.
// =========================================================

import { obterEstado, atualizar, registrarAtividade } from '../core/estado.js';
import { hojeISO, formatarMinutos } from './datas.js';
import { agendarAlarme, tocarAlarme, prepararAudio } from './som.js';
import { toast } from './ui.js';
import { idAleatorio } from './dom.js';

export const NOMES_FASE = { foco: 'Foco', pausa: 'Pausa curta', pausaLonga: 'Pausa longa' };

const ouvintes = new Set();
let laco = null;
let cancelarAlarmePomodoro = null;
let cancelarAlarmeSimulado = null;

const agora = () => Date.now();

/** Assina os "ticks" dos cronômetros (≈4 vezes por segundo enquanto algum estiver rodando). */
export function assinarTimers(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function avisarOuvintes() {
  ouvintes.forEach((fn) => {
    try {
      fn();
    } catch (erro) {
      console.error(erro);
    }
  });
}

function notificarNavegador(titulo, corpo) {
  const { config } = obterEstado();
  if (!config.notificacoes || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (!document.hidden) return;
  try {
    new Notification(titulo, { body: corpo, tag: 'rumo-ao-junior' });
  } catch {
    /* alguns navegadores não permitem Notification fora de service worker */
  }
}

function algumRodando() {
  const s = obterEstado();
  return s.pomodoro.ativo?.status === 'rodando' || s.simulados.ativo?.status === 'rodando';
}

function garantirLaco() {
  if (algumRodando()) {
    if (!laco) laco = setInterval(tick, 250);
  } else if (laco) {
    clearInterval(laco);
    laco = null;
  }
  avisarOuvintes();
}

function tick() {
  const s = obterEstado();
  const p = s.pomodoro.ativo;
  if (p?.status === 'rodando' && p.fimEm <= agora()) concluirFasePomodoro();
  const sim = s.simulados.ativo;
  if (sim?.status === 'rodando' && sim.fimEm <= agora()) esgotarSimulado();
  garantirLaco();
}

// ===================== Pomodoro =====================

function duracaoFase(fase) {
  const cfg = obterEstado().config.pomodoro;
  const minutos = fase === 'foco' ? cfg.foco : fase === 'pausa' ? cfg.pausa : cfg.pausaLonga;
  return Math.max(1, Number(minutos) || 1) * 60000;
}

export function restantePomodoro() {
  const a = obterEstado().pomodoro.ativo;
  if (!a) return duracaoFase('foco');
  return a.status === 'rodando' ? Math.max(0, a.fimEm - agora()) : a.restanteMs;
}

function fasePronta(fase, rotulo) {
  const dur = duracaoFase(fase);
  return { fase, status: 'pausado', duracaoMs: dur, restanteMs: dur, fimEm: null, rotulo: rotulo ?? '', iniciada: false };
}

function faseRodando(fase, rotulo) {
  const dur = duracaoFase(fase);
  return { fase, status: 'rodando', duracaoMs: dur, restanteMs: dur, fimEm: agora() + dur, rotulo: rotulo ?? '', iniciada: true };
}

function agendarAlarmePomodoro() {
  cancelarAlarmePomodoro?.();
  cancelarAlarmePomodoro = null;
  const { config, pomodoro } = obterEstado();
  if (!config.pomodoro.som || pomodoro.ativo?.status !== 'rodando') return;
  cancelarAlarmePomodoro = agendarAlarme(pomodoro.ativo.fimEm - agora());
}

/** Inicia (ou reinicia) uma fase. */
export function iniciarPomodoro({ fase = 'foco', rotulo } = {}) {
  prepararAudio();
  atualizar((s) => {
    s.pomodoro.ativo = faseRodando(fase, rotulo ?? s.pomodoro.ativo?.rotulo ?? '');
  }, 'pomodoro');
  agendarAlarmePomodoro();
  garantirLaco();
}

export function pausarPomodoro() {
  atualizar((s) => {
    const a = s.pomodoro.ativo;
    if (!a || a.status !== 'rodando') return;
    a.restanteMs = Math.max(0, a.fimEm - agora());
    a.fimEm = null;
    a.status = 'pausado';
  }, 'pomodoro');
  cancelarAlarmePomodoro?.();
  cancelarAlarmePomodoro = null;
  garantirLaco();
}

export function retomarPomodoro() {
  prepararAudio();
  atualizar((s) => {
    const a = s.pomodoro.ativo;
    if (!a || a.status !== 'pausado') return;
    a.fimEm = agora() + a.restanteMs;
    a.status = 'rodando';
    a.iniciada = true;
  }, 'pomodoro');
  agendarAlarmePomodoro();
  garantirLaco();
}

/** Botão principal: iniciar / pausar / retomar. */
export function alternarPomodoro(rotulo) {
  const a = obterEstado().pomodoro.ativo;
  if (!a) iniciarPomodoro({ fase: 'foco', rotulo });
  else if (a.status === 'rodando') pausarPomodoro();
  else {
    if (rotulo !== undefined) definirRotuloPomodoro(rotulo);
    retomarPomodoro();
  }
}

export function definirRotuloPomodoro(rotulo) {
  const a = obterEstado().pomodoro.ativo;
  if (!a || a.rotulo === rotulo) return;
  atualizar((s) => {
    s.pomodoro.ativo.rotulo = rotulo;
  }, 'pomodoro-rotulo');
}

function registrarSessao(s, minutos, origem, descricao) {
  s.sessoes.push({
    id: idAleatorio('sessao'),
    data: hojeISO(),
    inicio: new Date(agora() - minutos * 60000).toISOString(),
    minutos,
    origem,
    descricao: descricao ?? ''
  });
  registrarAtividade(s);
}

/**
 * Encerra a fase atual.
 * - pulada: o usuário clicou em "Pular" (foco parcial é registrado, mas não conta como pomodoro);
 * - silencioso: a fase terminou enquanto o app estava fechado.
 */
function concluirFasePomodoro({ pulada = false, silencioso = false } = {}) {
  const s = obterEstado();
  const a = s.pomodoro.ativo;
  if (!a) return;
  const cfg = s.config.pomodoro;
  const restante = a.status === 'rodando' ? Math.max(0, a.fimEm - agora()) : a.restanteMs;
  const alarmeJaAgendado = Boolean(cancelarAlarmePomodoro);
  if (pulada) cancelarAlarmePomodoro?.();
  cancelarAlarmePomodoro = null;

  if (a.fase === 'foco') {
    const minutos = pulada ? Math.floor((a.duracaoMs - restante) / 60000) : Math.round(a.duracaoMs / 60000);
    const ciclos = (s.pomodoro.ciclos || 0) + (pulada ? 0 : 1);
    const longa = !pulada && ciclos % Math.max(1, cfg.ciclosAteLonga) === 0;
    const proxima = longa ? 'pausaLonga' : 'pausa';
    const autoIniciar = cfg.autoIniciarPausa && !silencioso && !pulada;
    atualizar((st) => {
      if (minutos >= 1) registrarSessao(st, minutos, 'pomodoro', a.rotulo);
      st.pomodoro.ciclos = ciclos;
      st.pomodoro.ativo = autoIniciar ? faseRodando(proxima, a.rotulo) : fasePronta(proxima, a.rotulo);
    }, 'pomodoro');
    if (autoIniciar) agendarAlarmePomodoro();
    if (pulada) {
      toast(minutos >= 1 ? `Foco interrompido: ${formatarMinutos(minutos)} registrados.` : 'Foco pulado (menos de 1 minuto, nada registrado).');
    } else {
      const texto = `Pomodoro concluído! ${formatarMinutos(minutos)} registrados. ${longa ? 'Hora da pausa longa.' : 'Hora de uma pausa curta.'}`;
      toast(texto, { tipo: 'sucesso', duracao: 7000 });
      notificarNavegador('Pomodoro concluído', texto);
    }
  } else {
    atualizar((st) => {
      st.pomodoro.ativo = fasePronta('foco', a.rotulo);
    }, 'pomodoro');
    if (!pulada) {
      toast('Pausa encerrada. Pronto para o próximo foco?', { duracao: 7000 });
      notificarNavegador('Pausa encerrada', 'Pronto para o próximo foco?');
    }
  }
  if (!pulada && !silencioso && cfg.som && !alarmeJaAgendado) tocarAlarme();
  garantirLaco();
}

export function pularFasePomodoro() {
  concluirFasePomodoro({ pulada: true });
}

/** Zera tudo. Se estava em foco, registra os minutos já estudados. */
export function zerarPomodoro() {
  const s = obterEstado();
  const a = s.pomodoro.ativo;
  cancelarAlarmePomodoro?.();
  cancelarAlarmePomodoro = null;
  let minutos = 0;
  if (a?.fase === 'foco' && a.iniciada) {
    const restante = a.status === 'rodando' ? Math.max(0, a.fimEm - agora()) : a.restanteMs;
    minutos = Math.floor((a.duracaoMs - restante) / 60000);
  }
  atualizar((st) => {
    if (minutos >= 1) registrarSessao(st, minutos, 'pomodoro', a?.rotulo);
    st.pomodoro.ativo = null;
    st.pomodoro.ciclos = 0;
  }, 'pomodoro');
  if (minutos >= 1) toast(`${formatarMinutos(minutos)} de foco registrados.`, { tipo: 'sucesso' });
  garantirLaco();
}

/** Escolhe a fase (foco/pausa/pausa longa) quando o timer não está rodando. */
export function selecionarFase(fase) {
  const a = obterEstado().pomodoro.ativo;
  if (a?.status === 'rodando') return;
  cancelarAlarmePomodoro?.();
  cancelarAlarmePomodoro = null;
  atualizar((s) => {
    s.pomodoro.ativo = fasePronta(fase, a?.rotulo);
  }, 'pomodoro');
  garantirLaco();
}

/** Depois de mudar as durações: uma fase que ainda não começou passa a usar o novo tempo. */
export function aplicarNovaConfiguracao() {
  const a = obterEstado().pomodoro.ativo;
  if (a && !a.iniciada) {
    atualizar((s) => {
      s.pomodoro.ativo = fasePronta(a.fase, a.rotulo);
    }, 'pomodoro');
  }
  garantirLaco();
}

/** Duração configurada (ms) de uma fase — usada para exibir o timer parado. */
export function duracaoConfigurada(fase = 'foco') {
  return duracaoFase(fase);
}

/** Registro manual de tempo de estudo (sem o timer). */
export function registrarSessaoManual({ minutos, descricao, data }) {
  atualizar((s) => {
    s.sessoes.push({
      id: idAleatorio('sessao'),
      data: data || hojeISO(),
      inicio: new Date().toISOString(),
      minutos,
      origem: 'manual',
      descricao: descricao ?? ''
    });
    if (!data || data === hojeISO()) registrarAtividade(s);
    else s.atividade[data] = (s.atividade[data] ?? 0) + 1;
  }, 'sessao');
}

// ===================== Simulado =====================

export function restanteSimulado() {
  const a = obterEstado().simulados.ativo;
  if (!a) return 0;
  if (a.status === 'rodando') return Math.max(0, a.fimEm - agora());
  return a.restanteMs;
}

function agendarAlarmeSimulado() {
  cancelarAlarmeSimulado?.();
  cancelarAlarmeSimulado = null;
  const { simulados } = obterEstado();
  if (simulados.ativo?.status !== 'rodando') return;
  cancelarAlarmeSimulado = agendarAlarme(simulados.ativo.fimEm - agora());
}

export function iniciarSimulado(desafio, minutos) {
  prepararAudio();
  const s = obterEstado();
  if (s.pomodoro.ativo?.status === 'rodando') {
    pausarPomodoro();
    toast('Pomodoro pausado: simulados devem imitar a prova real, sem pausas programadas.', { tipo: 'info', duracao: 6000 });
  }
  const dur = Math.max(1, Math.round(minutos)) * 60000;
  atualizar((st) => {
    st.simulados.ativo = {
      desafioId: desafio.id,
      titulo: desafio.titulo,
      duracaoMs: dur,
      restanteMs: dur,
      fimEm: agora() + dur,
      inicioEm: new Date().toISOString(),
      status: 'rodando',
      pausas: 0,
      notas: '',
      tempoUsadoMs: 0
    };
  }, 'simulado');
  agendarAlarmeSimulado();
  garantirLaco();
}

export function pausarSimulado() {
  atualizar((s) => {
    const a = s.simulados.ativo;
    if (!a || a.status !== 'rodando') return;
    a.restanteMs = Math.max(0, a.fimEm - agora());
    a.fimEm = null;
    a.status = 'pausado';
    a.pausas += 1;
  }, 'simulado');
  cancelarAlarmeSimulado?.();
  cancelarAlarmeSimulado = null;
  garantirLaco();
}

export function retomarSimulado() {
  prepararAudio();
  atualizar((s) => {
    const a = s.simulados.ativo;
    if (!a || a.status !== 'pausado') return;
    a.fimEm = agora() + a.restanteMs;
    a.status = 'rodando';
  }, 'simulado');
  agendarAlarmeSimulado();
  garantirLaco();
}

/** Encerra antes do tempo e vai para a autoavaliação. */
export function finalizarSimulado() {
  cancelarAlarmeSimulado?.();
  cancelarAlarmeSimulado = null;
  atualizar((s) => {
    const a = s.simulados.ativo;
    if (!a) return;
    const restante = a.status === 'rodando' ? Math.max(0, a.fimEm - agora()) : a.restanteMs;
    a.tempoUsadoMs = a.duracaoMs - restante;
    a.restanteMs = restante;
    a.fimEm = null;
    a.status = 'avaliando';
  }, 'simulado');
  garantirLaco();
}

function esgotarSimulado({ silencioso = false } = {}) {
  const alarmeJaAgendado = Boolean(cancelarAlarmeSimulado);
  cancelarAlarmeSimulado = null;
  atualizar((s) => {
    const a = s.simulados.ativo;
    if (!a) return;
    a.tempoUsadoMs = a.duracaoMs;
    a.restanteMs = 0;
    a.fimEm = null;
    a.status = 'avaliando';
    a.esgotado = true;
  }, 'simulado');
  toast('Tempo esgotado! Pare de codar e faça a autoavaliação.', { tipo: 'aviso', duracao: 8000 });
  notificarNavegador('Simulado: tempo esgotado', 'Pare de codar e faça a autoavaliação.');
  if (!silencioso && !alarmeJaAgendado) tocarAlarme();
  garantirLaco();
}

export function desistirSimulado() {
  cancelarAlarmeSimulado?.();
  cancelarAlarmeSimulado = null;
  atualizar((s) => {
    s.simulados.ativo = null;
  }, 'simulado');
  garantirLaco();
}

export function salvarNotasSimulado(texto) {
  atualizar((s) => {
    if (s.simulados.ativo) s.simulados.ativo.notas = texto;
  }, 'simulado-notas');
}

/** Grava a autoavaliação no histórico e encerra o simulado ativo. */
export function salvarAvaliacaoSimulado(avaliacao) {
  atualizar((s) => {
    const a = s.simulados.ativo;
    if (!a) return;
    const minutosUsados = Math.max(0, Math.round(a.tempoUsadoMs / 60000));
    s.simulados.historico.push({
      id: idAleatorio('simulado'),
      desafioId: a.desafioId,
      titulo: a.titulo,
      data: hojeISO(),
      inicioEm: a.inicioEm,
      minutosPlanejados: Math.round(a.duracaoMs / 60000),
      minutosUsados,
      esgotado: Boolean(a.esgotado),
      pausas: a.pausas,
      notasDuranteProva: a.notas,
      ...avaliacao
    });
    if (avaliacao.registrarTempo && minutosUsados >= 1) registrarSessao(s, minutosUsados, 'simulado', `Simulado: ${a.titulo}`);
    else registrarAtividade(s);
    s.simulados.ativo = null;
  }, 'simulado');
  garantirLaco();
}

// ===================== Inicialização =====================

/** Trata cronômetros que terminaram com o app fechado e liga o laço se preciso. */
export function iniciarTimers() {
  const s = obterEstado();
  const p = s.pomodoro.ativo;
  if (p?.status === 'rodando' && p.fimEm <= agora()) concluirFasePomodoro({ silencioso: true });
  const sim = s.simulados.ativo;
  if (sim?.status === 'rodando' && sim.fimEm <= agora()) esgotarSimulado({ silencioso: true });
  garantirLaco();
}

/** Chamado quando o estado muda por fora (outra aba ou importação de backup). */
export function sincronizarTimers() {
  cancelarAlarmePomodoro?.();
  cancelarAlarmePomodoro = null;
  cancelarAlarmeSimulado?.();
  cancelarAlarmeSimulado = null;
  garantirLaco();
}
