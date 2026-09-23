// =========================================================
// Página: Cronograma — plano de 6 semanas, por semana e dia,
// com tarefas marcáveis. As datas são calculadas a partir da
// "data de início" (Dia 1).
// =========================================================

import { obterEstado, atualizar, assinar, registrarAtividade } from '../core/estado.js';
import { html, md, renderizarPreservandoFoco } from '../lib/dom.js';
import { icone, medidor, linkExterno, toast } from '../lib/ui.js';
import { hojeISO, dataComDia, formatarMinutos, isoValido, dataCurta } from '../lib/datas.js';
import { progressoCronograma, progressoDia, diaDoPlano, dataDoDia, semanaAtual, proximaTarefa } from '../lib/estatisticas.js';
import { iniciarPomodoro } from '../lib/timers.js';
import { pct } from '../lib/dom.js';

/** Tipos de tarefa (também usados no Painel). Identidade por ícone + texto. */
export const TIPOS_TAREFA = {
  algoritmo: { nome: 'Algoritmo', icone: 'codigo', classe: 'selo-acento' },
  estudo: { nome: 'Estudo', icone: 'livro', classe: '' },
  projeto: { nome: 'Projeto', icone: 'raio', classe: '' },
  revisao: { nome: 'Revisão', icone: 'flashcards', classe: '' },
  simulado: { nome: 'Simulado', icone: 'simulado', classe: 'selo-contorno' },
  descanso: { nome: 'Descanso ativo', icone: 'lua', classe: '' }
};

let somentePendentes = false;

function semanaEscolhida(cronograma, estado, params, hoje) {
  const pedida = Number(params.get('semana'));
  if (cronograma.semanas.some((s) => s.numero === pedida)) return pedida;
  const atual = semanaAtual(cronograma, estado, hoje);
  if (atual) return atual;
  const prox = proximaTarefa(cronograma, estado);
  return prox ? prox.semana.numero : cronograma.semanas[0]?.numero ?? 1;
}

function tarefaHtml(tarefa, estado) {
  const feita = Boolean(estado.cronograma.feitas[tarefa.id]);
  const tipo = TIPOS_TAREFA[tarefa.tipo] ?? TIPOS_TAREFA.estudo;
  const idCheck = `tarefa-${tarefa.id}`;
  return html`<li class="tarefa ${feita ? 'feita' : ''}">
    <label class="check" for="${idCheck}">
      <input type="checkbox" id="${idCheck}" data-tarefa="${tarefa.id}" data-foco="${idCheck}" ${feita ? 'checked' : ''}>
      <span class="texto pilha-p" style="gap:.3rem">
        <span class="linha">
          <span class="selo ${tipo.classe}">${icone(tipo.icone, { tamanho: 14 })}${tipo.nome}</span>
          ${tarefa.duracao ? html`<span class="mini muted">${formatarMinutos(tarefa.duracao)}</span>` : ''}
        </span>
        <span class="riscavel negrito">${tarefa.titulo}</span>
      </span>
    </label>
    ${tarefa.descricao || tarefa.links?.length || tarefa.acao
      ? html`<div class="tarefa-detalhes">
        ${tarefa.descricao ? html`<div class="texto-2 pequeno">${md(tarefa.descricao)}</div>` : ''}
        ${tarefa.links?.length ? html`<ul class="lista-links pequeno">${tarefa.links.map((l) => html`<li>${linkExterno(l.url, l.titulo ?? l.url)}</li>`)}</ul>` : ''}
        <div class="linha">
          ${tarefa.acao?.rota ? html`<a class="btn btn-p" href="${tarefa.acao.rota}">${tarefa.acao.rotulo ?? 'Abrir'}</a>` : ''}
          ${!feita && tarefa.tipo !== 'descanso' ? html`<button type="button" class="btn btn-p btn-fantasma" data-acao="focar" data-titulo="${tarefa.titulo}">${icone('pomodoro', { tamanho: 16 })}Focar</button>` : ''}
        </div>
      </div>`
      : ''}
  </li>`;
}

function diaHtml(dia, estado, hoje) {
  const data = dataDoDia(estado, dia.numero);
  const eHoje = data === hoje;
  const p = progressoDia(dia, estado);
  const concluido = p.total > 0 && p.feitas === p.total;
  const tarefas = somentePendentes ? dia.tarefas.filter((t) => !estado.cronograma.feitas[t.id]) : dia.tarefas;
  if (somentePendentes && tarefas.length === 0) return '';
  return html`<article class="card card-p dia ${eHoje ? 'dia-hoje' : ''} ${concluido ? 'dia-concluido' : ''}" aria-labelledby="dia-${dia.numero}">
    <header class="dia-cabecalho">
      <div class="pilha-p" style="gap:.1rem">
        <h3 id="dia-${dia.numero}">Dia ${dia.numero}${data ? html` <span class="muted pequeno">· ${dataComDia(data)}</span>` : ''}</h3>
        <span class="texto-2 pequeno">${dia.titulo}</span>
      </div>
      <div class="linha">
        ${eHoje ? html`<span class="selo selo-acento">Hoje</span>` : ''}
        ${concluido ? html`<span class="selo selo-bom">${icone('check', { tamanho: 14 })}Concluído</span>` : html`<span class="mini muted numeros">${p.feitas}/${p.total}</span>`}
      </div>
    </header>
    <ul class="lista-check tarefas">${tarefas.map((t) => tarefaHtml(t, estado))}</ul>
  </article>`;
}

function conteudo(dados, estado, params) {
  const cron = dados.cronograma;
  const hoje = hojeISO();
  if (!cron) {
    return html`<header class="cabecalho-pagina"><div class="titulos"><h1>Cronograma</h1></div></header>
      <p class="texto-2">O arquivo <code>data/cronograma.json</code> não pôde ser carregado.</p>`;
  }
  const numSemana = semanaEscolhida(cron, estado, params, hoje);
  const semana = cron.semanas.find((s) => s.numero === numSemana) ?? cron.semanas[0];
  const geral = progressoCronograma(cron, estado);
  const n = diaDoPlano(estado, hoje);
  const semanaHoje = semanaAtual(cron, estado, hoje);
  let situacao = 'Defina a data de início para ver as datas de cada dia.';
  if (n !== null) {
    if (n < 1) situacao = `O plano começa em ${dataCurta(estado.config.dataInicio, true)}.`;
    else if (n > cron.totalDias) situacao = 'O período do plano terminou — conclua o que faltou e mantenha as revisões.';
    else situacao = `Hoje é o Dia ${n} (Semana ${semanaHoje}).`;
  }

  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>${cron.titulo ?? 'Cronograma'}</h1>
        <p class="subtitulo">${cron.descricao ?? ''}</p>
      </div>
    </header>

    <section class="card card-p">
      <div class="linha-g entre">
        <div class="linha-g">
          <div class="campo">
            <label for="cron-inicio">Data de início (Dia 1)</label>
            <input class="entrada" type="date" id="cron-inicio" value="${estado.config.dataInicio ?? ''}">
          </div>
          <p class="texto-2 pequeno" style="align-self:end;padding-bottom:.55rem">${situacao}</p>
        </div>
        <label class="check" style="align-self:end">
          <input type="checkbox" id="so-pendentes" ${somentePendentes ? 'checked' : ''}>
          <span class="texto">Mostrar só pendentes</span>
        </label>
      </div>
      <div class="medidor-rotulado" style="margin-top:1rem">
        <div class="cabeca"><span>Progresso do plano</span><span class="valor">${geral.pct}% · ${geral.feitas}/${geral.total} tarefas</span></div>
        ${medidor(geral.pct, { rotulo: 'Progresso do plano', grande: true })}
      </div>
    </section>

    <nav class="abas" aria-label="Semanas do plano">
      ${cron.semanas.map((s) => {
        const tarefas = s.dias.flatMap((d) => d.tarefas);
        const feitas = tarefas.filter((t) => estado.cronograma.feitas[t.id]).length;
        return html`<a class="aba" href="#/cronograma?semana=${s.numero}" ${s.numero === semana.numero ? html`aria-current="page"` : ''}>
          Semana ${s.numero}${s.numero === semanaHoje ? html` <span class="selo selo-acento">atual</span>` : ''}
          <span class="pct">${pct(feitas, tarefas.length)}%</span></a>`;
      })}
    </nav>

    <section class="pilha" aria-labelledby="titulo-semana">
      <div class="pilha-p">
        <div class="linha"><span class="selo">${semana.fase ?? ''}</span></div>
        <h2 id="titulo-semana">Semana ${semana.numero} — ${semana.titulo}</h2>
        ${semana.objetivo ? html`<div class="texto-2">${md(semana.objetivo)}</div>` : ''}
      </div>
      <div class="dias">${semana.dias.map((d) => diaHtml(d, estado, hoje))}</div>
      ${somentePendentes && semana.dias.every((d) => d.tarefas.every((t) => estado.cronograma.feitas[t.id]))
        ? html`<div class="vazio"><span class="icone-vazio">${icone('check-circulo', { tamanho: 28 })}</span><p>Tudo concluído nesta semana!</p></div>`
        : ''}
    </section>
  `;
}

export function montar(el, { dados, params }) {
  const render = () => renderizarPreservandoFoco(el, conteudo(dados, obterEstado(), params));
  render();

  const aoMudar = (e) => {
    const alvo = e.target;
    if (alvo.matches('[data-tarefa]')) {
      const id = alvo.dataset.tarefa;
      const marcado = alvo.checked;
      atualizar((s) => {
        if (marcado) {
          s.cronograma.feitas[id] = hojeISO();
          registrarAtividade(s);
        } else delete s.cronograma.feitas[id];
      }, 'cronograma');
      if (marcado) toast('Tarefa concluída!', { tipo: 'sucesso', duracao: 2500 });
    } else if (alvo.id === 'so-pendentes') {
      somentePendentes = alvo.checked;
      render();
    } else if (alvo.id === 'cron-inicio') {
      const valor = alvo.value;
      if (valor && !isoValido(valor)) return;
      atualizar((s) => {
        s.config.dataInicio = valor || null;
      }, 'config');
    }
  };

  const aoClicar = (e) => {
    const botao = e.target.closest('[data-acao="focar"]');
    if (!botao) return;
    iniciarPomodoro({ fase: 'foco', rotulo: botao.dataset.titulo });
    location.hash = '#/pomodoro';
  };

  el.addEventListener('change', aoMudar);
  el.addEventListener('click', aoClicar);
  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas' || motivo === 'nota') return;
    render();
  });
  return () => cancelar();
}
