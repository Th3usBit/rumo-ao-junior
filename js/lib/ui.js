// =========================================================
// ui.js — ícones SVG, avisos (toasts), diálogos, medidores
// e outros componentes visuais compartilhados.
// =========================================================

import { html, seguro, esc } from './dom.js';

// ---------- Ícones (traço 2px, 24×24, cor = currentColor) ----------
const ICONES = {
  painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  trilhas: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  cronograma: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  flashcards: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  simulado: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  pomodoro: '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2.5 2"/><path d="M10 2h4M12 2v4"/>',
  diario: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/>',
  recursos: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  ajustes: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3"/><path d="M14 2v4M8 10v4M16 18v4"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  enviar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  fechar: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circulo': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'x-circulo': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  chama: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>',
  pausa: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  pular: '<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',
  reiniciar: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  lixeira: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  editar: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  externo: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  'seta-direita': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'seta-esquerda': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  olho: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  estrela: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  bussola: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  codigo: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  grafico: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  tabela: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  livro: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  bandeira: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  raio: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  lampada: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/>',
  sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  salvar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  filtro: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
  embaralhar: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  cerebro: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>'
};

/** Retorna o SVG de um ícone como HtmlSeguro. */
export function icone(nome, { tamanho = 20, classe = '', rotulo = '' } = {}) {
  const conteudo = ICONES[nome] ?? ICONES.info;
  const aria = rotulo ? `role="img" aria-label="${esc(rotulo)}"` : 'aria-hidden="true"';
  return seguro(
    `<svg class="icone ${esc(classe)}" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" ${aria}>${conteudo}</svg>`
  );
}

// ---------- Avisos flutuantes (toasts) ----------
const ICONE_TOAST = { sucesso: 'check-circulo', erro: 'x-circulo', aviso: 'alerta', info: 'info' };

export function toast(mensagem, { tipo = 'info', duracao = 4500 } = {}) {
  const area = document.getElementById('avisos');
  if (!area) return;
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.innerHTML = html`${icone(ICONE_TOAST[tipo] ?? 'info')}<div class="cresce">${mensagem}</div>
    <button type="button" class="btn btn-fantasma btn-icone btn-p fechar" aria-label="Fechar aviso">${icone('fechar', { tamanho: 16 })}</button>`.toString();
  const remover = () => el.remove();
  el.querySelector('.fechar').addEventListener('click', remover);
  area.appendChild(el);
  if (duracao > 0) setTimeout(remover, duracao);
  // Limita a 4 avisos visíveis
  while (area.children.length > 4) area.firstElementChild.remove();
}

// ---------- Diálogos ----------
function abrirDialogo(conteudo, { aoAbrir, validar } = {}) {
  const dlg = document.getElementById('dialogo');
  const anterior = document.activeElement;
  return new Promise((resolve) => {
    dlg.innerHTML = conteudo.toString();
    // o nome acessível do diálogo vem do título (h2#dlg-titulo)
    dlg.setAttribute('aria-labelledby', 'dlg-titulo');
    if (dlg.querySelector('#dlg-msg')) dlg.setAttribute('aria-describedby', 'dlg-msg');
    else dlg.removeAttribute('aria-describedby');
    const form = dlg.querySelector('form');
    const erro = dlg.querySelector('[data-erro]');

    const finalizar = (valor) => {
      if (dlg.open) dlg.close();
      dlg.oncancel = null;
      resolve(valor);
      if (anterior instanceof HTMLElement && document.contains(anterior)) anterior.focus();
    };

    dlg.oncancel = (e) => {
      e.preventDefault();
      finalizar(null);
    };
    dlg.querySelectorAll('[data-cancelar]').forEach((b) => b.addEventListener('click', () => finalizar(null)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const mensagem = validar ? validar(form) : null;
      if (mensagem) {
        if (erro) {
          erro.hidden = false;
          erro.textContent = mensagem;
        }
        return;
      }
      finalizar(new FormData(form));
    });

    dlg.showModal();
    aoAbrir?.(dlg);
    const primeiro = dlg.querySelector('[autofocus]') ?? dlg.querySelector('input, textarea, select') ?? dlg.querySelector('[type="submit"]');
    primeiro?.focus();
  });
}

/** Confirmação acessível (substitui window.confirm). Resolve true/false. */
export async function confirmar({ titulo, mensagem, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', perigo = false }) {
  const resultado = await abrirDialogo(html`
    <form method="dialog" aria-labelledby="dlg-titulo" aria-describedby="dlg-msg">
      <h2 id="dlg-titulo">${titulo}</h2>
      <div id="dlg-msg" class="texto-2">${mensagem}</div>
      <div class="acoes">
        <button type="button" class="btn" data-cancelar>${textoCancelar}</button>
        <button type="submit" class="btn ${perigo ? 'btn-perigo cheio' : 'btn-primario'}" autofocus>${textoConfirmar}</button>
      </div>
    </form>`);
  return resultado !== null;
}

/**
 * Diálogo com formulário. `campos` é HtmlSeguro com os inputs.
 * Resolve com FormData ou null (cancelado).
 */
export function dialogoFormulario({ titulo, descricao = '', campos, textoConfirmar = 'Salvar', textoCancelar = 'Cancelar', validar, aoAbrir }) {
  return abrirDialogo(
    html`
    <form method="dialog" aria-labelledby="dlg-titulo" novalidate>
      <h2 id="dlg-titulo">${titulo}</h2>
      ${descricao ? html`<p class="texto-2">${descricao}</p>` : ''}
      ${campos}
      <div class="faixa faixa-erro" data-erro role="alert" hidden></div>
      <div class="acoes">
        <button type="button" class="btn" data-cancelar>${textoCancelar}</button>
        <button type="submit" class="btn btn-primario">${textoConfirmar}</button>
      </div>
    </form>`,
    { validar, aoAbrir }
  );
}

// ---------- Medidores e anel ----------

/** Barra de progresso acessível. */
export function medidor(porcentagem, { rotulo = 'Progresso', grande = false } = {}) {
  const valor = Math.max(0, Math.min(100, Math.round(porcentagem)));
  return html`<div class="medidor ${grande ? 'medidor-g' : ''} ${valor >= 100 ? 'completo' : ''}" role="progressbar"
    aria-label="${rotulo}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${valor}" aria-valuetext="${valor}%"
    style="--pct:${valor}%"><span></span></div>`;
}

/** Medidor com título e valor em texto acima da barra. */
export function medidorRotulado({ titulo, valorTexto, porcentagem, link }) {
  const tituloHtml = link ? html`<a href="${link}">${titulo}</a>` : html`<span>${titulo}</span>`;
  return html`<div class="medidor-rotulado">
      <div class="cabeca">${tituloHtml}<span class="valor">${valorTexto}</span></div>
      ${medidor(porcentagem, { rotulo: titulo })}
    </div>`;
}

/** Atualiza um medidor existente sem re-renderizar a página. */
export function atualizarMedidor(elemento, porcentagem) {
  if (!elemento) return;
  const valor = Math.max(0, Math.min(100, Math.round(porcentagem)));
  elemento.style.setProperty('--pct', `${valor}%`);
  elemento.setAttribute('aria-valuenow', String(valor));
  elemento.setAttribute('aria-valuetext', `${valor}%`);
  elemento.classList.toggle('completo', valor >= 100);
}

/** Anel SVG de progresso (0–1). */
export function anel(fracao, { tamanho = 220, espessura = 12 } = {}) {
  const r = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * r;
  const deslocamento = circunferencia * (1 - Math.max(0, Math.min(1, fracao)));
  return seguro(`<svg class="anel" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}" aria-hidden="true" focusable="false">
    <circle class="trilho" cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}" fill="none" stroke-width="${espessura}"/>
    <circle class="progresso" cx="${tamanho / 2}" cy="${tamanho / 2}" r="${r}" fill="none" stroke-width="${espessura}"
      stroke-dasharray="${circunferencia.toFixed(2)}" stroke-dashoffset="${deslocamento.toFixed(2)}" data-circunferencia="${circunferencia.toFixed(2)}"/>
  </svg>`);
}

/** Atualiza o anel já renderizado. */
export function atualizarAnel(svg, fracao) {
  const circulo = svg?.querySelector('.progresso');
  if (!circulo) return;
  const c = Number(circulo.dataset.circunferencia);
  circulo.setAttribute('stroke-dashoffset', (c * (1 - Math.max(0, Math.min(1, fracao)))).toFixed(2));
}

// ---------- Status (sempre ícone + texto, nunca só cor) ----------
const STATUS = {
  fraco: { classe: 'selo-critico', icone: 'alerta', texto: 'Ponto fraco' },
  atencao: { classe: 'selo-atencao', icone: 'info', texto: 'Atenção' },
  bom: { classe: 'selo-bom', icone: 'check-circulo', texto: 'Bom' },
  'sem-dados': { classe: '', icone: 'info', texto: 'Poucos dados' }
};

export function seloStatus(status) {
  const s = STATUS[status] ?? STATUS['sem-dados'];
  return html`<span class="selo ${s.classe}">${icone(s.icone, { tamanho: 14 })}${s.texto}</span>`;
}

// ---------- Arquivos ----------

/** Dispara o download de um arquivo de texto (usado no backup). */
export function baixarArquivo(nome, conteudo, tipo = 'application/json') {
  const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lê um arquivo escolhido pelo usuário como texto. */
export function lerArquivoTexto(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsText(arquivo, 'utf-8');
  });
}

/** Link externo padronizado (abre em nova aba com segurança). */
export function linkExterno(url, texto) {
  return html`<a class="externo" href="${url}" target="_blank" rel="noopener noreferrer">${texto}<span class="sr-only"> (abre em nova aba)</span></a>`;
}

// ---------- Gráfico de colunas: minutos por dia da semana ----------

/**
 * `dias` = [{ data: 'AAAA-MM-DD', minutos }]. Uma série só (sem legenda):
 * o título do cartão diz o que está plotado. Valores no topo das colunas,
 * dica ao passar o mouse/focar e uma tabela equivalente para leitores de tela.
 */
export function graficoSemana(dias, hoje, { rotuloDia, formatar, formatarCompacto }) {
  const maximo = Math.max(60, ...dias.map((d) => d.minutos));
  const escala = Math.ceil(maximo / 30) * 30; // topo "redondo" (múltiplo de 30 min)
  return html`<div class="grafico" data-grafico>
      <div class="colunas" style="--n:${dias.length}">
        ${dias.map((d) => {
          const altura = (d.minutos / escala) * 100;
          const texto = `${rotuloDia(d.data)}: ${formatar(d.minutos)}`;
          return html`<div class="coluna" tabindex="0" role="img" aria-label="${texto}" data-dica-titulo="${rotuloDia(d.data)}" data-dica-valor="${formatar(d.minutos)}" style="--h:${altura.toFixed(1)}%">
            ${d.minutos > 0 ? html`<span class="rotulo-valor" aria-hidden="true">${formatarCompacto(d.minutos)}</span>` : ''}
            <span class="barra"></span>
          </div>`;
        })}
      </div>
      <div class="eixo-x" style="--n:${dias.length}" aria-hidden="true">
        ${dias.map((d) => html`<span class="${d.data === hoje ? 'hoje' : ''}">${rotuloDia(d.data, true)}${d.data === hoje ? ' (hoje)' : ''}</span>`)}
      </div>
      <div class="dica-grafico" role="presentation" hidden></div>
    </div>
    <details class="bloco" style="margin-top:.75rem">
      <summary class="pequeno">${icone('tabela', { tamanho: 16 })} Ver como tabela</summary>
      <div class="corpo">
        <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela (role para os lados se precisar)"><table class="tabela">
          <thead><tr><th scope="col">Dia</th><th scope="col" class="num">Tempo estudado</th></tr></thead>
          <tbody>${dias.map((d) => html`<tr><td>${rotuloDia(d.data)}</td><td class="num">${formatar(d.minutos)}</td></tr>`)}</tbody>
        </table></div>
      </div>
    </details>`;
}

/** Liga as dicas (tooltips) de um gráfico renderizado por graficoSemana(). */
export function ativarDicasGrafico(raiz) {
  raiz.querySelectorAll('[data-grafico]').forEach((grafico) => {
    const dica = grafico.querySelector('.dica-grafico');
    const mostrar = (coluna) => {
      dica.innerHTML = html`<strong>${coluna.dataset.dicaValor}</strong>${coluna.dataset.dicaTitulo}`.toString();
      const caixa = grafico.getBoundingClientRect();
      const barra = coluna.querySelector('.barra').getBoundingClientRect();
      const col = coluna.getBoundingClientRect();
      dica.style.left = `${col.left - caixa.left + col.width / 2}px`;
      dica.style.top = `${Math.min(barra.top, col.bottom - 4) - caixa.top - 6}px`;
      dica.hidden = false;
    };
    const esconder = () => {
      dica.hidden = true;
    };
    grafico.querySelectorAll('.coluna').forEach((coluna) => {
      coluna.addEventListener('pointerenter', () => mostrar(coluna));
      coluna.addEventListener('pointerleave', esconder);
      coluna.addEventListener('focus', () => mostrar(coluna));
      coluna.addEventListener('blur', esconder);
    });
  });
}
