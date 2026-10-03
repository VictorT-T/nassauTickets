// Regras de negócio das senhas: emitir, chamar, iniciar, finalizar etc.
// Todas as consultas usam "?" (parâmetros) para evitar SQL Injection.
const pool = require("../config/db");
const { ErroNegocio } = require("../utils/erros");
const { TIPOS, escolherTipo } = require("../utils/fila");
const {
  hojeISO,
  gerarNumero,
  dentroDoExpediente,
  expedienteEncerrado,
} = require("../utils/data");

const ESTADOS_ATIVOS = ["CHAMADA", "CHAMADA_NOVAMENTE", "EM_ATENDIMENTO"];
const MSG_EXPEDIENTE = "Fora do horário de atendimento (07h às 17h).";

// ---------------------------------------------------------------------------
// Totem: emitir senha
// ---------------------------------------------------------------------------
async function emitir(tipo) {
  if (!TIPOS.includes(tipo)) throw new ErroNegocio("Tipo de senha inválido.", 400);

  const agora = new Date();
  if (!dentroDoExpediente(agora)) throw new ErroNegocio(MSG_EXPEDIENTE, 403);

  const dia = hojeISO(agora);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Incrementa o contador do dia/tipo. A linha fica travada até o COMMIT, então
    // dois clientes apertando ao mesmo tempo nunca recebem o mesmo número.
    await conn.query(
      `INSERT INTO contadores (data, tipo, ultimo) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE ultimo = ultimo + 1`,
      [dia, tipo]
    );
    const [[contador]] = await conn.query(
      "SELECT ultimo FROM contadores WHERE data = ? AND tipo = ?",
      [dia, tipo]
    );

    const sequencia = contador.ultimo;
    const numero = gerarNumero(tipo, sequencia, agora);

    // Máquina de estados: nasce EMITIDA e já passa para AGUARDANDO.
    const [resultado] = await conn.query(
      `INSERT INTO senhas (numero, tipo, sequencia, data_emissao, estado, emitida_em)
       VALUES (?, ?, ?, ?, 'EMITIDA', ?)`,
      [numero, tipo, sequencia, dia, agora]
    );
    await conn.query("UPDATE senhas SET estado = 'AGUARDANDO' WHERE id = ?", [
      resultado.insertId,
    ]);

    await conn.commit();
    return { id: resultado.insertId, numero, tipo, sequencia, estado: "AGUARDANDO" };
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------------
// Atendente: chamar a próxima senha (com tratamento de concorrência)
// ---------------------------------------------------------------------------
async function chamarProxima(usuarioId, guiche) {
  guiche = Number(guiche);
  if (!Number.isInteger(guiche) || guiche < 1 || guiche > 99) {
    throw new ErroNegocio("Informe um guichê entre 1 e 99.", 400);
  }

  const agora = new Date();
  if (!dentroDoExpediente(agora)) throw new ErroNegocio(MSG_EXPEDIENTE, 403);
  const dia = hojeISO(agora);

  const conn = await pool.getConnection();
  try {
    await conn.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await conn.beginTransaction();

    // 1) TRAVA: só um atendente por vez passa daqui. Se dois chamarem ao mesmo
    //    tempo, o segundo espera o primeiro terminar e já enxerga a fila atualizada.
    const [[controle]] = await conn.query(
      `SELECT ultimo_tipo, DATE_FORMAT(ultimo_dia, '%Y-%m-%d') AS ultimo_dia
         FROM controle_fila WHERE id = 1 FOR UPDATE`
    );
    const ultimoTipo = controle.ultimo_dia === dia ? controle.ultimo_tipo : null;

    // 2) Este atendente ainda tem alguém em andamento?
    const [emAndamento] = await conn.query(
      `SELECT id FROM senhas WHERE atendente_id = ? AND estado IN (?) LIMIT 1`,
      [usuarioId, ESTADOS_ATIVOS]
    );
    if (emAndamento.length > 0) {
      throw new ErroNegocio("Finalize a senha atual antes de chamar a próxima.", 409);
    }

    // 3) Quais tipos têm senha aguardando hoje? A regra de prioridade escolhe um.
    const [tipos] = await conn.query(
      `SELECT DISTINCT tipo FROM senhas WHERE data_emissao = ? AND estado = 'AGUARDANDO'`,
      [dia]
    );
    const escolhido = escolherTipo(ultimoTipo, tipos.map((t) => t.tipo));
    if (!escolhido) throw new ErroNegocio("Não há senhas aguardando.", 404);

    // 4) Pega a mais antiga do tipo escolhido.
    const [[senha]] = await conn.query(
      `SELECT id, numero, tipo, sequencia FROM senhas
        WHERE data_emissao = ? AND estado = 'AGUARDANDO' AND tipo = ?
        ORDER BY id LIMIT 1`,
      [dia, escolhido]
    );

    await conn.query(
      `UPDATE senhas
          SET estado = 'CHAMADA', atendente_id = ?, guiche = ?, primeira_chamada_em = ?
        WHERE id = ?`,
      [usuarioId, guiche, agora, senha.id]
    );
    await conn.query("UPDATE controle_fila SET ultimo_tipo = ?, ultimo_dia = ? WHERE id = 1", [
      escolhido,
      dia,
    ]);

    await conn.commit();
    return { ...senha, estado: "CHAMADA", guiche };
  } catch (erro) {
    await conn.rollback();
    throw erro;
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------------
// Transições da máquina de estados (uma única consulta, segura e atômica)
// ---------------------------------------------------------------------------
async function mudarEstado(id, usuarioId, estadosPermitidos, novoEstado, colunaHorario) {
  id = Number(id);
  if (!Number.isInteger(id)) throw new ErroNegocio("Senha inválida.", 400);

  const campos = ["estado = ?"];
  const valores = [novoEstado];
  if (colunaHorario) {
    // colunaHorario vem do nosso código (nunca do usuário), por isso é seguro.
    campos.push(`${colunaHorario} = ?`);
    valores.push(new Date());
  }
  valores.push(id, usuarioId, estadosPermitidos);

  const [resultado] = await pool.query(
    `UPDATE senhas SET ${campos.join(", ")}
      WHERE id = ? AND atendente_id = ? AND estado IN (?)`,
    valores
  );
  if (resultado.affectedRows === 0) {
    throw new ErroNegocio("Ação não permitida para o estado atual da senha.", 409);
  }
  return { id, estado: novoEstado };
}

const chamarNovamente = (id, u) =>
  mudarEstado(id, u, ["CHAMADA"], "CHAMADA_NOVAMENTE", "segunda_chamada_em");

const iniciarAtendimento = (id, u) =>
  mudarEstado(id, u, ["CHAMADA", "CHAMADA_NOVAMENTE"], "EM_ATENDIMENTO", "inicio_atendimento_em");

const finalizarAtendimento = (id, u) =>
  mudarEstado(id, u, ["EM_ATENDIMENTO"], "ATENDIDA", "fim_atendimento_em");

// Só é possível marcar "não compareceu" depois da segunda chamada.
const naoCompareceu = (id, u) => mudarEstado(id, u, ["CHAMADA_NOVAMENTE"], "NAO_COMPARECEU", null);

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------
async function senhaAtual(usuarioId) {
  const [linhas] = await pool.query(
    `SELECT id, numero, tipo, sequencia, estado, guiche
       FROM senhas
      WHERE atendente_id = ? AND estado IN (?)
      ORDER BY id DESC LIMIT 1`,
    [usuarioId, ESTADOS_ATIVOS]
  );
  return { senha: linhas[0] || null };
}

async function resumoDaFila() {
  const [linhas] = await pool.query(
    `SELECT tipo, COUNT(*) AS total FROM senhas
      WHERE data_emissao = ? AND estado = 'AGUARDANDO' GROUP BY tipo`,
    [hojeISO()]
  );
  const aguardando = { SP: 0, SE: 0, SG: 0 };
  for (const l of linhas) aguardando[l.tipo] = Number(l.total);
  return { aguardando, expediente_aberto: dentroDoExpediente() };
}

// Painel: as 5 últimas chamadas. Nunca mostra a próxima senha (regra do projeto).
async function painel() {
  const [linhas] = await pool.query(
    `SELECT numero, tipo, sequencia, guiche, estado,
            CASE WHEN segunda_chamada_em IS NULL THEN 1 ELSE 2 END AS chamada,
            COALESCE(segunda_chamada_em, primeira_chamada_em) AS ultima_chamada_em
       FROM senhas
      WHERE data_emissao = ? AND primeira_chamada_em IS NOT NULL
      ORDER BY ultima_chamada_em DESC, id DESC
      LIMIT 5`,
    [hojeISO()]
  );
  return linhas;
}

// ---------------------------------------------------------------------------
// Fim do expediente: descarta as senhas que sobraram na fila
// ---------------------------------------------------------------------------
async function descartarPendentes() {
  const agora = new Date();
  const hoje = hojeISO(agora);
  // Depois das 17h descarta também as de hoje; antes, só as de dias anteriores.
  const operador = expedienteEncerrado(agora) ? "<=" : "<";
  const [resultado] = await pool.query(
    `UPDATE senhas SET estado = 'DESCARTADA'
      WHERE estado = 'AGUARDANDO' AND data_emissao ${operador} ?`,
    [hoje]
  );
  return resultado.affectedRows;
}

module.exports = {
  emitir,
  chamarProxima,
  chamarNovamente,
  iniciarAtendimento,
  finalizarAtendimento,
  naoCompareceu,
  senhaAtual,
  resumoDaFila,
  painel,
  descartarPendentes,
};
