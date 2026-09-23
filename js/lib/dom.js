// =========================================================
// dom.js — HTML seguro, mini-markdown e pequenos utilitários.
//
// Regra de segurança: todo texto que vem de dados (JSON, anotações
// do usuário, backup importado) passa por esc() antes de virar HTML.
// A função `html` faz isso automaticamente nas interpolações.
// =========================================================

/** Marca uma string como HTML já seguro (não será escapada de novo). */
export class HtmlSeguro {
  constructor(texto) {
    this.texto = texto;
  }

  toString() {
    return this.texto;
  }
}

const MAPA_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa caracteres especiais de HTML. */
export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => MAPA_ESCAPE[c]);
}

/** Envolve uma string confiável (ex.: SVG dos ícones) como HtmlSeguro. */
export function seguro(texto) {
  return new HtmlSeguro(texto);
}

function interpolar(valor) {
  if (valor === null || valor === undefined || valor === false) return '';
  if (valor instanceof HtmlSeguro) return valor.texto;
  if (Array.isArray(valor)) return valor.map(interpolar).join('');
  return esc(valor);
}

/**
 * Template tag que escapa automaticamente as interpolações.
 * Uso: html`<p>${textoDoUsuario}</p>`
 */
export function html(partes, ...valores) {
  let saida = partes[0];
  for (let i = 0; i < valores.length; i++) {
    saida += interpolar(valores[i]) + partes[i + 1];
  }
  return new HtmlSeguro(saida);
}

/** Substitui o conteúdo de um elemento por HTML seguro. */
export function renderizar(elemento, conteudo) {
  elemento.innerHTML = conteudo instanceof HtmlSeguro ? conteudo.texto : esc(conteudo);
}

// ---------- Mini-markdown ----------
// Suporta: ```blocos de código```, `código inline`, **negrito**,
// listas com "- " e quebras de linha. Nada de HTML cru.

function inline(texto) {
  // texto já escapado; separa trechos de código inline para não aplicar negrito dentro deles
  return texto
    .split(/(`[^`\n]+`)/g)
    .map((trecho, i) => {
      if (i % 2 === 1) return `<code>${trecho.slice(1, -1)}</code>`;
      return trecho.replace(/\*\*([^*\n][^*]*?)\*\*/g, '<strong>$1</strong>');
    })
    .join('');
}

function blocoTexto(texto) {
  const linhas = texto.split('\n');
  const saida = [];
  let lista = null;
  let paragrafo = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      saida.push(`<p>${paragrafo.map(inline).join('<br>')}</p>`);
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      saida.push(`<ul>${lista.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
      lista = null;
    }
  };

  for (const bruta of linhas) {
    const linha = bruta.trimEnd();
    const item = /^\s*[-*]\s+(.*)$/.exec(linha);
    if (item) {
      fecharParagrafo();
      (lista ??= []).push(item[1]);
    } else if (linha.trim() === '') {
      fecharParagrafo();
      fecharLista();
    } else {
      fecharLista();
      paragrafo.push(linha);
    }
  }
  fecharParagrafo();
  fecharLista();
  return saida.join('');
}

/**
 * Converte o mini-markdown dos arquivos JSON em HTML seguro.
 * `opcoes.inline = true` produz só formatação de linha (sem <p>).
 */
export function md(texto, opcoes = {}) {
  const fonte = String(texto ?? '');
  if (opcoes.inline) {
    return new HtmlSeguro(inline(esc(fonte)).replace(/\n/g, '<br>'));
  }
  const partes = [];
  const regexCodigo = /```([\w#+.-]*)[^\S\n]*\n?([\s\S]*?)```/g;
  let ultimo = 0;
  let m;
  while ((m = regexCodigo.exec(fonte))) {
    partes.push(blocoTexto(esc(fonte.slice(ultimo, m.index))));
    const linguagem = m[1] ? ` data-lang="${esc(m[1])}"` : '';
    partes.push(`<pre class="codigo" tabindex="0"${linguagem}><code>${esc(m[2].replace(/\n$/, ''))}</code></pre>`);
    ultimo = regexCodigo.lastIndex;
  }
  partes.push(blocoTexto(esc(fonte.slice(ultimo))));
  return new HtmlSeguro(`<div class="md">${partes.join('')}</div>`);
}

/** Remove a formatação do mini-markdown (para buscas e textos curtos). */
export function textoPuro(texto) {
  return String(texto ?? '')
    .replace(/```[\w#+.-]*\n?/g, '')
    .replace(/[`*]/g, '')
    .trim();
}

// ---------- Utilitários ----------

export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
export const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

/**
 * Atrasa a execução até parar de chamar por `espera` ms.
 * `.descarregar()` executa na hora a chamada pendente (se houver);
 * `.pendente()` diz se há uma chamada aguardando.
 */
export function debounce(fn, espera = 400) {
  let id = null;
  let ultimosArgs = [];
  const envolvida = (...args) => {
    ultimosArgs = args;
    clearTimeout(id);
    id = setTimeout(() => {
      id = null;
      fn(...ultimosArgs);
    }, espera);
  };
  envolvida.descarregar = () => {
    if (id === null) return;
    clearTimeout(id);
    id = null;
    fn(...ultimosArgs);
  };
  envolvida.cancelar = () => {
    clearTimeout(id);
    id = null;
  };
  envolvida.pendente = () => id !== null;
  envolvida.argumentos = () => ultimosArgs;
  return envolvida;
}

export function idAleatorio(prefixo = 'id') {
  const aleatorio = Math.random().toString(36).slice(2, 8);
  return `${prefixo}-${Date.now().toString(36)}-${aleatorio}`;
}

/** Embaralha uma cópia do array (Fisher–Yates). */
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Normaliza texto para busca: minúsculas e sem acentos. */
export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Porcentagem inteira segura (evita divisão por zero). */
export function pct(parte, total) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

/** Verdadeiro se o evento de teclado veio de um campo de digitação. */
export function digitando(evento) {
  const alvo = evento.target;
  if (!(alvo instanceof HTMLElement)) return false;
  return alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName);
}

/**
 * Renderiza mantendo o foco do teclado: se o elemento focado tinha
 * `data-foco="chave"` (ou um id), o novo elemento equivalente recebe o foco.
 */
export function renderizarPreservandoFoco(elemento, conteudo) {
  const ativo = document.activeElement;
  let seletor = null;
  if (ativo instanceof HTMLElement && elemento.contains(ativo)) {
    if (ativo.dataset.foco) seletor = `[data-foco="${CSS.escape(ativo.dataset.foco)}"]`;
    else if (ativo.id) seletor = `#${CSS.escape(ativo.id)}`;
  }
  const selecao = ativo && 'selectionStart' in ativo ? [ativo.selectionStart, ativo.selectionEnd] : null;
  renderizar(elemento, conteudo);
  if (!seletor) return;
  const novo = elemento.querySelector(seletor);
  if (!novo) return;
  novo.focus();
  if (selecao && 'setSelectionRange' in novo && selecao[0] !== null) {
    try {
      novo.setSelectionRange(selecao[0], selecao[1]);
    } catch {
      /* alguns tipos de input (ex.: number, date) não suportam seleção */
    }
  }
}
