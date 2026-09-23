// =========================================================
// dados.js — carrega e valida os arquivos JSON de /data.
//
// Se você editar um JSON e quebrar a sintaxe, o app mostra qual
// arquivo e em que linha/coluna está o problema. Itens inválidos
// (ex.: questão sem alternativa correta) são ignorados com aviso.
// =========================================================

const ARQUIVOS = {
  trilhas: 'data/trilhas.json',
  cronograma: 'data/cronograma.json',
  flashcards: 'data/flashcards.json',
  quiz: 'data/quiz.json',
  desafios: 'data/desafios.json',
  recursos: 'data/recursos.json'
};

/**
 * Descobre a posição do erro de sintaxe e devolve " (linha X, coluna Y)".
 * O Chrome informa "position N" na maioria dos erros; em alguns (ex.: vírgula
 * sobrando antes de "]" ou "}") ele só cita um trecho do texto — nesse caso
 * procuramos o trecho no arquivo para estimar a posição.
 */
function localizarErro(texto, mensagem) {
  let pos = null;
  const m = /position (\d+)/i.exec(mensagem);
  if (m) pos = Number(m[1]);
  else {
    // formato do V8: Unexpected token ']', ..."trecho"... is not valid JSON
    // (as reticências só aparecem quando o trecho foi cortado)
    const m2 = /Unexpected token '(.)', (?:\.\.\.)?"([\s\S]*)"(?:\.\.\.)? is not valid JSON/.exec(mensagem);
    const token = m2?.[1];
    const trecho = m2?.[2];
    if (token && trecho) {
      const inicio = texto.indexOf(trecho);
      if (inicio >= 0) pos = inicio + Math.max(0, trecho.indexOf(token));
    }
  }
  if (pos === null) return '';
  const antes = texto.slice(0, pos);
  const linha = antes.split('\n').length;
  const coluna = pos - antes.lastIndexOf('\n');
  return ` (linha ${linha}, coluna ${coluna})`;
}

async function carregarArquivo(nome, caminho) {
  let resposta;
  try {
    resposta = await fetch(caminho, { cache: 'no-cache' });
  } catch (erro) {
    throw new Error(`não foi possível baixar ${caminho} (${erro.message}).`);
  }
  if (!resposta.ok) throw new Error(`${caminho} respondeu com status ${resposta.status}.`);
  const texto = await resposta.text();
  try {
    return JSON.parse(texto);
  } catch (erro) {
    throw new Error(`JSON inválido em ${caminho}${localizarErro(texto, erro.message)}: ${erro.message}`);
  }
}

// ---------- Validação ----------

function texto(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function lista(v) {
  return Array.isArray(v) ? v : [];
}

function checarDuplicados(ids, arquivo, avisos) {
  const vistos = new Set();
  for (const id of ids) {
    if (vistos.has(id)) avisos.push(`${arquivo}: id duplicado "${id}" — o progresso desse item pode se misturar com outro.`);
    vistos.add(id);
  }
}

function validarTrilhas(d, avisos) {
  const trilhas = lista(d?.trilhas).filter((t) => texto(t.id) && texto(t.nome));
  const idsTopicos = [];
  const idsItens = [];
  for (const t of trilhas) {
    t.topicos = lista(t.topicos).filter((tp) => {
      const ok = texto(tp.id) && texto(tp.titulo);
      if (!ok) avisos.push(`trilhas.json: um tópico da trilha "${t.nome}" está sem id ou título e foi ignorado.`);
      return ok;
    });
    for (const tp of t.topicos) {
      idsTopicos.push(tp.id);
      tp.links = lista(tp.links).filter((l) => texto(l.url));
      tp.checklist = lista(tp.checklist).filter((c) => texto(c.id) && texto(c.texto));
      tp.checklist.forEach((c) => idsItens.push(c.id));
      if (!['alta', 'media', 'baixa'].includes(tp.prioridade)) tp.prioridade = 'media';
    }
  }
  checarDuplicados(idsTopicos, 'trilhas.json (tópicos)', avisos);
  checarDuplicados(idsItens, 'trilhas.json (checklist)', avisos);
  return { ...d, trilhas };
}

function validarCronograma(d, avisos) {
  const semanas = lista(d?.semanas);
  const ids = [];
  let numeroDia = 0;
  for (const s of semanas) {
    s.dias = lista(s.dias);
    for (const dia of s.dias) {
      numeroDia += 1;
      dia.numero = numeroDia; // posição no plano (1..N), usada para calcular a data
      dia.tarefas = lista(dia.tarefas).filter((t) => {
        const ok = texto(t.id) && texto(t.titulo);
        if (!ok) avisos.push(`cronograma.json: uma tarefa do dia ${numeroDia} está sem id ou título e foi ignorada.`);
        return ok;
      });
      dia.tarefas.forEach((t) => ids.push(t.id));
    }
  }
  checarDuplicados(ids, 'cronograma.json', avisos);
  return { ...d, semanas, totalDias: numeroDia };
}

function validarFlashcards(d, avisos) {
  const temas = lista(d?.temas).filter((t) => texto(t.id) && texto(t.nome));
  const idsTemas = new Set(temas.map((t) => t.id));
  const cartoes = lista(d?.cartoes).filter((c) => {
    const ok = texto(c.id) && texto(c.pergunta) && texto(c.resposta);
    if (!ok) avisos.push(`flashcards.json: cartão "${c.id ?? '(sem id)'}" incompleto foi ignorado.`);
    else if (!idsTemas.has(c.tema)) avisos.push(`flashcards.json: cartão "${c.id}" usa o tema "${c.tema}", que não está na lista de temas.`);
    return ok;
  });
  checarDuplicados(cartoes.map((c) => c.id), 'flashcards.json', avisos);
  return { ...d, temas, cartoes };
}

function validarQuiz(d, avisos) {
  const temas = lista(d?.temas).filter((t) => texto(t.id) && texto(t.nome));
  const questoes = lista(d?.questoes).filter((q) => {
    const alternativas = lista(q.alternativas);
    const ok =
      texto(q.id) &&
      texto(q.enunciado) &&
      alternativas.length >= 2 &&
      Number.isInteger(q.correta) &&
      q.correta >= 0 &&
      q.correta < alternativas.length;
    if (!ok) avisos.push(`quiz.json: questão "${q.id ?? '(sem id)'}" inválida (confira alternativas e o índice "correta") e foi ignorada.`);
    return ok;
  });
  checarDuplicados(questoes.map((q) => q.id), 'quiz.json', avisos);
  return { ...d, temas, questoes };
}

function validarDesafios(d, avisos) {
  const desafios = lista(d?.desafios).filter((x) => {
    const ok = texto(x.id) && texto(x.titulo) && texto(x.enunciado);
    if (!ok) avisos.push(`desafios.json: desafio "${x.id ?? '(sem id)'}" incompleto foi ignorado.`);
    return ok;
  });
  for (const x of desafios) {
    x.requisitos = lista(x.requisitos);
    x.diferenciais = lista(x.diferenciais);
    x.criterios = lista(x.criterios);
    x.dicas = lista(x.dicas);
    x.stack = lista(x.stack);
    x.inspiracao = lista(x.inspiracao).filter((l) => texto(l?.url));
    const tempo = Number(x.tempoSugeridoMin);
    x.tempoSugeridoMin = Number.isFinite(tempo) && tempo > 0 ? tempo : 90;
  }
  checarDuplicados(desafios.map((x) => x.id), 'desafios.json', avisos);
  return { ...d, desafios };
}

function validarRecursos(d) {
  const categorias = lista(d?.categorias).map((c) => ({ ...c, links: lista(c.links).filter((l) => texto(l.url)) }));
  return { ...d, categorias };
}

const VALIDADORES = {
  trilhas: validarTrilhas,
  cronograma: validarCronograma,
  flashcards: validarFlashcards,
  quiz: validarQuiz,
  desafios: validarDesafios,
  recursos: validarRecursos
};

/**
 * Carrega todos os arquivos em paralelo.
 * Retorna { dados, erros, avisos } — um arquivo com erro vira `null` em `dados`.
 */
export async function carregarDados() {
  const erros = [];
  const avisos = [];
  const dados = {};
  await Promise.all(
    Object.entries(ARQUIVOS).map(async ([nome, caminho]) => {
      try {
        const bruto = await carregarArquivo(nome, caminho);
        dados[nome] = VALIDADORES[nome](bruto, avisos);
      } catch (erro) {
        dados[nome] = null;
        erros.push({ arquivo: caminho, mensagem: erro.message });
      }
    })
  );
  avisos.forEach((a) => console.warn('[dados]', a));
  erros.forEach((e) => console.error('[dados]', e.mensagem));
  return { dados, erros, avisos };
}
