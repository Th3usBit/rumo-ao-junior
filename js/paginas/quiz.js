// =========================================================
// Página: Quiz — múltipla escolha por tema ou misto.
// Modos: Treino (correção imediata com explicação) e
// Prova cronometrada (correção só no final, como prova real).
// Guarda o histórico por tema e destaca os pontos fracos.
// =========================================================

import { obterEstado, atualizar, assinar, registrarAtividade } from '../core/estado.js';
import { html, md, renderizar, renderizarPreservandoFoco, embaralhar, digitando, idAleatorio, pct, textoPuro } from '../lib/dom.js';
import { icone, medidor, seloStatus, confirmar, toast } from '../lib/ui.js';
import { hojeISO, relogio, dataCurta, formatarMinutos } from '../lib/datas.js';
import { desempenhoPorTema, MIN_RESPOSTAS_STATUS } from '../lib/estatisticas.js';
import { abrirNovoCartao } from './flashcards.js';

const SEG_POR_QUESTAO_PROVA = 90;
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Estado de interface (sobrevive a re-renderizações)
let rodada = null; // quiz em andamento ou finalizado
let preferencias = { tema: 'misto', qtd: 10, modo: 'treino', priorizar: true };

function temasDe(dados) {
  return dados.quiz?.temas ?? [];
}

function nomeTema(dados, id) {
  return temasDe(dados).find((t) => t.id === id)?.nome ?? id;
}

// ---------- Seleção de questões ----------

function selecionar(dados, estado, { tema, qtd, priorizar, ids }) {
  const todas = dados.quiz.questoes;
  let pool = ids ? todas.filter((q) => ids.includes(q.id)) : tema === 'misto' ? todas : todas.filter((q) => q.tema === tema);
  pool = embaralhar(pool);
  if (priorizar && !ids) {
    const stats = estado.quiz.questoes;
    // Primeiro as que você errou por último, depois as nunca respondidas, depois as que acertou
    const peso = (q) => (!stats[q.id] ? 1 : stats[q.id].ultimaCorreta ? 2 : 0);
    pool.sort((a, b) => peso(a) - peso(b));
  }
  const escolhidas = embaralhar(pool.slice(0, qtd === 'todas' ? pool.length : Number(qtd)));
  return escolhidas.map((q) => ({ q, ordem: embaralhar(q.alternativas.map((_, i) => i)), resposta: null }));
}

function iniciarRodada(dados, estado, opcoes) {
  const itens = selecionar(dados, estado, opcoes);
  if (!itens.length) {
    toast('Não há questões para esse filtro.', { tipo: 'aviso' });
    return;
  }
  rodada = {
    id: idAleatorio('quiz'),
    modo: opcoes.modo,
    tema: opcoes.ids ? 'refazer' : opcoes.tema,
    itens,
    indice: 0,
    respondida: false,
    inicio: Date.now(),
    fimEm: opcoes.modo === 'prova' ? Date.now() + itens.length * SEG_POR_QUESTAO_PROVA * 1000 : null,
    finalizada: false,
    convertidas: new Set()
  };
}

// ---------- Registro ----------

function registrarRespostas(itens) {
  const hoje = hojeISO();
  atualizar((s) => {
    for (const item of itens) {
      if (item.resposta === null) continue;
      const certa = item.resposta === item.q.correta;
      const st = (s.quiz.questoes[item.q.id] ??= { total: 0, acertos: 0 });
      st.total += 1;
      if (certa) st.acertos += 1;
      st.ultimaData = hoje;
      st.ultimaCorreta = certa;
      const t = (s.quiz.porTema[item.q.tema] ??= { total: 0, acertos: 0, recentes: [] });
      t.total += 1;
      if (certa) t.acertos += 1;
      t.recentes = [...(t.recentes ?? []), certa ? 1 : 0].slice(-20);
    }
    registrarAtividade(s);
  }, 'quiz');
}

function finalizarRodada() {
  if (!rodada || rodada.finalizada) return;
  rodada.finalizada = true;
  rodada.duracaoSeg = Math.round((Date.now() - rodada.inicio) / 1000);
  if (rodada.modo === 'prova') registrarRespostas(rodada.itens);
  const acertos = rodada.itens.filter((i) => i.resposta === i.q.correta).length;
  atualizar((s) => {
    s.quiz.tentativas.push({
      id: rodada.id,
      data: hojeISO(),
      modo: rodada.modo,
      tema: rodada.tema,
      total: rodada.itens.length,
      respondidas: rodada.itens.filter((i) => i.resposta !== null).length,
      acertos,
      duracaoSeg: rodada.duracaoSeg
    });
    s.quiz.tentativas = s.quiz.tentativas.slice(-100);
  }, 'quiz');
}

// ---------- Renderização ----------

function formularioConfig(dados) {
  const temas = temasDe(dados);
  const contagem = (id) => dados.quiz.questoes.filter((q) => q.tema === id).length;
  const p = preferencias;
  return html`<section class="card" aria-labelledby="titulo-config">
    <div class="card-titulo"><h2 id="titulo-config">${icone('quiz')} Novo quiz</h2></div>
    <form class="pilha" data-form="config">
      <div class="grade-2">
        <div class="campo">
          <label for="quiz-tema">Tema</label>
          <select class="entrada" id="quiz-tema" name="tema">
            <option value="misto" ${p.tema === 'misto' ? 'selected' : ''}>Misto — todos os temas intercalados (${dados.quiz.questoes.length})</option>
            ${temas.map((t) => html`<option value="${t.id}" ${p.tema === t.id ? 'selected' : ''}>${t.nome} (${contagem(t.id)})</option>`)}
          </select>
        </div>
        <div class="campo">
          <label for="quiz-qtd">Quantidade de questões</label>
          <select class="entrada" id="quiz-qtd" name="qtd">
            ${[5, 10, 15, 20, 30].map((n) => html`<option value="${n}" ${String(p.qtd) === String(n) ? 'selected' : ''}>${n}</option>`)}
            <option value="todas" ${p.qtd === 'todas' ? 'selected' : ''}>Todas do filtro</option>
          </select>
        </div>
      </div>
      <fieldset class="campo">
        <legend class="rotulo">Modo</legend>
        <div class="opcoes">
          <label class="opcao-pilula"><input type="radio" name="modo" value="treino" ${p.modo === 'treino' ? 'checked' : ''}><span>${icone('lampada', { tamanho: 16 })}Treino — correção imediata</span></label>
          <label class="opcao-pilula"><input type="radio" name="modo" value="prova" ${p.modo === 'prova' ? 'checked' : ''}><span>${icone('relogio', { tamanho: 16 })}Prova cronometrada — correção no final</span></label>
        </div>
        <span class="ajuda">Na prova cronometrada você tem ${String(SEG_POR_QUESTAO_PROVA / 60).replace('.', ',')} min por questão e só vê as respostas no final — como numa prova online real.</span>
      </fieldset>
      <label class="check">
        <input type="checkbox" name="priorizar" ${p.priorizar ? 'checked' : ''}>
        <span class="texto">Priorizar questões que errei ou nunca respondi</span>
      </label>
      <div><button class="btn btn-primario btn-g" type="submit">${icone('play', { tamanho: 18 })}Começar</button></div>
    </form>
  </section>`;
}

function historico(dados, estado) {
  const temas = temasDe(dados);
  const desempenho = desempenhoPorTema(estado, temas);
  const tentativas = [...estado.quiz.tentativas].reverse().slice(0, 10);
  const totalRespondidas = Object.values(estado.quiz.porTema).reduce((a, t) => a + t.total, 0);
  const totalAcertos = Object.values(estado.quiz.porTema).reduce((a, t) => a + t.acertos, 0);
  const questoesVistas = Object.keys(estado.quiz.questoes).length;
  return html`
    <section class="card" aria-labelledby="titulo-desempenho">
      <div class="card-titulo"><h2 id="titulo-desempenho">${icone('grafico')} Desempenho por tema</h2></div>
      <p class="texto-2 pequeno" style="margin-bottom:1rem">Taxa de acerto nas últimas 20 respostas de cada tema (a partir de ${MIN_RESPOSTAS_STATUS} respostas). Abaixo de 60% = ponto fraco; 60–79% = atenção.
        Total: ${totalRespondidas} respostas, ${pct(totalAcertos, totalRespondidas)}% de acerto · ${questoesVistas} de ${dados.quiz.questoes.length} questões já vistas.</p>
      <ul class="barras-h">
        ${desempenho.map(
          (t) => html`<li class="barra-h">
            <span class="linha" style="gap:.4rem"><a href="#/quiz?tema=${t.id}">${t.nome}</a></span>
            <span class="trilho" aria-hidden="true"><span style="--pct:${t.qtdRecentes ? t.taxaRecente : 0}%"></span></span>
            <span class="linha" style="gap:.5rem;justify-content:flex-end"><span class="valor">${t.qtdRecentes ? `${t.taxaRecente}%` : '—'}</span>${seloStatus(t.status)}</span>
          </li>`
        )}
      </ul>
      <details class="bloco" style="margin-top:1rem">
        <summary class="pequeno">${icone('tabela', { tamanho: 16 })} Ver como tabela</summary>
        <div class="corpo"><div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela (role para os lados se precisar)"><table class="tabela">
          <thead><tr><th scope="col">Tema</th><th scope="col" class="num">Recentes</th><th scope="col" class="num">Acerto recente</th><th scope="col" class="num">Total respondidas</th><th scope="col" class="num">Acerto geral</th><th scope="col">Situação</th></tr></thead>
          <tbody>${desempenho.map((t) => html`<tr><td>${t.nome}</td><td class="num">${t.qtdRecentes}</td><td class="num">${t.qtdRecentes ? `${t.taxaRecente}%` : '—'}</td><td class="num">${t.total}</td><td class="num">${t.total ? `${t.taxaGeral}%` : '—'}</td><td>${seloStatus(t.status)}</td></tr>`)}</tbody>
        </table></div></div>
      </details>
    </section>

    <section class="card" aria-labelledby="titulo-tentativas">
      <div class="card-titulo"><h2 id="titulo-tentativas">${icone('relogio')} Últimas tentativas</h2></div>
      ${tentativas.length
        ? html`<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela (role para os lados se precisar)"><table class="tabela">
            <thead><tr><th scope="col">Data</th><th scope="col">Modo</th><th scope="col">Tema</th><th scope="col" class="num">Acertos</th><th scope="col" class="num">Tempo</th></tr></thead>
            <tbody>${tentativas.map(
              (t) => html`<tr><td>${dataCurta(t.data, true)}</td><td>${t.modo === 'prova' ? 'Prova' : 'Treino'}</td>
                <td>${t.tema === 'misto' ? 'Misto' : t.tema === 'refazer' ? 'Refazer erradas' : nomeTema(dados, t.tema)}</td>
                <td class="num">${t.acertos}/${t.total} (${pct(t.acertos, t.total)}%)</td><td class="num">${formatarMinutos(t.duracaoSeg / 60)}</td></tr>`
            )}</tbody></table></div>`
        : html`<p class="texto-2 pequeno">Nenhuma tentativa ainda. Comece com um quiz misto de 20 questões como diagnóstico.</p>`}
    </section>`;
}

function alternativasHtml(item, { mostrarCorrecao, bloqueado }) {
  return html`<div class="alternativas" role="radiogroup" aria-labelledby="enunciado-atual">
    ${item.ordem.map((original, posicao) => {
      const marcada = item.resposta === original;
      const certa = original === item.q.correta;
      let classe = '';
      let marcador = '';
      if (mostrarCorrecao) {
        if (certa) {
          classe = 'correta';
          marcador = html`<span class="marcador">${icone('check-circulo', { tamanho: 18 })}<span>${marcada ? 'Sua resposta — correta' : 'Resposta correta'}</span></span>`;
        } else if (marcada) {
          classe = 'errada';
          marcador = html`<span class="marcador">${icone('x-circulo', { tamanho: 18 })}<span>Sua resposta</span></span>`;
        }
      }
      const id = `alt-${item.q.id}-${original}`;
      return html`<label class="alternativa ${classe} ${marcada ? 'marcada' : ''}" for="${id}">
        <input type="radio" name="alternativa" id="${id}" value="${original}" ${marcada ? 'checked' : ''} ${bloqueado ? 'disabled' : ''} data-foco="${id}">
        <span class="letra" aria-hidden="true">${LETRAS[posicao]}</span>
        <span class="texto-alt">${md(item.q.alternativas[original], { inline: true })}</span>
        ${marcador}
      </label>`;
    })}
  </div>`;
}

function telaQuestao(dados) {
  const r = rodada;
  const item = r.itens[r.indice];
  const total = r.itens.length;
  const treino = r.modo === 'treino';
  const mostrarCorrecao = treino && r.respondida;
  const acertou = item.resposta === item.q.correta;
  const respondidas = r.itens.filter((i) => i.resposta !== null).length;
  return html`
    <section class="card quiz-card" aria-labelledby="titulo-questao">
      <div class="linha entre quiz-topo">
        <h2 id="titulo-questao" class="pequeno texto-2" tabindex="-1">Questão ${r.indice + 1} de ${total}</h2>
        <div class="linha">
          <span class="selo">${nomeTema(dados, item.q.tema)}</span>
          ${r.modo === 'prova' ? html`<span class="selo selo-contorno cronometro-quiz" aria-live="off">${icone('relogio', { tamanho: 14 })}<span data-tempo-quiz>${relogio(r.fimEm - Date.now())}</span></span>` : ''}
        </div>
      </div>
      ${medidor(((treino ? r.indice + (r.respondida ? 1 : 0) : respondidas) / total) * 100, { rotulo: 'Progresso do quiz' })}
      <form class="pilha" data-form="resposta">
        <div class="quiz-enunciado" id="enunciado-atual">${md(item.q.enunciado)}</div>
        ${alternativasHtml(item, { mostrarCorrecao, bloqueado: mostrarCorrecao })}
        <div aria-live="polite" class="pilha-p">
          ${mostrarCorrecao
            ? html`<div class="faixa ${acertou ? 'faixa-bom' : 'faixa-erro'}">
                ${icone(acertou ? 'check-circulo' : 'x-circulo')}
                <div class="pilha-p"><strong>${acertou ? 'Correto!' : 'Incorreto.'}</strong>${md(item.q.explicacao ?? '')}</div>
              </div>`
            : ''}
        </div>
        <div class="linha entre">
          <div class="linha">
            ${treino
              ? mostrarCorrecao
                ? html`<button class="btn btn-primario" type="button" data-acao="proxima" data-foco="proxima">${r.indice + 1 < total ? html`Próxima ${icone('seta-direita', { tamanho: 18 })}` : 'Ver resultado'}</button>
                  ${!acertou ? html`<button class="btn" type="button" data-acao="virar-cartao" data-id="${item.q.id}">${icone('flashcards', { tamanho: 18 })}Transformar em flashcard</button>` : ''}`
                : html`<button class="btn btn-primario" type="submit" data-foco="responder">Responder</button>`
              : html`<button class="btn" type="button" data-acao="anterior" ${r.indice === 0 ? 'disabled' : ''}>${icone('seta-esquerda', { tamanho: 18 })}Anterior</button>
                ${r.indice + 1 < total ? html`<button class="btn btn-primario" type="button" data-acao="proxima" data-foco="proxima">Próxima ${icone('seta-direita', { tamanho: 18 })}</button>` : ''}`}
          </div>
          <div class="linha">
            ${!treino ? html`<button class="btn btn-perigo" type="button" data-acao="finalizar">Finalizar prova</button>` : ''}
            <button class="btn btn-fantasma" type="button" data-acao="abandonar">Sair</button>
          </div>
        </div>
        <p class="mini muted">Atalhos: <kbd>1</kbd>–<kbd>4</kbd> escolhem a alternativa${treino ? html` · <kbd>Enter</kbd> responde` : ''}.</p>
      </form>
      ${!treino
        ? html`<nav class="navegador-questoes" aria-label="Ir para a questão">
            ${r.itens.map((it, i) => html`<button type="button" class="btn btn-p ${i === r.indice ? 'atual' : ''} ${it.resposta !== null ? 'respondida' : ''}" data-acao="ir" data-indice="${i}" aria-label="Questão ${i + 1}${it.resposta !== null ? ' (respondida)' : ''}" ${i === r.indice ? html`aria-current="step"` : ''}>${i + 1}</button>`)}
          </nav>`
        : ''}
    </section>`;
}

function telaResultado(dados) {
  const r = rodada;
  const total = r.itens.length;
  const acertos = r.itens.filter((i) => i.resposta === i.q.correta).length;
  const erradas = r.itens.filter((i) => i.resposta !== i.q.correta);
  const porTema = {};
  for (const i of r.itens) {
    const t = (porTema[i.q.tema] ??= { total: 0, acertos: 0 });
    t.total += 1;
    if (i.resposta === i.q.correta) t.acertos += 1;
  }
  const taxa = pct(acertos, total);
  return html`
    <section class="card" aria-labelledby="titulo-resultado">
      <div class="card-titulo"><h2 id="titulo-resultado" tabindex="-1">${icone('alvo')} Resultado</h2></div>
      <div class="resultado-topo">
        <div class="indicador-card">
          <span class="rotulo">Acertos</span>
          <span class="valor valor-heroi">${taxa}%</span>
          <span class="detalhe">${acertos} de ${total} · tempo: ${formatarMinutos(r.duracaoSeg / 60)}${r.modo === 'prova' ? ` · não respondidas: ${r.itens.filter((i) => i.resposta === null).length}` : ''}</span>
        </div>
        <div class="tabela-rolagem cresce" tabindex="0" role="region" aria-label="Tabela de acertos por tema"><table class="tabela">
          <thead><tr><th scope="col">Tema</th><th scope="col" class="num">Acertos</th></tr></thead>
          <tbody>${Object.entries(porTema).map(([id, t]) => html`<tr><td>${nomeTema(dados, id)}</td><td class="num">${t.acertos}/${t.total} (${pct(t.acertos, t.total)}%)</td></tr>`)}</tbody>
        </table></div>
      </div>
      <p class="texto-2" style="margin-top:1rem">${
        taxa >= 80 ? 'Ótimo resultado! Mantenha a revisão espaçada para não esquecer.' : taxa >= 60 ? 'Bom caminho. Revise as explicações abaixo e transforme os erros em flashcards.' : 'Este é um ponto a reforçar — e errar agora ajuda a aprender (efeito do pré-teste). Leia as explicações e crie flashcards dos erros.'
      }</p>
      <div class="linha" style="margin-top:1rem">
        ${erradas.length ? html`<button class="btn btn-primario" type="button" data-acao="refazer">${icone('reiniciar', { tamanho: 18 })}Refazer as ${erradas.length} que errei</button>
          <button class="btn" type="button" data-acao="cartoes-erros">${icone('flashcards', { tamanho: 18 })}Criar flashcards dos erros</button>` : ''}
        <button class="btn" type="button" data-acao="novo-quiz">Novo quiz</button>
      </div>
    </section>
    <section class="pilha-p" aria-labelledby="titulo-revisao">
      <h2 id="titulo-revisao">Revisão das questões</h2>
      ${r.itens.map((item, i) => {
        const certa = item.resposta === item.q.correta;
        const naoRespondida = item.resposta === null;
        return html`<details class="bloco" ${!certa ? 'open' : ''}>
          <summary>
            <span class="${certa ? 'texto-bom' : 'texto-erro'}">${icone(certa ? 'check-circulo' : 'x-circulo', { tamanho: 18 })}</span>
            <span class="cresce">${i + 1}. ${textoPuro(item.q.enunciado).split('\n')[0].slice(0, 140)}</span>
            <span class="selo ${certa ? 'selo-bom' : 'selo-critico'}">${certa ? 'Acertou' : naoRespondida ? 'Não respondida' : 'Errou'}</span>
          </summary>
          <div class="corpo">
            ${md(item.q.enunciado)}
            ${alternativasHtml(item, { mostrarCorrecao: true, bloqueado: true })}
            <div class="faixa faixa-info">${icone('lampada')}<div>${md(item.q.explicacao ?? '')}</div></div>
            ${!certa ? html`<div><button class="btn btn-p" type="button" data-acao="virar-cartao" data-id="${item.q.id}" ${r.convertidas.has(item.q.id) ? 'disabled' : ''}>${icone('flashcards', { tamanho: 16 })}${r.convertidas.has(item.q.id) ? 'Flashcard criado' : 'Transformar em flashcard'}</button></div>` : ''}
          </div>
        </details>`;
      })}
    </section>`;
}

function conteudo(dados, estado) {
  let corpo;
  if (rodada && !rodada.finalizada) corpo = telaQuestao(dados);
  else if (rodada && rodada.finalizada) corpo = telaResultado(dados);
  else corpo = html`${formularioConfig(dados)}${historico(dados, estado)}`;
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Quiz</h1>
        <p class="subtitulo">Responda <strong>sem consultar</strong>: é a prática de recuperação que fixa o conteúdo. Errar aqui é barato — e ensina.</p>
      </div>
      ${rodada?.finalizada ? html`<button class="btn" type="button" data-acao="novo-quiz">${icone('seta-esquerda', { tamanho: 18 })}Voltar ao início</button>` : ''}
    </header>
    ${corpo}`;
}

// ---------- Montagem ----------

export function montar(el, { dados, params }) {
  if (!dados.quiz?.questoes?.length) {
    renderizar(el, html`<header class="cabecalho-pagina"><div class="titulos"><h1>Quiz</h1></div></header>
      <p class="texto-2">O arquivo <code>data/quiz.json</code> não pôde ser carregado.</p>`);
    return undefined;
  }
  // Parâmetros vindos do cronograma/painel pré-preenchem o formulário
  const temaParam = params.get('tema');
  if (temaParam && (temaParam === 'misto' || temasDe(dados).some((t) => t.id === temaParam))) preferencias.tema = temaParam;
  if (params.get('modo') === 'prova' || params.get('modo') === 'treino') preferencias.modo = params.get('modo');
  if (params.get('qtd')) preferencias.qtd = params.get('qtd') === 'todas' ? 'todas' : Number(params.get('qtd')) || 10;
  if (params.has('tema') || params.has('modo')) {
    if (rodada?.finalizada) rodada = null; // mostra o formulário já preenchido
  }

  const render = () => renderizarPreservandoFoco(el, conteudo(dados, obterEstado()));
  render();

  // Cronômetro do modo prova
  const relogioProva = setInterval(() => {
    if (!rodada || rodada.finalizada || rodada.modo !== 'prova') return;
    const restante = rodada.fimEm - Date.now();
    const alvo = el.querySelector('[data-tempo-quiz]');
    if (alvo) alvo.textContent = relogio(restante);
    if (restante <= 0) {
      finalizarRodada();
      toast('Tempo esgotado! A prova foi finalizada.', { tipo: 'aviso' });
      render();
      focarResultado();
    }
  }, 500);

  const focarResultado = () => requestAnimationFrame(() => el.querySelector('#titulo-resultado')?.focus());
  const focar = (seletor) => requestAnimationFrame(() => el.querySelector(seletor)?.focus());

  const escolher = (valor) => {
    if (!rodada || rodada.finalizada) return;
    if (rodada.modo === 'treino' && rodada.respondida) return;
    rodada.itens[rodada.indice].resposta = Number(valor);
  };

  const responderTreino = () => {
    const item = rodada.itens[rodada.indice];
    if (item.resposta === null) {
      toast('Escolha uma alternativa antes de responder.', { tipo: 'aviso', duracao: 2500 });
      return;
    }
    rodada.respondida = true;
    registrarRespostas([item]); // dispara re-render via assinatura
    focar('[data-foco="proxima"]');
  };

  const avancar = () => {
    if (rodada.modo === 'treino') {
      if (rodada.indice + 1 >= rodada.itens.length) {
        finalizarRodada();
        render();
        focarResultado();
        return;
      }
      rodada.indice += 1;
      rodada.respondida = false;
    } else {
      rodada.indice = Math.min(rodada.itens.length - 1, rodada.indice + 1);
    }
    render();
    focar('#titulo-questao');
  };

  const criarCartaoDe = async (id) => {
    const item = rodada?.itens.find((i) => i.q.id === id);
    if (!item) return;
    const correta = item.q.alternativas[item.q.correta];
    const criado = await abrirNovoCartao(dados, {
      tema: item.q.tema,
      pergunta: item.q.enunciado,
      resposta: `${correta}\n\n${item.q.explicacao ?? ''}`.trim()
    });
    if (criado) {
      rodada.convertidas.add(id);
      render();
    }
  };

  const aoEnviar = (e) => {
    const form = e.target;
    if (form.dataset.form === 'config') {
      e.preventDefault();
      const fd = new FormData(form);
      preferencias = {
        tema: String(fd.get('tema')),
        qtd: fd.get('qtd') === 'todas' ? 'todas' : Number(fd.get('qtd')),
        modo: String(fd.get('modo')),
        priorizar: fd.get('priorizar') === 'on'
      };
      iniciarRodada(dados, obterEstado(), preferencias);
      render();
      focar('#titulo-questao');
    } else if (form.dataset.form === 'resposta') {
      e.preventDefault();
      if (rodada?.modo === 'treino' && !rodada.respondida) responderTreino();
    }
  };

  const aoMudar = (e) => {
    if (e.target.name === 'alternativa') {
      escolher(e.target.value);
      if (rodada?.modo === 'prova') {
        // marca visualmente sem perder o foco
        el.querySelectorAll('.alternativa').forEach((l) => l.classList.toggle('marcada', l.contains(e.target)));
        const botao = el.querySelector(`.navegador-questoes [data-indice="${rodada.indice}"]`);
        botao?.classList.add('respondida');
      } else {
        el.querySelectorAll('.alternativa').forEach((l) => l.classList.toggle('marcada', l.contains(e.target)));
      }
    }
  };

  const aoClicar = async (e) => {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'proxima') avancar();
    else if (acao === 'anterior') {
      rodada.indice = Math.max(0, rodada.indice - 1);
      render();
      focar('#titulo-questao');
    } else if (acao === 'ir') {
      rodada.indice = Number(alvo.dataset.indice);
      render();
      focar('#titulo-questao');
    } else if (acao === 'finalizar') {
      const faltam = rodada.itens.filter((i) => i.resposta === null).length;
      const ok = faltam === 0 || (await confirmar({ titulo: 'Finalizar a prova?', mensagem: `Ainda há ${faltam} questão(ões) sem resposta — elas contam como erro.`, textoConfirmar: 'Finalizar' }));
      if (!ok) return;
      finalizarRodada();
      render();
      focarResultado();
    } else if (acao === 'abandonar') {
      const ok = await confirmar({ titulo: 'Sair do quiz?', mensagem: rodada.modo === 'treino' ? 'As respostas já dadas ficam registradas no histórico.' : 'As respostas desta prova serão descartadas.', textoConfirmar: 'Sair' });
      if (!ok) return;
      rodada = null;
      render();
    } else if (acao === 'novo-quiz') {
      rodada = null;
      render();
      focar('#quiz-tema');
    } else if (acao === 'refazer') {
      const ids = rodada.itens.filter((i) => i.resposta !== i.q.correta).map((i) => i.q.id);
      iniciarRodada(dados, obterEstado(), { ...preferencias, ids, qtd: ids.length, modo: 'treino' });
      render();
      focar('#titulo-questao');
    } else if (acao === 'virar-cartao') {
      await criarCartaoDe(alvo.dataset.id);
    } else if (acao === 'cartoes-erros') {
      const pendentes = rodada.itens.filter((i) => i.resposta !== i.q.correta && !rodada.convertidas.has(i.q.id));
      if (!pendentes.length) return;
      atualizar((s) => {
        for (const item of pendentes) {
          s.flashcards.meus.push({
            id: idAleatorio('meu'),
            tema: item.q.tema,
            pergunta: item.q.enunciado,
            resposta: `${item.q.alternativas[item.q.correta]}\n\n${item.q.explicacao ?? ''}`.trim(),
            criadoEm: new Date().toISOString(),
            origem: item.q.id
          });
          rodada.convertidas.add(item.q.id);
        }
      }, 'flashcards');
      toast(`${pendentes.length} flashcard(s) criado(s) a partir dos erros.`, { tipo: 'sucesso' });
    }
  };

  const aoTeclar = (e) => {
    if (!rodada || rodada.finalizada || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    const emRadio = e.target instanceof HTMLInputElement && e.target.type === 'radio';
    if (digitando(e) && !emRadio) return;
    if (e.key === 'Enter' && emRadio && rodada.modo === 'treino' && !rodada.respondida) {
      e.preventDefault();
      responderTreino();
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const radios = el.querySelectorAll('input[name="alternativa"]:not(:disabled)');
      const radio = radios[n - 1];
      if (radio) {
        e.preventDefault();
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        radio.focus();
      }
    }
  };

  el.addEventListener('submit', aoEnviar);
  el.addEventListener('change', aoMudar);
  el.addEventListener('click', aoClicar);
  document.addEventListener('keydown', aoTeclar);
  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas' || motivo === 'nota') return;
    render();
  });
  return () => {
    clearInterval(relogioProva);
    document.removeEventListener('keydown', aoTeclar);
    cancelar();
  };
}
