// =========================================================
// estado.js — todo o progresso do usuário, salvo no localStorage.
//
// O conteúdo de estudo (cartões, questões, desafios…) fica nos
// arquivos de /data. Aqui fica só o que é SEU: o que você marcou,
// suas notas no SM-2, histórico de quiz, sessões de estudo etc.
// =========================================================

import { hojeISO } from '../lib/datas.js';

export const CHAVE_ARMAZENAMENTO = 'rumo-junior:estado';
export const VERSAO_ESTADO = 1;
const APP_ID = 'rumo-ao-junior';

/** Estrutura inicial do estado (também serve de "esquema" de referência). */
export function estadoInicial() {
  return {
    versao: VERSAO_ESTADO,
    criadoEm: new Date().toISOString(),
    config: {
      tema: 'sistema', // 'sistema' | 'claro' | 'escuro'
      dataInicio: null, // 'AAAA-MM-DD' — início do cronograma
      dataProva: null, // 'AAAA-MM-DD' — opcional, para contagem regressiva
      novosPorDia: 15, // cartões novos liberados por dia
      metaHorasSemana: 8,
      pomodoro: { foco: 25, pausa: 5, pausaLonga: 15, ciclosAteLonga: 4, som: true, autoIniciarPausa: true },
      notificacoes: false
    },
    trilhas: { feitos: {}, notas: {} }, // feitos: { idItem: 'AAAA-MM-DD' }
    cronograma: { feitas: {} }, // { idTarefa: 'AAAA-MM-DD' }
    flashcards: {
      progresso: {}, // { idCartao: estado SM-2 }
      novosHoje: { data: null, qtd: 0, extra: 0 },
      reforco: { data: null, ids: [] },
      meus: [] // cartões criados por você
    },
    quiz: {
      questoes: {}, // { idQuestao: { total, acertos, ultimaData, ultimaCorreta } }
      porTema: {}, // { tema: { total, acertos, recentes: [1,0,...] } }
      tentativas: []
    },
    simulados: { ativo: null, historico: [] },
    pomodoro: { ativo: null, ciclos: 0 },
    sessoes: [], // { id, data, inicio, minutos, origem, descricao }
    diario: {}, // { 'AAAA-MM-DD': { estudei, dificil, proximo, atualizadoEm } }
    atividade: {}, // { 'AAAA-MM-DD': número de ações de estudo }
    ultimoBackup: null
  };
}

let estado = estadoInicial();
let armazenamentoDisponivel = true;
const ouvintes = new Set();
let aoFalharSalvar = null;

function eObjeto(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Mescla o estado salvo com o inicial, preenchendo campos novos de versões futuras. */
function mesclar(base, salvo) {
  if (!eObjeto(salvo)) return base;
  const resultado = { ...base };
  for (const [chave, valor] of Object.entries(salvo)) {
    if (eObjeto(base[chave]) && eObjeto(valor)) resultado[chave] = mesclar(base[chave], valor);
    else if (valor !== undefined) resultado[chave] = valor;
  }
  return resultado;
}

/** Ajustes entre versões do estado (preparado para o futuro). */
function migrar(dados) {
  const copia = { ...dados };
  // Exemplo para o futuro: if (copia.versao === 1) { ...; copia.versao = 2; }
  copia.versao = VERSAO_ESTADO;
  return copia;
}

export function carregarEstado() {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    estado = bruto ? mesclar(estadoInicial(), migrar(JSON.parse(bruto))) : estadoInicial();
  } catch (erro) {
    console.error('Não foi possível ler o progresso salvo:', erro);
    armazenamentoDisponivel = testarArmazenamento();
    estado = estadoInicial();
  }
  return estado;
}

function testarArmazenamento() {
  try {
    const k = '__teste__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function armazenamentoOk() {
  return armazenamentoDisponivel;
}

/** Callback chamado quando o salvamento falhar (ex.: cota cheia). */
export function quandoFalharSalvar(fn) {
  aoFalharSalvar = fn;
}

function salvar() {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
    armazenamentoDisponivel = true;
  } catch (erro) {
    armazenamentoDisponivel = false;
    console.error('Falha ao salvar o progresso:', erro);
    aoFalharSalvar?.(erro);
  }
}

/** Estado atual (somente leitura — para alterar, use atualizar()). */
export function obterEstado() {
  return estado;
}

/**
 * Altera o estado, salva e avisa os ouvintes.
 * Ex.: atualizar((s) => { s.config.tema = 'escuro'; }, 'config')
 */
export function atualizar(alteracao, motivo = 'geral') {
  alteracao(estado);
  salvar();
  ouvintes.forEach((fn) => {
    try {
      fn(estado, motivo);
    } catch (erro) {
      console.error(erro);
    }
  });
}

/** Registra que você estudou hoje (alimenta a sequência de dias). */
export function registrarAtividade(s, quantidade = 1) {
  const hoje = hojeISO();
  s.atividade[hoje] = (s.atividade[hoje] ?? 0) + quantidade;
}

/** Assina mudanças do estado. Retorna função para cancelar. */
export function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

/** Recarrega quando outra aba altera o progresso. */
export function sincronizarEntreAbas(aoMudar) {
  window.addEventListener('storage', (e) => {
    if (e.key !== CHAVE_ARMAZENAMENTO || e.newValue === null) return;
    try {
      estado = mesclar(estadoInicial(), migrar(JSON.parse(e.newValue)));
      ouvintes.forEach((fn) => fn(estado, 'externo'));
      aoMudar?.();
    } catch (erro) {
      console.error('Não foi possível sincronizar com outra aba:', erro);
    }
  });
}

// ---------- Backup ----------

/** Monta o objeto de backup (e registra a data do último backup). */
export function gerarBackup() {
  atualizar((s) => {
    s.ultimoBackup = new Date().toISOString();
  }, 'backup');
  return {
    app: APP_ID,
    versao: VERSAO_ESTADO,
    exportadoEm: new Date().toISOString(),
    estado
  };
}

/** Valida um backup lido de arquivo. Lança Error com mensagem amigável. */
export function validarBackup(obj) {
  if (!eObjeto(obj)) throw new Error('O arquivo não contém um objeto JSON.');
  const dados = obj.app === APP_ID && eObjeto(obj.estado) ? obj.estado : obj;
  if (!eObjeto(dados.config) || !eObjeto(dados.flashcards) || !eObjeto(dados.trilhas)) {
    throw new Error('Este arquivo não parece ser um backup do Rumo ao Júnior (faltam as seções config, trilhas ou flashcards).');
  }
  if (typeof dados.versao === 'number' && dados.versao > VERSAO_ESTADO) {
    throw new Error(`O backup é de uma versão mais nova do app (v${dados.versao}). Atualize o app antes de importar.`);
  }
  return mesclar(estadoInicial(), migrar(dados));
}

/** Substitui todo o progresso pelo backup (já validado). */
export function restaurarBackup(novoEstado) {
  atualizar((s) => {
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, novoEstado);
  }, 'importacao');
}

/** Apaga todo o progresso. */
export function apagarTudo() {
  const tema = estado.config.tema;
  atualizar((s) => {
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, estadoInicial());
    s.config.tema = tema;
  }, 'reset');
}
