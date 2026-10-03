// Relatórios diário e mensal: resumo, TM, detalhado e auditoria.
const pool = require("../config/db");
const { ErroNegocio } = require("../utils/erros");
const { dois } = require("../utils/data");

// Tempo Médio de referência (em minutos), conforme o documento do projeto.
// SE: 95% dos atendimentos levam 1 min e 5% levam 5 min -> média esperada de 1,2 min.
const REFERENCIA_TM_MINUTOS = { SP: 15, SG: 5, SE: 1.2 };

const COLUNAS_RESUMO = `
  COUNT(*) AS emitidas,
  COALESCE(SUM(estado = 'ATENDIDA'), 0)       AS atendidas,
  COALESCE(SUM(estado = 'NAO_COMPARECEU'), 0) AS nao_compareceu,
  COALESCE(SUM(estado = 'DESCARTADA'), 0)     AS descartadas,
  AVG(CASE WHEN estado = 'ATENDIDA'
           THEN TIMESTAMPDIFF(SECOND, inicio_atendimento_em, fim_atendimento_em) END) AS tm_segundos,
  AVG(CASE WHEN primeira_chamada_em IS NOT NULL
           THEN TIMESTAMPDIFF(SECOND, emitida_em, primeira_chamada_em) END)           AS espera_segundos
`;

const arredondar = (v) => (v === null || v === undefined ? null : Math.round(Number(v)));

function formatarLinha(l) {
  return {
    emitidas: Number(l.emitidas),
    atendidas: Number(l.atendidas),
    nao_compareceu: Number(l.nao_compareceu),
    descartadas: Number(l.descartadas),
    tm_segundos: arredondar(l.tm_segundos),
    espera_segundos: arredondar(l.espera_segundos),
  };
}

function calcularPeriodo(tipo, data) {
  if (!["diario", "mensal"].includes(tipo)) {
    throw new ErroNegocio("Tipo de relatório inválido (use diario ou mensal).", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) {
    throw new ErroNegocio("Data inválida (use AAAA-MM-DD).", 400);
  }
  const [a, m, d] = data.split("-").map(Number);
  const conferida = new Date(a, m - 1, d);
  if (conferida.getFullYear() !== a || conferida.getMonth() !== m - 1 || conferida.getDate() !== d) {
    throw new ErroNegocio("Data inexistente.", 400);
  }
  if (tipo === "diario") return { inicio: data, fim: data };

  const ultimoDia = new Date(a, m, 0).getDate(); // dia 0 do mês seguinte = último dia deste mês
  return { inicio: `${a}-${dois(m)}-01`, fim: `${a}-${dois(m)}-${dois(ultimoDia)}` };
}

async function gerar(tipo, data) {
  const { inicio, fim } = calcularPeriodo(tipo, data);
  const filtro = [inicio, fim];

  const [[total]] = await pool.query(
    `SELECT ${COLUNAS_RESUMO} FROM senhas WHERE data_emissao BETWEEN ? AND ?`,
    filtro
  );
  const [porTipo] = await pool.query(
    `SELECT tipo, ${COLUNAS_RESUMO} FROM senhas
      WHERE data_emissao BETWEEN ? AND ? GROUP BY tipo`,
    filtro
  );

  const por_prioridade = {};
  for (const t of ["SP", "SE", "SG"]) {
    const linha = porTipo.find((p) => p.tipo === t);
    por_prioridade[t] = linha
      ? formatarLinha(linha)
      : { emitidas: 0, atendidas: 0, nao_compareceu: 0, descartadas: 0, tm_segundos: null, espera_segundos: null };
  }

  // Relatório detalhado: campos de atendimento ficam em branco se não foi atendida.
  const [detalhado] = await pool.query(
    `SELECT numero, tipo, estado, emitida_em, inicio_atendimento_em,
            CASE WHEN inicio_atendimento_em IS NULL THEN NULL ELSE guiche END AS guiche
       FROM senhas
      WHERE data_emissao BETWEEN ? AND ?
      ORDER BY id
      LIMIT 5000`,
    filtro
  );

  // Relatório de auditoria: quem chamou, onde, e todos os horários.
  const [auditoria] = await pool.query(
    `SELECT s.numero, s.tipo, s.estado, u.nome AS atendente, s.guiche,
            s.primeira_chamada_em, s.segunda_chamada_em,
            s.inicio_atendimento_em, s.fim_atendimento_em
       FROM senhas s
       JOIN usuarios u ON u.id = s.atendente_id
      WHERE s.data_emissao BETWEEN ? AND ?
      ORDER BY s.primeira_chamada_em
      LIMIT 5000`,
    filtro
  );

  return {
    periodo: { tipo, inicio, fim },
    total: formatarLinha(total),
    por_prioridade,
    referencia_tm_minutos: REFERENCIA_TM_MINUTOS,
    detalhado,
    auditoria,
  };
}

module.exports = { gerar, calcularPeriodo };
