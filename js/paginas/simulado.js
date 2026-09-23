// =========================================================
// Página: Simulado — escolha um desafio no estilo de teste
// técnico real, rode o cronômetro regressivo e, ao final,
// marque os critérios atendidos e registre a autoavaliação.
// =========================================================

import { obterEstado, atualizar, assinar } from '../core/estado.js';
import { html, md, renderizar, renderizarPreservandoFoco, debounce, pct } from '../lib/dom.js';
import { icone, medidor, atualizarMedidor, linkExterno, confirmar, toast } from '../lib/ui.js';
import { hojeISO, relogio, formatarMinutos, dataCurta } from '../lib/datas.js';
import {
  assinarTimers, restanteSimulado, iniciarSimulado, pausarSimulado, retomarSimulado, finalizarSimulado,
  desistirSimulado, salvarNotasSimulado, salvarAvaliacaoSimulado
} from '../lib/timers.js';

export const AREAS = { front: 'Front-end', back: 'Back-end', fullstack: 'Fullstack', comum: 'Núcleo comum' };
export const FORMATOS = { 'take-home': 'Desafio para casa', 'live-coding': 'Live coding', 'prova-pratica': 'Prova prática', 'code-review': 'Code review' };
const NOTAS = [
  { valor: 1, rotulo: '1 · Não entreguei' },
  { valor: 2, rotulo: '2 · Parcial' },
  { valor: 3, rotulo: '3 · Funciona, com ressalvas' },
  { valor: 4, rotulo: '4 · Bom' },
  { valor: 5, rotulo: '5 · Excelente' }
];

const filtros = { area: 'todas', nivel: 'todos', formato: 'todos' };

function selosDesafio(d) {
  return html`<span class="selo selo-acento">${AREAS[d.area] ?? d.area}</span>
    <span class="selo">${FORMATOS[d.formato] ?? d.formato}</span>
    <span class="selo selo-contorno">Nível ${d.nivel}</span>
    <span class="selo selo-contorno">${icone('relogio', { tamanho: 14 })}${formatarMinutos(d.tempoSugeridoMin)}</span>`;
}

function listaTextos(itens) {
  return html`<ul class="lista-md">${itens.map((t) => html`<li>${md(t, { inline: true })}</li>`)}</ul>`;
}

function enunciadoCompleto(d, { comCriterios = true } = {}) {
  return html`
    ${d.contexto ? html`<blockquote class="contexto">${md(d.contexto)}</blockquote>` : ''}
    <section class="pilha-p"><h3>Enunciado</h3>${md(d.enunciado)}</section>
    ${d.requisitos.length ? html`<section class="pilha-p"><h3>Requisitos obrigatórios</h3>${listaTextos(d.requisitos)}</section>` : ''}
    ${d.diferenciais.length ? html`<section class="pilha-p"><h3>Diferenciais (bônus)</h3>${listaTextos(d.diferenciais)}</section>` : ''}
    ${comCriterios && d.criterios.length ? html`<section class="pilha-p"><h3>Como você será avaliado</h3>${listaTextos(d.criterios)}</section>` : ''}
    ${d.entrega ? html`<section class="pilha-p"><h3>Entrega</h3>${md(d.entrega)}</section>` : ''}
    ${d.stack.length ? html`<p class="pequeno texto-2"><strong>Stack sugerida:</strong> ${d.stack.join(' · ')}</p>` : ''}
    ${d.dicas.length ? html`<section class="pilha-p"><h3>Dicas</h3>${listaTextos(d.dicas)}</section>` : ''}
    ${d.inspiracao.length ? html`<p class="pequeno texto-2"><strong>Inspirado em:</strong> ${d.inspiracao.map((l, i) => html`${i ? ' · ' : ''}${linkExterno(l.url, l.titulo ?? l.url)}`)}</p>` : ''}`;
}

// ---------- Lista ----------

function cartaoDesafio(d, estado) {
  const tentativas = estado.simulados.historico.filter((h) => h.desafioId === d.id);
  const ultima = tentativas[tentativas.length - 1];
  return html`<article class="card card-p desafio-card">
    <div class="linha">${selosDesafio(d)}</div>
    <h3>${d.titulo}</h3>
    <p class="texto-2 pequeno">${d.resumo ?? ''}</p>
    <div class="linha entre" style="margin-top:auto">
      <span class="mini muted">${ultima ? `Última tentativa: ${dataCurta(ultima.data)} · nota ${ultima.nota}/5` : 'Ainda não tentado'}</span>
      <a class="btn btn-p btn-primario" href="#/simulado?desafio=${d.id}">Ver desafio</a>
    </div>
  </article>`;
}

function historicoHtml(dados, estado) {
  const hist = [...estado.simulados.historico].reverse();
  if (!hist.length) return html`<p class="texto-2 pequeno">Nenhum simulado registrado ainda. Nas semanas 5 e 6 do cronograma há simulados planejados — mas você pode fazer um quando quiser.</p>`;
  const media = hist.reduce((a, h) => a + (Number(h.nota) || 0), 0) / hist.length;
  return html`<p class="texto-2 pequeno" style="margin-bottom:.75rem">${hist.length} simulado(s) · nota média ${media.toFixed(1)}/5</p>
    <div class="pilha-p">${hist.map(
      (h) => html`<details class="bloco">
        <summary><span class="cresce">${dataCurta(h.data, true)} · ${h.titulo}</span>
          <span class="linha"><span class="selo">${h.minutosUsados}/${h.minutosPlanejados} min</span>
          <span class="selo selo-acento">Critérios ${pct(h.criteriosAtendidos?.length ?? 0, h.totalCriterios ?? 0)}%</span>
          <span class="selo selo-contorno">Nota ${h.nota}/5</span></span></summary>
        <div class="corpo pequeno">
          ${h.esgotado ? html`<p>${icone('relogio', { tamanho: 14 })} O tempo esgotou.</p>` : ''}
          <p><strong>Requisitos entregues:</strong> ${h.requisitosAtendidos?.length ?? 0}/${h.totalRequisitos ?? 0} · <strong>Critérios atendidos:</strong> ${h.criteriosAtendidos?.length ?? 0}/${h.totalCriterios ?? 0}</p>
          ${h.bem ? html`<div><strong>O que foi bem:</strong> ${h.bem}</div>` : ''}
          ${h.melhorar ? html`<div><strong>O que melhorar:</strong> ${h.melhorar}</div>` : ''}
          ${h.notasDuranteProva ? html`<div><strong>Anotações durante o simulado:</strong> ${h.notasDuranteProva}</div>` : ''}
          <div><a href="#/simulado?desafio=${h.desafioId}">Abrir o desafio</a></div>
        </div>
      </details>`
    )}</div>`;
}

function telaLista(dados, estado) {
  const desafios = dados.desafios.desafios;
  const visiveis = desafios.filter(
    (d) => (filtros.area === 'todas' || d.area === filtros.area) && (filtros.nivel === 'todos' || d.nivel === filtros.nivel) && (filtros.formato === 'todos' || d.formato === filtros.formato)
  );
  const niveis = [...new Set(desafios.map((d) => d.nivel))];
  const formatos = [...new Set(desafios.map((d) => d.formato))];
  return html`
    <div class="pilha-p">
      <nav class="chips" aria-label="Filtrar por área">
        ${[['todas', 'Todas as áreas'], ...Object.entries(AREAS)].map(
          ([id, nome]) => html`<button type="button" class="chip" data-filtro-area="${id}" aria-pressed="${filtros.area === id}">${nome}
            <span class="num">${id === 'todas' ? desafios.length : desafios.filter((d) => d.area === id).length}</span></button>`
        )}
      </nav>
      <div class="linha-g">
        <div class="campo"><label for="filtro-nivel" class="sr-only">Nível</label>
          <select class="entrada" id="filtro-nivel"><option value="todos">Todos os níveis</option>${niveis.map((n) => html`<option value="${n}" ${filtros.nivel === n ? 'selected' : ''}>Nível ${n}</option>`)}</select></div>
        <div class="campo"><label for="filtro-formato" class="sr-only">Formato</label>
          <select class="entrada" id="filtro-formato"><option value="todos">Todos os formatos</option>${formatos.map((f) => html`<option value="${f}" ${filtros.formato === f ? 'selected' : ''}>${FORMATOS[f] ?? f}</option>`)}</select></div>
        <span class="texto-2 pequeno">${visiveis.length} desafio(s)</span>
      </div>
    </div>
    <div class="grade-3 lista-desafios">${visiveis.map((d) => cartaoDesafio(d, estado))}</div>
    ${!visiveis.length ? html`<div class="vazio"><p>Nenhum desafio com esses filtros.</p></div>` : ''}
    <section class="card" aria-labelledby="titulo-hist-sim">
      <div class="card-titulo"><h2 id="titulo-hist-sim">${icone('relogio')} Histórico de simulados</h2></div>
      ${historicoHtml(dados, estado)}
    </section>`;
}

// ---------- Detalhe ----------

function telaDetalhe(dados, estado, d) {
  const ativo = estado.simulados.ativo;
  const tentativas = estado.simulados.historico.filter((h) => h.desafioId === d.id);
  return html`
    <div><a class="btn btn-fantasma btn-p" href="#/simulado">${icone('seta-esquerda', { tamanho: 16 })}Todos os desafios</a></div>
    <article class="card pilha desafio-detalhe" aria-labelledby="titulo-desafio">
      <div class="linha">${selosDesafio(d)}</div>
      <h2 id="titulo-desafio" style="font-size:1.4rem">${d.titulo}</h2>
      ${enunciadoCompleto(d)}
    </article>
    <section class="card card-destaque" aria-labelledby="titulo-iniciar">
      <div class="card-titulo"><h2 id="titulo-iniciar">${icone('play')} Iniciar simulado</h2></div>
      ${ativo
        ? html`<p class="texto-2">Já existe um simulado em andamento (${ativo.titulo}). <a href="#/simulado">Continue ou finalize-o</a> antes de começar outro.</p>`
        : html`<form class="pilha" data-form="iniciar">
            <p class="texto-2 pequeno">Simule as condições reais: sem soluções prontas, no editor que você usaria na prova, celular longe. Leia tudo antes de codar e planeje 5 minutos. O Pomodoro será pausado.</p>
            <div class="linha-g">
              <div class="campo"><label for="duracao-sim">Duração (minutos)</label>
                <input class="entrada entrada-curta" type="number" id="duracao-sim" name="duracao" min="1" max="600" step="1" value="${d.tempoSugeridoMin}" required></div>
              <button class="btn btn-primario btn-g" type="submit" style="align-self:end">${icone('play', { tamanho: 18 })}Começar agora</button>
            </div>
          </form>`}
    </section>
    ${d.gabarito
      ? html`<details class="bloco"><summary>${icone('lampada', { tamanho: 18 })} Gabarito / solução de referência — abra só depois de tentar!</summary><div class="corpo">${md(d.gabarito)}</div></details>`
      : ''}
    ${tentativas.length
      ? html`<section class="card card-p"><h2 class="pequeno">Suas tentativas neste desafio</h2>
          <ul class="lista-simples pequeno" style="margin-top:.5rem">${tentativas.map((h) => html`<li>${dataCurta(h.data, true)} — nota ${h.nota}/5 · critérios ${h.criteriosAtendidos?.length ?? 0}/${h.totalCriterios ?? 0} · ${h.minutosUsados} min</li>`)}</ul></section>`
      : ''}`;
}

// ---------- Em andamento ----------

function telaAndamento(dados, estado, d) {
  const a = estado.simulados.ativo;
  const restante = restanteSimulado();
  const decorrido = a.duracaoMs - restante;
  return html`
    <section class="card card-destaque simulado-ativo" aria-labelledby="titulo-ativo">
      <div class="linha entre">
        <div class="pilha-p" style="gap:.2rem">
          <span class="mini muted">Simulado em andamento</span>
          <h2 id="titulo-ativo">${a.titulo}</h2>
        </div>
        <span class="selo ${a.status === 'pausado' ? 'selo-contorno' : 'selo-acento'}">${a.status === 'pausado' ? 'Pausado' : 'Rodando'}</span>
      </div>
      <div class="cronometro-grande" role="timer" aria-label="Tempo restante">
        <span data-tempo-sim>${relogio(restante)}</span>
      </div>
      <div data-medidor-sim>${medidor((decorrido / a.duracaoMs) * 100, { rotulo: 'Tempo decorrido', grande: true })}</div>
      <p class="mini muted centro">Duração: ${formatarMinutos(a.duracaoMs / 60000)} · o tempo continua contando se você trocar de página.</p>
      <div class="linha" style="justify-content:center">
        ${a.status === 'rodando'
          ? html`<button class="btn" type="button" data-acao="pausar" data-foco="pausar">${icone('pausa', { tamanho: 18 })}Pausar</button>`
          : html`<button class="btn btn-primario" type="button" data-acao="retomar" data-foco="retomar">${icone('play', { tamanho: 18 })}Retomar</button>`}
        <button class="btn btn-primario" type="button" data-acao="finalizar">${icone('check', { tamanho: 18 })}Terminei — avaliar</button>
        <button class="btn btn-fantasma" type="button" data-acao="desistir">Desistir</button>
      </div>
    </section>
    <div class="grade-2 simulado-grade">
      <article class="card pilha" aria-label="Enunciado">${d ? enunciadoCompleto(d, { comCriterios: false }) : html`<p>Desafio não encontrado nos dados.</p>`}</article>
      <aside class="pilha">
        <div class="card campo">
          <label for="notas-sim">Rascunho e decisões (salvo automaticamente)</label>
          <textarea class="entrada" id="notas-sim" rows="10" placeholder="Plano, decisões técnicas, o que ficou para depois…">${a.notas ?? ''}</textarea>
          <span class="ajuda">Dica de avaliador: anote o que você deixou de fora e por quê — isso vai para o README.</span>
        </div>
        ${d?.criterios.length ? html`<div class="card"><h3 style="margin-bottom:.5rem">Como você será avaliado</h3>${listaTextos(d.criterios)}</div>` : ''}
      </aside>
    </div>`;
}

// ---------- Autoavaliação ----------

function grupoChecks(nome, titulo, itens) {
  if (!itens.length) return '';
  return html`<fieldset class="pilha-p">
    <legend class="rotulo">${titulo}</legend>
    <ul class="lista-check">${itens.map(
      (t, i) => html`<li><label class="check"><input type="checkbox" name="${nome}" value="${i}"><span class="texto">${md(t, { inline: true })}</span></label></li>`
    )}</ul>
  </fieldset>`;
}

function telaAvaliacao(dados, estado, d) {
  const a = estado.simulados.ativo;
  const minutosUsados = Math.round(a.tempoUsadoMs / 60000);
  return html`
    <section class="card pilha" aria-labelledby="titulo-avaliacao">
      <div class="pilha-p">
        <span class="mini muted">Autoavaliação</span>
        <h2 id="titulo-avaliacao" tabindex="-1">${a.titulo}</h2>
        <p class="texto-2">Tempo usado: <strong>${formatarMinutos(minutosUsados)}</strong> de ${formatarMinutos(a.duracaoMs / 60000)}${a.esgotado ? ' (tempo esgotado)' : ''}. Seja honesto: marque só o que um avaliador marcaria.</p>
      </div>
      <form class="pilha" data-form="avaliacao">
        ${d ? grupoChecks('requisitos', 'Requisitos obrigatórios que você entregou', d.requisitos) : ''}
        ${d ? grupoChecks('criterios', 'Critérios de avaliação atendidos', d.criterios) : ''}
        ${d ? grupoChecks('diferenciais', 'Diferenciais entregues', d.diferenciais) : ''}
        <fieldset class="campo">
          <legend class="rotulo">Nota geral (autoavaliação)</legend>
          <div class="opcoes">${NOTAS.map(
            (n) => html`<label class="opcao-pilula"><input type="radio" name="nota" value="${n.valor}" ${n.valor === 3 ? 'checked' : ''}><span>${n.rotulo}</span></label>`
          )}</div>
        </fieldset>
        <div class="grade-2">
          <div class="campo"><label for="av-bem">O que foi bem</label><textarea class="entrada" id="av-bem" name="bem" rows="4"></textarea></div>
          <div class="campo"><label for="av-melhorar">O que melhorar / estudar</label><textarea class="entrada" id="av-melhorar" name="melhorar" rows="4"></textarea></div>
        </div>
        <label class="check"><input type="checkbox" name="registrarTempo" checked><span class="texto">Registrar ${formatarMinutos(minutosUsados)} como horas estudadas</span></label>
        <label class="check"><input type="checkbox" name="noDiario" checked><span class="texto">Copiar "o que melhorar" para o diário de hoje</span></label>
        <div class="linha">
          <button class="btn btn-primario" type="submit">${icone('salvar', { tamanho: 18 })}Salvar avaliação</button>
          <button class="btn btn-fantasma" type="button" data-acao="descartar">Descartar sem salvar</button>
        </div>
      </form>
    </section>
    ${d?.gabarito ? html`<details class="bloco"><summary>${icone('lampada', { tamanho: 18 })} Gabarito / solução de referência</summary><div class="corpo">${md(d.gabarito)}</div></details>` : ''}
    ${a.notas ? html`<section class="card card-p"><h3 class="pequeno">Suas anotações durante o simulado</h3><p class="texto-2" style="white-space:pre-wrap;margin-top:.5rem">${a.notas}</p></section>` : ''}`;
}

function conteudo(dados, estado, params) {
  const desafios = dados.desafios.desafios;
  const ativo = estado.simulados.ativo;
  let corpo;
  if (ativo) {
    const d = desafios.find((x) => x.id === ativo.desafioId);
    corpo = ativo.status === 'avaliando' ? telaAvaliacao(dados, estado, d) : telaAndamento(dados, estado, d);
  } else {
    const d = desafios.find((x) => x.id === params.get('desafio'));
    corpo = d ? telaDetalhe(dados, estado, d) : telaLista(dados, estado);
  }
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Simulados</h1>
        <p class="subtitulo">Desafios no formato dos testes técnicos reais. Cronometre, entregue o núcleo funcionando + README antes dos diferenciais e avalie-se pelos critérios.</p>
      </div>
    </header>
    ${corpo}`;
}

// ---------- Montagem ----------

export function montar(el, { dados, params }) {
  if (!dados.desafios?.desafios?.length) {
    renderizar(el, html`<header class="cabecalho-pagina"><div class="titulos"><h1>Simulados</h1></div></header>
      <p class="texto-2">O arquivo <code>data/desafios.json</code> não pôde ser carregado.</p>`);
    return undefined;
  }
  let statusAnterior = obterEstado().simulados.ativo?.status ?? null;
  const render = () => renderizarPreservandoFoco(el, conteudo(dados, obterEstado(), params));
  render();

  const salvarNotas = debounce((texto) => salvarNotasSimulado(texto), 700);

  // Atualiza só o relógio a cada tick (sem re-renderizar a página)
  const pararTimer = assinarTimers(() => {
    const a = obterEstado().simulados.ativo;
    const status = a?.status ?? null;
    if (status !== statusAnterior) {
      statusAnterior = status;
      render();
      if (status === 'avaliando') requestAnimationFrame(() => el.querySelector('#titulo-avaliacao')?.focus());
      return;
    }
    if (!a || a.status === 'avaliando') return;
    const restante = restanteSimulado();
    const alvo = el.querySelector('[data-tempo-sim]');
    if (alvo) alvo.textContent = relogio(restante);
    atualizarMedidor(el.querySelector('[data-medidor-sim] [role="progressbar"]'), ((a.duracaoMs - restante) / a.duracaoMs) * 100);
  });

  const aoEnviar = async (e) => {
    const form = e.target;
    e.preventDefault();
    if (form.dataset.form === 'iniciar') {
      const d = dados.desafios.desafios.find((x) => x.id === params.get('desafio'));
      const minutos = Number(new FormData(form).get('duracao'));
      if (!d || !Number.isFinite(minutos) || minutos < 1) return;
      iniciarSimulado(d, minutos);
      statusAnterior = 'rodando';
      toast('Simulado iniciado. Boa prova!', { tipo: 'sucesso' });
      history.replaceState(null, '', '#/simulado');
      render();
    } else if (form.dataset.form === 'avaliacao') {
      const a = obterEstado().simulados.ativo;
      const d = dados.desafios.desafios.find((x) => x.id === a?.desafioId);
      const fd = new FormData(form);
      const numeros = (nome) => fd.getAll(nome).map(Number);
      const melhorar = String(fd.get('melhorar') ?? '').trim();
      const avaliacao = {
        requisitosAtendidos: numeros('requisitos'),
        criteriosAtendidos: numeros('criterios'),
        diferenciaisAtendidos: numeros('diferenciais'),
        totalRequisitos: d?.requisitos.length ?? 0,
        totalCriterios: d?.criterios.length ?? 0,
        totalDiferenciais: d?.diferenciais.length ?? 0,
        nota: Number(fd.get('nota')) || 3,
        bem: String(fd.get('bem') ?? '').trim(),
        melhorar,
        registrarTempo: fd.get('registrarTempo') === 'on'
      };
      if (fd.get('noDiario') === 'on' && melhorar) {
        const hoje = hojeISO();
        atualizar((s) => {
          const entrada = (s.diario[hoje] ??= { estudei: '', dificil: '', proximo: '' });
          const linha = `Simulado "${a.titulo}": ${melhorar}`;
          entrada.dificil = entrada.dificil ? `${entrada.dificil}\n${linha}` : linha;
          entrada.atualizadoEm = new Date().toISOString();
        }, 'diario');
      }
      salvarAvaliacaoSimulado(avaliacao);
      statusAnterior = null;
      toast('Autoavaliação salva no histórico.', { tipo: 'sucesso' });
      render();
    }
  };

  const aoClicar = async (e) => {
    const filtroArea = e.target.closest('[data-filtro-area]');
    if (filtroArea) {
      filtros.area = filtroArea.dataset.filtroArea;
      render();
      el.querySelector(`[data-filtro-area="${CSS.escape(filtros.area)}"]`)?.focus();
      return;
    }
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'pausar') pausarSimulado();
    else if (acao === 'retomar') retomarSimulado();
    else if (acao === 'finalizar') {
      salvarNotas.descarregar(); // garante o último trecho digitado no rascunho
      const ok = await confirmar({ titulo: 'Encerrar e avaliar?', mensagem: 'O cronômetro para e você vai para a autoavaliação.', textoConfirmar: 'Encerrar e avaliar' });
      if (ok) finalizarSimulado();
    } else if (acao === 'desistir' || acao === 'descartar') {
      const ok = await confirmar({ titulo: 'Descartar este simulado?', mensagem: 'Nada será registrado no histórico.', textoConfirmar: 'Descartar', perigo: true });
      if (ok) {
        desistirSimulado();
        statusAnterior = null;
        render();
      }
    }
  };

  const aoMudar = (e) => {
    if (e.target.id === 'filtro-nivel') {
      filtros.nivel = e.target.value;
      render();
    } else if (e.target.id === 'filtro-formato') {
      filtros.formato = e.target.value;
      render();
    }
  };

  const aoDigitar = (e) => {
    if (e.target.id === 'notas-sim') salvarNotas(e.target.value);
  };

  el.addEventListener('submit', aoEnviar);
  el.addEventListener('click', aoClicar);
  el.addEventListener('change', aoMudar);
  el.addEventListener('input', aoDigitar);
  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'simulado' || motivo === 'pomodoro') {
      const novo = obterEstado().simulados.ativo?.status ?? null;
      const foiParaAvaliacao = novo === 'avaliando' && statusAnterior !== 'avaliando';
      statusAnterior = novo;
      render();
      if (foiParaAvaliacao) requestAnimationFrame(() => el.querySelector('#titulo-avaliacao')?.focus());
    }
  });
  return () => {
    salvarNotas.descarregar();
    pararTimer();
    cancelar();
  };
}
