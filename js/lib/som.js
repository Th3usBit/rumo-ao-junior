// =========================================================
// som.js — alarme sonoro com Web Audio (sem arquivos de áudio).
// O navegador só libera áudio depois de um clique do usuário,
// por isso chamamos prepararAudio() nos botões "Iniciar".
// O alarme é agendado no relógio do AudioContext, que continua
// preciso mesmo com a aba em segundo plano.
// =========================================================

let contexto = null;

function obterContexto() {
  if (!contexto) {
    const Classe = window.AudioContext || window.webkitAudioContext;
    if (!Classe) return null;
    contexto = new Classe();
  }
  return contexto;
}

/** Deve ser chamado dentro de um evento de clique. */
export function prepararAudio() {
  const ctx = obterContexto();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/** Toca 3 bipes curtos daqui a `atrasoSeg` segundos. Retorna função para cancelar. */
function bipes(atrasoSeg = 0) {
  const ctx = obterContexto();
  if (!ctx) return () => {};
  const inicio = ctx.currentTime + Math.max(0, atrasoSeg);
  const osciladores = [];
  [0, 0.28, 0.56].forEach((desloc, i) => {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 2 ? 1046.5 : 880; // lá5, lá5, dó6
    const t = inicio + desloc;
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
    osciladores.push(osc);
  });
  return () => {
    osciladores.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* já parado */
      }
    });
  };
}

/** Toca o alarme agora. */
export function tocarAlarme() {
  bipes(0);
}

/**
 * Agenda o alarme para daqui a `ms` milissegundos.
 * Retorna uma função de cancelamento, ou null se o áudio não estiver liberado
 * (nesse caso quem chamou deve tocar o alarme na hora, com tocarAlarme()).
 */
export function agendarAlarme(ms) {
  const ctx = contexto;
  if (!ctx || ctx.state !== 'running') return null;
  return bipes(ms / 1000);
}
