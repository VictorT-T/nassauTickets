// Funções de data e hora (sempre no horário local do servidor).

function dois(n) {
  return String(n).padStart(2, "0");
}

// "2026-10-03"
function hojeISO(d = new Date()) {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

// Número da senha no padrão YYMMDD-PPSQ  (ex.: 261003-SP001)
function gerarNumero(tipo, sequencia, d = new Date()) {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = dois(d.getMonth() + 1);
  const dd = dois(d.getDate());
  const sq = String(sequencia).padStart(3, "0");
  return `${yy}${mm}${dd}-${tipo}${sq}`;
}

// Expediente: das 07:00 (inclusive) até 17:00 (exclusive).
function dentroDoExpediente(d = new Date()) {
  if (process.env.IGNORAR_EXPEDIENTE === "true") return true;
  const hora = d.getHours();
  return hora >= 7 && hora < 17;
}

function expedienteEncerrado(d = new Date()) {
  if (process.env.IGNORAR_EXPEDIENTE === "true") return false;
  return d.getHours() >= 17;
}

module.exports = { dois, hojeISO, gerarNumero, dentroDoExpediente, expedienteEncerrado };
