// =========================================================
// Página: Trilhas — Núcleo Comum, Front, Back e Fullstack.
// Cada tópico tem descrição, prioridade, links, checklist
// marcável e um campo de anotações (salvo automaticamente).
// =========================================================

import { obterEstado, atualizar, assinar, registrarAtividade } from '../core/estado.js';
import { html, md, renderizar, renderizarPreservandoFoco, debounce, normalizar, textoPuro } from '../lib/dom.js';
import { icone, medidor, linkExterno } from '../lib/ui.js';
import { hojeISO } from '../lib/datas.js';
import { progressoTopico, progressoTrilha } from '../lib/estatisticas.js';

const PRIORIDADES = {
  alta: { nome: 'Prioridade alta', classe: 'selo-acento' },
  media: { nome: 'Prioridade média', classe: '' },
  baixa: { nome: 'Prioridade baixa', classe: 'selo-contorno' }
};

// Estado de interface que sobrevive às re-renderizações
const filtros = { busca: '', prioridade: 'todas', ocultarConcluidos: false };
const abertos = new Set();

function topicoCorresponde(topico, estado) {
  if (filtros.prioridade !== 'todas' && topico.prioridade !== filtros.prioridade) return false;
  if (filtros.ocultarConcluidos) {
    const p = progressoTopico(topico, estado);
    if (p.total > 0 && p.feitos === p.total) return false;
  }
  if (!filtros.busca) return true;
  const alvo = normalizar([topico.titulo, textoPuro(topico.descricao), ...topico.checklist.map((c) => c.texto)].join(' '));
  return normalizar(filtros.busca)
    .split(/\s+/)
    .filter(Boolean)
    .every((termo) => alvo.includes(termo));
}

function topicoHtml(topico, estado) {
  const p = progressoTopico(topico, estado);
  const prioridade = PRIORIDADES[topico.prioridade] ?? PRIORIDADES.media;
  const nota = estado.trilhas.notas[topico.id] ?? '';
  const idNota = `nota-${topico.id}`;
  return html`<details class="bloco topico" id="topico-${topico.id}" data-topico="${topico.id}" ${abertos.has(topico.id) ? 'open' : ''}>
    <summary>
      <span class="cresce topico-resumo">
        <span class="topico-titulo">${topico.titulo}</span>
        <span class="linha">
          <span class="selo ${prioridade.classe}">${prioridade.nome}</span>
          <span class="mini muted numeros" data-contagem="${topico.id}">${p.feitos}/${p.total} itens</span>
        </span>
      </span>
      <span class="topico-medidor" aria-hidden="true">${medidor(p.pct, { rotulo: `Progresso de ${topico.titulo}` })}</span>
    </summary>
    <div class="corpo">
      ${topico.descricao ? html`<div class="texto-2">${md(topico.descricao)}</div>` : ''}
      <div class="grade-2 topico-grade">
        <div class="pilha-p">
          <h4>Checklist</h4>
          <ul class="lista-check">
            ${topico.checklist.map((item) => {
              const feito = Boolean(estado.trilhas.feitos[item.id]);
              const idCheck = `item-${item.id}`;
              return html`<li><label class="check" for="${idCheck}">
                <input type="checkbox" id="${idCheck}" data-item="${item.id}" data-foco="${idCheck}" ${feito ? 'checked' : ''}>
                <span class="texto"><span class="riscavel">${md(item.texto, { inline: true })}</span></span>
              </label></li>`;
            })}
          </ul>
        </div>
        <div class="pilha">
          ${topico.links.length
            ? html`<div class="pilha-p"><h4>Onde estudar</h4>
                <ul class="lista-links">${topico.links.map((l) => html`<li>${linkExterno(l.url, l.titulo ?? l.url)}${l.idioma ? html` <span class="mini muted">(${l.idioma})</span>` : ''}</li>`)}</ul></div>`
            : ''}
          <div class="campo">
            <label for="${idNota}">Minhas anotações</label>
            <textarea class="entrada" id="${idNota}" data-nota="${topico.id}" rows="4" placeholder="Explique com suas palavras (autoexplicação), anote dúvidas e exemplos…">${nota}</textarea>
            <span class="ajuda" data-status-nota="${topico.id}" aria-live="polite"></span>
          </div>
        </div>
      </div>
    </div>
  </details>`;
}

function listaHtml(trilha, estado) {
  const visiveis = trilha.topicos.filter((t) => topicoCorresponde(t, estado));
  if (!visiveis.length) {
    return html`<div class="vazio"><span class="icone-vazio">${icone('busca', { tamanho: 26 })}</span><p>Nenhum tópico encontrado com esses filtros.</p></div>`;
  }
  return html`${visiveis.map((t) => topicoHtml(t, estado))}`;
}

function conteudo(dados, estado, trilha) {
  const lista = dados.trilhas.trilhas;
  const p = progressoTrilha(trilha, estado);
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Trilhas de estudo</h1>
        <p class="subtitulo">Marque o que já domina de verdade — consegue explicar e aplicar sem consultar. Links são para estudar; o checklist é para se testar.</p>
      </div>
    </header>

    <nav class="abas" aria-label="Trilhas">
      ${lista.map((t) => {
        const pt = progressoTrilha(t, estado);
        return html`<a class="aba" href="#/trilhas?trilha=${t.id}" ${t.id === trilha.id ? html`aria-current="page"` : ''}>${t.nome} <span class="pct">${pt.pct}%</span></a>`;
      })}
    </nav>

    <section class="card card-p pilha-p" aria-labelledby="titulo-trilha">
      <div class="linha entre">
        <h2 id="titulo-trilha">${trilha.nome}</h2>
        <span class="texto-2 pequeno numeros">${p.feitos} de ${p.total} itens · ${p.pct}%</span>
      </div>
      ${trilha.descricao ? html`<div class="texto-2">${md(trilha.descricao)}</div>` : ''}
      ${medidor(p.pct, { rotulo: `Progresso da trilha ${trilha.nome}`, grande: true })}
    </section>

    <div class="filtros linha-g" role="search">
      <div class="campo busca cresce">
        <label class="sr-only" for="busca-trilhas">Buscar tópicos</label>
        ${icone('busca', { tamanho: 18 })}
        <input class="entrada" type="search" id="busca-trilhas" placeholder="Buscar nesta trilha…" value="${filtros.busca}">
      </div>
      <div class="campo">
        <label class="sr-only" for="filtro-prioridade">Prioridade</label>
        <select class="entrada" id="filtro-prioridade">
          <option value="todas" ${filtros.prioridade === 'todas' ? 'selected' : ''}>Todas as prioridades</option>
          <option value="alta" ${filtros.prioridade === 'alta' ? 'selected' : ''}>Prioridade alta</option>
          <option value="media" ${filtros.prioridade === 'media' ? 'selected' : ''}>Prioridade média</option>
          <option value="baixa" ${filtros.prioridade === 'baixa' ? 'selected' : ''}>Prioridade baixa</option>
        </select>
      </div>
      <label class="check">
        <input type="checkbox" id="ocultar-concluidos" ${filtros.ocultarConcluidos ? 'checked' : ''}>
        <span class="texto">Ocultar concluídos</span>
      </label>
      <div class="linha">
        <button type="button" class="btn btn-p btn-fantasma" data-acao="abrir-todos">Expandir todos</button>
        <button type="button" class="btn btn-p btn-fantasma" data-acao="fechar-todos">Recolher todos</button>
      </div>
    </div>

    <div class="pilha-p lista-topicos" id="lista-topicos">${listaHtml(trilha, estado)}</div>
  `;
}

export function montar(el, { dados, params }) {
  if (!dados.trilhas?.trilhas?.length) {
    renderizar(el, html`<header class="cabecalho-pagina"><div class="titulos"><h1>Trilhas de estudo</h1></div></header>
      <p class="texto-2">O arquivo <code>data/trilhas.json</code> não pôde ser carregado.</p>`);
    return undefined;
  }
  const lista = dados.trilhas.trilhas;
  const trilha = lista.find((t) => t.id === params.get('trilha')) ?? lista[0];
  const topicoPedido = params.get('topico');
  if (topicoPedido) abertos.add(topicoPedido);

  const render = () => renderizarPreservandoFoco(el, conteudo(dados, obterEstado(), trilha));
  const renderLista = () => {
    const alvo = el.querySelector('#lista-topicos');
    if (alvo) renderizarPreservandoFoco(alvo, listaHtml(trilha, obterEstado()));
  };
  render();

  if (topicoPedido) {
    requestAnimationFrame(() => el.querySelector(`#topico-${CSS.escape(topicoPedido)}`)?.scrollIntoView({ block: 'start' }));
  }

  // Anotações: salva sozinho 600 ms depois de parar de digitar
  const salvarNota = debounce((id, texto, statusEl) => {
    atualizar((s) => {
      if (texto.trim()) s.trilhas.notas[id] = texto;
      else delete s.trilhas.notas[id];
    }, 'nota');
    if (statusEl) statusEl.textContent = 'Anotação salva.';
  }, 600);

  const buscar = debounce(() => renderLista(), 200);

  el.addEventListener('input', (e) => {
    const alvo = e.target;
    if (alvo.matches('[data-nota]')) {
      const status = el.querySelector(`[data-status-nota="${CSS.escape(alvo.dataset.nota)}"]`);
      if (status) status.textContent = 'Salvando…';
      // Se havia outra anotação pendente (outro tópico), salva ela antes
      if (salvarNota.pendente() && salvarNota.argumentos()[0] !== alvo.dataset.nota) salvarNota.descarregar();
      salvarNota(alvo.dataset.nota, alvo.value, status);
    } else if (alvo.id === 'busca-trilhas') {
      filtros.busca = alvo.value;
      buscar();
    }
  });

  el.addEventListener('change', (e) => {
    const alvo = e.target;
    if (alvo.matches('[data-item]')) {
      const id = alvo.dataset.item;
      const marcado = alvo.checked;
      atualizar((s) => {
        if (marcado) {
          s.trilhas.feitos[id] = hojeISO();
          registrarAtividade(s);
        } else delete s.trilhas.feitos[id];
      }, 'trilha');
    } else if (alvo.id === 'filtro-prioridade') {
      filtros.prioridade = alvo.value;
      renderLista();
    } else if (alvo.id === 'ocultar-concluidos') {
      filtros.ocultarConcluidos = alvo.checked;
      renderLista();
    }
  });

  el.addEventListener(
    'toggle',
    (e) => {
      const det = e.target;
      if (!(det instanceof HTMLDetailsElement) || !det.dataset.topico) return;
      if (det.open) abertos.add(det.dataset.topico);
      else abertos.delete(det.dataset.topico);
    },
    true
  );

  el.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    const abrir = botao.dataset.acao === 'abrir-todos';
    el.querySelectorAll('details.topico').forEach((d) => {
      d.open = abrir;
    });
  });

  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'nota' || motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas') return;
    render();
  });

  return () => {
    salvarNota.descarregar(); // garante que a última anotação digitada seja salva ao sair
    cancelar();
  };
}
