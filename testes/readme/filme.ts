// =====================================================================
// filme.ts — monta um "filme" em SVG com quadros REAIS do app, capturados
// pelo Playwright durante uma interação de verdade. Cada quadro vira uma
// imagem WebP embutida; o SVG alterna os quadros com CSS (sem JavaScript),
// mostra a rota da tela, uma legenda por passo e, em laranja, o controle
// que será usado em seguida (clique ou tecla).
// Com prefers-reduced-motion, fica só o primeiro quadro, parado.
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';

export type Acao = { tipo: 'clique'; x: number; y: number; w: number; h: number } | { tipo: 'tecla'; tecla: string };
export type Quadro = { webp: string; largura: number; altura: number; escala: number; rota: string; legenda: string; acao?: Acao };

const CLARO = {
  bg: '#ffffff', bg2: '#f3f3ef', borda: '#e1e0d9', tinta: '#111110', tinta2: '#4a4945', suave: '#676660',
  acentoSuave: '#e5eefa', acentoTexto: '#184f95', trilho: '#e1e0d9', progresso: '#256abf'
};
const ESCURO = {
  bg: '#1a1a19', bg2: '#222220', borda: '#2f2f2c', tinta: '#f4f4f1', tinta2: '#c3c2b7', suave: '#9c9a91',
  acentoSuave: '#16263d', acentoTexto: '#9ec5f4', trilho: '#2f2f2c', progresso: '#6da7ec'
};
const MARCA = '#e8590c'; // a mesma cor das marcações do manual
const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const DURACAO = 3.8; // segundos por quadro
const FADE = 0.45;
const VOLTAS = 3;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const vars = (t: Record<string, string>) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');
const r2 = (n: number) => Math.round(n * 100) / 100;

function largura(texto: string, px: number) {
  let w = 0;
  for (const ch of texto) {
    if (" il.,:;'|!`’·".includes(ch)) w += 0.3;
    else if ('fjrtI()[]{}-/'.includes(ch)) w += 0.38;
    else if ('mwMW@%'.includes(ch)) w += 0.88;
    else if ((ch >= 'A' && ch <= 'Z') || 'ÁÉÍÓÚÂÊÔÃÕÇ'.includes(ch)) w += 0.68;
    else if (ch >= '0' && ch <= '9') w += 0.58;
    else w += 0.56;
  }
  return w * px;
}
function quebrar(texto: string, px: number, max: number) {
  const linhas: string[] = [];
  let atual = '';
  for (const p of texto.split(/\s+/)) {
    const teste = atual ? `${atual} ${p}` : p;
    if (largura(teste, px) > max && atual) {
      linhas.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Converte o PNG da captura em WebP usando o próprio Chrome (canvas). */
async function paraWebp(page: Page, png: Buffer, qualidade = 0.8) {
  const conversor = await page.context().newPage();
  const b64 = await conversor.evaluate(
    async ({ dados, q }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${dados}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      return c.toDataURL('image/webp', q).split(',')[1];
    },
    { dados: png.toString('base64'), q: qualidade }
  );
  await conversor.close();
  return b64;
}

export class Filme {
  quadros: Quadro[] = [];

  constructor(
    private page: Page,
    readonly nome: string,
    readonly titulo: string,
    readonly opcoes: { celular?: boolean } = {}
  ) {}

  /** Captura a tela atual. "proxima" é o controle (ou a tecla) usado para chegar ao quadro seguinte. */
  async quadro(legenda: string, proxima?: Locator | string, { rolar = true } = {}) {
    const page = this.page;
    await page.mouse.move(2, 2);
    await page.waitForTimeout(450); // deixa terminar as transições de 160ms do app
    let acao: Acao | undefined;
    const vp = page.viewportSize()!;
    if (typeof proxima === 'string') acao = { tipo: 'tecla', tecla: proxima };
    else if (proxima) {
      if (rolar) await proxima.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const b = await proxima.first().boundingBox();
      if (b && b.y >= 0 && b.y + b.height <= vp.height) acao = { tipo: 'clique', x: b.x, y: b.y, w: b.width, h: b.height };
    }
    const png = await page.screenshot();
    const escala = await page.evaluate(() => window.devicePixelRatio);
    this.quadros.push({
      webp: await paraWebp(page, png),
      largura: vp.width,
      altura: vp.height,
      escala,
      rota: new URL(page.url()).hash || '#/dashboard',
      legenda,
      acao
    });
  }

  salvar(pasta: string) {
    const svg = this.opcoes.celular ? montarCelular(this) : montarDesktop(this);
    const arquivo = path.join(pasta, `demo-${this.nome}.svg`);
    fs.writeFileSync(arquivo, svg);
    return { arquivo, quadros: this.quadros.length, kb: Math.round(Buffer.byteLength(svg) / 1024) };
  }
}

// ---------------------------------------------------------------------
// Tempo: cada quadro fica DURACAO segundos; o seguinte entra por cima (FADE).
// O quadro 0 fica sempre embaixo, visível (é o que aparece sem animação).
// ---------------------------------------------------------------------
function tempos(n: number) {
  const T = n * DURACAO;
  const p = (s: number) => `${r2((Math.min(Math.max(s, 0), T) / T) * 100)}%`;
  // Movimento finito (WCAG 2.2.2): VOLTAS repetições e o filme para no 1º quadro, com a legenda.
  let css = `.q,.leg,.pr,.ac{animation-duration:${r2(T)}s;animation-iteration-count:${VOLTAS};animation-timing-function:linear}\n`;
  for (let i = 1; i < n; i++) {
    const ini = i * DURACAO;
    const fim = i === n - 1 ? T - FADE : (i + 1) * DURACAO;
    css += `.q${i}{opacity:0;animation-name:q${i}}@keyframes q${i}{0%,${p(ini - FADE)}{opacity:0}${p(ini)}{opacity:1}${p(fim)}{opacity:1}` +
      (i === n - 1 ? `100%{opacity:0}}` : `${p(fim + 0.02)}{opacity:0}100%{opacity:0}}`) + '\n';
  }
  for (let i = 0; i < n; i++) {
    const ini = i * DURACAO;
    const fim = (i + 1) * DURACAO;
    // legenda e rota do quadro i
    css += i === 0
      ? `.leg0{animation-name:leg0}@keyframes leg0{0%,${p(fim - 0.2)}{opacity:1}${p(fim)}{opacity:0}${p(T - 0.25)}{opacity:0}100%{opacity:1}}\n`
      : `.leg${i}{opacity:0;animation-name:leg${i}}@keyframes leg${i}{0%,${p(ini)}{opacity:0}${p(ini + 0.25)}{opacity:1}${p(fim - 0.2)}{opacity:1}${p(fim)}{opacity:0}100%{opacity:0}}\n`;
    // barra de progresso (estilo "stories")
    css += `.pr${i}{transform:scaleX(0);animation-name:pr${i}}@keyframes pr${i}{0%,${p(ini)}{transform:scaleX(0)}${p(fim)}{transform:scaleX(1)}99.9%{transform:scaleX(1)}100%{transform:scaleX(0)}}\n`;
    // destaque do próximo controle
    css += `.ac${i}{opacity:0;animation-name:ac${i}}@keyframes ac${i}{0%,${p(ini + DURACAO * 0.42)}{opacity:0}${p(ini + DURACAO * 0.5)}{opacity:1}${p(fim - 0.12)}{opacity:1}${p(fim)}{opacity:0}100%{opacity:0}}\n`;
  }
  return css;
}

function estiloBase(extra: string) {
  return `<style>
svg{${vars(CLARO)}}
@media (prefers-color-scheme: dark){svg{${vars(ESCURO)}}}
text{font-family:${FONTE};fill:var(--tinta)}
.cartao{fill:var(--bg);stroke:var(--borda)} .barra{fill:var(--bg2)} .t2{fill:var(--tinta2)} .suave{fill:var(--suave)}
.pilula{fill:var(--bg);stroke:var(--borda)} .rota{font-size:12.5px;fill:var(--tinta2);font-family:"Cascadia Mono",Consolas,monospace}
.passo{fill:var(--acentoSuave)} .passo-t{font-size:12px;font-weight:700;fill:var(--acentoTexto)}
.legenda{font-size:14.5px}
.trilho{fill:var(--trilho)} .pr{fill:var(--progresso);transform-box:fill-box;transform-origin:left center}
.anel{fill:none;stroke:${MARCA};stroke-width:3}
.pulso{fill:${MARCA};transform-box:fill-box;transform-origin:center;animation:pulso 1.1s ease-out infinite} /* só aparece dentro da janela do destaque (.ac) */
@keyframes pulso{from{opacity:.55;transform:scale(.6)}to{opacity:0;transform:scale(2.2)}}
.tecla{fill:#fff;stroke:${MARCA};stroke-width:2.5} .tecla-t{font-size:15px;font-weight:700;fill:#111110} .tecla-r{font-size:11px;font-weight:700;fill:${MARCA};letter-spacing:.06em}
.moldura{fill:#111110}
${extra}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>`;
}

function destaque(q: Quadro, i: number, ox: number, oy: number, s: number, larguraTela: number, alturaTela: number) {
  if (!q.acao) return '';
  if (q.acao.tipo === 'clique') {
    const { x, y, w, h } = q.acao;
    const cx = ox + (x + w / 2) * s;
    const cy = oy + (y + h / 2) * s;
    return `<g class="ac ac${i}"><rect class="anel" x="${r2(ox + x * s - 5)}" y="${r2(oy + y * s - 5)}" width="${r2(w * s + 10)}" height="${r2(h * s + 10)}" rx="9"/>` +
      `<circle class="pulso" cx="${r2(cx)}" cy="${r2(cy)}" r="12"/></g>`;
  }
  const rotulo = q.acao.tecla;
  const w = Math.max(44, largura(rotulo, 15) + 28);
  const x = ox + larguraTela - w - 18; // canto inferior direito: não cobre o conteúdo central
  const y = oy + alturaTela - 56;
  return `<g class="ac ac${i}"><rect class="tecla" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="38" rx="9"/>` +
    `<text class="tecla-t" x="${r2(x + w / 2)}" y="${r2(y + 25)}" text-anchor="middle">${esc(rotulo)}</text>` +
    `<text class="tecla-r" x="${r2(x + w / 2)}" y="${r2(y - 8)}" text-anchor="middle">TECLA</text></g>`;
}

function montarDesktop(f: Filme) {
  const n = f.quadros.length;
  const W = 880;
  const pad = 12;
  const barra = 40;
  const tela = W - pad * 2;
  const q0 = f.quadros[0];
  const s = tela / q0.largura;
  const telaH = Math.round(q0.altura * s);
  const topoTela = pad + barra;
  const legY = topoTela + telaH + 14;
  const legendas = f.quadros.map((q) => quebrar(q.legenda, 14.5, tela - 90).slice(0, 2));
  const legH = legendas.some((l) => l.length > 1) ? 70 : 52;
  const H = legY + legH + 8;
  const segW = (tela - (n - 1) * 6) / n;

  const imagens = f.quadros.map((q, i) =>
    `<image class="q q${i}" href="data:image/webp;base64,${q.webp}" x="${pad}" y="${topoTela}" width="${tela}" height="${telaH}" preserveAspectRatio="xMidYMin slice"/>`).join('\n');
  const destaques = f.quadros.map((q, i) => destaque(q, i, pad, topoTela, s, tela, telaH)).join('\n');
  const topo = f.quadros.map((q, i) => {
    const w = largura(q.rota, 12.5) + 30;
    return `<g class="leg leg${i}"><rect class="pilula" x="${r2(W / 2 - w / 2)}" y="${pad + 8}" width="${r2(w)}" height="24" rx="12"/>` +
      `<text class="rota" x="${W / 2}" y="${pad + 24.5}" text-anchor="middle">${esc(q.rota)}</text></g>`;
  }).join('');
  const rodape = f.quadros.map((q, i) =>
    `<g class="leg leg${i}"><rect class="passo" x="${pad}" y="${legY + 14}" width="52" height="24" rx="12"/>` +
    `<text class="passo-t" x="${pad + 26}" y="${legY + 30.5}" text-anchor="middle">${i + 1} / ${n}</text>` +
    legendas[i].map((l, k) => `<text class="legenda" x="${pad + 66}" y="${legY + 31 + k * 20}">${esc(l)}</text>`).join('') + '</g>').join('\n');
  const progresso = f.quadros.map((_, i) =>
    `<rect class="trilho" x="${r2(pad + i * (segW + 6))}" y="${legY}" width="${r2(segW)}" height="3" rx="1.5"/>` +
    `<rect class="pr pr${i}" x="${r2(pad + i * (segW + 6))}" y="${legY}" width="${r2(segW)}" height="3" rx="1.5"/>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="titulo desc">
<title id="titulo">${esc(f.titulo)}</title>
<desc id="desc">${esc(f.quadros.map((q, i) => `${i + 1}. ${q.legenda}`).join(' '))}</desc>
${estiloBase(tempos(n))}
<defs><clipPath id="recorte"><rect x="${pad}" y="${topoTela}" width="${tela}" height="${telaH}" rx="0"/></clipPath></defs>
<rect class="cartao" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"/>
<path class="barra" d="M${pad} ${pad + 10} a10 10 0 0 1 10 -10 h${tela - 20} a10 10 0 0 1 10 10 v${barra - 10} h-${tela} z"/>
<rect x="${pad + 14}" y="${pad + 13}" width="14" height="14" rx="4" fill="#256abf"/>
<text class="t2" x="${pad + 36}" y="${pad + 25}" font-size="12.5" font-weight="600">Rumo ao Júnior</text>
${topo}
<g clip-path="url(#recorte)">
${imagens}
</g>
<rect x="${pad + 0.5}" y="${topoTela + 0.5}" width="${tela - 1}" height="${telaH - 1}" fill="none" stroke="var(--borda)"/>
${destaques}
${progresso}
${rodape}
</svg>
`;
}

function montarCelular(f: Filme) {
  const n = f.quadros.length;
  const W = 880;
  const q0 = f.quadros[0];
  const telaW = 300;
  const s = telaW / q0.largura;
  const telaH = Math.round(q0.altura * s);
  const bezel = 11;
  const ox = 40 + bezel;
  const oy = 24 + bezel;
  const H = oy + telaH + bezel + 24;
  const imagens = f.quadros.map((q, i) =>
    `<image class="q q${i}" href="data:image/webp;base64,${q.webp}" x="${ox}" y="${oy}" width="${telaW}" height="${telaH}"/>`).join('\n');
  const destaques = f.quadros.map((q, i) => destaque(q, i, ox, oy, s, telaW, telaH)).join('\n');
  const colX = ox + telaW + bezel + 48;
  const colW = W - colX - 32;
  let y = 84;
  const passos = f.quadros.map((q, i) => {
    const linhas = quebrar(q.legenda, 14.5, colW - 44);
    const bloco = `<g class="item"><g class="leg leg${i}"><rect class="passo" x="${colX - 8}" y="${y - 20}" width="${colW + 16}" height="${linhas.length * 20 + 18}" rx="10"/></g>` +
      `<text class="passo-t" x="${colX + 10}" y="${y}" text-anchor="middle">${i + 1}</text>` +
      linhas.map((l, k) => `<text class="legenda" x="${colX + 30}" y="${y + k * 20}">${esc(l)}</text>`).join('') + '</g>';
    y += linhas.length * 20 + 26;
    return bloco;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="titulo desc">
<title id="titulo">${esc(f.titulo)}</title>
<desc id="desc">${esc(f.quadros.map((q, i) => `${i + 1}. ${q.legenda}`).join(' '))}</desc>
${estiloBase(tempos(n))}
<defs><clipPath id="recorte"><rect x="${ox}" y="${oy}" width="${telaW}" height="${telaH}" rx="26"/></clipPath></defs>
<rect class="cartao" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"/>
<rect class="moldura" x="${ox - bezel}" y="${oy - bezel}" width="${telaW + bezel * 2}" height="${telaH + bezel * 2}" rx="36"/>
<g clip-path="url(#recorte)">
${imagens}
</g>
${destaques}
<text x="${colX - 8}" y="48" font-size="17" font-weight="650">${esc(f.titulo)}</text>
${passos}
</svg>
`;
}
