export const NOME_TIPO = {
  SP: "Prioritária",
  SE: "Retirada de exames",
  SG: "Geral",
};

// No banco o estado é gravado sem acento; na tela mostramos como no documento.
export const NOME_ESTADO = {
  EMITIDA: "EMITIDA",
  AGUARDANDO: "AGUARDANDO",
  CHAMADA: "CHAMADA",
  CHAMADA_NOVAMENTE: "CHAMADA_NOVAMENTE",
  EM_ATENDIMENTO: "EM_ATENDIMENTO",
  ATENDIDA: "ATENDIDA",
  NAO_COMPARECEU: "NÃO_COMPARECEU",
  DESCARTADA: "DESCARTADA",
};

export function formatarDataHora(iso) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "";
}

export function formatarDuracao(segundos) {
  if (segundos === null || segundos === undefined) return "-";
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return min > 0 ? `${min} min ${seg} s` : `${seg} s`;
}

// "2026-10-03" no horário local (o toISOString usaria UTC e poderia errar o dia)
export function hojeLocal() {
  const d = new Date();
  const dois = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}
