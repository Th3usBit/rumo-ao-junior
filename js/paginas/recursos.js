// =========================================================
// Página: Recursos — links gratuitos da pesquisa,
// organizados por categoria, com busca e filtro de idioma.
// =========================================================

import { html, renderizar, renderizarPreservandoFoco, normalizar } from '../lib/dom.js';
import { icone } from '../lib/ui.js';
import { dataCurta } from '../lib/datas.js';

const IDIOMAS = { 'pt-BR': 'Português', 'pt-PT': 'Português (PT)', en: 'Inglês', multi: 'Vários idiomas' };
const filtros = { busca: '', idioma: 'todos' };

function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function correspondeIdioma(link) {
  if (filtros.idioma === 'todos') return true;
  if (filtros.idioma === 'pt') return link.idioma?.startsWith('pt') || link.idioma === 'multi';
  return link.idioma === 'en';
}

function categoriasFiltradas(dados) {
  const termos = normalizar(filtros.busca).split(/\s+/).filter(Boolean);
  return dados.recursos.categorias
    .map((c) => ({
      ...c,
      links: c.links.filter((l) => {
        if (!correspondeIdioma(l)) return false;
        if (!termos.length) return true;
        const alvo = normalizar(`${l.titulo} ${l.descricao ?? ''} ${l.url} ${c.nome}`);
        return termos.every((t) => alvo.includes(t));
      })
    }))
    .filter((c) => c.links.length);
}

function listaHtml(dados) {
  const categorias = categoriasFiltradas(dados);
  if (!categorias.length) {
    return html`<div class="vazio"><span class="icone-vazio">${icone('busca', { tamanho: 26 })}</span><p>Nenhum recurso encontrado.</p></div>`;
  }
  return html`${categorias.map(
    (c) => html`<section class="pilha-p categoria-recursos" id="cat-${c.id}" aria-labelledby="titulo-cat-${c.id}">
      <h2 id="titulo-cat-${c.id}">${c.nome} <span class="muted pequeno">(${c.links.length})</span></h2>
      ${c.descricao ? html`<p class="texto-2 pequeno">${c.descricao}</p>` : ''}
      <ul class="grade-3 lista-recursos">
        ${c.links.map(
          (l) => html`<li><a class="card card-p recurso" href="${l.url}" target="_blank" rel="noopener noreferrer">
            <span class="linha entre"><strong class="recurso-titulo">${l.titulo}</strong>${icone('externo', { tamanho: 16 })}</span>
            ${l.descricao ? html`<span class="texto-2 pequeno">${l.descricao}</span>` : ''}
            <span class="linha" style="margin-top:auto"><span class="selo ${l.idioma?.startsWith('pt') ? 'selo-acento' : ''}">${IDIOMAS[l.idioma] ?? l.idioma ?? '—'}</span><span class="mini muted quebra">${dominio(l.url)}</span></span>
            <span class="sr-only">(abre em nova aba)</span>
          </a></li>`
        )}
      </ul>
    </section>`
  )}`;
}

function conteudo(dados) {
  const total = dados.recursos.categorias.reduce((a, c) => a + c.links.length, 0);
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Recursos gratuitos</h1>
        <p class="subtitulo">${total} links da pesquisa${dados.recursos.verificadoEm ? `, verificados em ${dataCurta(dados.recursos.verificadoEm, true)}` : ''}. Prefira a documentação oficial e pratique mais do que lê. A pesquisa completa, com todas as fontes, está no arquivo <code>docs/pesquisa.md</code> — abra no VS Code e use <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> para ver formatado.</p>
      </div>
    </header>
    <div class="linha-g" role="search">
      <div class="campo busca cresce">
        <label class="sr-only" for="busca-recursos">Buscar recursos</label>
        ${icone('busca', { tamanho: 18 })}
        <input class="entrada" type="search" id="busca-recursos" placeholder="Buscar (ex.: JPA, flexbox, CEP, testes)…" value="${filtros.busca}">
      </div>
      <div class="chips" role="group" aria-label="Idioma">
        ${[['todos', 'Todos'], ['pt', 'Em português'], ['en', 'Em inglês']].map(
          ([id, nome]) => html`<button type="button" class="chip" data-idioma="${id}" aria-pressed="${filtros.idioma === id}">${nome}</button>`
        )}
      </div>
    </div>
    <nav class="chips chips-rolagem indice-categorias" aria-label="Categorias">
      ${dados.recursos.categorias.map((c) => html`<a class="chip" href="#/recursos" data-ir="cat-${c.id}">${c.nome}</a>`)}
    </nav>
    <div class="pilha-g" id="lista-recursos">${listaHtml(dados)}</div>`;
}

export function montar(el, { dados }) {
  if (!dados.recursos?.categorias?.length) {
    renderizar(el, html`<header class="cabecalho-pagina"><div class="titulos"><h1>Recursos</h1></div></header>
      <p class="texto-2">O arquivo <code>data/recursos.json</code> não pôde ser carregado.</p>`);
    return undefined;
  }
  renderizar(el, conteudo(dados));
  const lista = () => renderizarPreservandoFoco(el.querySelector('#lista-recursos'), listaHtml(dados));

  el.addEventListener('input', (e) => {
    if (e.target.id !== 'busca-recursos') return;
    filtros.busca = e.target.value;
    lista();
  });
  el.addEventListener('click', (e) => {
    const idioma = e.target.closest('[data-idioma]');
    if (idioma) {
      filtros.idioma = idioma.dataset.idioma;
      el.querySelectorAll('[data-idioma]').forEach((b) => b.setAttribute('aria-pressed', String(b === idioma)));
      lista();
      return;
    }
    const ir = e.target.closest('[data-ir]');
    if (ir) {
      // Navega até a categoria sem trocar a rota
      e.preventDefault();
      const alvo = el.querySelector(`#${CSS.escape(ir.dataset.ir)}`);
      if (alvo) {
        alvo.scrollIntoView({ block: 'start' });
        alvo.querySelector('h2')?.setAttribute('tabindex', '-1');
        alvo.querySelector('h2')?.focus({ preventScroll: true });
      }
    }
  });
  return undefined;
}
