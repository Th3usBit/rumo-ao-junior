// =========================================================
// datas.js — utilitários de data sempre no fuso LOCAL.
// Usamos strings "AAAA-MM-DD" como chave de dia. Nunca use
// toISOString() para isso: ela converte para UTC e, no Brasil,
// depois das 21h já seria "amanhã".
// =========================================================

const DIA_MS = 24 * 60 * 60 * 1000;

const NOMES_DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const NOMES_DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const dois = (n) => String(n).padStart(2, '0');

/** Converte um Date para "AAAA-MM-DD" no fuso local. */
export function paraISO(data) {
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}

/** Data de hoje como "AAAA-MM-DD" (fuso local). */
export function hojeISO() {
  return paraISO(new Date());
}

/** Converte "AAAA-MM-DD" em Date local (meia-noite). */
export function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Verifica se a string está no formato AAAA-MM-DD e é uma data real. */
export function isoValido(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return paraISO(deISO(iso)) === iso;
}

/** Soma (ou subtrai) dias a uma data ISO. */
export function somarDias(iso, dias) {
  const d = deISO(iso);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

/** Diferença em dias entre duas datas ISO (b - a). Usa UTC para não sofrer com horário de verão. */
export function diferencaDias(a, b) {
  const [a1, m1, d1] = a.split('-').map(Number);
  const [a2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / DIA_MS);
}

/** Segunda-feira da semana da data informada. */
export function inicioSemana(iso) {
  const d = deISO(iso);
  const deslocamento = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - deslocamento);
  return paraISO(d);
}

/** Os 7 dias (seg → dom) da semana da data informada. */
export function diasDaSemana(iso) {
  const inicio = inicioSemana(iso);
  return Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));
}

/** Próxima segunda-feira (ou hoje, se hoje for segunda). */
export function proximaSegunda(iso = hojeISO()) {
  const d = deISO(iso);
  const faltam = (8 - d.getDay()) % 7;
  return somarDias(iso, faltam);
}

export function nomeDiaSemana(iso, curto = false) {
  const dia = deISO(iso).getDay();
  return curto ? NOMES_DIAS_CURTOS[dia] : NOMES_DIAS[dia];
}

/** "23/09" ou "23/09/2026" */
export function dataCurta(iso, comAno = false) {
  const [a, m, d] = iso.split('-');
  return comAno ? `${d}/${m}/${a}` : `${d}/${m}`;
}

/** "terça-feira, 23 de setembro" */
export function dataPorExtenso(iso, comAno = false) {
  const d = deISO(iso);
  const texto = `${NOMES_DIAS[d.getDay()]}, ${d.getDate()} de ${NOMES_MESES[d.getMonth()]}`;
  return comAno ? `${texto} de ${d.getFullYear()}` : texto;
}

/** "ter, 23/09" */
export function dataComDia(iso) {
  return `${nomeDiaSemana(iso, true)}, ${dataCurta(iso)}`;
}

/** Texto relativo: "hoje", "ontem", "há 3 dias", "amanhã", "em 5 dias". */
export function relativo(iso, hoje = hojeISO()) {
  const dif = diferencaDias(hoje, iso);
  if (dif === 0) return 'hoje';
  if (dif === -1) return 'ontem';
  if (dif === 1) return 'amanhã';
  if (dif < 0) return `há ${-dif} dias`;
  return `em ${dif} dias`;
}

/** Formata minutos como "45 min", "1h", "2h 15min". */
export function formatarMinutos(min) {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** Versão compacta para rótulos de gráfico: "45m", "1h20". */
export function minutosCompacto(min) {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${dois(m)}`;
}

/** Formata milissegundos como relógio: "05:00" ou "1:25:07". */
export function relogio(ms) {
  const totalSeg = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${dois(m)}:${dois(s)}`;
}

/** Hora local "14:05" de um timestamp ou Date. */
export function horaCurta(valor) {
  const d = valor instanceof Date ? valor : new Date(valor);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** "1 dia" / "6 dias" */
export function pluralDias(n) {
  return n === 1 ? '1 dia' : `${n} dias`;
}
