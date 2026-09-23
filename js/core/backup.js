// =========================================================
// backup.js — exportar e importar o progresso em JSON.
// O localStorage vive só neste navegador e neste endereço
// (ex.: http://127.0.0.1:5500). Faça backup com frequência!
// =========================================================

import { gerarBackup, validarBackup, restaurarBackup } from './estado.js';
import { baixarArquivo, lerArquivoTexto, confirmar, toast } from '../lib/ui.js';
import { hojeISO } from '../lib/datas.js';
import { sincronizarTimers } from '../lib/timers.js';

/** Baixa um arquivo .json com todo o progresso. */
export function exportarBackup() {
  const backup = gerarBackup();
  baixarArquivo(`rumo-ao-junior-backup-${hojeISO()}.json`, JSON.stringify(backup, null, 2));
  toast('Backup exportado. Guarde o arquivo em um lugar seguro (ex.: nuvem).', { tipo: 'sucesso' });
}

/** Abre o seletor de arquivo e importa o backup escolhido. */
export function escolherArquivoBackup() {
  const input = document.getElementById('arquivo-backup');
  input.value = '';
  input.onchange = async () => {
    const arquivo = input.files?.[0];
    if (arquivo) await importarBackup(arquivo);
  };
  input.click();
}

export async function importarBackup(arquivo) {
  let novoEstado;
  try {
    const texto = await lerArquivoTexto(arquivo);
    novoEstado = validarBackup(JSON.parse(texto));
  } catch (erro) {
    const mensagem = erro instanceof SyntaxError ? 'o arquivo não é um JSON válido.' : erro.message;
    toast(`Não foi possível importar: ${mensagem}`, { tipo: 'erro', duracao: 8000 });
    return false;
  }
  const ok = await confirmar({
    titulo: 'Importar backup?',
    mensagem: `O progresso atual deste navegador será SUBSTITUÍDO pelo conteúdo de "${arquivo.name}". Se quiser, exporte um backup do estado atual antes.`,
    textoConfirmar: 'Substituir e importar',
    perigo: true
  });
  if (!ok) return false;
  restaurarBackup(novoEstado);
  sincronizarTimers();
  window.dispatchEvent(new CustomEvent('rumo:recarregar'));
  toast('Backup importado com sucesso.', { tipo: 'sucesso' });
  return true;
}
