// =====================================================================
// graficos.mjs — gera os visuais do README (docs/readme/*.svg) a partir
// dos DADOS REAIS do projeto. Nenhum número é digitado à mão:
//   - data/*.json ............ conteúdo (trilhas, cronograma, cartões...)
//   - js/lib/sm2.js .......... o próprio algoritmo do app calcula os intervalos
//   - start.bat .............. o texto do terminal animado sai do arquivo
//   - docs/readme/dados/testes.json  resumo de uma execução real dos testes
//                                    (gerado por readme/resumo-testes.mjs)
// Também reescreve, no README.md, as tabelas entre
// <!-- gerado:NOME --> e <!-- /gerado:NOME -->.
//
// Uso (dentro de testes/):  npm run readme:graficos
// =====================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(aqui, '../..');
const SAIDA = resolve(RAIZ, 'docs/readme');
const { revisar, estadoInicialCartao } = await import(pathToFileURL(resolve(RAIZ, 'js/lib/sm2.js')).href);
const { diferencaDias } = await import(pathToFileURL(resolve(RAIZ, 'js/lib/datas.js')).href);
const { AREAS, FORMATOS } = await importarRotulos();

const ler = (rel) => JSON.parse(readFileSync(resolve(RAIZ, rel), 'utf8'));
const trilhas = ler('data/trilhas.json').trilhas;
const cronograma = ler('data/cronograma.json');
const flashcards = ler('data/flashcards.json');
const quiz = ler('data/quiz.json');
const desafios = ler('data/desafios.json').desafios;
const recursos = ler('data/recursos.json');
const arquivoTestes = resolve(SAIDA, 'dados/testes.json');
const testes = existsSync(arquivoTestes) ? JSON.parse(readFileSync(arquivoTestes, 'utf8')) : null;
const paginas = readdirSync(resolve(RAIZ, 'js/paginas')).filter((f) => f.endsWith('.js'));

/** Os rótulos de área e formato vêm do próprio app (js/paginas/simulado.js). */
async function importarRotulos() {
  const fonte = readFileSync(resolve(RAIZ, 'js/paginas/simulado.js'), 'utf8');
  const pegar = (nome) => {
    const m = fonte.match(new RegExp(`export const ${nome} = (\\{[^}]*\\});`));
    if (!m) throw new Error(`não achei ${nome} em js/paginas/simulado.js`);
    return Function(`return (${m[1]})`)();
  };
  return { AREAS: pegar('AREAS'), FORMATOS: pegar('FORMATOS') };
}

// ---------------------------------------------------------------------
// Tokens (os mesmos de css/base.css) e paleta categórica validada
// (validate_palette.js: aprovada nos dois temas, ordem = ordem dos slots)
// ---------------------------------------------------------------------
const CLARO = {
  bg: '#ffffff', bg2: '#f3f3ef', borda: '#e1e0d9', tinta: '#111110', tinta2: '#4a4945', suave: '#676660',
  grade: '#e1e0d9', base: '#c3c2b7', acento: '#256abf', acentoSuave: '#e5eefa', acentoTexto: '#184f95',
  s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', s4: '#eda100', s5: '#e87ba4', s6: '#008300',
  o1: '#184f95', o2: '#3987e5', o3: '#86b6ef', neutro: '#c3c2b7'
};
const ESCURO = {
  bg: '#1a1a19', bg2: '#222220', borda: '#2f2f2c', tinta: '#f4f4f1', tinta2: '#c3c2b7', suave: '#9c9a91',
  grade: '#2c2c2a', base: '#383835', acento: '#6da7ec', acentoSuave: '#16263d', acentoTexto: '#9ec5f4',
  s1: '#3987e5', s2: '#d95926', s3: '#199e70', s4: '#c98500', s5: '#d55181', s6: '#008300',
  o1: '#86b6ef', o2: '#3987e5', o3: '#1c5cab', neutro: '#5a5954'
};
const STATUS = { bom: '#0ca30c', critico: '#d03b3b', aviso: '#fab219' };
const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const MONO = '"Cascadia Mono", "Cascadia Code", Consolas, "SFMono-Regular", Menlo, monospace';
const L = 880; // largura padrão (a coluna do README no GitHub tem ~880px)

const vars = (t) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');

// Cada gráfico sai em duas versões com a paleta FIXA (claro e escuro), para o README
// escolher com <picture> + prefers-color-scheme — o jeito documentado pelo GitHub.
// Uma media query dentro do SVG nem sempre acompanha o tema do site.
let TEMA = 'auto';
function paleta() {
  if (TEMA === 'claro') return `svg{${vars(CLARO)}}`;
  if (TEMA === 'escuro') return `svg{${vars(ESCURO)}}`;
  return `svg{${vars(CLARO)}}\n@media (prefers-color-scheme: dark){svg{${vars(ESCURO)}}}`;
}

function estilo(extra = '') {
  return `<style>
${paleta()}
text{font-family:${FONTE};fill:var(--tinta)}
.cartao{fill:var(--bg);stroke:var(--borda)}
.t2{fill:var(--tinta2)} .suave{fill:var(--suave)} .acento{fill:var(--acento)}
.titulo{font-size:17px;font-weight:650} .sub{font-size:13px;fill:var(--tinta2)} .rot{font-size:13px}
.val{font-size:12.5px;font-variant-numeric:tabular-nums;fill:var(--tinta2)} .mini{font-size:12px;fill:var(--suave)}
.grade{stroke:var(--grade);stroke-width:1} .base{stroke:var(--base);stroke-width:1}
.s1{fill:var(--s1)} .s2{fill:var(--s2)} .s3{fill:var(--s3)} .s4{fill:var(--s4)} .s5{fill:var(--s5)} .s6{fill:var(--s6)}
.o1{fill:var(--o1)} .o2{fill:var(--o2)} .o3{fill:var(--o3)} .neutro{fill:var(--neutro)}
.bom{fill:${STATUS.bom}} .critico{fill:${STATUS.critico}} .aviso{fill:${STATUS.aviso}}
.cresce{transform-box:fill-box;transform-origin:left center;animation:cresce .9s cubic-bezier(.2,.7,.2,1) both}
.surge{animation:surge .6s ease-out both}
@keyframes cresce{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes surge{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
${extra}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>`;
}

function svg({ largura = L, altura, titulo, descricao, corpo, extra = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-labelledby="titulo desc">
<title id="titulo">${esc(titulo)}</title>
<desc id="desc">${esc(descricao)}</desc>
${estilo(extra)}
<rect class="cartao" x="0.5" y="0.5" width="${largura - 1}" height="${altura - 1}" rx="16"/>
${corpo}
</svg>
`;
}

// ---------------------------------------------------------------------
// Texto: escape, largura estimada e quebra de linha
// ---------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semMd = (s) => String(s).replace(/\*\*/g, '').replace(/`/g, '');

function largura(texto, px, negrito = false, mono = false) {
  if (mono) return [...String(texto)].length * px * 0.6;
  let w = 0;
  for (const ch of String(texto)) {
    if (" il.,:;'|!`’·".includes(ch)) w += 0.3;
    else if ('fjrtI()[]{}-/'.includes(ch)) w += 0.38;
    else if ('mwMW@%'.includes(ch)) w += 0.88;
    else if ((ch >= 'A' && ch <= 'Z') || 'ÁÉÍÓÚÂÊÔÃÕÇ'.includes(ch)) w += 0.68;
    else if (ch >= '0' && ch <= '9') w += 0.58;
    else w += 0.56;
  }
  return w * px * (negrito ? 1.07 : 1);
}

function cortar(texto, px, max, negrito = false) {
  if (largura(texto, px, negrito) <= max) return texto;
  let t = texto;
  while (t.length > 1 && largura(t + '…', px, negrito) > max) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

/** Quebra um texto com mini-markdown (`código` e **negrito**) em linhas de tspans. */
function linhasMd(md, px, max) {
  const partes = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let i = 0;
  let m;
  while ((m = re.exec(md))) {
    if (m.index > i) partes.push({ s: md.slice(i, m.index), e: 'n' });
    partes.push(m[0].startsWith('`') ? { s: m[0].slice(1, -1), e: 'c' } : { s: m[0].slice(2, -2), e: 'b' });
    i = m.index + m[0].length;
  }
  if (i < md.length) partes.push({ s: md.slice(i), e: 'n' });
  const palavras = [];
  for (const p of partes) {
    for (const w of p.s.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) palavras.push({ espaco: true });
      else palavras.push({ t: w, e: p.e });
    }
  }
  const medir = (w) => largura(w.t, px, w.e === 'b', w.e === 'c');
  const linhas = [];
  let atual = [];
  let w = 0;
  let espacoPendente = false;
  for (const p of palavras) {
    if (p.espaco) { espacoPendente = atual.length > 0; continue; }
    const extra = (espacoPendente ? px * 0.3 : 0) + medir(p);
    if (w + extra > max && atual.length) {
      linhas.push(atual);
      atual = [];
      w = 0;
      espacoPendente = false;
    }
    atual.push({ ...p, espaco: espacoPendente && atual.length > 0 });
    w += (atual.length > 1 && espacoPendente ? px * 0.3 : 0) + medir(p);
    espacoPendente = false;
  }
  if (atual.length) linhas.push(atual);
  return linhas.map((l) =>
    l.map((p) => {
      const t = (p.espaco ? ' ' : '') + p.t;
      if (p.e === 'c') return `${p.espaco ? ' ' : ''}<tspan class="cod">${esc(p.t)}</tspan>`;
      if (p.e === 'b') return `<tspan font-weight="650">${esc(t)}</tspan>`;
      return esc(t);
    }).join('')
  );
}

const fmtMin = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};
const fmtNum = (n) => n.toLocaleString('pt-BR');
const dataBR = (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

function legenda(itens, x, y) {
  let cx = x;
  return itens.map(([classe, nome]) => {
    const g = `<rect class="${classe}" x="${cx}" y="${y - 10}" width="12" height="12" rx="3"/><text class="rot t2" x="${cx + 18}" y="${y}">${esc(nome)}</text>`;
    cx += 18 + largura(nome, 13) + 22;
    return g;
  }).join('');
}

function fonte(texto, altura) {
  return `<text class="mini" x="24" y="${altura - 16}">${esc(texto)}</text>`;
}

const escritos = [];
function gravar(nome, conteudo) {
  writeFileSync(resolve(SAIDA, nome), conteudo);
  escritos.push(`${nome} (${Math.round(Buffer.byteLength(conteudo) / 102.4) / 10} KB)`);
}
/** Grava nome-claro.svg e nome-escuro.svg. */
function gravarTemas(nome, gerar) {
  for (const tema of ['claro', 'escuro']) {
    TEMA = tema;
    gravar(`${nome}-${tema}.svg`, gerar());
  }
  TEMA = 'auto';
}

// =====================================================================
// Números do conteúdo (compartilhados por gráficos, selos e tabelas)
// =====================================================================
const TIPOS = [
  ['algoritmo', 'Algoritmo', 's1'], ['estudo', 'Estudo', 's2'], ['projeto', 'Projeto', 's3'],
  ['revisao', 'Revisão', 's4'], ['simulado', 'Simulado', 's5'], ['descanso', 'Descanso ativo', 's6']
];
const semanas = cronograma.semanas.map((s) => {
  const porTipo = Object.fromEntries(TIPOS.map(([id]) => [id, 0]));
  let tarefas = 0;
  for (const d of s.dias) for (const t of d.tarefas) { porTipo[t.tipo] = (porTipo[t.tipo] ?? 0) + (t.duracao ?? 0); tarefas += 1; }
  const total = Object.values(porTipo).reduce((a, b) => a + b, 0);
  return { numero: s.numero, titulo: s.titulo, dias: s.dias.length, tarefas, porTipo, total };
});
const totalMin = semanas.reduce((a, s) => a + s.total, 0);
const totalTarefas = semanas.reduce((a, s) => a + s.tarefas, 0);
const totalDias = semanas.reduce((a, s) => a + s.dias, 0);

const temas = flashcards.temas.map((t) => ({
  id: t.id,
  nome: t.nome,
  cartoes: flashcards.cartoes.filter((c) => c.tema === t.id).length,
  questoes: quiz.questoes.filter((q) => q.tema === t.id).length
}));
const comExplicacao = quiz.questoes.filter((q) => String(q.explicacao ?? '').trim()).length;

const trilhasResumo = trilhas.map((t) => {
  const prioridade = { alta: 0, media: 0, baixa: 0 };
  let itens = 0;
  let links = 0;
  for (const tp of t.topicos) { prioridade[tp.prioridade] += 1; itens += (tp.checklist ?? []).length; links += (tp.links ?? []).length; }
  return { id: t.id, nome: t.nome, topicos: t.topicos.length, prioridade, itens, links };
});
const totalItens = trilhasResumo.reduce((a, t) => a + t.itens, 0);
const totalTopicos = trilhasResumo.reduce((a, t) => a + t.topicos, 0);

const IDIOMAS = [['en', 'Inglês', 's1'], ['pt-BR', 'Português', 's2'], ['pt-PT', 'Português (PT)', 's3'], ['multi', 'Vários idiomas', 's4']];
const FRASE_IDIOMA = { en: 'em inglês', 'pt-BR': 'em português', 'pt-PT': 'em português de Portugal', multi: 'em vários idiomas' };
const categorias = recursos.categorias.map((c) => {
  const porIdioma = {};
  for (const l of c.links) porIdioma[l.idioma] = (porIdioma[l.idioma] ?? 0) + 1;
  return { nome: c.nome, total: c.links.length, porIdioma };
}).sort((a, b) => b.total - a.total);
const totalLinks = categorias.reduce((a, c) => a + c.total, 0);
const idiomasUsados = IDIOMAS.filter(([id]) => categorias.some((c) => c.porIdioma[id]));

const comGabarito = desafios.filter((d) => d.gabarito).length;
const ORDEM_AREAS = ['front', 'back', 'fullstack', 'comum'];

// =====================================================================
// 1. Banner (hero) — cartões REAIS de data/flashcards.json virando
// =====================================================================
function banner() {
  const W = L;
  const H = 330;
  const ids = ['js-ts-005', 'spring-013', 'sql-011'];
  const cartoes = ids.map((id) => {
    const c = flashcards.cartoes.find((x) => x.id === id);
    if (!c) throw new Error(`cartão ${id} não existe mais em data/flashcards.json — escolha outro no banner`);
    const primeira = c.resposta.split('\n')[0].replace(/^- /, '');
    const continua = c.resposta.split('\n').length > 1;
    return { ...c, tema: flashcards.temas.find((t) => t.id === c.tema)?.nome ?? c.tema, primeira, continua };
  });
  const FACE = 6.5; // segundos por cartão
  // Movimento finito (WCAG 2.2.2): o banner dá 2 voltas e para no 1º cartão.
  const VOLTAS = 2;
  const CICLO = FACE * cartoes.length;
  const pct = (s) => `${Math.round((s / CICLO) * 10000) / 100}%`;
  const cx = 470;
  const cy = 56;
  const cw = 370;
  const ch = 214;
  let keyframes = '';
  const faces = cartoes.map((c, i) => {
    const t0 = i * FACE;
    const vira = t0 + 3.2;
    // frente: visível de t0 até "vira"; verso: de "vira" até o fim da janela
    keyframes += `@keyframes f${i}{0%{opacity:${i === 0 ? 1 : 0};transform:none}` +
      `${i === 0 ? '' : `${pct(t0 - 0.01)}{opacity:0}${pct(t0)}{opacity:1;transform:scaleX(1)}`}` +
      `${pct(vira)}{opacity:1;transform:scaleX(1)}${pct(vira + 0.22)}{opacity:1;transform:scaleX(0)}${pct(vira + 0.23)}{opacity:0}100%{opacity:0}}\n`;
    keyframes += `@keyframes v${i}{0%,${pct(vira + 0.22)}{opacity:0;transform:scaleX(0)}${pct(vira + 0.23)}{opacity:1;transform:scaleX(0)}` +
      `${pct(vira + 0.45)}{opacity:1;transform:scaleX(1)}${pct(t0 + FACE - 0.3)}{opacity:1;transform:scaleX(1)}${pct(t0 + FACE - 0.05)}{opacity:0}100%{opacity:0}}\n`;
    keyframes += `@keyframes p${i}{0%,${pct(t0)}{transform:scaleX(0)}${pct(t0 + FACE - 0.05)}{transform:scaleX(1)}${pct(t0 + FACE - 0.04)},100%{transform:scaleX(0)}}\n`;
    const pergunta = linhasMd(c.pergunta, 19, cw - 48);
    const resposta = linhasMd(c.primeira + (c.continua ? ' …' : ''), 15, cw - 48).slice(0, 4);
    const topo = (rotulo) => `<text class="mini" x="${cx + 24}" y="${cy + 34}">${esc(c.tema)}</text>` +
      `<rect x="${cx + cw - 24 - largura(rotulo, 11.5, true) - 18}" y="${cy + 20}" width="${largura(rotulo, 11.5, true) + 18}" height="22" rx="11" class="selo"/>` +
      `<text class="selo-t" x="${cx + cw - 24 - (largura(rotulo, 11.5, true) + 18) / 2}" y="${cy + 35}" text-anchor="middle">${rotulo}</text>`;
    const frente = `<g class="face${i === 0 ? ' primeira' : ''}" style="animation-name:f${i}">` +
      `<rect class="carta" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="14"/>${topo('Pergunta')}` +
      pergunta.map((l, k) => `<text class="perg" x="${cx + 24}" y="${cy + 82 + k * 26}" style="white-space:pre">${l}</text>`).join('') +
      `<rect class="botao" x="${cx + 24}" y="${cy + ch - 58}" width="${cw - 48}" height="36" rx="9"/>` +
      `<text class="botao-t" x="${cx + cw / 2}" y="${cy + ch - 35}" text-anchor="middle">Mostrar resposta  ·  Espaço</text></g>`;
    const botoes = ['Errei', 'Difícil', 'Bom', 'Fácil'];
    const bw = (cw - 48 - 3 * 8) / 4;
    const verso = `<g class="face" style="animation-name:v${i}">` +
      `<rect class="carta" x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="14"/>${topo('Resposta')}` +
      resposta.map((l, k) => `<text class="resp" x="${cx + 24}" y="${cy + 76 + k * 22}" style="white-space:pre">${l}</text>`).join('') +
      botoes.map((b, k) => `<rect class="nota" x="${cx + 24 + k * (bw + 8)}" y="${cy + ch - 56}" width="${bw}" height="34" rx="8"/>` +
        `<text class="nota-t" x="${cx + 24 + k * (bw + 8) + bw / 2}" y="${cy + ch - 34}" text-anchor="middle">${k + 1} · ${b}</text>`).join('') +
      `</g>`;
    const progresso = `<rect class="prog" x="${cx}" y="${cy + ch + 14}" width="${cw}" height="3" rx="1.5" style="animation-name:p${i}"/>`;
    return frente + verso + progresso;
  }).join('\n');

  const chips = [
    `${paginas.length} páginas`, `${fmtNum(flashcards.cartoes.length)} flashcards`, `${quiz.questoes.length} questões`,
    `${desafios.length} desafios`, `${totalDias} dias de plano`
  ];
  const proximoX = [40, 40];
  const chipsSvg = chips.map((c, i) => {
    const w = largura(c, 13, true) + 22;
    const linha = i < 3 ? 0 : 1;
    const x = proximoX[linha];
    proximoX[linha] = x + w + 8;
    return `<g class="surge" style="animation-delay:${300 + i * 110}ms"><rect class="chip" x="${x}" y="${236 + linha * 38}" width="${w}" height="28" rx="14"/>` +
      `<text class="chip-t" x="${x + w / 2}" y="${255 + linha * 38}" text-anchor="middle">${esc(c)}</text></g>`;
  }).join('');
  const tagline = ['Sistema de estudo local para a prova de', 'efetivação de Dev Júnior — front-end, back-end', 'ou fullstack, na stack Vue 3 + TS e Spring Boot.'];
  const extra = `
.carta{fill:var(--bg);stroke:var(--borda);stroke-width:1.5}
.face{transform-box:fill-box;transform-origin:center;animation-duration:${CICLO}s;animation-iteration-count:${VOLTAS};animation-timing-function:linear;opacity:0}
.primeira{opacity:1}
.perg{font-size:19px;font-weight:650} .resp{font-size:15px;fill:var(--tinta2)}
.cod{font-family:${MONO};font-size:.9em;fill:var(--acentoTexto)}
.selo{fill:var(--acentoSuave)} .selo-t{font-size:11.5px;font-weight:650;fill:var(--acentoTexto)}
.botao{fill:#256abf} .botao-t{font-size:14px;font-weight:650;fill:#fff}
.nota{fill:var(--bg2);stroke:var(--borda)} .nota-t{font-size:12.5px;font-weight:600;fill:var(--tinta)}
.prog{fill:var(--acento);transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation-duration:${CICLO}s;animation-iteration-count:${VOLTAS};animation-timing-function:linear}
.chip{fill:var(--bg2);stroke:var(--borda)} .chip-t{font-size:13px;font-weight:600;fill:var(--tinta2)}
.nome{font-size:40px;font-weight:750;letter-spacing:-0.02em} .tag{font-size:16.5px;fill:var(--tinta2)}
.brilho{stop-color:var(--acento)}
.logo{fill:#256abf}
.aro{fill:none;stroke:var(--acento);stroke-width:2;opacity:.35;transform-box:fill-box;transform-origin:center;animation:gira ${CICLO * 2}s linear ${VOLTAS / 2}}
@keyframes gira{to{transform:rotate(360deg)}}
${keyframes}`;
  const corpo = `
<defs><radialGradient id="luz" cx="78%" cy="30%" r="60%"><stop offset="0" class="brilho" stop-opacity=".16"/><stop offset="1" class="brilho" stop-opacity="0"/></radialGradient></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="url(#luz)"/>
<circle class="aro" cx="${cx + cw / 2}" cy="${cy + ch / 2}" r="150" stroke-dasharray="4 10"/>
<g class="surge"><rect class="logo" x="40" y="44" width="46" height="46" rx="12"/>
<g transform="translate(51 55)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></g></g>
<text class="nome surge" x="40" y="140" style="animation-delay:80ms">Rumo ao Júnior</text>
${tagline.map((l, i) => `<text class="tag surge" x="40" y="${172 + i * 23}" style="animation-delay:${160 + i * 60}ms">${esc(l)}</text>`).join('')}
${chipsSvg}
${faces}`;
  return svg({
    altura: H,
    titulo: 'Rumo ao Júnior — sistema de estudo para a prova de efetivação',
    descricao: `Banner animado: o nome do projeto, a descrição e três flashcards reais do app (${ids.join(', ')}) virando da pergunta para a resposta.`,
    corpo,
    extra
  });
}

// =====================================================================
// 2. Números do projeto
// =====================================================================
function numeros() {
  const tiles = [
    [paginas.length, 'páginas no app', 'tudo no navegador, sem build'],
    [flashcards.cartoes.length, 'flashcards', `${flashcards.temas.length} temas, repetição SM-2`],
    [quiz.questoes.length, 'questões de quiz', comExplicacao === quiz.questoes.length ? 'todas com explicação' : `${comExplicacao} com explicação`],
    [desafios.length, 'desafios de simulado', `${comGabarito} com gabarito`],
    [totalDias, 'dias de plano', `${semanas.length} semanas, ${totalTarefas} tarefas`],
    [totalItens, 'itens de checklist', `${trilhas.length} trilhas, ${totalTopicos} tópicos`],
    [totalLinks, 'links gratuitos', `verificados em ${new Date(recursos.verificadoEm + 'T12:00:00').toLocaleDateString('pt-BR')}`]
  ];
  if (testes) tiles.push([testes.total, 'testes automatizados', `${testes.projetos.length} projetos Playwright`]);
  const cols = 4;
  const tw = (L - 48 - (cols - 1) * 12) / cols;
  const th = 104;
  const linhas = Math.ceil(tiles.length / cols);
  const H = 24 + linhas * th + (linhas - 1) * 12 + 24;
  const corpo = tiles.map(([n, rotulo, detalhe], i) => {
    const x = 24 + (i % cols) * (tw + 12);
    const y = 24 + Math.floor(i / cols) * (th + 12);
    return `<g class="surge" style="animation-delay:${i * 90}ms">` +
      `<rect class="tile" x="${x}" y="${y}" width="${tw}" height="${th}" rx="12"/>` +
      `<rect class="traco cresce" x="${x + 18}" y="${y + 16}" width="28" height="3" rx="1.5" style="animation-delay:${200 + i * 90}ms"/>` +
      `<text class="n" x="${x + 18}" y="${y + 52}">${fmtNum(n)}</text>` +
      `<text class="rot" x="${x + 18}" y="${y + 74}" font-weight="600">${esc(rotulo)}</text>` +
      `<text class="mini" x="${x + 18}" y="${y + 92}">${esc(cortar(detalhe, 12, tw - 30))}</text></g>`;
  }).join('\n');
  return svg({
    altura: H,
    titulo: 'O projeto em números',
    descricao: tiles.map(([n, r, d]) => `${n} ${r} (${d})`).join('; ') + '.',
    corpo,
    extra: `.tile{fill:var(--bg2)} .traco{fill:var(--acento)} .n{font-size:30px;font-weight:750;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}`
  });
}

// =====================================================================
// 3. Cronograma: minutos por tipo de tarefa em cada semana
// =====================================================================
function graficoCronograma() {
  const x0 = 24;
  const x1 = L - 90;
  const topo = 104;
  const linha = 52;
  const H = topo + semanas.length * linha + 58;
  const maxEixo = Math.ceil(Math.max(...semanas.map((s) => s.total)) / 120) * 120;
  const escala = (m) => (m / maxEixo) * (x1 - x0);
  const ticks = [];
  for (let m = 0; m <= maxEixo; m += 120) {
    const x = x0 + escala(m);
    ticks.push(`<line class="grade" x1="${x}" y1="${topo - 6}" x2="${x}" y2="${topo + semanas.length * linha - 14}"/>` +
      `<text class="mini" x="${x}" y="${topo + semanas.length * linha + 4}" text-anchor="middle">${m / 60} h</text>`);
  }
  const barras = semanas.map((s, i) => {
    const y = topo + i * linha;
    let x = x0;
    const segs = TIPOS.filter(([id]) => s.porTipo[id] > 0).map(([id, nome, classe]) => {
      const w = escala(s.porTipo[id]);
      const r = `<rect class="${classe} cresce" x="${x}" y="${y + 12}" width="${Math.max(0, w - 2)}" height="18" rx="2" style="animation-delay:${i * 90}ms"><title>${esc(`${nome}: ${fmtMin(s.porTipo[id])}`)}</title></rect>`;
      x += w;
      return r;
    }).join('');
    return `<text class="rot t2" x="${x0}" y="${y + 4}"><tspan font-weight="650" class="tinta">Semana ${s.numero}</tspan> · ${esc(cortar(s.titulo, 13, x1 - x0 - 90))}</text>` +
      segs + `<text class="val surge" x="${x + 8}" y="${y + 26}" style="animation-delay:${400 + i * 90}ms">${fmtMin(s.total)}</text>`;
  }).join('\n');
  const corpo = `
<text class="titulo" x="24" y="38">Plano de ${semanas.length} semanas: tempo por tipo de tarefa</text>
<text class="sub" x="24" y="60">${totalDias} dias, ${totalTarefas} tarefas e ${fmtMin(totalMin)} no total — fundamentos, projetos e, no fim, simulados.</text>
${legenda(TIPOS.map(([, nome, classe]) => [classe, nome]), 24, 88)}
${ticks.join('')}
${barras}
${fonte('Fonte: data/cronograma.json (soma do campo "duracao" das tarefas de cada semana).', H)}`;
  return svg({
    altura: H,
    titulo: `Plano de ${semanas.length} semanas: tempo por tipo de tarefa`,
    descricao: semanas.map((s) => `Semana ${s.numero} (${s.titulo}): ${fmtMin(s.total)} — ` +
      TIPOS.filter(([id]) => s.porTipo[id]).map(([id, nome]) => `${nome} ${fmtMin(s.porTipo[id])}`).join(', ')).join('. ') + '.',
    corpo,
    extra: '.tinta{fill:var(--tinta)}'
  });
}

// =====================================================================
// 4. Conteúdo por tema: flashcards e questões
// =====================================================================
function graficoTemas() {
  const lista = [...temas].sort((a, b) => b.cartoes + b.questoes - (a.cartoes + a.questoes));
  const x0 = 270;
  const x1 = L - 70;
  const topo = 100;
  const linha = 32;
  const H = topo + lista.length * linha + 64;
  const max = Math.max(...lista.map((t) => Math.max(t.cartoes, t.questoes)));
  const maxEixo = Math.ceil(max / 5) * 5;
  const escala = (n) => (n / maxEixo) * (x1 - x0);
  const ticks = [];
  for (let n = 0; n <= maxEixo; n += 5) {
    const x = x0 + escala(n);
    ticks.push(`<line class="grade" x1="${x}" y1="${topo - 6}" x2="${x}" y2="${topo + lista.length * linha - 4}"/><text class="mini" x="${x}" y="${topo + lista.length * linha + 12}" text-anchor="middle">${n}</text>`);
  }
  const linhas = lista.map((t, i) => {
    const y = topo + i * linha;
    const a = escala(t.cartoes);
    const b = escala(t.questoes);
    return `<text class="rot" x="${x0 - 14}" y="${y + 17}" text-anchor="end">${esc(cortar(t.nome, 13, x0 - 34))}</text>` +
      `<rect class="s1 cresce" x="${x0}" y="${y + 2}" width="${a}" height="10" rx="2" style="animation-delay:${i * 60}ms"><title>${t.cartoes} flashcards</title></rect>` +
      `<text class="val" x="${x0 + a + 6}" y="${y + 11}">${t.cartoes}</text>` +
      `<rect class="s2 cresce" x="${x0}" y="${y + 14}" width="${b}" height="10" rx="2" style="animation-delay:${i * 60 + 40}ms"><title>${t.questoes} questões</title></rect>` +
      `<text class="val" x="${x0 + b + 6}" y="${y + 23}">${t.questoes}</text>`;
  }).join('\n');
  const corpo = `
<text class="titulo" x="24" y="38">Conteúdo por tema</text>
<text class="sub" x="24" y="60">${flashcards.cartoes.length} flashcards e ${quiz.questoes.length} questões nos mesmos ${temas.length} temas — o quiz Misto e a fila de revisão intercalam todos.</text>
${legenda([['s1', 'Flashcards'], ['s2', 'Questões de quiz']], 24, 84)}
${ticks.join('')}
${linhas}
${fonte('Fonte: data/flashcards.json e data/quiz.json (itens por campo "tema").', H)}`;
  return svg({
    altura: H,
    titulo: 'Conteúdo por tema: flashcards e questões',
    descricao: lista.map((t) => `${t.nome}: ${t.cartoes} flashcards e ${t.questoes} questões`).join('; ') + '.',
    corpo
  });
}

// =====================================================================
// 5. Desafios: tempo sugerido, área, formato e gabarito
// =====================================================================
function graficoDesafios() {
  const grupos = ORDEM_AREAS.map((area) => ({
    area,
    itens: desafios.filter((d) => d.area === area).sort((a, b) => a.tempoSugeridoMin - b.tempoSugeridoMin)
  })).filter((g) => g.itens.length);
  const x0 = 372;
  const x1 = L - 330;
  const topo = 84;
  const linha = 25;
  const cab = 30;
  const H = topo + grupos.length * cab + desafios.length * linha + 50;
  const maxEixo = Math.ceil(Math.max(...desafios.map((d) => d.tempoSugeridoMin)) / 60) * 60;
  const escala = (m) => (m / maxEixo) * (x1 - x0);
  let y = topo;
  let k = 0;
  const classes = { front: 's1', back: 's2', fullstack: 's3', comum: 's4' };
  const partes = [];
  for (let m = 0; m <= maxEixo; m += 60) {
    const x = x0 + escala(m);
    partes.push(`<line class="grade" x1="${x}" y1="${topo}" x2="${x}" y2="${H - 50}"/><text class="mini" x="${x}" y="${topo - 8}" text-anchor="middle">${m / 60} h</text>`);
  }
  for (const g of grupos) {
    partes.push(`<text class="rot" x="24" y="${y + 20}" font-weight="650">${esc(AREAS[g.area] ?? g.area)} <tspan class="suave" font-weight="400">· ${g.itens.length}</tspan></text>`);
    y += cab;
    for (const d of g.itens) {
      const w = escala(d.tempoSugeridoMin);
      partes.push(`<text class="rot t2" x="36" y="${y + 14}" font-size="12.5">${esc(cortar(d.titulo, 12.5, x0 - 52))}</text>` +
        `<rect class="${classes[d.area]} cresce" x="${x0}" y="${y + 3}" width="${w}" height="13" rx="2" style="animation-delay:${k * 45}ms"><title>${esc(`${d.titulo}: ${fmtMin(d.tempoSugeridoMin)}`)}</title></rect>` +
        `<text class="val" x="${x0 + w + 6}" y="${y + 14}">${fmtMin(d.tempoSugeridoMin)}</text>` +
        `<text class="mini" x="${x1 + 56}" y="${y + 14}">${esc(FORMATOS[d.formato] ?? d.formato)}</text>` +
        (d.gabarito ? `<text class="gab" x="${L - 24}" y="${y + 14}" text-anchor="end">✓ gabarito</text>` : ''));
      y += linha;
      k += 1;
    }
  }
  const corpo = `
<text class="titulo" x="24" y="38">${desafios.length} desafios de simulado</text>
<text class="sub" x="24" y="60">Tempo sugerido de cada desafio, por área. ${comGabarito} têm gabarito para conferir depois de tentar.</text>
${partes.join('\n')}
${fonte('Fonte: data/desafios.json (campos area, formato, nivel, tempoSugeridoMin e gabarito).', H)}`;
  return svg({
    altura: H,
    titulo: `${desafios.length} desafios de simulado`,
    descricao: desafios.map((d) => `${d.titulo} (${AREAS[d.area]}, ${FORMATOS[d.formato]}, ${d.nivel}, ${fmtMin(d.tempoSugeridoMin)}${d.gabarito ? ', com gabarito' : ''})`).join('; ') + '.',
    corpo,
    extra: '.gab{font-size:12px;font-weight:650;fill:var(--acentoTexto)}'
  });
}

// =====================================================================
// 6. Recursos por categoria e idioma
// =====================================================================
function graficoRecursos() {
  const x0 = 250;
  const x1 = L - 70;
  const topo = 100;
  const linha = 26;
  const H = topo + categorias.length * linha + 60;
  const maxEixo = Math.ceil(Math.max(...categorias.map((c) => c.total)) / 5) * 5;
  const escala = (n) => (n / maxEixo) * (x1 - x0);
  const ticks = [];
  for (let n = 0; n <= maxEixo; n += 5) {
    const x = x0 + escala(n);
    ticks.push(`<line class="grade" x1="${x}" y1="${topo - 6}" x2="${x}" y2="${topo + categorias.length * linha - 4}"/><text class="mini" x="${x}" y="${topo + categorias.length * linha + 12}" text-anchor="middle">${n}</text>`);
  }
  const porIdioma = Object.fromEntries(idiomasUsados.map(([id]) => [id, categorias.reduce((a, c) => a + (c.porIdioma[id] ?? 0), 0)]));
  const linhas = categorias.map((c, i) => {
    const y = topo + i * linha;
    let x = x0;
    const segs = idiomasUsados.filter(([id]) => c.porIdioma[id]).map(([id, nome, classe]) => {
      const w = escala(c.porIdioma[id]);
      const r = `<rect class="${classe} cresce" x="${x}" y="${y + 3}" width="${Math.max(0, w - 2)}" height="14" rx="2" style="animation-delay:${i * 45}ms"><title>${esc(`${nome}: ${c.porIdioma[id]}`)}</title></rect>`;
      x += w;
      return r;
    }).join('');
    return `<text class="rot" x="${x0 - 14}" y="${y + 15}" text-anchor="end">${esc(cortar(c.nome, 13, x0 - 40))}</text>${segs}<text class="val" x="${x + 6}" y="${y + 15}">${c.total}</text>`;
  }).join('\n');
  const corpo = `
<text class="titulo" x="24" y="38">${totalLinks} links gratuitos em ${categorias.length} categorias</text>
<text class="sub" x="24" y="60">${idiomasUsados.map(([id]) => `${porIdioma[id]} ${FRASE_IDIOMA[id]}`).join(', ')} — verificados em ${new Date(recursos.verificadoEm + 'T12:00:00').toLocaleDateString('pt-BR')}.</text>
${legenda(idiomasUsados.map(([, nome, classe]) => [classe, nome]), 24, 84)}
${ticks.join('')}
${linhas}
${fonte('Fonte: data/recursos.json (links por categoria e campo "idioma").', H)}`;
  return svg({
    altura: H,
    titulo: `${totalLinks} links gratuitos em ${categorias.length} categorias`,
    descricao: categorias.map((c) => `${c.nome}: ${c.total}`).join('; ') + '.',
    corpo
  });
}

// =====================================================================
// 7. Trilhas: tópicos por prioridade
// =====================================================================
function graficoTrilhas() {
  const x0 = 180;
  const x1 = L - 300;
  const topo = 100;
  const linha = 46;
  const H = topo + trilhasResumo.length * linha + 36;
  const max = Math.max(...trilhasResumo.map((t) => t.topicos));
  const escala = (n) => (n / max) * (x1 - x0);
  const PRI = [['alta', 'Prioridade alta', 'o1'], ['media', 'Prioridade média', 'o2'], ['baixa', 'Prioridade baixa', 'o3']];
  const linhas = trilhasResumo.map((t, i) => {
    const y = topo + i * linha;
    let x = x0;
    const segs = PRI.filter(([id]) => t.prioridade[id]).map(([id, nome, classe]) => {
      const w = escala(t.prioridade[id]);
      const r = `<rect class="${classe} cresce" x="${x}" y="${y}" width="${Math.max(0, w - 2)}" height="20" rx="2" style="animation-delay:${i * 90}ms"><title>${esc(`${nome}: ${t.prioridade[id]} tópico(s)`)}</title></rect>`;
      x += w;
      return r;
    }).join('');
    return `<text class="rot" x="24" y="${y + 15}" font-weight="650">${esc(t.nome)}</text>${segs}` +
      `<text class="val" x="${x + 8}" y="${y + 15}">${t.topicos} tópicos</text>` +
      `<text class="rot t2" x="${x1 + 100}" y="${y + 15}">${t.itens} itens · ${t.links} links</text>`;
  }).join('\n');
  const corpo = `
<text class="titulo" x="24" y="38">${trilhas.length} trilhas, ${totalTopicos} tópicos, ${totalItens} itens de checklist</text>
<text class="sub" x="24" y="60">Cada tópico tem prioridade, descrição, links "Onde estudar", checklist marcável e anotações.</text>
${legenda(PRI.map(([, nome, classe]) => [classe, nome]), 24, 84)}
${linhas}
${fonte('Fonte: data/trilhas.json (tópicos por "prioridade"; itens de "checklist" e "links").', H)}`;
  return svg({
    altura: H,
    titulo: `${trilhas.length} trilhas de estudo`,
    descricao: trilhasResumo.map((t) => `${t.nome}: ${t.topicos} tópicos (${t.prioridade.alta} de prioridade alta, ${t.prioridade.media} média, ${t.prioridade.baixa} baixa), ${t.itens} itens, ${t.links} links`).join('; ') + '.',
    corpo
  });
}

// =====================================================================
// 8. SM-2: quando o cartão volta (calculado por js/lib/sm2.js)
// =====================================================================
const INICIO = '2026-01-05';
const HORIZONTE = 180;
function simular(notas) {
  let e = estadoInicialCartao();
  let dia = INICIO;
  const revisoes = [{ dia: 0, intervalo: null, nota: null }];
  for (let i = 0; i < 40; i++) {
    const q = notas[Math.min(i, notas.length - 1)];
    e = revisar(e, q, dia);
    const d = diferencaDias(INICIO, e.proxima);
    if (d > HORIZONTE) break;
    revisoes.push({ dia: d, intervalo: e.intervalo, nota: q });
    dia = e.proxima;
  }
  return revisoes;
}
const POLITICAS = [
  { nome: 'Sempre Fácil', notas: [5], classe: 's1' },
  { nome: 'Sempre Bom', notas: [4], classe: 's2' },
  { nome: 'Sempre Difícil', notas: [3], classe: 's3' },
  { nome: 'Bom, com um Errei', notas: [4, 4, 4, 1, 4], classe: 's4', nota: 'Errei na 4ª revisão: o cartão recomeça (1 dia), sem mudar o fator.' }
].map((p) => ({ ...p, revisoes: simular(p.notas) }));

function graficoSm2() {
  const x0 = 200;
  const x1 = L - 140;
  const topo = 108;
  const linha = 50;
  const H = topo + POLITICAS.length * linha + 58;
  const escala = (d) => x0 + (d / HORIZONTE) * (x1 - x0);
  const ticks = [];
  for (let d = 0; d <= HORIZONTE; d += 30) {
    ticks.push(`<line class="grade" x1="${escala(d)}" y1="${topo - 16}" x2="${escala(d)}" y2="${topo + POLITICAS.length * linha - 18}"/>` +
      `<text class="mini" x="${escala(d)}" y="${topo + POLITICAS.length * linha + 2}" text-anchor="middle">${d}</text>`);
  }
  const DUR = 4.5; // segundos para "tocar" os 180 dias (uma vez só)
  const linhas = POLITICAS.map((p, i) => {
    const y = topo + i * linha;
    const ultimo = p.revisoes[p.revisoes.length - 1].dia;
    const trilho = `<line class="trilho" x1="${escala(0)}" y1="${y}" x2="${escala(HORIZONTE)}" y2="${y}"/>` +
      `<line class="linha-${p.classe} cresce-linha" x1="${escala(0)}" y1="${y}" x2="${escala(ultimo)}" y2="${y}" style="animation-duration:${(ultimo / HORIZONTE) * DUR}s"/>`;
    const pontos = p.revisoes.map((r, k) =>
      `<circle class="${p.classe} ponto" cx="${escala(r.dia)}" cy="${y}" r="${k === 0 ? 4 : 6}" style="animation-delay:${(r.dia / HORIZONTE) * DUR}s">` +
      `<title>${k === 0 ? 'Primeiro estudo (dia 0)' : esc(`Revisão ${k}: dia ${r.dia} (intervalo de ${r.intervalo} dia${r.intervalo === 1 ? '' : 's'})`)}</title></circle>`).join('');
    const rotulosDia = p.revisoes.slice(1).filter((r, k, arr) => k === arr.length - 1 || escala(arr[k + 1].dia) - escala(r.dia) > 26)
      .map((r) => `<text class="mini" x="${escala(r.dia)}" y="${y - 12}" text-anchor="middle">${r.dia}</text>`).join('');
    return `<text class="rot" x="24" y="${y + 5}" font-weight="650">${esc(p.nome)}</text>${trilho}${pontos}${rotulosDia}` +
      `<text class="val" x="${x1 + 16}" y="${y + 5}">${p.revisoes.length - 1} revisões</text>`;
  }).join('\n');
  const bom = POLITICAS[1].revisoes.slice(1).map((r) => r.intervalo);
  const corpo = `
<text class="titulo" x="24" y="38">Quando o cartão volta: intervalos reais do SM-2</text>
<text class="sub" x="24" y="60">Dias de revisão nos primeiros ${HORIZONTE} dias, calculados pelo js/lib/sm2.js do app. Sempre Bom: +${bom.join(', +')} dias.</text>
<text class="mini" x="24" y="80">${esc(POLITICAS[3].nota)}</text>
${ticks.join('')}
${linhas}
<text class="mini" x="${x1}" y="${topo + POLITICAS.length * linha + 20}" text-anchor="end">dias depois do 1º estudo →</text>
${fonte('Fonte: revisar() de js/lib/sm2.js, a mesma função usada pela página Flashcards.', H)}`;
  return svg({
    altura: H,
    titulo: 'Quando o cartão volta: intervalos reais do SM-2',
    descricao: POLITICAS.map((p) => `${p.nome}: revisões nos dias ${p.revisoes.slice(1).map((r) => r.dia).join(', ')}`).join('. ') + '.',
    corpo,
    extra: `.trilho{stroke:var(--grade);stroke-width:4;stroke-linecap:round}
.linha-s1{stroke:var(--s1)} .linha-s2{stroke:var(--s2)} .linha-s3{stroke:var(--s3)} .linha-s4{stroke:var(--s4)}
.cresce-linha{stroke-width:2;transform-box:fill-box;transform-origin:left center;animation:cresce linear both}
.ponto{stroke:var(--bg);stroke-width:2;transform-box:fill-box;transform-origin:center;animation:pulo .45s cubic-bezier(.3,1.6,.5,1) both}
@keyframes pulo{from{transform:scale(0)}to{transform:scale(1)}}`
  });
}

// =====================================================================
// 9. Testes: resultado real da última execução
// =====================================================================
const COBERTURA = {
  'e2e/navegacao.spec.ts': 'Navegação',
  'e2e/plano.spec.ts': 'Painel, Trilhas e Cronograma',
  'e2e/pratica.spec.ts': 'Flashcards e Quiz',
  'e2e/rotina.spec.ts': 'Simulado, Pomodoro, Diário e mais',
  'e2e/dados.spec.ts': 'JSON editado à mão',
  'e2e/acessibilidade.spec.ts': 'Acessibilidade (axe-core)',
  'e2e/responsivo.spec.ts': 'Responsividade',
  'e2e/visual.spec.ts': 'Capturas de cada tela',
  'e2e/manual.spec.ts': 'Manual de uso',
  'e2e/readme.spec.ts': 'README em dia com os dados'
};
function graficoTestes() {
  const arquivos = Object.entries(testes.porArquivo).sort((a, b) => b[1].total - a[1].total);
  const x0 = 290;
  const x1 = L - 170;
  const topo = 100;
  const linha = 38;
  const H = topo + arquivos.length * linha + 36;
  const max = Math.max(...arquivos.map(([, r]) => r.total));
  const escala = (n) => (n / max) * (x1 - x0);
  const ST = [['aprovados', 'Aprovado', 'bom'], ['instaveis', 'Instável', 'aviso'], ['falharam', 'Falhou', 'critico'], ['pulados', 'Pulado', 'neutro']];
  const linhas = arquivos.map(([arq, r], i) => {
    const y = topo + i * linha;
    let x = x0;
    const segs = ST.filter(([id]) => r[id]).map(([id, nome, classe]) => {
      const w = escala(r[id]);
      const s = `<rect class="${classe} cresce" x="${x}" y="${y + 6}" width="${Math.max(0, w - 2)}" height="14" rx="2" style="animation-delay:${i * 60}ms"><title>${esc(`${nome}: ${r[id]}`)}</title></rect>`;
      x += w;
      return s;
    }).join('');
    const detalhe = [`${r.aprovados} ✓`, r.pulados ? `${r.pulados} pulado${r.pulados > 1 ? 's' : ''}` : '', r.falharam ? `${r.falharam} ✗` : '', r.instaveis ? `${r.instaveis} instável` : ''].filter(Boolean).join(' · ');
    return `<text class="rot" x="24" y="${y + 12}">${esc(COBERTURA[arq] ?? arq)}</text><text class="mini" x="24" y="${y + 28}">${esc(arq)}</text>` +
      segs + `<text class="val" x="${x + 6}" y="${y + 18}">${detalhe}</text>`;
  }).join('\n');
  const quando = dataBR(testes.geradoEm);
  const resumo = [`${testes.aprovados} aprovados`, `${testes.pulados} pulados`, testes.falharam ? `${testes.falharam} falharam` : '', testes.instaveis ? `${testes.instaveis} instáveis` : ''].filter(Boolean).join(', ');
  const corpo = `
<text class="titulo" x="24" y="38">${testes.total} testes de ponta a ponta em ${testes.projetos.length} projetos</text>
<text class="sub" x="24" y="60">Execução real em ${quando}: ${resumo} (${fmtMin(Math.round(testes.duracaoSeg / 60))}). Projetos: ${testes.projetos.join(', ')}.</text>
${legenda(ST.filter(([id]) => testes[id]).map(([, nome, classe]) => [classe, nome]), 24, 84)}
${linhas}
${fonte('Fonte: docs/readme/dados/testes.json, gravado por testes/readme/resumo-testes.mjs a partir do relatório do Playwright.', H)}`;
  return svg({
    altura: H,
    titulo: `${testes.total} testes de ponta a ponta`,
    descricao: `Execução de ${quando}: ${resumo}. ` + arquivos.map(([arq, r]) => `${COBERTURA[arq] ?? arq}: ${r.total} testes, ${r.aprovados} aprovados`).join('; ') + '.',
    corpo
  });
}

// =====================================================================
// 10. Terminal do start.bat (texto tirado do próprio arquivo)
// =====================================================================
function terminal() {
  const bat = readFileSync(resolve(RAIZ, 'start.bat'), 'utf8').replace(/\r\n/g, '\n');
  const porta = bat.match(/set "PORTA=(\d+)"/)?.[1];
  const titulo = bat.match(/^title (.+)$/m)?.[1];
  const trecho = (de, ate) => {
    const i = bat.indexOf(de);
    const j = bat.indexOf(ate, i);
    if (i === -1 || j === -1) throw new Error(`trecho ${de}..${ate} não encontrado no start.bat`);
    return bat.slice(i + de.length, j).split('\n').filter((l) => /^echo[. ]/.test(l)).map((l) => (l === 'echo.' ? '' : l.slice(5)));
  };
  const menu = trecho(':menu\n', 'choice ');
  const prompt = bat.match(/choice [^\n]*\/m "([^"]+)"/)?.[1];
  const inicio = trecho(':iniciar_servidor\n', 'rem Abre').map((l) => l.replace(/%URL%/g, `http://localhost:${porta}`));
  if (!porta || !titulo || !prompt) throw new Error('não consegui ler porta, título ou prompt do start.bat');
  const linhas = [...menu, prompt + '1', ...inicio];
  const W = L;
  const lh = 19;
  const topo = 58;
  const H = topo + linhas.length * lh + 28;
  const CPS = 70; // caracteres por segundo
  let t = 0.6;
  const tempos = linhas.map((l) => {
    const dur = l.trim() ? Math.max(0.12, l.length / CPS) : 0.05;
    const r = { inicio: t, fim: t + dur };
    t += dur + (l === prompt + '1' ? 0.9 : 0.04);
    return r;
  });
  const CICLO = t + 5;
  const p = (s) => `${Math.round((s / CICLO) * 10000) / 100}%`;
  let kf = '';
  const textos = linhas.map((l, i) => {
    if (!l.trim()) return '';
    const n = [...l].length;
    kf += `@keyframes l${i}{0%,${p(tempos[i].inicio)}{clip-path:inset(0 100% 0 0);animation-timing-function:steps(${n},end)}${p(tempos[i].fim)},99.5%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 100% 0 0)}}\n`;
    const destaque = l.startsWith(prompt) ? ' forte' : /^\s*\[\d\]/.test(l) ? ' opcao' : '';
    const conteudo = l.startsWith(prompt) ? `${esc(prompt)}<tspan class="digitado">1</tspan>` : esc(l);
    return `<text class="linha${destaque}" x="22" y="${topo + i * lh}" style="animation-name:l${i}">${conteudo}</text>`;
  }).join('\n');
  const ultimaY = topo + (linhas.length - 1) * lh;
  const ultimaW = largura(linhas[linhas.length - 1], 13.5, false, true);
  const corpo = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="#0c0c0c"/>
<rect x="1" y="1" width="${W - 2}" height="34" rx="15" fill="#1f1f1f"/><rect x="1" y="20" width="${W - 2}" height="15" fill="#1f1f1f"/>
<rect x="16" y="11" width="13" height="13" rx="3" fill="#256abf"/>
<text x="38" y="23" class="barra">${esc(titulo)} — start.bat</text>
<text x="${W - 22}" y="23" class="barra" text-anchor="end">✕</text>
${textos}
<rect class="cursor" x="${22 + ultimaW + 2}" y="${ultimaY - 13}" width="8" height="16"/>`;
  return svg({
    altura: H,
    titulo: 'start.bat em ação',
    descricao: `Terminal animado com o texto real do start.bat: o menu de opções, a escolha da opção 1 e as mensagens ao iniciar o servidor em http://localhost:${porta}.`,
    corpo,
    extra: `.cartao{fill:#0c0c0c;stroke:#333}
.barra{font-family:${FONTE};font-size:12.5px;fill:#d4d4d4}
.linha{font-family:${MONO};font-size:13.5px;fill:#cccccc;white-space:pre;animation-duration:${CICLO}s;animation-iteration-count:2;animation-timing-function:linear}
.opcao{fill:#e8e8e8} .forte{fill:#ffffff;font-weight:700} .digitado{fill:#6da7ec}
.cursor{fill:#cccccc;animation:pisca 1.05s steps(1) ${Math.round((CICLO * 2) / 1.05)}}
@keyframes pisca{50%{opacity:0}}
${kf}`
  });
}

// =====================================================================
// 11. Selos (badges) com fatos verificáveis
// =====================================================================
function selo(nome, rotulo, valor, cor) {
  const pad = 9;
  const w1 = Math.ceil(largura(rotulo, 11.5) + pad * 2);
  const w2 = Math.ceil(largura(valor, 11.5, true) + pad * 2);
  const W = w1 + w2;
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="22" viewBox="0 0 ${W} 22" role="img" aria-label="${esc(`${rotulo}: ${valor}`)}">
<title>${esc(`${rotulo}: ${valor}`)}</title>
<rect width="${W}" height="22" rx="5" fill="#4a4945"/><rect x="${w1}" width="${w2}" height="22" rx="5" fill="${cor}"/><rect x="${w1}" width="6" height="22" fill="${cor}"/>
<g font-family='${FONTE}' font-size="11.5" fill="#fff"><text x="${w1 / 2}" y="15" text-anchor="middle">${esc(rotulo)}</text><text x="${w1 + w2 / 2}" y="15" text-anchor="middle" font-weight="650">${esc(valor)}</text></g>
</svg>
`;
  gravar(`selos/${nome}.svg`, s);
}

// =====================================================================
// Tabelas do README (entre marcadores)
// =====================================================================
function tabelas() {
  const t = {};
  t.temas = ['| Tema | Flashcards | Questões |', '|---|---:|---:|',
    ...temas.map((x) => `| ${x.nome} | ${x.cartoes} | ${x.questoes} |`),
    `| **Total** | **${flashcards.cartoes.length}** | **${quiz.questoes.length}** |`].join('\n');
  t.cronograma = ['| Semana | Foco | Tarefas | ' + TIPOS.map(([, n]) => n).join(' | ') + ' | Total |',
    '|---|---|---:|' + TIPOS.map(() => '---:').join('|') + '|---:|',
    ...semanas.map((s) => `| ${s.numero} | ${s.titulo} | ${s.tarefas} | ` + TIPOS.map(([id]) => (s.porTipo[id] ? fmtMin(s.porTipo[id]) : '—')).join(' | ') + ` | **${fmtMin(s.total)}** |`)].join('\n');
  t.trilhas = ['| Trilha | Tópicos | Alta · média · baixa | Itens de checklist | Links |', '|---|---:|:---:|---:|---:|',
    ...trilhasResumo.map((x) => `| ${x.nome} | ${x.topicos} | ${x.prioridade.alta} · ${x.prioridade.media} · ${x.prioridade.baixa} | ${x.itens} | ${x.links} |`),
    `| **Total** | **${totalTopicos}** | | **${totalItens}** | **${trilhasResumo.reduce((a, x) => a + x.links, 0)}** |`].join('\n');
  t.desafios = ['| Desafio | Área | Formato | Nível | Tempo | Gabarito |', '|---|---|---|---|---:|:---:|',
    ...ORDEM_AREAS.flatMap((a) => desafios.filter((d) => d.area === a).map((d) =>
      `| ${d.titulo} | ${AREAS[d.area]} | ${FORMATOS[d.formato]} | ${d.nivel} | ${fmtMin(d.tempoSugeridoMin)} | ${d.gabarito ? '✓' : '—'} |`))].join('\n');
  t.recursos = ['| Categoria | Links | ' + idiomasUsados.map(([, n]) => n).join(' | ') + ' |', '|---|---:|' + idiomasUsados.map(() => '---:').join('|') + '|',
    ...categorias.map((c) => `| ${c.nome} | ${c.total} | ` + idiomasUsados.map(([id]) => c.porIdioma[id] ?? '—').join(' | ') + ' |')].join('\n');
  t.sm2 = ['| Respondendo sempre… | Revisões nos dias (até o dia ' + HORIZONTE + ') |', '|---|---|',
    ...POLITICAS.map((p) => `| ${p.nome} | ${p.revisoes.slice(1).map((r) => r.dia).join(', ')} |`)].join('\n');
  if (testes) {
    t.testes = ['| Arquivo | Área | Testes | Aprovados | Pulados | Falharam |', '|---|---|---:|---:|---:|---:|',
      ...Object.entries(testes.porArquivo).sort((a, b) => b[1].total - a[1].total).map(([arq, r]) =>
        `| \`${arq}\` | ${COBERTURA[arq] ?? '—'} | ${r.total} | ${r.aprovados} | ${r.pulados} | ${r.falharam} |`),
      `| **Total** | ${testes.projetos.join(', ')} | **${testes.total}** | **${testes.aprovados}** | **${testes.pulados}** | **${testes.falharam}** |`].join('\n');
  }
  return t;
}

function blocosReadme(md, t, numeros) {
  const faltando = [];
  // tabelas: <!-- gerado:NOME --> ... <!-- /gerado:NOME -->
  for (const [nome, conteudo] of Object.entries(t)) {
    const re = new RegExp(`(<!-- gerado:${nome} -->)[\\s\\S]*?(<!-- /gerado:${nome} -->)`);
    if (re.test(md)) md = md.replace(re, (_, abre, fecha) => `${abre}\n${conteudo}\n${fecha}`);
    else faltando.push(`gerado:${nome}`);
  }
  // números no meio do texto: <!-- n:CHAVE -->valor<!-- /n -->
  md = md.replace(/<!-- n:([\w-]+) -->[^<]*<!-- \/n -->/g, (_, chave) => {
    if (!(chave in numeros)) throw new Error(`README.md usa <!-- n:${chave} -->, que o gerador não conhece`);
    return `<!-- n:${chave} -->${numeros[chave]}<!-- /n -->`;
  });
  return { md, faltando };
}

// =====================================================================
const CONFERIR = process.argv.includes('--conferir');
const NUMEROS = {
  paginas: paginas.length,
  flashcards: flashcards.cartoes.length,
  temas: flashcards.temas.length,
  questoes: quiz.questoes.length,
  desafios: desafios.length,
  gabaritos: comGabarito,
  semanas: semanas.length,
  dias: totalDias,
  tarefas: totalTarefas,
  'tarefas-com-acao': cronograma.semanas.flatMap((s) => s.dias.flatMap((d) => d.tarefas)).filter((t) => t.acao?.rota).length,
  'dias-1h45': cronograma.semanas.flatMap((s) => s.dias).filter((d) => d.tarefas.reduce((a, t) => a + (t.duracao ?? 0), 0) === 105).length,
  'horas-plano': fmtMin(totalMin),
  trilhas: trilhas.length,
  topicos: totalTopicos,
  itens: totalItens,
  'itens-progresso': totalItens + totalTarefas,
  links: totalLinks,
  categorias: categorias.length,
  'links-verificados-em': new Date(recursos.verificadoEm + 'T12:00:00').toLocaleDateString('pt-BR'),
  'novos-por-dia': Number(readFileSync(resolve(RAIZ, 'js/core/estado.js'), 'utf8').match(/novosPorDia:\s*(\d+)/)?.[1]),
  'sm2-bom': POLITICAS[1].revisoes.slice(1).map((r) => r.intervalo).join(', '),
  ...(testes ? {
    'testes-total': testes.total,
    'testes-aprovados': testes.aprovados,
    'testes-pulados': testes.pulados,
    'testes-falharam': testes.falharam,
    'testes-projetos': testes.projetos.length,
    'testes-data': dataBR(testes.geradoEm),
    'testes-duracao': fmtMin(Math.round(testes.duracaoSeg / 60))
  } : {})
};

if (CONFERIR) {
  // Só compara: falha se o README estiver diferente do que os dados geram hoje.
  const atual = readFileSync(resolve(RAIZ, 'README.md'), 'utf8');
  const { md, faltando } = blocosReadme(atual, tabelas(), NUMEROS);
  const problemas = [...faltando.map((f) => `marcador ausente: <!-- ${f} -->`)];
  if (md !== atual) {
    const a = atual.split('\n');
    const b = md.split('\n');
    const i = a.findIndex((l, k) => l !== b[k]);
    problemas.push(`README.md desatualizado a partir da linha ${i + 1}: "${a[i]?.slice(0, 90)}" deveria ser "${b[i]?.slice(0, 90)}"`);
  }
  if (problemas.length) {
    console.error('README.md não bate com os dados:\n  ' + problemas.join('\n  ') + '\nRode "npm run readme:graficos" dentro de testes/.');
    process.exit(1);
  }
  console.log('README.md está de acordo com os dados.');
  process.exit(0);
}

mkdirSync(resolve(SAIDA, 'selos'), { recursive: true });
mkdirSync(resolve(SAIDA, 'dados'), { recursive: true });
gravarTemas('banner', banner);
gravarTemas('numeros', numeros);
gravarTemas('grafico-cronograma', graficoCronograma);
gravarTemas('grafico-temas', graficoTemas);
gravarTemas('grafico-desafios', graficoDesafios);
gravarTemas('grafico-recursos', graficoRecursos);
gravarTemas('grafico-trilhas', graficoTrilhas);
gravarTemas('grafico-sm2', graficoSm2);
gravar('terminal-start.svg', terminal());
if (testes) {
  gravarTemas('grafico-testes', graficoTestes);
  const ok = testes.falharam === 0;
  selo('testes', 'testes', ok ? `${testes.aprovados} aprovados` : `${testes.falharam} falhando`, ok ? '#1f7a1f' : '#b0292b');
  const a11y = testes.porArquivo['e2e/acessibilidade.spec.ts'];
  if (a11y) selo('acessibilidade', 'acessibilidade', a11y.falharam ? 'axe: falhas' : 'WCAG 2.2 AA (axe)', a11y.falharam ? '#b0292b' : '#184f95');
} else {
  console.warn('Aviso: docs/readme/dados/testes.json não existe — rode "npm run readme:testes". Gráfico e selo de testes não foram gerados.');
}
selo('dependencias', 'dependências do app', '0', '#184f95');
selo('build', 'build', 'nenhum', '#184f95');
// versões antigas, de arquivo único (antes das variantes claro/escuro)
for (const velho of ['banner', 'numeros', 'grafico-cronograma', 'grafico-temas', 'grafico-desafios', 'grafico-recursos', 'grafico-trilhas', 'grafico-sm2', 'grafico-testes']) {
  rmSync(resolve(SAIDA, `${velho}.svg`), { force: true });
}
rmSync(resolve(SAIDA, 'selos/idioma.svg'), { force: true });

const conteudo = {
  numeros: NUMEROS,
  trilhas: trilhasResumo,
  cronograma: { semanas, totalDias, totalTarefas, totalMin },
  temas,
  sm2: POLITICAS.map((p) => ({ nome: p.nome, notas: p.notas, dias: p.revisoes.slice(1).map((r) => r.dia), intervalos: p.revisoes.slice(1).map((r) => r.intervalo) }))
};
writeFileSync(resolve(SAIDA, 'dados/conteudo.json'), JSON.stringify(conteudo, null, 2) + '\n');

const caminhoReadme = resolve(RAIZ, 'README.md');
const { md, faltando } = blocosReadme(readFileSync(caminhoReadme, 'utf8'), tabelas(), NUMEROS);
writeFileSync(caminhoReadme, md);

console.log(`Gerados em docs/readme/:\n  ${escritos.join('\n  ')}`);
console.log(faltando.length ? `README: marcadores ausentes — ${faltando.join(', ')}` : 'README: tabelas e números atualizados.');
