// =========================================================
// Página: Diário — anotação rápida do dia: o que estudei,
// o que ficou difícil e o próximo passo. Salva sozinho.
// =========================================================

import { obterEstado, atualizar, assinar, registrarAtividade } from '../core/estado.js';
import { html, renderizarPreservandoFoco, debounce, normalizar } from '../lib/dom.js';
import { icone, confirmar, toast } from '../lib/ui.js';
import { hojeISO, dataPorExtenso, formatarMinutos, horaCurta, isoValido } from '../lib/datas.js';
import { minutosPorDia } from '../lib/estatisticas.js';
import { abrirNovoCartao } from './flashcards.js';

let dataEditada = null;
let busca = '';

const CAMPOS = [
  { nome: 'estudei', rotulo: 'O que estudei hoje', dica: 'Ex.: resolvi Two Sum com HashMap; li o guia de JPA; fiz os testes do service.', linhas: 4 },
  { nome: 'dificil', rotulo: 'O que ficou difícil', dica: 'Seja específico: "não entendi quando usar LEFT JOIN" é melhor que "SQL".', linhas: 4 },
  { nome: 'proximo', rotulo: 'Próximo passo', dica: 'A primeira coisa que você vai fazer amanhã.', linhas: 2 }
];

function formulario(estado, data) {
  const entrada = estado.diario[data] ?? {};
  const minutos = minutosPorDia(estado)[data] ?? 0;
  return html`<section class="card" aria-labelledby="titulo-form-diario">
    <div class="card-titulo"><h2 id="titulo-form-diario">${icone('editar')} ${data === hojeISO() ? 'Hoje' : 'Editando'} — ${dataPorExtenso(data)}</h2></div>
    <form class="pilha" data-form="diario">
      <div class="linha-g">
        <div class="campo"><label for="diario-data">Dia</label>
          <input class="entrada" type="date" id="diario-data" name="data" value="${data}" max="${hojeISO()}"></div>
        <p class="texto-2 pequeno" style="align-self:end;padding-bottom:.55rem">${icone('relogio', { tamanho: 14 })} Tempo registrado neste dia: <strong>${formatarMinutos(minutos)}</strong></p>
      </div>
      ${CAMPOS.map(
        (c) => html`<div class="campo">
          <label for="diario-${c.nome}">${c.rotulo}</label>
          <textarea class="entrada" id="diario-${c.nome}" name="${c.nome}" rows="${c.linhas}" placeholder="${c.dica}">${entrada[c.nome] ?? ''}</textarea>
        </div>`
      )}
      <div class="linha entre">
        <div class="linha">
          <button class="btn btn-primario" type="submit">${icone('salvar', { tamanho: 18 })}Salvar <kbd>Ctrl</kbd>+<kbd>Enter</kbd></button>
          <button class="btn" type="button" data-acao="cartao" data-foco="cartao-dificil">${icone('flashcards', { tamanho: 18 })}Transformar o "difícil" em flashcard</button>
        </div>
        <span class="mini muted" data-status-diario aria-live="polite">${entrada.atualizadoEm ? `Salvo às ${horaCurta(entrada.atualizadoEm)}` : 'Salva automaticamente enquanto você digita.'}</span>
      </div>
    </form>
  </section>`;
}

function listaEntradas(estado) {
  const minutos = minutosPorDia(estado);
  const termos = normalizar(busca).split(/\s+/).filter(Boolean);
  const entradas = Object.entries(estado.diario)
    .filter(([, e]) => CAMPOS.some((c) => e[c.nome]?.trim()))
    .filter(([, e]) => {
      if (!termos.length) return true;
      const alvo = normalizar(CAMPOS.map((c) => e[c.nome] ?? '').join(' '));
      return termos.every((t) => alvo.includes(t));
    })
    .sort((a, b) => b[0].localeCompare(a[0]));
  if (!entradas.length) {
    return html`<div class="vazio"><span class="icone-vazio">${icone('diario', { tamanho: 26 })}</span><p>${busca ? 'Nada encontrado.' : 'Suas anotações aparecem aqui.'}</p></div>`;
  }
  return html`${entradas.map(
    ([data, e]) => html`<article class="card card-p entrada-diario" aria-labelledby="entrada-${data}">
      <header class="linha entre">
        <h3 id="entrada-${data}">${dataPorExtenso(data, true)}</h3>
        <span class="linha">
          ${minutos[data] ? html`<span class="selo">${icone('relogio', { tamanho: 14 })}${formatarMinutos(minutos[data])}</span>` : ''}
          <button class="btn btn-p btn-fantasma" type="button" data-acao="editar" data-data="${data}" data-foco="editar-${data}">${icone('editar', { tamanho: 16 })}Editar</button>
          <button class="btn btn-p btn-fantasma" type="button" data-acao="excluir" data-data="${data}" aria-label="Excluir anotação de ${dataPorExtenso(data)}">${icone('lixeira', { tamanho: 16 })}</button>
        </span>
      </header>
      <dl class="diario-campos">
        ${CAMPOS.filter((c) => e[c.nome]?.trim()).map((c) => html`<div><dt>${c.rotulo}</dt><dd>${e[c.nome]}</dd></div>`)}
      </dl>
    </article>`
  )}`;
}

function conteudo(estado) {
  const data = dataEditada ?? hojeISO();
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Diário de estudo</h1>
        <p class="subtitulo">Dois minutos por dia. Escrever o que ficou difícil transforma dúvida vaga em próximo passo — e vira material de revisão.</p>
      </div>
    </header>
    <div id="area-form">${formulario(estado, data)}</div>
    <section class="pilha" aria-labelledby="titulo-entradas">
      <div class="linha-g entre">
        <h2 id="titulo-entradas">Anotações anteriores</h2>
        <div class="campo busca" role="search">
          <label class="sr-only" for="busca-diario">Buscar no diário</label>
          ${icone('busca', { tamanho: 18 })}
          <input class="entrada" type="search" id="busca-diario" placeholder="Buscar no diário…" value="${busca}">
        </div>
      </div>
      <div class="pilha-p" id="lista-diario">${listaEntradas(estado)}</div>
    </section>`;
}

export function montar(el, { dados, params }) {
  const dataParam = params.get('data');
  dataEditada = isoValido(dataParam) && dataParam <= hojeISO() ? dataParam : null;

  const render = () => renderizarPreservandoFoco(el, conteudo(obterEstado()));
  render();

  const lerFormulario = () => {
    const form = el.querySelector('[data-form="diario"]');
    const fd = new FormData(form);
    return { data: String(fd.get('data') || hojeISO()), valores: Object.fromEntries(CAMPOS.map((c) => [c.nome, String(fd.get(c.nome) ?? '')])) };
  };

  const salvar = ({ data, valores }) => {
    const vazio = CAMPOS.every((c) => !valores[c.nome].trim());
    atualizar((s) => {
      const existia = Boolean(s.diario[data] && CAMPOS.some((c) => s.diario[data][c.nome]?.trim()));
      if (vazio) delete s.diario[data];
      else {
        s.diario[data] = { ...valores, atualizadoEm: new Date().toISOString() };
        if (!existia) registrarAtividade(s);
      }
    }, 'nota');
    const status = el.querySelector('[data-status-diario]');
    if (status) status.textContent = vazio ? 'Anotação vazia (nada salvo).' : `Salvo às ${horaCurta(new Date())}`;
    const lista = el.querySelector('#lista-diario');
    if (lista) renderizarPreservandoFoco(lista, listaEntradas(obterEstado()));
  };
  const salvarDepois = debounce(salvar, 800);

  el.addEventListener('input', (e) => {
    if (e.target.id === 'busca-diario') {
      busca = e.target.value;
      renderizarPreservandoFoco(el.querySelector('#lista-diario'), listaEntradas(obterEstado()));
      return;
    }
    if (e.target.closest('[data-form="diario"]') && e.target.tagName === 'TEXTAREA') {
      const status = el.querySelector('[data-status-diario]');
      if (status) status.textContent = 'Salvando…';
      salvarDepois(lerFormulario());
    }
  });

  el.addEventListener('change', (e) => {
    if (e.target.id !== 'diario-data') return;
    salvarDepois.descarregar();
    const valor = e.target.value;
    if (!isoValido(valor)) return;
    dataEditada = valor > hojeISO() ? hojeISO() : valor;
    renderizarPreservandoFoco(el.querySelector('#area-form'), formulario(obterEstado(), dataEditada));
  });

  el.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-form="diario"]')) return;
    e.preventDefault();
    salvarDepois.cancelar();
    salvar(lerFormulario());
    toast('Diário salvo.', { tipo: 'sucesso', duracao: 2500 });
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.closest('[data-form="diario"]')) {
      e.preventDefault();
      el.querySelector('[data-form="diario"]').requestSubmit();
    }
  });

  el.addEventListener('click', async (e) => {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'editar') {
      salvarDepois.descarregar();
      dataEditada = alvo.dataset.data;
      renderizarPreservandoFoco(el.querySelector('#area-form'), formulario(obterEstado(), dataEditada));
      el.querySelector('#area-form').scrollIntoView({ block: 'start' });
      el.querySelector('#diario-estudei')?.focus({ preventScroll: true });
    } else if (acao === 'excluir') {
      const ok = await confirmar({ titulo: 'Excluir esta anotação?', mensagem: `A anotação de ${dataPorExtenso(alvo.dataset.data)} será apagada.`, textoConfirmar: 'Excluir', perigo: true });
      if (!ok) return;
      salvarDepois.descarregar();
      atualizar((s) => {
        delete s.diario[alvo.dataset.data];
      }, 'diario');
    } else if (acao === 'cartao') {
      const { valores } = lerFormulario();
      await abrirNovoCartao(dados, { pergunta: valores.dificil.trim(), resposta: '' });
    }
  });

  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'nota' || motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas') return;
    render();
  });
  return () => {
    salvarDepois.descarregar();
    cancelar();
  };
}
