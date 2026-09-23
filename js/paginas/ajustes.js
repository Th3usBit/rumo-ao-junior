// =========================================================
// Página: Ajustes e backup — tema, datas do plano, metas,
// limite de flashcards novos, exportar/importar e reset.
// =========================================================

import { obterEstado, atualizar, assinar, apagarTudo, armazenamentoOk } from '../core/estado.js';
import { exportarBackup, escolherArquivoBackup } from '../core/backup.js';
import { html, renderizarPreservandoFoco } from '../lib/dom.js';
import { icone, confirmar, toast } from '../lib/ui.js';
import { hojeISO, dataCurta, relativo, paraISO, isoValido } from '../lib/datas.js';
import { listaTarefas } from '../lib/estatisticas.js';
import { sincronizarTimers } from '../lib/timers.js';

function contagens(dados, estado) {
  const topicos = (dados.trilhas?.trilhas ?? []).flatMap((t) => t.topicos);
  return [
    ['Tópicos nas trilhas', topicos.length],
    ['Itens de checklist', topicos.reduce((a, t) => a + t.checklist.length, 0)],
    ['Tarefas no cronograma', listaTarefas(dados.cronograma).length],
    ['Flashcards (arquivo)', dados.flashcards?.cartoes.length ?? 0],
    ['Flashcards criados por você', estado.flashcards.meus.length],
    ['Questões de quiz', dados.quiz?.questoes.length ?? 0],
    ['Desafios de simulado', dados.desafios?.desafios.length ?? 0],
    ['Links de recursos', (dados.recursos?.categorias ?? []).reduce((a, c) => a + c.links.length, 0)]
  ];
}

function conteudo(dados, estado, { avisos, erros }) {
  const cfg = estado.config;
  const ultimo = estado.ultimoBackup ? paraISO(new Date(estado.ultimoBackup)) : null;
  return html`
    <header class="cabecalho-pagina">
      <div class="titulos">
        <h1>Ajustes e backup</h1>
        <p class="subtitulo">Personalize o plano e cuide do seu progresso — ele fica salvo só neste navegador.</p>
      </div>
    </header>

    <div class="grade-2">
      <section class="card" aria-labelledby="titulo-aparencia">
        <div class="card-titulo"><h2 id="titulo-aparencia">${icone('sol')} Aparência</h2></div>
        <fieldset class="campo">
          <legend class="rotulo">Tema</legend>
          <div class="opcoes">
            ${[['sistema', 'Igual ao sistema', 'monitor'], ['claro', 'Claro', 'sol'], ['escuro', 'Escuro', 'lua']].map(
              ([valor, nome, ic]) => html`<label class="opcao-pilula"><input type="radio" name="tema" value="${valor}" ${cfg.tema === valor ? 'checked' : ''} data-foco="tema-${valor}"><span>${icone(ic, { tamanho: 16 })}${nome}</span></label>`
            )}
          </div>
        </fieldset>
      </section>

      <section class="card" aria-labelledby="titulo-plano">
        <div class="card-titulo"><h2 id="titulo-plano">${icone('cronograma')} Plano de estudo</h2></div>
        <form class="pilha" data-form="plano">
          <div class="linha-g">
            <div class="campo"><label for="aj-inicio">Início do plano (Dia 1)</label><input class="entrada" type="date" id="aj-inicio" name="dataInicio" value="${cfg.dataInicio ?? ''}"></div>
            <div class="campo"><label for="aj-prova">Data da prova (opcional)</label><input class="entrada" type="date" id="aj-prova" name="dataProva" value="${cfg.dataProva ?? ''}"></div>
          </div>
          <div class="linha-g">
            <div class="campo"><label for="aj-meta">Meta de horas por semana</label><input class="entrada entrada-curta" type="number" id="aj-meta" name="metaHorasSemana" min="1" max="80" value="${cfg.metaHorasSemana}"></div>
            <div class="campo"><label for="aj-novos">Flashcards novos por dia</label><input class="entrada entrada-curta" type="number" id="aj-novos" name="novosPorDia" min="0" max="100" value="${cfg.novosPorDia}">
              <span class="ajuda">Recomendado: 10–20. Cada novo gera revisões nos dias seguintes.</span></div>
          </div>
          <div><button class="btn btn-primario" type="submit">${icone('salvar', { tamanho: 18 })}Salvar plano</button></div>
        </form>
      </section>
    </div>

    <section class="card" aria-labelledby="titulo-backup-aj">
      <div class="card-titulo"><h2 id="titulo-backup-aj">${icone('salvar')} Backup do progresso</h2></div>
      <div class="pilha">
        <p class="texto-2">O progresso fica no <strong>localStorage</strong> deste navegador e <strong>deste endereço</strong>. Abrir por outro endereço (ex.: Live Server em <code>http://127.0.0.1:5500</code> e depois <code>npx serve</code> em <code>http://localhost:3000</code>) mostra um progresso vazio — use sempre o mesmo, ou exporte aqui e importe lá.</p>
        <p class="pequeno">${ultimo ? html`Último backup exportado: <strong>${dataCurta(ultimo, true)}</strong> (${relativo(ultimo, hojeISO())}).` : html`<strong>Você ainda não exportou nenhum backup.</strong>`}
          ${armazenamentoOk() ? '' : html` <span class="selo selo-critico">${icone('alerta', { tamanho: 14 })}Armazenamento bloqueado</span>`}</p>
        <div class="linha">
          <button class="btn btn-primario" type="button" data-acao="exportar">${icone('baixar', { tamanho: 18 })}Exportar backup (.json)</button>
          <button class="btn" type="button" data-acao="importar">${icone('enviar', { tamanho: 18 })}Importar backup</button>
        </div>
        <p class="mini muted">Importar substitui todo o progresso atual pelo do arquivo (você confirma antes).</p>
      </div>
    </section>

    <section class="card" aria-labelledby="titulo-dados">
      <div class="card-titulo"><h2 id="titulo-dados">${icone('tabela')} Conteúdo carregado</h2></div>
      <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela (role para os lados se precisar)"><table class="tabela">
        <tbody>${contagens(dados, estado).map(([nome, n]) => html`<tr><th scope="row">${nome}</th><td class="num">${n}</td></tr>`)}</tbody>
      </table></div>
      <p class="texto-2 pequeno" style="margin-top:.75rem">Para editar ou adicionar cartões, questões e desafios, altere os arquivos em <code>data/</code> e recarregue a página. O passo a passo está no <code>README.md</code>.</p>
      ${erros.length ? html`<div class="faixa faixa-erro" style="margin-top:.75rem">${icone('alerta')}<div><strong>Erros:</strong><ul>${erros.map((e) => html`<li><code>${e.arquivo}</code>: ${e.mensagem}</li>`)}</ul></div></div>` : ''}
      ${avisos.length
        ? html`<details class="bloco" style="margin-top:.75rem"><summary>${icone('alerta', { tamanho: 18 })} ${avisos.length} aviso(s) de validação nos dados</summary>
            <div class="corpo"><ul class="pequeno">${avisos.map((a) => html`<li>${a}</li>`)}</ul></div></details>`
        : html`<p class="pequeno" style="margin-top:.75rem">${icone('check-circulo', { tamanho: 16 })} Nenhum problema encontrado nos arquivos de dados.</p>`}
    </section>

    <section class="card zona-perigo" aria-labelledby="titulo-perigo">
      <div class="card-titulo"><h2 id="titulo-perigo">${icone('alerta')} Zona de perigo</h2></div>
      <p class="texto-2 pequeno">Apaga todo o progresso deste navegador: checklists, cronograma, flashcards (inclusive os seus), quiz, simulados, sessões e diário. Exporte um backup antes.</p>
      <div style="margin-top:.75rem"><button class="btn btn-perigo" type="button" data-acao="apagar">${icone('lixeira', { tamanho: 18 })}Apagar todo o progresso</button></div>
    </section>`;
}

export function montar(el, ctx) {
  const { dados } = ctx;
  const render = () => renderizarPreservandoFoco(el, conteudo(dados, obterEstado(), ctx));
  render();

  el.addEventListener('change', (e) => {
    if (e.target.name !== 'tema') return;
    atualizar((s) => {
      s.config.tema = e.target.value;
    }, 'tema');
  });

  el.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-form="plano"]')) return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = (nome) => {
      const v = String(fd.get(nome) ?? '');
      return isoValido(v) ? v : null;
    };
    const numero = (nome, min, max, padrao) => {
      const n = Math.round(Number(fd.get(nome)));
      return Number.isFinite(n) && n >= min && n <= max ? n : padrao;
    };
    atualizar((s) => {
      s.config.dataInicio = data('dataInicio');
      s.config.dataProva = data('dataProva');
      s.config.metaHorasSemana = numero('metaHorasSemana', 1, 80, 8);
      s.config.novosPorDia = numero('novosPorDia', 0, 100, 15);
    }, 'config');
    toast('Plano salvo.', { tipo: 'sucesso' });
  });

  el.addEventListener('click', async (e) => {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'exportar') exportarBackup();
    else if (acao === 'importar') escolherArquivoBackup();
    else if (acao === 'apagar') {
      const ok = await confirmar({
        titulo: 'Apagar TODO o progresso?',
        mensagem: 'Esta ação não pode ser desfeita. Se não exportou um backup, cancele e exporte antes.',
        textoConfirmar: 'Apagar tudo',
        perigo: true
      });
      if (!ok) return;
      apagarTudo();
      sincronizarTimers();
      window.dispatchEvent(new CustomEvent('rumo:recarregar'));
      toast('Progresso apagado. Recomeço limpo!', { tipo: 'info' });
    }
  });

  const cancelar = assinar((_s, motivo) => {
    if (motivo === 'pomodoro-rotulo' || motivo === 'simulado-notas' || motivo === 'nota') return;
    render();
  });
  return () => cancelar();
}
