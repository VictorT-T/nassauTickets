// Cria (ou atualiza) um usuário de login.
// Uso:  npm run seed -- "Nome Completo" login senha GESTOR
//       (perfil: ATENDENTE ou GESTOR; o padrão é ATENDENTE)
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

async function main() {
  const [nome, login, senha, perfilInformado] = process.argv.slice(2);
  const perfil = (perfilInformado || "ATENDENTE").toUpperCase();

  if (!nome || !login || !senha || !["ATENDENTE", "GESTOR"].includes(perfil)) {
    console.log('Uso: npm run seed -- "Nome" login senha [ATENDENTE|GESTOR]');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.log("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 10);
  await pool.query(
    `INSERT INTO usuarios (nome, login, senha_hash, perfil) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha_hash = VALUES(senha_hash), perfil = VALUES(perfil)`,
    [nome, login, hash, perfil]
  );
  console.log(`Usuário "${login}" salvo com perfil ${perfil}.`);
  await pool.end();
}

main().catch((erro) => {
  console.error("Erro:", erro.message);
  process.exit(1);
});
