// =========================================================
// Página: Pomodoro — timer 25/5 (configurável) que registra
// automaticamente o tempo de foco como horas estudadas.
// O timer é global: continua rodando se você mudar de página.
// =========================================================

import { obterEstado, atualizar, assinar } from '../core/estado.js';
import { html, renderizarPreservandoFoco, pct } from '../lib/dom.js';
import { icone, anel, atualizarAnel, graficoSemana, ativarDicasGrafico, confirmar, toast } from '../lib/ui.js';
import { hojeISO, relogio, formatarMinutos, minutosCompacto, nomeDiaSemana, dataCurta, dataComDia, horaCurta, somarDias, isoValido } from '../lib/datas.js';
import { resumoSemana, minutosHoje, listaTarefas } from '../lib/estatisticas.js';
import {
  NOMES_FASE, assinarTimers, restantePomodoro, alternarPomodoro, pularFasePomodoro, zerarPomodoro, selecionarFase,
  definirRotuloPomodoro, registrarSessaoManual, aplicarNovaConfiguracao, duracaoConfigurada
} from '../lib/timers.js';

const ORIGENS = { pomodoro: 'Pomodoro', manual: 'Manual', simulado: 'Simulado' };
let rotuloDigitado = '';

function estadoTimer() {
  const s = obterEstado();
  const a = s.pomodoro.ativo;
  const fase = a?.fase ?? 'foco';
  const duracao = a?.duracaoMs ?? duracaoConfigurada('foco');
  const restante = restantePomodoro();
  return { a, fase, duracao, restante, rodando: a?.status === 'rodando', iniciada: Boolean(a?.iniciada) };
}

function textoBotaoPrincipal(t) {
  if (t.rodando) return html`${icone('pausa', { tamanho: 20 })}Pausar`;
  if (t.iniciada) return html`${icone('play', { tamanho: 20 })}Retomar`;
  return html`${icone('play', { tamanho: 20 })}Iniciar ${NOMES_FASE[t.fase].toLowerCase()}`;
}

function cardTimer(dados, estado) {
  const t = estadoTimer();
  const cfg = estado.config.pomodoro;
  const ciclos = estado.pomodoro.ciclos || 0;
  const noCiclo = ciclos % Math.max(1, cfg.ciclosAteLonga);
  const sugestoes = listaTarefas(dados.cronograma)
    .filter(({ tarefa }) => !estado.cronograma.feitas[tarefa.id] && tarefa.tipo !== 'descanso')
    .slice(0, 6)
    .map(({ tarefa }) => tarefa.titulo);
  const rotulo = t.a?.rotulo ?? rotuloDigitado;
  return html`<section class="card timer-card fase-${t.fase}" aria-labelledby="titulo-timer">
    <h2 id="titulo-timer" class="sr-only">Timer</h2>
    <div class="abas fases" role="group" aria-label="Fase do timer">
      ${['foco', 'pausa', 'pausaLonga'].map(
        (f) => html`<button type="button" class="aba" data-fase="${f}" aria-pressed="${t.fase === f}" ${t.fase === f ? html`aria-current="page"` : ''} ${t.rodando && t.fase !== f ? 'disabled' : ''}>${NOMES_FASE[f]}</button>`
      )}
    </div>
    <div class="relogio-anel" data-anel>
      ${anel(1 - t.restante / t.duracao, { tamanho: 240, espessura: 12 })}
      <div class="relogio-centro">
        <span class="relogio-tempo" data-tempo role="timer" aria-label="Tempo restante">${relogio(t.restante)}</span>
        <span class="relogio-fase">${NOMES_FASE[t.fase]}${t.a && !t.rodando && t.iniciada ? ' · pausado' : ''}</span>
      </div>
    </div>
    <div class="ciclos" aria-label="${noCiclo} de ${cfg.ciclosAteLonga} pomodoros até a pausa longa">
      ${Array.from({ length: cfg.ciclosAteLonga }, (_, i) => html`<span class="ciclo ${i < noCiclo ? 'feito' : ''}" aria-hidden="true"></span>`)}
      <span class="mini muted">${noCiclo}/${cfg.ciclosAteLonga} até a pausa longa</span>
    </div>
    <div class="linha" style="justify-content:center">
      <button type="button" class="btn btn-primario btn-g" data-acao="alternar" data-foco="alternar">${textoBotaoPrincipal(t)}</button>
      <button type="button" class="btn btn-g" data-acao="pular" data-foco="pular" ${t.a ? '' : 'disabled'} title="Encerrar esta fase e ir para a próxima">${icone('pular', { tamanho: 18 })}Pular</button>
      <button type="button" class="btn btn-fantasma btn-g" data-acao="zerar" data-foco="zerar" ${t.a ? '' : 'disabled'}>${icone('reiniciar', { tamanho: 18 })}Zerar</button>
    </div>
    <div class="campo" style="margin-top:1rem">
      <label for="rotulo-pomodoro">No que você vai focar?</label>
      <input class="entrada" id="rotulo-pomodoro" list="sugestoes-pomodoro" value="${rotulo}" placeholder="Ex.: Two Sum com HashMap / API de livros — DTOs">
      <datalist id="sugestoes-pomodoro">${sugestoes.map((s) => html`<option value="${s}"></option>`)}</datalist>
      <span class="ajuda">Sugestões vêm das próximas tarefas do cronograma. O rótulo aparece no registro de horas.</span>
    </div>
  </section>`;
}

function cardHoje(estado) {
  const hoje = hojeISO();
  const sessoesHoje = estado.sessoes.filter((s) => s.data === hoje);
  const pomodorosHoje = sessoesHoje.filter((s) => s.origem === 'pomodoro').length;
  const semana = resumoSemana(estado, hoje);
  const meta = Math.max(1, Number(estado.config.metaHorasSemana) || 1) * 60;
  return html`<section class="card" aria-labelledby="titulo-hoje-pom">
    <div class="card-titulo"><h2 id="titulo-hoje-pom">${icone('grafico')} Seu tempo</h2></div>
    <div class="grade-3 mini-indicadores">
      <div class="indicador-card"><span class="rotulo">Hoje</span><span class="valor">${formatarMinutos(minutosHoje(estado, hoje))}</span></div>
      <div class="indicador-card"><span class="rotulo">Sessões de Pomodoro hoje</span><span class="valor">${pomodorosHoje}</span></div>
      <div class="indicador-card"><span class="rotulo">Semana</span><span class="valor">${formatarMinutos(semana.total)}</span><span class="detalhe">${pct(semana.total, meta)}% da meta de ${formatarMinutos(meta)}</span></div>
    </div>
    <div style="margin-top:1rem">
      ${graficoSemana(semana.dias, hoje, {
        rotuloDia: (d, curto) => (curto ? nomeDiaSemana(d, true) : `${nomeDiaSemana(d)}, ${dataCurta(d)}`),
        formatar: formatarMinutos,
        formatarCompacto: minutosCompacto
      })}
    </div>
  </section>`;
}

function cardManual() {
  return html`<section class="card" aria-labelledby="titulo-manual">
    <div class="card-titulo"><h2 id="titulo-manual">${icone('mais')} Estudou sem o timer? Registre</h2></div>
    <form class="pilha" data-form="manual">
      <div class="linha-g">
        <div class="campo"><label for="man-min">Minutos</label><input class="entrada entrada-curta" type="number" id="man-min" name="minutos" min="1" max="720" step="1" value="30" required></div>
        <div class="campo"><label for="man-data">Data</label><input class="entrada" type="date" id="man-data" name="data" value="${hojeISO()}" max="${hojeISO()}"></div>
      </div>
      <div class="campo"><label for="man-desc">O que você estudou</label><input class="entrada" id="man-desc" name="descricao" placeholder="Ex.: leitura do guia de JPA"></div>
      <div><button class="btn" type="submit">${icone('salvar', { tamanho: 18 })}Registrar tempo</button></div>
    </form>
  </section>`;
}

function cardSessoes(estado) {
  const hoje = hojeISO();
  const limite = somarDias(hoje, -6);
  const recentes = estado.sessoes.filter((s) => s.data >= limite).sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio));
  return html`<section class="card" aria-labelledby="titulo-sessoes">
    <div class="card-titulo"><h2 id="titulo-sessoes">${icone('relogio')} Registros dos últimos 7 dias</h2></div>
    ${recentes.length
      ? html`<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela (role para os lados se precisar)"><table class="tabela">
          <thead><tr><th scope="col">Dia</th><th scope="col">Hora</th><th scope="col">Origem</th><th scope="col">Descrição</th><th scope="col" class="num">Tempo</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
          <tbody>${recentes.map(
            (s) => html`<tr><td>${dataComDia(s.data)}</td><td class="numeros">${s.origem === 'manual' ? '—' : horaCurta(s.inicio)}</td><td>${ORIGENS[s.origem] ?? s.origem}</td>
              <td class="quebra">${s.descricao || html`<span class="muted">—</span>`}</td><td class="num">${formatarMinutos(s.minutos)}</td>
              <td><button type="button" class="btn btn-fantasma btn-icone btn-p" data-acao="apagar-sessao" data-id="${s.id}" aria-label="Apagar registro de ${formatarMinutos(s.minutos)} em ${dataCurta(s.data)}">${icone('lixeira', { tamanho: 16 })}</button></td></tr>`
          )}</tbody></table></div>`
      : html`<p class="texto-2 pequeno">Nenhum registro ainda. Comece um foco de 25 minutos!</p>`}
  </section>`;
}

function cardConfig(estado) {
  const cfg = estado.config.pomodoro;
  const permissao = 'Notification' in window ? Notification.permission : 'indisponivel';
  return html`<section class="card" aria-labelledby="titulo-config-pom">
    <div class="card-titulo"><h2 id="titulo-config-pom">${icone('ajustes')} Configurações do timer</h2></div>
    <form class="pilha" data-form="config">
      <div class="linha-g">
        <div class="campo"><label for="cfg-foco">Foco (min)</label><input class="entrada entrada-curta" type="number" id="cfg-foco" name="foco" min="1" max="180" value="${cfg.foco}"></div>
        <div class="campo"><label for="cfg-pausa">Pausa curta</label><input class="entrada entrada-curta" type="number" id="cfg-pausa" name="pausa" min="1" max="60" value="${cfg.pausa}"></div>
        <div class="campo"><label for="cfg-longa">Pausa longa</label><input class="entrada entrada-curta" type="number" id="cfg-longa" name="pausaLonga" min="1" max="90" value="${cfg.pausaLonga}"></div>
        <div class="campo"><label for="cfg-ciclos">Focos até a pausa longa</label><input class="entrada entrada-curta" type="number" id="cfg-ciclos" name="ciclosAteLonga" min="1" max="12" value="${cfg.ciclosAteLonga}"></div>
      </div>
      <label class="check"><input type="checkbox" name="som" ${cfg.som ? 'checked' : ''}><span class="texto">Tocar alarme no fim de cada fase</span></label>
      <label class="check"><input type="checkbox" name="autoIniciarPausa" ${cfg.autoIniciarPausa ? 'checked' : ''}><span class="texto">Iniciar a pausa automaticamente ao terminar o foco</span></label>
      <label class="check"><input type="checkbox" name="notificacoes" ${estado.config.notificacoes ? 'checked' : ''} ${permissao === 'indisponivel' || permissao === 'denied' ? 'disabled' : ''}>
        <span class="texto">Notificação do navegador quando a aba estiver em segundo plano${permissao === 'denied' ? ' (bloqueada nas permissões do site)' : permissao === 'indisponivel' ? ' (indisponível neste navegador)' : ''}</span></label>
      <div class="linha">
        <button class="btn" type="submit">${icone('salvar', { tamanho: 18 })}Salvar configurações</button>
        <button class="btn btn-fantasma" type="button" data-acao="padrao">Voltar ao 25/5 clássico</button>
      </div>
    </form>
  </section>`;
}

function conteudo(dados, estado) {
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Pomodoro</h1>
        <p class="subtitulo">Foco de 25 minutos, pausa de 5 — e o tempo de foco vira horas estudadas no painel. Use para dar ritmo; nos simulados, siga o tempo da prova.</p>
      </div>
    </header>
    <div class="grade-2 pomodoro-grade">
      <div id="area-timer">${cardTimer(dados, estado)}</div>
      ${cardHoje(estado)}
    </div>
    <div class="grade-2">
      ${cardManual()}
      ${cardConfig(estado)}
    </div>
    ${cardSessoes(estado)}
  `;
}

export function montar(el, { dados }) {
  const render = () => {
    renderizarPreservandoFoco(el, conteudo(dados, obterEstado()));
    ativarDicasGrafico(el);
  };
  render();

  // Atualização leve a cada tick: só o relógio e o anel
  let ultimaChave = '';
  const aoTick = () => {
    const t = estadoTimer();
    const chave = `${t.fase}|${t.a?.status}|${t.iniciada}`;
    if (chave !== ultimaChave) {
      ultimaChave = chave;
      const area = el.querySelector('#area-timer');
      if (area) renderizarPreservandoFoco(area, cardTimer(dados, obterEstado()));
      return;
    }
    const tempo = el.querySelector('[data-tempo]');
    if (tempo) tempo.textContent = relogio(t.restante);
    atualizarAnel(el.querySelector('[data-anel] svg'), 1 - t.restante / t.duracao);
  };
  ultimaChave = (() => {
    const t = estadoTimer();
    return `${t.fase}|${t.a?.status}|${t.iniciada}`;
  })();
  const pararTick = assinarTimers(aoTick);

  const aoClicar = async (e) => {
    const botaoFase = e.target.closest('[data-fase]');
    if (botaoFase) {
      selecionarFase(botaoFase.dataset.fase);
      return;
    }
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'alternar') {
      const rotulo = el.querySelector('#rotulo-pomodoro')?.value.trim() ?? '';
      alternarPomodoro(rotulo);
    } else if (acao === 'pular') pularFasePomodoro();
    else if (acao === 'zerar') {
      const ok = await confirmar({ titulo: 'Zerar o Pomodoro?', mensagem: 'O ciclo recomeça do zero. Se você estava em foco, os minutos já feitos serão registrados.', textoConfirmar: 'Zerar' });
      if (ok) zerarPomodoro();
    } else if (acao === 'apagar-sessao') {
      const ok = await confirmar({ titulo: 'Apagar este registro?', mensagem: 'O tempo será removido das suas horas estudadas.', textoConfirmar: 'Apagar', perigo: true });
      if (ok) {
        atualizar((s) => {
          s.sessoes = s.sessoes.filter((x) => x.id !== alvo.dataset.id);
        }, 'sessao');
      }
    } else if (acao === 'padrao') {
      atualizar((s) => {
        s.config.pomodoro = { ...s.config.pomodoro, foco: 25, pausa: 5, pausaLonga: 15, ciclosAteLonga: 4 };
      }, 'config');
      aplicarNovaConfiguracao();
      toast('Configuração 25/5 restaurada.', { tipo: 'sucesso' });
    }
  };

  const aoEnviar = async (e) => {
    const form = e.target;
    e.preventDefault();
    const fd = new FormData(form);
    if (form.dataset.form === 'manual') {
      const minutos = Math.round(Number(fd.get('minutos')));
      const data = String(fd.get('data') || hojeISO());
      if (!minutos || minutos < 1) return toast('Informe os minutos estudados.', { tipo: 'aviso' });
      if (!isoValido(data) || data > hojeISO()) return toast('Escolha uma data válida (até hoje).', { tipo: 'aviso' });
      registrarSessaoManual({ minutos, data, descricao: String(fd.get('descricao') ?? '').trim() });
      toast(`${formatarMinutos(minutos)} registrados.`, { tipo: 'sucesso' });
    } else if (form.dataset.form === 'config') {
      const numero = (nome, min, max, padrao) => {
        const n = Math.round(Number(fd.get(nome)));
        return Number.isFinite(n) && n >= min && n <= max ? n : padrao;
      };
      const querNotificacao = fd.get('notificacoes') === 'on';
      let notificacoes = querNotificacao;
      if (querNotificacao && 'Notification' in window && Notification.permission === 'default') {
        notificacoes = (await Notification.requestPermission()) === 'granted';
      }
      atualizar((s) => {
        const c = s.config.pomodoro;
        s.config.pomodoro = {
          ...c,
          foco: numero('foco', 1, 180, 25),
          pausa: numero('pausa', 1, 60, 5),
          pausaLonga: numero('pausaLonga', 1, 90, 15),
          ciclosAteLonga: numero('ciclosAteLonga', 1, 12, 4),
          som: fd.get('som') === 'on',
          autoIniciarPausa: fd.get('autoIniciarPausa') === 'on'
        };
        s.config.notificacoes = notificacoes;
      }, 'config');
      aplicarNovaConfiguracao();
      toast('Configurações salvas.', { tipo: 'sucesso' });
    }
    return undefined;
  };

  const aoDigitar = (e) => {
    if (e.target.id !== 'rotulo-pomodoro') return;
    rotuloDigitado = e.target.value;
    definirRotuloPomodoro(e.target.value.trim());
  };

  el.addEventListener('click', aoClicar);
  el.addEventListener('submit', aoEnviar);
  el.addEventListener('input', aoDigitar);
  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas' || motivo === 'nota') return;
    render();
  });
  return () => {
    pararTick();
    cancelar();
  };
}
