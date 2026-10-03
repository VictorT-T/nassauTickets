// Regra de prioridade da fila, sem banco de dados (função "pura": fácil de testar).
//
//   [SP] -> [SE|SG] -> [SP] -> [SE|SG] ...
//
// - Se a última chamada foi SP, a vez é de SE (se houver) ou SG.
// - Caso contrário (SE, SG ou nenhuma ainda), a vez é de SP.
// - Se a fila do tipo da vez estiver vazia, passa para o próximo da lista,
//   ainda respeitando a ordem de prioridade.

const TIPOS = ["SP", "SG", "SE"];

function ordemDePrioridade(ultimoTipo) {
  return ultimoTipo === "SP" ? ["SE", "SG", "SP"] : ["SP", "SE", "SG"];
}

// tiposDisponiveis: lista dos tipos que têm pelo menos uma senha aguardando.
function escolherTipo(ultimoTipo, tiposDisponiveis) {
  for (const tipo of ordemDePrioridade(ultimoTipo)) {
    if (tiposDisponiveis.includes(tipo)) return tipo;
  }
  return null;
}

module.exports = { TIPOS, ordemDePrioridade, escolherTipo };
