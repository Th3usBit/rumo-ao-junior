// Roda a suíte Playwright inteira e grava um resumo REAL da execução em
// docs/readme/dados/testes.json (usado pelo README e pelos selos).
// Uso (dentro de testes/):  npm run readme:testes
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const pastaTestes = resolve(aqui, '..');
const destino = resolve(aqui, '../../docs/readme/dados/testes.json');

console.log('Rodando a suíte completa (leva alguns minutos)...');
const r = spawnSync('npx playwright test --reporter=json', {
  cwd: pastaTestes,
  shell: true,
  encoding: 'utf8',
  maxBuffer: 512 * 1024 * 1024
});
const inicio = r.stdout.indexOf('{');
if (inicio === -1) {
  console.error(r.stderr || r.stdout);
  throw new Error('O Playwright não devolveu o relatório JSON.');
}
const relatorio = JSON.parse(r.stdout.slice(inicio));

const porProjeto = {};
const porArquivo = {};
const falhas = [];
function visitar(suite) {
  for (const spec of suite.specs ?? []) {
    const arquivo = relative(pastaTestes, resolve(relatorio.config.rootDir, spec.file)).replaceAll('\\', '/');
    for (const t of spec.tests ?? []) {
      const proj = (porProjeto[t.projectName] ??= { total: 0, aprovados: 0, pulados: 0, falharam: 0, instaveis: 0 });
      const arq = (porArquivo[arquivo] ??= { total: 0, aprovados: 0, pulados: 0, falharam: 0, instaveis: 0 });
      for (const alvo of [proj, arq]) {
        alvo.total += 1;
        if (t.status === 'expected') alvo.aprovados += 1;
        else if (t.status === 'skipped') alvo.pulados += 1;
        else if (t.status === 'flaky') alvo.instaveis += 1;
        else alvo.falharam += 1;
      }
      if (t.status === 'unexpected') {
        const ultimo = t.results?.[t.results.length - 1];
        const erro = (ultimo?.error?.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').slice(0, 6).join(' | ');
        falhas.push({ teste: `[${t.projectName}] ${arquivo} › ${spec.title}`, erro });
      }
    }
  }
  for (const filha of suite.suites ?? []) visitar(filha);
}
for (const s of relatorio.suites ?? []) visitar(s);

const st = relatorio.stats;
const resumo = {
  geradoEm: st.startTime,
  duracaoSeg: Math.round(st.duration / 1000),
  total: st.expected + st.skipped + st.unexpected + st.flaky,
  aprovados: st.expected,
  pulados: st.skipped,
  falharam: st.unexpected,
  instaveis: st.flaky,
  projetos: relatorio.config.projects.map((p) => p.name),
  porProjeto,
  porArquivo,
  falhas
};
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(resumo, null, 2) + '\n');
console.log(`Resumo gravado em ${relative(process.cwd(), destino)}:`);
console.log(`  ${resumo.aprovados} aprovados, ${resumo.pulados} pulados, ${resumo.falharam} falharam, ${resumo.instaveis} instáveis (${resumo.duracaoSeg}s)`);
process.exitCode = resumo.falharam ? 1 : 0;
