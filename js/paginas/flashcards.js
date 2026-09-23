// =========================================================
// Página: Flashcards — repetição espaçada com SM-2.
//
// Fluxo (active recall): a pergunta aparece sozinha; você tenta
// lembrar; só então revela a resposta e se avalia:
//   Errei (1) · Difícil (3) · Bom (4) · Fácil (5)
// Cartões com nota < 4 voltam no fim da sessão (reforço do dia),
// sem alterar o agendamento — como no passo 7 do SM-2 original.
// =========================================================

import { obterEstado, atualizar, assinar, registrarAtividade } from '../core/estado.js';
import { html, md, renderizar, renderizarPreservandoFoco, digitando, embaralhar, normalizar, textoPuro, idAleatorio } from '../lib/dom.js';
import { icone, medidor, dialogoFormulario, confirmar, toast } from '../lib/ui.js';
import { hojeISO, pluralDias, dataCurta, relativo } from '../lib/datas.js';
import { BOTOES, revisar, estaVencido, previsaoIntervalos, situacao, ROTULO_SITUACAO } from '../lib/sm2.js';
import { todosCartoes, resumoFlashcards, novosRestantesHoje, intercalarPorTema } from '../lib/estatisticas.js';

// Sessão em memória (sobrevive a re-renderizações da página)
let sessao = null;
let buscaLista = '';

function temasDe(dados) {
  return dados.flashcards?.temas ?? [];
}

function nomeTema(dados, id) {
  return temasDe(dados).find((t) => t.id === id)?.nome ?? id;
}

function intercalar(a, b) {
  const saida = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) saida.push(a[i]);
    if (i < b.length) saida.push(b[i]);
  }
  return saida;
}

/** Monta a fila do dia: vencidos + novos (intercalados) + reforços pendentes. */
function novaSessao(dados, estado, tema, livre = false) {
  const hoje = hojeISO();
  const cartoes = todosCartoes(dados, estado).filter((c) => !tema || c.tema === tema);
  const prog = estado.flashcards.progresso;
  let fila;
  if (livre) {
    fila = embaralhar(cartoes).map((c) => c.id);
  } else {
    const vencidos = cartoes.filter((c) => estaVencido(prog[c.id], hoje)).sort((a, b) => prog[a.id].proxima.localeCompare(prog[b.id].proxima));
    const novos = intercalarPorTema(cartoes.filter((c) => !prog[c.id]?.revisoes)).slice(0, novosRestantesHoje(estado, hoje));
    const reforcoIds = estado.flashcards.reforco.data === hoje ? estado.flashcards.reforco.ids : [];
    const reforco = cartoes.filter((c) => reforcoIds.includes(c.id) && !estaVencido(prog[c.id], hoje));
    fila = [...intercalar(vencidos, novos), ...reforco].map((c) => c.id);
  }
  return { chave: `${hoje}|${tema ?? ''}|${livre}`, tema, livre, fila, total: fila.length, revisadas: 0, lembradas: 0, revelado: false };
}

function ehReforco(estado, id, hoje) {
  const r = estado.flashcards.reforco;
  return r.data === hoje && r.ids.includes(id) && estado.flashcards.progresso[id]?.ultima === hoje;
}

// ---------- Renderização ----------

function chipsTemas(dados, estado, tema, aba) {
  const hoje = hojeISO();
  const cartoes = todosCartoes(dados, estado);
  const resumo = resumoFlashcards(cartoes, estado, hoje);
  const restantes = novosRestantesHoje(estado, hoje);
  const sufixo = aba === 'lista' ? '&aba=lista' : '';
  const contagem = (t) => (aba === 'lista' ? t.total : t.vencidos + Math.min(t.novos, restantes));
  const totalGeral = aba === 'lista' ? resumo.total : resumo.vencidos + resumo.novosDisponiveis;
  const legenda = aba === 'lista'
    ? 'Números = total de cartões do tema.'
    : `Números = cartões na fila de hoje ao filtrar pelo tema (vencidos + novos, até o limite diário de ${estado.config.novosPorDia} novos).`;
  return html`<p class="mini muted">${legenda}</p><nav class="chips chips-rolagem" aria-label="Filtrar por tema">
    <a class="chip" href="#/flashcards?${sufixo.slice(1)}" ${!tema ? html`aria-current="true"` : ''}>Todos os temas <span class="num">${totalGeral}</span></a>
    ${temasDe(dados).map((t) => {
      const r = resumo.porTema[t.id] ?? { vencidos: 0, novos: 0, total: 0 };
      return html`<a class="chip" href="#/flashcards?tema=${t.id}${sufixo}" ${tema === t.id ? html`aria-current="true"` : ''}>${t.nome} <span class="num">${contagem(r)}</span></a>`;
    })}
  </nav>`;
}

function botoesAvaliacao(estado, id, hoje, reforco) {
  const previsao = previsaoIntervalos(estado.flashcards.progresso[id], hoje);
  return html`<div class="avaliacao" role="group" aria-label="Como foi lembrar?">
    ${BOTOES.map((b) => {
      const dica = reforco ? (b.q < 4 ? 'volta de novo' : 'sai da fila') : b.q < 3 ? `${pluralDias(previsao[b.id])} + reforço hoje` : b.q < 4 ? `${pluralDias(previsao[b.id])} + reforço hoje` : pluralDias(previsao[b.id]);
      return html`<button type="button" class="btn botao-nota nota-${b.id}" data-nota="${b.q}" data-foco="nota-${b.id}" title="${b.descricao}">
        <span class="nota-rotulo">${b.rotulo} <kbd>${b.tecla}</kbd></span>
        <span class="nota-intervalo">${dica}</span>
      </button>`;
    })}
  </div>`;
}

function areaRevisao(dados, estado) {
  const hoje = hojeISO();
  const cartoes = todosCartoes(dados, estado);
  const mapa = new Map(cartoes.map((c) => [c.id, c]));
  // remove da fila cartões que deixaram de existir
  sessao.fila = sessao.fila.filter((id) => mapa.has(id));

  if (!sessao.fila.length) return fimSessao(dados, estado);

  const cartao = mapa.get(sessao.fila[0]);
  const prog = estado.flashcards.progresso[cartao.id];
  const reforco = !sessao.livre && ehReforco(estado, cartao.id, hoje);
  const tipo = sessao.livre ? 'Treino livre' : reforco ? 'Reforço' : !prog?.revisoes ? 'Novo' : 'Revisão';
  const feitos = sessao.revisadas;
  const totalSessao = feitos + sessao.fila.length;

  return html`
    ${sessao.livre ? html`<div class="faixa faixa-info">${icone('info')}<div class="cresce">Modo treino livre: as respostas <strong>não alteram</strong> o agendamento do SM-2.</div><button class="btn btn-p" type="button" data-acao="sair-livre">Voltar para a fila do dia</button></div>` : ''}
    <div class="sessao-progresso">
      <div class="linha entre pequeno"><span class="texto-2">Cartão ${feitos + 1} de ${totalSessao}</span><span class="muted">${sessao.fila.length} na fila</span></div>
      ${medidor((feitos / Math.max(1, totalSessao)) * 100, { rotulo: 'Progresso da sessão' })}
    </div>
    <article class="flashcard ${sessao.revelado ? 'revelado' : ''}" aria-labelledby="fc-pergunta-titulo">
      <div class="flashcard-topo linha entre">
        <span class="selo">${nomeTema(dados, cartao.tema)}</span>
        <span class="linha">${cartao.meu ? html`<span class="selo selo-contorno">Meu cartão</span>` : ''}<span class="selo ${tipo === 'Novo' ? 'selo-acento' : ''}">${tipo}</span></span>
      </div>
      <div class="flashcard-face">
        <h2 id="fc-pergunta-titulo" class="sr-only">Pergunta</h2>
        <div class="flashcard-pergunta">${md(cartao.pergunta)}</div>
      </div>
      ${
        sessao.revelado
          ? html`<div class="flashcard-resposta" aria-live="polite">
              <h2 class="rotulo-resposta" tabindex="-1" id="fc-resposta-titulo">Resposta</h2>
              ${md(cartao.resposta)}
            </div>
            ${botoesAvaliacao(estado, cartao.id, hoje, reforco || sessao.livre)}
            <p class="mini muted centro">Atalhos: <kbd>1</kbd> Errei · <kbd>2</kbd> Difícil · <kbd>3</kbd> Bom · <kbd>4</kbd> Fácil</p>`
          : html`<div class="flashcard-acoes">
              <p class="texto-2 pequeno centro">Tente responder mentalmente (ou em voz alta) antes de revelar.</p>
              <button type="button" class="btn btn-primario btn-g" data-acao="revelar" data-foco="revelar">${icone('olho', { tamanho: 18 })}Mostrar resposta <kbd>Espaço</kbd></button>
            </div>`
      }
    </article>
  `;
}

function fimSessao(dados, estado) {
  const hoje = hojeISO();
  const cartoes = todosCartoes(dados, estado).filter((c) => !sessao.tema || c.tema === sessao.tema);
  const r = resumoFlashcards(cartoes, estado, hoje);
  const temNovos = r.novosTotal > 0;
  const revisou = sessao.revisadas > 0;
  return html`<div class="card vazio fim-sessao">
    <span class="icone-vazio">${icone('check-circulo', { tamanho: 28 })}</span>
    <h2>${revisou ? 'Sessão concluída!' : 'Nada para revisar agora'}</h2>
    ${revisou ? html`<p>Você revisou <strong>${sessao.revisadas}</strong> cartão(ões); lembrou com facilidade (Bom/Fácil) de <strong>${sessao.lembradas}</strong>.</p>` : ''}
    <p class="texto-2">${r.venceAmanha ? `Amanhã vencem ${r.venceAmanha} cartão(ões).` : 'Nenhum cartão vence amanhã.'} ${temNovos ? `Ainda há ${r.novosTotal} cartões novos neste filtro.` : 'Todos os cartões deste filtro já foram vistos.'}</p>
    <div class="linha" style="justify-content:center">
      ${temNovos && !sessao.livre ? html`<button class="btn btn-primario" type="button" data-acao="mais-novos">${icone('mais', { tamanho: 18 })}Estudar mais 10 novos hoje</button>` : ''}
      <button class="btn" type="button" data-acao="livre">${icone('embaralhar', { tamanho: 18 })}Treino livre (não altera agendamento)</button>
      <a class="btn btn-fantasma" href="#/flashcards?aba=lista${sessao.tema ? `&tema=${sessao.tema}` : ''}">Ver todos os cartões</a>
    </div>
    <p class="mini muted">Dica: estudar um pouco todo dia vale mais que maratonas. O limite de novos por dia pode ser ajustado em Ajustes.</p>
  </div>`;
}

function areaLista(dados, estado, tema) {
  return html`
    <div class="linha-g" role="search">
      <div class="campo busca cresce">
        <label class="sr-only" for="busca-cartoes">Buscar cartões</label>
        ${icone('busca', { tamanho: 18 })}
        <input class="entrada" type="search" id="busca-cartoes" placeholder="Buscar em perguntas e respostas…" value="${buscaLista}">
      </div>
    </div>
    <div id="lista-cartoes" class="pilha">${listaCartoes(dados, estado, tema)}</div>`;
}

function listaCartoes(dados, estado, tema) {
  const hoje = hojeISO();
  const termos = normalizar(buscaLista).split(/\s+/).filter(Boolean);
  const cartoes = todosCartoes(dados, estado)
    .filter((c) => !tema || c.tema === tema)
    .filter((c) => {
      if (!termos.length) return true;
      const alvo = normalizar(`${textoPuro(c.pergunta)} ${textoPuro(c.resposta)}`);
      return termos.every((t) => alvo.includes(t));
    });
  const prog = estado.flashcards.progresso;
  const grupos = temasDe(dados)
    .map((t) => ({ tema: t, cartoes: cartoes.filter((c) => c.tema === t.id) }))
    .filter((g) => g.cartoes.length);
  return html`<p class="texto-2 pequeno" aria-live="polite">${cartoes.length} cartão(ões)</p>
      ${grupos.length
        ? grupos.map(
            (g) => html`<section class="pilha-p" aria-labelledby="grupo-${g.tema.id}">
              <h2 id="grupo-${g.tema.id}" class="h-grupo">${g.tema.nome} <span class="muted pequeno">(${g.cartoes.length})</span></h2>
              ${g.cartoes.map((c) => {
                const p = prog[c.id];
                const sit = situacao(p);
                return html`<details class="bloco cartao-lista">
                  <summary><span class="cresce">${md(c.pergunta.split('\n')[0], { inline: true })}</span>
                    <span class="linha">${c.meu ? html`<span class="selo selo-contorno">Meu</span>` : ''}
                    <span class="selo ${sit === 'novo' ? 'selo-acento' : ''}">${ROTULO_SITUACAO[sit]}</span></span></summary>
                  <div class="corpo">
                    ${c.pergunta.includes('\n') ? html`<div>${md(c.pergunta)}</div>` : ''}
                    <div class="flashcard-resposta">${md(c.resposta)}</div>
                    <p class="mini muted">${
                      p?.revisoes
                        ? `Revisões: ${p.revisoes} · erros: ${p.lapsos} · fator de facilidade: ${Number(p.ef).toFixed(2)} · intervalo: ${pluralDias(p.intervalo)} · próxima: ${dataCurta(p.proxima, true)} (${relativo(p.proxima, hoje)})`
                        : 'Ainda não estudado.'
                    }</p>
                    <div class="linha">
                      ${c.meu ? html`<button class="btn btn-p" type="button" data-acao="editar" data-id="${c.id}" data-foco="editar-${c.id}">${icone('editar', { tamanho: 16 })}Editar</button>
                        <button class="btn btn-p btn-perigo" type="button" data-acao="excluir" data-id="${c.id}">${icone('lixeira', { tamanho: 16 })}Excluir</button>` : ''}
                      ${p?.revisoes ? html`<button class="btn btn-p btn-fantasma" type="button" data-acao="reiniciar" data-id="${c.id}" data-foco="reiniciar-${c.id}">${icone('reiniciar', { tamanho: 16 })}Reiniciar progresso</button>` : ''}
                    </div>
                  </div>
                </details>`;
              })}
            </section>`
          )
        : html`<div class="vazio"><span class="icone-vazio">${icone('busca', { tamanho: 26 })}</span><p>Nenhum cartão encontrado.</p></div>`}`;
}

function conteudo(dados, estado, tema, aba) {
  const hoje = hojeISO();
  const r = resumoFlashcards(todosCartoes(dados, estado), estado, hoje);
  const sufixoTema = tema ? `tema=${tema}` : '';
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Flashcards</h1>
        <p class="subtitulo">Repetição espaçada (SM-2): tente lembrar <strong>antes</strong> de ver a resposta. Estudados: ${r.estudados} de ${r.total} · maduros (intervalo ≥ 21 dias): ${r.maduros}.</p>
      </div>
      <button class="btn" type="button" data-acao="novo" data-foco="novo-cartao">${icone('mais', { tamanho: 18 })}Novo cartão</button>
    </header>
    <nav class="abas" aria-label="Modo">
      <a class="aba" href="#/flashcards?${sufixoTema}" ${aba !== 'lista' ? html`aria-current="page"` : ''}>${icone('flashcards', { tamanho: 16 })}Revisar hoje <span class="pct">${r.vencidos + r.novosDisponiveis}</span></a>
      <a class="aba" href="#/flashcards?aba=lista${tema ? `&${sufixoTema}` : ''}" ${aba === 'lista' ? html`aria-current="page"` : ''}>${icone('tabela', { tamanho: 16 })}Todos os cartões <span class="pct">${r.total}</span></a>
    </nav>
    ${chipsTemas(dados, estado, tema, aba)}
    <section id="area-flashcards" aria-label="${aba === 'lista' ? 'Lista de cartões' : 'Revisão'}">
      ${aba === 'lista' ? areaLista(dados, estado, tema) : areaRevisao(dados, estado)}
    </section>
  `;
}

// ---------- Cartões próprios ----------

function camposCartao(dados, cartao = {}) {
  return html`
    <div class="campo">
      <label for="novo-tema">Tema</label>
      <select class="entrada" id="novo-tema" name="tema">
        ${temasDe(dados).map((t) => html`<option value="${t.id}" ${cartao.tema === t.id ? 'selected' : ''}>${t.nome}</option>`)}
      </select>
    </div>
    <div class="campo">
      <label for="novo-pergunta">Pergunta</label>
      <textarea class="entrada" id="novo-pergunta" name="pergunta" rows="3" autofocus>${cartao.pergunta ?? ''}</textarea>
    </div>
    <div class="campo">
      <label for="novo-resposta">Resposta</label>
      <textarea class="entrada" id="novo-resposta" name="resposta" rows="4">${cartao.resposta ?? ''}</textarea>
      <span class="ajuda">Formatação: <code>\`código\`</code>, <code>**negrito**</code>, listas com "- " e blocos com três crases.</span>
    </div>`;
}

function validarCartao(form) {
  const dados = new FormData(form);
  if (!String(dados.get('pergunta') ?? '').trim()) return 'Escreva a pergunta.';
  if (!String(dados.get('resposta') ?? '').trim()) return 'Escreva a resposta.';
  return null;
}

/**
 * Abre o diálogo de novo cartão (também usado pelo Quiz e pelo Diário).
 * Retorna true se o cartão foi criado.
 */
export async function abrirNovoCartao(dados, inicial = {}) {
  const resultado = await dialogoFormulario({
    titulo: 'Novo flashcard',
    descricao: 'Criar o próprio cartão é uma forma de "gerar" o conhecimento — ajuda a memorizar. Prefira uma ideia por cartão.',
    campos: camposCartao(dados, inicial),
    textoConfirmar: 'Criar cartão',
    validar: validarCartao
  });
  if (!resultado) return false;
  atualizar((s) => {
    s.flashcards.meus.push({
      id: idAleatorio('meu'),
      tema: String(resultado.get('tema')),
      pergunta: String(resultado.get('pergunta')).trim(),
      resposta: String(resultado.get('resposta')).trim(),
      criadoEm: new Date().toISOString()
    });
    registrarAtividade(s);
  }, 'flashcards');
  toast('Cartão criado! Ele entra na fila como cartão novo.', { tipo: 'sucesso' });
  return true;
}

// ---------- Montagem ----------

export function montar(el, { dados, params }) {
  if (!dados.flashcards) {
    renderizar(el, html`<header class="cabecalho-pagina"><div class="titulos"><h1>Flashcards</h1></div></header>
      <p class="texto-2">O arquivo <code>data/flashcards.json</code> não pôde ser carregado. Seus cartões próprios continuam salvos.</p>`);
    return undefined;
  }
  const temaParam = params.get('tema');
  const tema = temasDe(dados).some((t) => t.id === temaParam) ? temaParam : null;
  const aba = params.get('aba') === 'lista' ? 'lista' : 'revisar';

  // Sempre recalcula a fila ao entrar (o progresso salvo garante que nada se repete indevidamente)
  sessao = novaSessao(dados, obterEstado(), tema);

  const render = () => renderizarPreservandoFoco(el, conteudo(dados, obterEstado(), tema, aba));
  render();
  // no celular os chips rolam na horizontal: garante que o tema escolhido fique visível
  el.querySelector('.chips-rolagem [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

  const focar = (seletor) => requestAnimationFrame(() => el.querySelector(seletor)?.focus());

  const revelar = () => {
    if (aba === 'lista' || sessao.revelado || !sessao.fila.length) return;
    sessao.revelado = true;
    render();
    focar('#fc-resposta-titulo');
  };

  const avaliar = (q) => {
    if (!sessao.revelado || !sessao.fila.length) return;
    const hoje = hojeISO();
    const id = sessao.fila.shift();
    const estado = obterEstado();
    const reforco = ehReforco(estado, id, hoje);
    sessao.revisadas += 1;
    if (q >= 4) sessao.lembradas += 1;
    sessao.revelado = false;

    if (sessao.livre) {
      atualizar((s) => registrarAtividade(s), 'flashcards');
    } else if (reforco) {
      // Reforço do dia: não mexe no SM-2
      if (q < 4) sessao.fila.push(id);
      atualizar((s) => {
        if (q >= 4) s.flashcards.reforco.ids = s.flashcards.reforco.ids.filter((x) => x !== id);
        registrarAtividade(s);
      }, 'flashcards');
    } else {
      if (q < 4) sessao.fila.push(id);
      atualizar((s) => {
        const anterior = s.flashcards.progresso[id];
        const eraNovo = !anterior?.revisoes;
        s.flashcards.progresso[id] = revisar(anterior, q, hoje);
        if (eraNovo) {
          if (s.flashcards.novosHoje.data !== hoje) s.flashcards.novosHoje = { data: hoje, qtd: 0, extra: 0 };
          s.flashcards.novosHoje.qtd += 1;
        }
        if (q < 4) {
          if (s.flashcards.reforco.data !== hoje) s.flashcards.reforco = { data: hoje, ids: [] };
          if (!s.flashcards.reforco.ids.includes(id)) s.flashcards.reforco.ids.push(id);
        }
        registrarAtividade(s);
      }, 'flashcards');
    }
    focar(sessao.fila.length ? '[data-foco="revelar"]' : '.fim-sessao .btn');
  };

  const aoClicar = async (e) => {
    const alvo = e.target.closest('[data-acao], [data-nota]');
    if (!alvo) return;
    if (alvo.dataset.nota) return avaliar(Number(alvo.dataset.nota));
    const acao = alvo.dataset.acao;
    const estado = obterEstado();
    if (acao === 'revelar') revelar();
    else if (acao === 'mais-novos') {
      const hoje = hojeISO();
      atualizar((s) => {
        if (s.flashcards.novosHoje.data !== hoje) s.flashcards.novosHoje = { data: hoje, qtd: 0, extra: 0 };
        s.flashcards.novosHoje.extra = (s.flashcards.novosHoje.extra || 0) + 10;
      }, 'flashcards-extra');
      sessao = novaSessao(dados, obterEstado(), tema);
      render();
      focar('[data-foco="revelar"]');
    } else if (acao === 'livre') {
      sessao = novaSessao(dados, estado, tema, true);
      render();
      focar('[data-foco="revelar"]');
    } else if (acao === 'sair-livre') {
      sessao = novaSessao(dados, estado, tema);
      render();
    } else if (acao === 'novo') {
      await abrirNovoCartao(dados, { tema: tema ?? undefined });
      sessao = novaSessao(dados, obterEstado(), tema);
      render();
    } else if (acao === 'editar') {
      const cartao = estado.flashcards.meus.find((c) => c.id === alvo.dataset.id);
      if (!cartao) return;
      const resultado = await dialogoFormulario({ titulo: 'Editar cartão', campos: camposCartao(dados, cartao), validar: validarCartao });
      if (!resultado) return;
      atualizar((s) => {
        const c = s.flashcards.meus.find((x) => x.id === cartao.id);
        if (c) {
          c.tema = String(resultado.get('tema'));
          c.pergunta = String(resultado.get('pergunta')).trim();
          c.resposta = String(resultado.get('resposta')).trim();
        }
      }, 'flashcards');
      toast('Cartão atualizado.', { tipo: 'sucesso' });
    } else if (acao === 'excluir') {
      const ok = await confirmar({ titulo: 'Excluir cartão?', mensagem: 'O cartão e o histórico de revisões dele serão apagados.', textoConfirmar: 'Excluir', perigo: true });
      if (!ok) return;
      atualizar((s) => {
        s.flashcards.meus = s.flashcards.meus.filter((c) => c.id !== alvo.dataset.id);
        delete s.flashcards.progresso[alvo.dataset.id];
      }, 'flashcards');
      toast('Cartão excluído.');
    } else if (acao === 'reiniciar') {
      const ok = await confirmar({ titulo: 'Reiniciar este cartão?', mensagem: 'Ele volta a ser um cartão novo (o histórico de revisões dele é apagado).', textoConfirmar: 'Reiniciar' });
      if (!ok) return;
      atualizar((s) => {
        delete s.flashcards.progresso[alvo.dataset.id];
      }, 'flashcards');
    }
    return undefined;
  };

  const aoTeclar = (e) => {
    if (aba === 'lista' || e.ctrlKey || e.metaKey || e.altKey || digitando(e)) return;
    if (document.querySelector('dialog[open]')) return;
    if ((e.key === ' ' || e.key === 'Enter') && !sessao.revelado) {
      // Enter/Espaço sobre um botão já dispara o clique dele
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
      e.preventDefault();
      revelar();
    } else if (sessao.revelado && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      avaliar(BOTOES[Number(e.key) - 1].q);
    }
  };

  const aoDigitar = (e) => {
    if (e.target.id !== 'busca-cartoes') return;
    buscaLista = e.target.value;
    const lista = el.querySelector('#lista-cartoes');
    if (lista) renderizarPreservandoFoco(lista, listaCartoes(dados, obterEstado(), tema));
  };

  el.addEventListener('click', aoClicar);
  el.addEventListener('input', aoDigitar);
  document.addEventListener('keydown', aoTeclar);
  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas' || motivo === 'nota') return;
    render();
  });
  return () => {
    document.removeEventListener('keydown', aoTeclar);
    cancelar();
  };
}
