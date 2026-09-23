// =========================================================
// sm2.js — algoritmo de repetição espaçada SM-2 (SuperMemo 2),
// conforme a descrição original de Piotr Wozniak (1990):
// https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
//
// Resumo:
//  - todo cartão começa com fator de facilidade EF = 2,5;
//  - intervalos: I(1) = 1 dia, I(2) = 6 dias, I(n) = I(n-1) × EF (arredondado para cima);
//  - nota q de 0 a 5; EF' = EF + (0,1 − (5 − q) × (0,08 + (5 − q) × 0,02)), mínimo 1,3;
//  - se q < 3, o cartão recomeça (I(1), I(2)…) SEM alterar o EF (leitura literal do passo 6);
//  - no mesmo dia, repetir os cartões com nota < 4 até todos terem nota ≥ 4
//    (reforço — não altera EF nem intervalo; isso é tratado na página de flashcards).
// =========================================================

import { somarDias, diferencaDias } from './datas.js';

/** Botões da interface → nota SM-2. */
export const BOTOES = [
  { id: 'errei', rotulo: 'Errei', q: 1, tecla: '1', descricao: 'Não lembrei (ou lembrei errado)' },
  { id: 'dificil', rotulo: 'Difícil', q: 3, tecla: '2', descricao: 'Lembrei com muito esforço' },
  { id: 'bom', rotulo: 'Bom', q: 4, tecla: '3', descricao: 'Lembrei depois de pensar um pouco' },
  { id: 'facil', rotulo: 'Fácil', q: 5, tecla: '4', descricao: 'Lembrei na hora' }
];

export const EF_INICIAL = 2.5;
export const EF_MINIMO = 1.3;

/** Estado de um cartão que nunca foi estudado. */
export function estadoInicialCartao() {
  return { rep: 0, ef: EF_INICIAL, intervalo: 0, proxima: null, revisoes: 0, lapsos: 0, ultima: null };
}

/** Novo EF após uma nota q (0–5), respeitando o mínimo de 1,3. */
export function novoFator(ef, q) {
  const calculado = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(EF_MINIMO, Math.round(calculado * 1000) / 1000);
}

/**
 * Aplica uma revisão com nota q ao estado do cartão e devolve o NOVO estado
 * (não altera o objeto recebido).
 */
export function revisar(estado, q, hoje) {
  const s = { ...estadoInicialCartao(), ...estado };
  if (q >= 3) {
    s.ef = novoFator(s.ef, q);
    if (s.rep === 0) s.intervalo = 1;
    else if (s.rep === 1) s.intervalo = 6;
    else s.intervalo = Math.ceil(s.intervalo * s.ef);
    s.rep += 1;
  } else {
    // Errou: recomeça a sequência de intervalos, mantendo o EF.
    s.rep = 0;
    s.intervalo = 1;
    s.lapsos += 1;
  }
  s.revisoes += 1;
  s.ultima = hoje;
  s.proxima = somarDias(hoje, s.intervalo);
  return s;
}

/** Intervalo (em dias) que cada botão geraria — usado para mostrar "1 dia", "6 dias"… */
export function previsaoIntervalos(estado, hoje) {
  const resultado = {};
  for (const b of BOTOES) resultado[b.id] = revisar(estado, b.q, hoje).intervalo;
  return resultado;
}

/** O cartão está vencido (deve ser revisado hoje)? */
export function estaVencido(estado, hoje) {
  return Boolean(estado?.proxima) && estado.proxima <= hoje;
}

/** Classificação para exibição. */
export function situacao(estado) {
  if (!estado || !estado.revisoes) return 'novo';
  if (estado.intervalo >= 21) return 'maduro';
  return 'aprendendo';
}

export const ROTULO_SITUACAO = { novo: 'Novo', aprendendo: 'Aprendendo', maduro: 'Maduro' };

/** Dias de atraso de um cartão vencido (0 = vence hoje). */
export function diasDeAtraso(estado, hoje) {
  if (!estado?.proxima) return 0;
  return Math.max(0, diferencaDias(estado.proxima, hoje));
}
