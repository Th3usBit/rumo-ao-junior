// =========================================================
// Página: Painel (dashboard)
// Progresso geral e por trilha, sequência de dias, revisões
// pendentes, próxima tarefa, horas da semana e pontos fracos.
// =========================================================

import { obterEstado, atualizar, assinar, registrarAtividade } from '../core/estado.js';
import { exportarBackup } from '../core/backup.js';
import { html, md, renderizarPreservandoFoco } from '../lib/dom.js';
import { icone, medidor, medidorRotulado, graficoSemana, ativarDicasGrafico, seloStatus, toast } from '../lib/ui.js';
import {
  hojeISO, dataPorExtenso, nomeDiaSemana, dataCurta, formatarMinutos, minutosCompacto, diferencaDias, proximaSegunda, paraISO, relativo
} from '../lib/datas.js';
import {
  progressoGeral, progressoTrilha, progressoCronograma, sequencia, resumoSemana, todosCartoes, resumoFlashcards,
  proximaTarefa, diaDoPlano, desempenhoPorTema, diasAteProva
} from '../lib/estatisticas.js';
import { iniciarPomodoro } from '../lib/timers.js';
import { TIPOS_TAREFA } from './cronograma.js';

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function blocoInicioPlano(hoje) {
  const segunda = proximaSegunda(hoje);
  return html`<section class="card card-destaque" aria-labelledby="titulo-inicio">
    <div class="pilha">
      <div class="card-titulo" style="margin:0"><h2 id="titulo-inicio">${icone('bandeira')} Comece seu plano de 6 semanas</h2></div>
      <p class="texto-2">Escolha a data do <strong>Dia 1</strong>. O cronograma é distribuído a partir dela: 6 dias de estudo por semana e o domingo como descanso ativo, só com revisão de flashcards.</p>
      <form class="linha-g" data-form="inicio">
        <div class="campo">
          <label for="data-inicio">Data de início</label>
          <input class="entrada" type="date" id="data-inicio" name="data" value="${hoje}" required>
        </div>
        <div class="linha" style="align-self:end">
          <button class="btn btn-primario" type="submit">Começar plano</button>
          ${segunda !== hoje ? html`<button class="btn" type="button" data-acao="inicio-segunda" data-data="${segunda}">Começar na segunda (${dataCurta(segunda)})</button>` : ''}
        </div>
      </form>
      <div class="faixa faixa-info">${icone('lampada')}<div><strong>Primeiro passo de verdade:</strong> pergunte ao RH ou ao seu gestor como será a prova (prática ou teórica? qual stack? quanto tempo? pode consultar?). Ajuste o foco das trilhas com essa informação.</div></div>
    </div>
  </section>`;
}

function blocoProximaTarefa(dados, estado, hoje) {
  const prox = proximaTarefa(dados.cronograma, estado);
  if (!dados.cronograma) return '';
  if (!prox) {
    return html`<section class="card card-destaque"><div class="card-titulo"><h2>${icone('check-circulo')} Plano concluído!</h2></div>
      <p class="texto-2">Você marcou todas as tarefas do cronograma. Continue com revisões de flashcards e simulados até o dia da prova.</p></section>`;
  }
  const { semana, dia, tarefa } = prox;
  const tipo = TIPOS_TAREFA[tarefa.tipo] ?? TIPOS_TAREFA.estudo;
  const n = diaDoPlano(estado, hoje);
  const atraso = n && n > dia.numero ? n - dia.numero : 0;
  return html`<section class="card card-destaque" aria-labelledby="titulo-proxima">
    <div class="card-titulo"><h2 id="titulo-proxima">${icone('raio')} Próxima tarefa</h2>
      <span class="acoes selo">Semana ${semana.numero} · Dia ${dia.numero}</span></div>
    <div class="pilha-p">
      <div class="linha"><span class="selo ${tipo.classe}">${icone(tipo.icone, { tamanho: 14 })}${tipo.nome}</span>
        ${tarefa.duracao ? html`<span class="selo selo-contorno">${icone('relogio', { tamanho: 14 })}${formatarMinutos(tarefa.duracao)}</span>` : ''}
        <span class="mini muted">${dia.titulo}</span></div>
      <h3 style="font-size:1.15rem">${tarefa.titulo}</h3>
      ${tarefa.descricao ? html`<div class="texto-2">${md(tarefa.descricao)}</div>` : ''}
      ${atraso > 0 ? html`<p class="mini muted">${icone('info', { tamanho: 14 })} Pela data, você estaria no dia ${n}. Tudo bem: siga a ordem do plano — consistência vale mais que velocidade.</p>` : ''}
      <div class="linha" style="margin-top:.5rem">
        <button class="btn btn-primario" type="button" data-acao="concluir" data-id="${tarefa.id}" data-foco="concluir-proxima">${icone('check', { tamanho: 18 })}Concluir</button>
        <button class="btn" type="button" data-acao="focar" data-titulo="${tarefa.titulo}">${icone('pomodoro', { tamanho: 18 })}Focar com Pomodoro</button>
        ${tarefa.acao?.rota ? html`<a class="btn" href="${tarefa.acao.rota}">${tarefa.acao.rotulo ?? 'Abrir'}</a>` : ''}
        <a class="btn btn-fantasma" href="#/cronograma?semana=${semana.numero}">Ver no cronograma</a>
      </div>
    </div>
  </section>`;
}

function rotuloDiaGrafico(data, curto = false) {
  return curto ? nomeDiaSemana(data, true) : `${nomeDiaSemana(data)}, ${dataCurta(data)}`;
}

function conteudo(dados, estado) {
  const hoje = hojeISO();
  const geral = progressoGeral(dados, estado);
  const seq = sequencia(estado, hoje);
  const cartoes = todosCartoes(dados, estado);
  const fc = resumoFlashcards(cartoes, estado, hoje);
  const semana = resumoSemana(estado, hoje);
  const meta = Math.max(1, Number(estado.config.metaHorasSemana) || 1) * 60;
  const cron = progressoCronograma(dados.cronograma, estado);
  const n = diaDoPlano(estado, hoje);
  const totalDias = dados.cronograma?.totalDias ?? 42;
  const faltamProva = diasAteProva(estado, hoje);
  const temas = dados.quiz?.temas ?? [];
  const desempenho = desempenhoPorTema(estado, temas);
  const fracos = desempenho.filter((t) => t.status === 'fraco' || t.status === 'atencao').slice(0, 3);
  const temasAvaliados = desempenho.filter((t) => t.status !== 'sem-dados').length;
  const temDadosQuiz = Object.keys(estado.quiz.porTema).length > 0;
  const entradasDiario = Object.entries(estado.diario).sort((a, b) => b[0].localeCompare(a[0]));
  const ultimaDificil = entradasDiario.find(([, e]) => e.dificil?.trim());
  const ultimoBackup = estado.ultimoBackup ? paraISO(new Date(estado.ultimoBackup)) : null;
  const precisaBackup = !ultimoBackup || diferencaDias(ultimoBackup, hoje) >= 7;
  const sim = estado.simulados.ativo;

  let linhaPlano = 'Plano ainda não iniciado.';
  if (n !== null) {
    if (n < 1) linhaPlano = `O plano começa ${relativo(estado.config.dataInicio, hoje)} (${dataCurta(estado.config.dataInicio)}).`;
    else if (n > totalDias) linhaPlano = `Plano de ${totalDias} dias encerrado pela data — ${cron.pct}% das tarefas concluídas.`;
    else linhaPlano = `Dia ${n} de ${totalDias} do plano.`;
  }
  if (faltamProva !== null) {
    if (faltamProva > 0) linhaPlano += ` Faltam ${faltamProva} dia${faltamProva === 1 ? '' : 's'} para a prova.`;
    else if (faltamProva === 0) linhaPlano += ' A prova é HOJE — respire, leia o enunciado com calma e boa sorte!';
  }

  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <p class="muted pequeno">${saudacao()} · ${dataPorExtenso(hoje)}</p>
        <h1>Painel de estudo</h1>
        <p class="subtitulo">${linhaPlano}</p>
      </div>
      <div class="linha">
        <a class="btn btn-primario" href="#/flashcards">${icone('flashcards', { tamanho: 18 })}Revisar flashcards</a>
        <a class="btn" href="#/pomodoro">${icone('pomodoro', { tamanho: 18 })}Pomodoro</a>
      </div>
    </header>

    ${sim ? html`<div class="faixa faixa-info">${icone('simulado')}<div class="cresce"><strong>Simulado em andamento:</strong> ${sim.titulo}.</div><a class="btn btn-p" href="#/simulado">Continuar</a></div>` : ''}
    ${estado.config.dataInicio ? '' : blocoInicioPlano(hoje)}

    <section class="grade-4" aria-label="Indicadores">
      <div class="card indicador-card">
        <span class="rotulo">${icone('alvo', { tamanho: 18 })}Progresso geral</span>
        <span class="valor valor-heroi">${geral.pct}%</span>
        ${medidor(geral.pct, { rotulo: 'Progresso geral' })}
        <span class="detalhe">${geral.feitos} de ${geral.total} itens (trilhas + cronograma)</span>
      </div>
      <div class="card indicador-card">
        <span class="rotulo"><span style="color:var(--streak)">${icone('chama', { tamanho: 18 })}</span>Sequência</span>
        <span class="valor">${seq.atual} <small>${seq.atual === 1 ? 'dia' : 'dias'}</small></span>
        <span class="detalhe">Recorde: ${seq.recorde} ${seq.recorde === 1 ? 'dia' : 'dias'}</span>
        <span class="detalhe">${seq.estudouHoje ? html`${icone('check', { tamanho: 14 })} Você já estudou hoje.` : 'Estude algo hoje para manter a sequência.'}</span>
      </div>
      <div class="card indicador-card">
        <span class="rotulo">${icone('flashcards', { tamanho: 18 })}Revisões de hoje</span>
        <span class="valor">${fc.vencidos + fc.novosDisponiveis}</span>
        <span class="detalhe">${fc.vencidos} vencida${fc.vencidos === 1 ? '' : 's'} · ${fc.novosDisponiveis} nova${fc.novosDisponiveis === 1 ? '' : 's'}</span>
        <a class="pequeno" href="#/flashcards">Abrir a fila de revisão</a>
      </div>
      <div class="card indicador-card">
        <span class="rotulo">${icone('relogio', { tamanho: 18 })}Horas nesta semana</span>
        <span class="valor">${formatarMinutos(semana.total)}</span>
        ${medidor((semana.total / meta) * 100, { rotulo: 'Meta semanal de horas' })}
        <span class="detalhe">Meta: ${formatarMinutos(meta)} · <a href="#/ajustes">ajustar</a></span>
      </div>
    </section>

    ${blocoProximaTarefa(dados, estado, hoje)}

    <div class="grade-2">
      <section class="card" aria-labelledby="titulo-horas">
        <div class="card-titulo"><h2 id="titulo-horas">${icone('grafico')} Tempo estudado por dia (semana atual)</h2></div>
        ${graficoSemana(semana.dias, hoje, { rotuloDia: rotuloDiaGrafico, formatar: formatarMinutos, formatarCompacto: minutosCompacto })}
        <p class="mini muted" style="margin-top:.5rem">Registrado pelo Pomodoro, simulados e registros manuais.</p>
      </section>

      <section class="card" aria-labelledby="titulo-trilhas">
        <div class="card-titulo"><h2 id="titulo-trilhas">${icone('trilhas')} Progresso por trilha</h2></div>
        <div class="pilha">
          ${(dados.trilhas?.trilhas ?? []).map((t) => {
            const p = progressoTrilha(t, estado);
            return medidorRotulado({ titulo: t.nome, valorTexto: `${p.pct}% · ${p.feitos}/${p.total}`, porcentagem: p.pct, link: `#/trilhas?trilha=${t.id}` });
          })}
          ${medidorRotulado({ titulo: 'Cronograma de 6 semanas', valorTexto: `${cron.pct}% · ${cron.feitas}/${cron.total}`, porcentagem: cron.pct, link: '#/cronograma' })}
        </div>
      </section>
    </div>

    <div class="grade-3">
      <section class="card" aria-labelledby="titulo-fracos">
        <div class="card-titulo"><h2 id="titulo-fracos">${icone('alerta')} Pontos fracos (quiz)</h2></div>
        ${
          fracos.length
            ? html`<ul class="lista-simples">${fracos.map(
                (t) => html`<li class="linha entre"><span class="pilha-p" style="gap:.15rem"><strong>${t.nome}</strong>
                  <span class="mini muted">Últimas ${t.qtdRecentes} respostas: ${t.taxaRecente}% de acerto</span></span>
                  <span class="linha">${seloStatus(t.status)}<a class="btn btn-p" href="#/quiz?tema=${t.id}">Treinar</a></span></li>`
              )}</ul>`
            : html`<p class="texto-2 pequeno">${
                temasAvaliados > 0
                  ? `Nenhum dos ${temasAvaliados} tema(s) avaliados está abaixo de 80% nas respostas recentes. Continue intercalando temas no quiz misto.`
                  : temDadosQuiz
                    ? 'Ainda há poucas respostas por tema (são necessárias pelo menos 5 em um tema). Faça mais quizzes para ver seus pontos fracos.'
                    : 'Ainda não há respostas suficientes. Faça um quiz diagnóstico para descobrir onde focar.'
              }</p>
              <a class="btn btn-p" style="margin-top:.75rem" href="#/quiz?modo=prova&qtd=20">Fazer diagnóstico (20 questões)</a>`
        }
      </section>

      <section class="card" aria-labelledby="titulo-diario">
        <div class="card-titulo"><h2 id="titulo-diario">${icone('diario')} Diário</h2></div>
        ${
          ultimaDificil
            ? html`<p class="mini muted">O que ficou difícil em ${dataCurta(ultimaDificil[0])}:</p><p class="texto-2" style="margin-top:.25rem">${ultimaDificil[1].dificil}</p>`
            : html`<p class="texto-2 pequeno">Anote em 2 minutos o que estudou e o que ficou difícil. Isso vira material para revisar.</p>`
        }
        <a class="btn btn-p" style="margin-top:.75rem" href="#/diario">${estado.diario[hoje] ? 'Ver o diário de hoje' : 'Escrever o de hoje'}</a>
      </section>

      <section class="card ${precisaBackup ? 'card-aviso' : ''}" aria-labelledby="titulo-backup">
        <div class="card-titulo"><h2 id="titulo-backup">${icone('salvar')} Backup</h2></div>
        <p class="texto-2 pequeno">${
          ultimoBackup ? `Último backup: ${relativo(ultimoBackup, hoje)}.` : 'Você ainda não exportou nenhum backup.'
        } Seu progresso fica só neste navegador — limpar os dados do site apaga tudo.</p>
        <button class="btn btn-p" style="margin-top:.75rem" type="button" data-acao="backup">${icone('baixar', { tamanho: 16 })}Exportar backup agora</button>
      </section>
    </div>
  `;
}

export function montar(el, { dados }) {
  const render = () => {
    renderizarPreservandoFoco(el, conteudo(dados, obterEstado()));
    ativarDicasGrafico(el);
  };
  render();

  const aoClicar = (e) => {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'concluir') {
      atualizar((s) => {
        s.cronograma.feitas[alvo.dataset.id] = hojeISO();
        registrarAtividade(s);
      }, 'cronograma');
      toast('Tarefa concluída. Boa!', { tipo: 'sucesso' });
    } else if (acao === 'focar') {
      iniciarPomodoro({ fase: 'foco', rotulo: alvo.dataset.titulo });
      location.hash = '#/pomodoro';
    } else if (acao === 'backup') {
      exportarBackup();
    } else if (acao === 'inicio-segunda') {
      definirInicio(alvo.dataset.data);
    }
  };

  const definirInicio = (data) => {
    atualizar((s) => {
      s.config.dataInicio = data;
    }, 'config');
    toast(`Plano começa em ${dataCurta(data, true)}. Bons estudos!`, { tipo: 'sucesso' });
  };

  const aoEnviar = (e) => {
    const form = e.target.closest('[data-form="inicio"]');
    if (!form) return;
    e.preventDefault();
    const data = new FormData(form).get('data');
    if (data) definirInicio(String(data));
  };

  el.addEventListener('click', aoClicar);
  el.addEventListener('submit', aoEnviar);
  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas') return;
    render();
  });
  return () => cancelar();
}
