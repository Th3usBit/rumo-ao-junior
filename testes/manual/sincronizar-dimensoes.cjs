// Atualiza width/height dos <img> do manual (manual/index.html) com as medidas
// reais dos prints, registradas em manual/img/capturas.json pelas capturas.
// Roda sozinho no fim de "npm run manual:capturas".
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '../../manual');
const arquivo = path.join(raiz, 'index.html');
const capturas = JSON.parse(fs.readFileSync(path.join(raiz, 'img/capturas.json'), 'utf8'));

let html = fs.readFileSync(arquivo, 'utf8');
let alteradas = 0;
html = html.replace(/<img src="img\/([\w-]+)\.webp" width="\d+" height="\d+"/g, (trecho, nome) => {
  const c = capturas[nome];
  if (!c) throw new Error(`manual/index.html usa img/${nome}.webp, que não está em capturas.json`);
  const novo = `<img src="img/${nome}.webp" width="${c.largura}" height="${c.altura}"`;
  if (novo !== trecho) alteradas += 1;
  return novo;
});
fs.writeFileSync(arquivo, html);
console.log(`Manual: ${alteradas} imagem(ns) com dimensões atualizadas.`);
