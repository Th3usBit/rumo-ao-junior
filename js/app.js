// =========================================================
// app.js — ponto de entrada: carrega estado e dados, monta o
// menu, controla as rotas (#/pagina?param=valor), o tema, os
// indicadores de cronômetro e os botões de backup.
// =========================================================

import { carregarEstado, obterEstado, atualizar, assinar, sincronizarEntreAbas, quandoFalharSalvar, armazenamentoOk } from './core/estado.js';
import { carregarDados } from './core/dados.js';
import { exportarBackup, escolherArquivoBackup } from './core/backup.js';
import { iniciarTimers, assinarTimers, restantePomodoro, restanteSimulado, NOMES_FASE, sincronizarTimers } from './lib/timers.js';
import { html, renderizar, debounce } from './lib/dom.js';
import { icone, toast } from './lib/ui.js';
import { hojeISO, relogio, relativo, paraISO } from './lib/datas.js';
import { todosCartoes, resumoFlashcards } from './lib/estatisticas.js';

import * as dashboard from './paginas/dashboard.js';
import * as trilhas from './paginas/trilhas.js';
import * as cronograma from './paginas/cronograma.js';
import * as flashcards from './paginas/flashcards.js';
import * as quiz from './paginas/quiz.js';
import * as simulado from './paginas/simulado.js';
import * as pomodoro from './paginas/pomodoro.js';
import * as diario from './paginas/diario.js';
import * as recursos from './paginas/recursos.js';
import * as ajustes from './paginas/ajustes.js';

const PAGINAS = [
  { rota: 'dashboard', titulo: 'Painel', icone: 'painel', modulo: dashboard, secao: 'Estudo' },
  { rota: 'trilhas', titulo: 'Trilhas', icone: 'trilhas', modulo: trilhas },
  { rota: 'cronograma', titulo: 'Cronograma', icone: 'cronograma', modulo: cronograma },
  { rota: 'flashcards', titulo: 'Flashcards', icone: 'flashcards', modulo: flashcards, secao: 'Prática' },
  { rota: 'quiz', titulo: 'Quiz', icone: 'quiz', modulo: quiz },
  { rota: 'simulado', titulo: 'Simulado', icone: 'simulado', modulo: simulado },
  { rota: 'pomodoro', titulo: 'Pomodoro', icone: 'pomodoro', modulo: pomodoro, secao: 'Rotina' },
  { rota: 'diario', titulo: 'Diário', icone: 'diario', modulo: diario },
  { rota: 'recursos', titulo: 'Recursos', icone: 'recursos', modulo: recursos },
  { rota: 'ajustes', titulo: 'Ajustes e backup', icone: 'ajustes', modulo: ajustes }
];

const contexto = { dados: {}, erros: [], avisos: [] };
let limpezaAtual = null;
let rotaAtual = null;

// ---------- Rotas ----------

function lerRota() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [caminho, busca = ''] = hash.split('?');
  return { rota: caminho || 'dashboard', params: new URLSearchParams(busca) };
}

function faixaErrosDados() {
  if (!contexto.erros.length) return '';
  return html`<div class="faixa faixa-erro" role="alert">
    ${icone('alerta')}
    <div class="pilha-p">
      <strong>Não foi possível carregar alguns arquivos de dados.</strong>
      <ul>${contexto.erros.map((e) => html`<li><code>${e.arquivo}</code>: ${e.mensagem}</li>`)}</ul>
      <span class="mini">Corrija o arquivo indicado e recarregue a página (F5). As outras páginas continuam funcionando.</span>
    </div>
  </div>`;
}

function navegar() {
  const { rota, params } = lerRota();
  const pagina = PAGINAS.find((p) => p.rota === rota);
  if (!pagina) {
    location.replace('#/dashboard');
    return;
  }
  const mesmaPagina = rotaAtual === rota;
  const elementoFocado = document.activeElement;
  const hrefFocado = elementoFocado instanceof HTMLAnchorElement ? elementoFocado.getAttribute('href') : null;

  if (limpezaAtual) {
    try {
      limpezaAtual();
    } catch (erro) {
      console.error(erro);
    }
  }
  limpezaAtual = null;
  rotaAtual = rota;

  const principal = document.getElementById('conteudo');
  principal.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'pagina';
  principal.appendChild(container);

  try {
    const resultado = pagina.modulo.montar(container, { ...contexto, params, pagina });
    limpezaAtual = typeof resultado === 'function' ? resultado : null;
  } catch (erro) {
    console.error(erro);
    renderizar(container, html`<div class="faixa faixa-erro" role="alert">${icone('alerta')}<div><strong>Erro ao abrir a página.</strong><br>${erro.message}</div></div>`);
  }

  const faixa = faixaErrosDados();
  if (faixa) container.insertAdjacentHTML('afterbegin', faixa.toString());

  const rodape = document.createElement('footer');
  rodape.className = 'rodape-app';
  rodape.textContent = 'Rumo ao Júnior · seu progresso fica salvo só neste navegador — exporte um backup de vez em quando.';
  principal.appendChild(rodape);

  document.querySelectorAll('.nav-link').forEach((a) => {
    if (a.dataset.rota === rota) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  atualizarTitulo();
  fecharMenu();

  // Foco: em trocas dentro da mesma página, tenta manter o link clicado; senão vai para o título.
  const alvoMesmaPagina = mesmaPagina && hrefFocado ? container.querySelector(`a[href="${CSS.escape(hrefFocado)}"]`) : null;
  if (alvoMesmaPagina) alvoMesmaPagina.focus();
  else if (navegarComFoco) {
    const h1 = container.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }
  navegarComFoco = true;
}

let navegarComFoco = false; // no carregamento inicial não movemos o foco

/** Re-renderiza a página atual (ex.: após importar backup). */
export function recarregarPagina() {
  navegarComFoco = false;
  rotaAtual = null;
  navegar();
}

// ---------- Menu ----------

function montarMenu() {
  const lista = document.getElementById('nav-lista');
  renderizar(
    lista,
    html`${PAGINAS.map(
      (p) => html`${p.secao ? html`<li class="nav-secao" aria-hidden="true">${p.secao}</li>` : ''}
        <li><a class="nav-link" href="#/${p.rota}" data-rota="${p.rota}">${icone(p.icone)}<span>${p.titulo}</span>${
          p.rota === 'flashcards' ? html`<span class="contador" id="contador-flashcards" hidden></span>` : ''
        }</a></li>`
    )}`
  );

  const app = document.getElementById('app');
  const botaoMenu = document.getElementById('botao-menu');
  botaoMenu.addEventListener('click', () => {
    const aberto = app.classList.toggle('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    if (aberto) document.querySelector('#menu-lateral .nav-link')?.focus();
  });
  document.getElementById('sobreposicao').addEventListener('click', fecharMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && app.classList.contains('menu-aberto')) {
      fecharMenu();
      botaoMenu.focus();
    }
  });

  document.getElementById('botao-tema').addEventListener('click', alternarTema);
  document.getElementById('botao-exportar').addEventListener('click', exportarBackup);
  document.getElementById('botao-importar').addEventListener('click', escolherArquivoBackup);

  // O link "Pular para o conteúdo" leva o foco ao <main> sem trocar a rota
  document.querySelector('[data-pular]').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('conteudo').focus();
  });
}

function fecharMenu() {
  const app = document.getElementById('app');
  if (!app.classList.contains('menu-aberto')) return;
  app.classList.remove('menu-aberto');
  const botao = document.getElementById('botao-menu');
  botao.setAttribute('aria-expanded', 'false');
  botao.setAttribute('aria-label', 'Abrir menu');
}

const atualizarContadores = debounce(() => {
  const el = document.getElementById('contador-flashcards');
  if (el && contexto.dados.flashcards) {
    const estado = obterEstado();
    const r = resumoFlashcards(todosCartoes(contexto.dados, estado), estado, hojeISO());
    const n = r.vencidos + r.novosDisponiveis;
    el.hidden = n === 0;
    el.textContent = String(n);
    el.setAttribute('aria-label', `${n} para revisar hoje`);
  }
  const info = document.getElementById('info-backup');
  const ultimo = obterEstado().ultimoBackup;
  if (info) info.textContent = ultimo ? `Último backup: ${relativo(paraISO(new Date(ultimo)))}` : 'Nenhum backup exportado ainda.';
}, 150);

// ---------- Tema ----------

function temaEfetivoEscuro() {
  const tema = obterEstado().config.tema;
  if (tema === 'escuro') return true;
  if (tema === 'claro') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function aplicarTema() {
  const tema = obterEstado().config.tema;
  const raiz = document.documentElement;
  if (tema === 'escuro') raiz.setAttribute('data-theme', 'dark');
  else if (tema === 'claro') raiz.setAttribute('data-theme', 'light');
  else raiz.removeAttribute('data-theme');
  const botao = document.getElementById('botao-tema');
  if (botao) {
    const escuro = temaEfetivoEscuro();
    renderizar(botao, html`${icone(escuro ? 'sol' : 'lua', { tamanho: 18 })}<span>${escuro ? 'Tema claro' : 'Tema escuro'}</span>`);
    botao.setAttribute('aria-label', escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
  }
}

function alternarTema() {
  const escuro = temaEfetivoEscuro();
  atualizar((s) => {
    s.config.tema = escuro ? 'claro' : 'escuro';
  }, 'tema');
}

// ---------- Indicadores de cronômetro ----------

function htmlIndicadores() {
  const s = obterEstado();
  const partes = [];
  const p = s.pomodoro.ativo;
  if (p && (p.status === 'rodando' || p.iniciada)) {
    const texto = relogio(restantePomodoro());
    partes.push(html`<a class="indicador ${p.status}" href="#/pomodoro" aria-label="Pomodoro: ${NOMES_FASE[p.fase]}, ${texto} restantes${p.status === 'pausado' ? ' (pausado)' : ''}">
      <span class="ponto" aria-hidden="true"></span><span class="rotulo">${NOMES_FASE[p.fase]}</span><span class="tempo">${texto}</span></a>`);
  }
  const sim = s.simulados.ativo;
  if (sim) {
    const texto = sim.status === 'avaliando' ? 'avaliar' : relogio(restanteSimulado());
    partes.push(html`<a class="indicador ${sim.status}" href="#/simulado" aria-label="Simulado em andamento: ${texto}">
      <span class="ponto" aria-hidden="true"></span><span class="rotulo">Simulado</span><span class="tempo">${texto}</span></a>`);
  }
  return html`${partes}`.toString();
}

let ultimoIndicador = '';
function atualizarIndicadores() {
  const conteudo = htmlIndicadores();
  if (conteudo !== ultimoIndicador) {
    ultimoIndicador = conteudo;
    document.getElementById('indicadores-lateral').innerHTML = conteudo;
    document.getElementById('indicadores-topo').innerHTML = conteudo;
  }
  atualizarTitulo();
}

function atualizarTitulo() {
  const pagina = PAGINAS.find((p) => p.rota === rotaAtual);
  const base = `${pagina ? pagina.titulo : 'Painel'} · Rumo ao Júnior`;
  const s = obterEstado();
  const p = s.pomodoro.ativo;
  const sim = s.simulados.ativo;
  let prefixo = '';
  if (sim?.status === 'rodando') prefixo = `${relogio(restanteSimulado())} Simulado · `;
  else if (p?.status === 'rodando') prefixo = `${relogio(restantePomodoro())} ${NOMES_FASE[p.fase]} · `;
  const titulo = prefixo + base;
  if (document.title !== titulo) document.title = titulo;
}

// ---------- Inicialização ----------

async function iniciar() {
  if (location.protocol === 'file:') return; // o aviso estático já está visível

  carregarEstado();
  aplicarTema();
  montarMenu();

  quandoFalharSalvar(() => {
    toast('Não foi possível salvar seu progresso (armazenamento cheio ou bloqueado). Exporte um backup!', { tipo: 'erro', duracao: 10000 });
  });

  const { dados, erros, avisos } = await carregarDados();
  Object.assign(contexto, { dados, erros, avisos });

  assinar((_estado, motivo) => {
    if (motivo === 'tema' || motivo === 'importacao' || motivo === 'reset' || motivo === 'externo') aplicarTema();
    atualizarContadores();
    atualizarIndicadores();
  });
  sincronizarEntreAbas(() => {
    sincronizarTimers();
    recarregarPagina();
  });
  window.addEventListener('rumo:recarregar', recarregarPagina);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', aplicarTema);

  assinarTimers(atualizarIndicadores);
  iniciarTimers();

  // Virada do dia com o app aberto: atualiza filas e "hoje"
  let dia = hojeISO();
  setInterval(() => {
    if (hojeISO() !== dia) {
      dia = hojeISO();
      recarregarPagina();
    }
  }, 60000);

  if (!armazenamentoOk()) {
    toast('O navegador está bloqueando o armazenamento local: seu progresso não será salvo.', { tipo: 'erro', duracao: 12000 });
  }

  window.addEventListener('hashchange', navegar);
  navegar();
  atualizarContadores();
  atualizarIndicadores();
}

iniciar().catch((erro) => {
  console.error(erro);
  const principal = document.getElementById('conteudo');
  principal.innerHTML = `<div class="pagina"><div class="faixa faixa-erro" role="alert"><div><strong>Erro ao iniciar o app.</strong><br>${String(erro.message).replace(/[<>&]/g, '')}</div></div></div>`;
});
