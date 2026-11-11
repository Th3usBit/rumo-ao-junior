// README.md: números e tabelas batem com os dados, caminhos existem e toda imagem tem texto alternativo.
// Roda só no projeto desktop (os projetos celular e escuro listam os arquivos que rodam).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test, expect } from './apoio';

const RAIZ = resolve(__dirname, '../..');
const DOCUMENTOS = ['README.md', 'docs/tecnico.md'].map((rel) => ({
  pasta: dirname(resolve(RAIZ, rel)),
  texto: readFileSync(resolve(RAIZ, rel), 'utf8')
}));

test.describe('README', () => {
  test('números e tabelas batem com data/*.json e com a última execução dos testes', () => {
    const r = spawnSync(process.execPath, [resolve(RAIZ, 'testes/readme/graficos.mjs'), '--conferir'], { encoding: 'utf8' });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  });

  test('todo arquivo citado por caminho relativo existe', () => {
    const caminhos = DOCUMENTOS.flatMap(({ pasta, texto }) => [
      ...[...texto.matchAll(/(?:src|srcset|href)="(\.{1,2}\/[^"#]+)"/g)].map((m) => resolve(pasta, decodeURI(m[1]))),
      ...[...texto.matchAll(/\]\((\.{1,2}\/[^)#\s]+)\)/g)].map((m) => resolve(pasta, decodeURI(m[1])))
    ]);
    expect(caminhos.length).toBeGreaterThan(20);
    const faltando = [...new Set(caminhos)].filter((c) => !existsSync(c));
    expect(faltando).toEqual([]);
  });

  test('toda imagem tem texto alternativo e as âncoras internas apontam para títulos que existem', () => {
    const imagens = DOCUMENTOS.flatMap(({ texto }) => [...texto.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]));
    expect(imagens.length).toBeGreaterThan(10);
    expect(imagens.filter((tag) => !/\balt="[^"]{8,}"/.test(tag))).toEqual([]);
    // âncoras no formato do GitHub: minúsculas, sem pontuação, espaço vira hífen
    const ancoraDe = (titulo: string) => titulo.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
    for (const { texto } of DOCUMENTOS) {
      const titulos = new Set([...texto.matchAll(/^#{2,4} (.+)$/gm)].map((m) => ancoraDe(m[1])));
      const ancoras = [...texto.matchAll(/href="#([^"]+)"/g)].map((m) => decodeURI(m[1]));
      expect(ancoras.filter((a) => !titulos.has(a))).toEqual([]);
    }
  });
});
