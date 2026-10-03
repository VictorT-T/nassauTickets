// Conexão com o MySQL. Usamos um "pool": um conjunto de conexões reaproveitadas,
// o que é mais rápido do que abrir uma conexão nova a cada requisição.
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nassautickets",
  waitForConnections: true,
  connectionLimit: 10,
  // As datas são sempre geradas pelo Node (new Date()) no horário local,
  // então o driver converte de/para o horário local, independente do fuso do MySQL.
  timezone: "local",
});

module.exports = pool;
