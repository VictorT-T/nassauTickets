const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pool = require("./config/db");
const { ErroNegocio } = require("./utils/erros");

const app = express();

// Cabeçalhos de segurança. "cross-origin" permite que o frontend (outra porta) leia as respostas da API.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim()),
  })
);
app.use(express.json({ limit: "10kb" }));

// Verificação de saúde: o frontend pode usar para saber se o banco está de pé.
app.get("/api/saude", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "banco_indisponivel" });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/publico"));
app.use("/api/atendimento", require("./routes/atendimento"));
app.use("/api/relatorios", require("./routes/relatorios"));

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// Tratador central de erros
const ERROS_DE_CONEXAO = ["ECONNREFUSED", "PROTOCOL_CONNECTION_LOST", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH", "ER_CON_COUNT_ERROR"];

// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  if (erro instanceof ErroNegocio) {
    return res.status(erro.status).json({ erro: erro.message });
  }
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "Corpo da requisição inválido." });
  }
  console.error(erro);
  // Recuperação de desastre: se o banco caiu, devolve 503 para o frontend mostrar o aviso.
  if (ERROS_DE_CONEXAO.includes(erro.code)) {
    return res.status(503).json({ erro: "Serviço temporariamente indisponível." });
  }
  res.status(500).json({ erro: "Erro interno do servidor." });
});

module.exports = app;
