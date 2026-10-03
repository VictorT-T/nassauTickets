// Ponto de entrada: carrega o .env, valida a configuração e liga o servidor.
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("Defina JWT_SECRET no arquivo .env (copie de .env.example).");
  process.exit(1);
}

const app = require("./app");
const senhas = require("./services/senhas");

const PORTA = Number(process.env.PORT || 3000);

async function rotinaDeEncerramento() {
  try {
    const total = await senhas.descartarPendentes();
    if (total > 0) console.log(`${total} senha(s) descartada(s) no encerramento do expediente.`);
  } catch (erro) {
    console.error("Falha ao descartar senhas pendentes:", erro.message);
  }
}

app.listen(PORTA, () => {
  console.log(`API nassauTickets rodando em http://localhost:${PORTA}`);
  rotinaDeEncerramento();
  setInterval(rotinaDeEncerramento, 60 * 1000); // confere a cada minuto
});
