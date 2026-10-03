// Testes automáticos das regras. Execute com:  npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { escolherTipo } = require("./fila");
const { gerarNumero } = require("./data");

test("começa chamando SP quando existe", () => {
  assert.equal(escolherTipo(null, ["SG", "SE", "SP"]), "SP");
});

test("depois de SP, chama SE antes de SG", () => {
  assert.equal(escolherTipo("SP", ["SG", "SE", "SP"]), "SE");
});

test("depois de SP, chama SG se não houver SE", () => {
  assert.equal(escolherTipo("SP", ["SG", "SP"]), "SG");
});

test("depois de SE ou SG, volta para SP", () => {
  assert.equal(escolherTipo("SE", ["SG", "SP"]), "SP");
  assert.equal(escolherTipo("SG", ["SE", "SP"]), "SP");
});

test("sem SP na fila, segue SE e depois SG", () => {
  assert.equal(escolherTipo("SG", ["SG", "SE"]), "SE");
  assert.equal(escolherTipo("SE", ["SG"]), "SG");
});

test("depois de SP, se só há SP, chama SP", () => {
  assert.equal(escolherTipo("SP", ["SP"]), "SP");
});

test("fila vazia devolve null", () => {
  assert.equal(escolherTipo("SP", []), null);
});

test("alternância completa com várias senhas", () => {
  const fila = { SP: 2, SE: 1, SG: 2 };
  let ultimo = null;
  const chamadas = [];
  for (;;) {
    const disponiveis = Object.keys(fila).filter((t) => fila[t] > 0);
    const tipo = escolherTipo(ultimo, disponiveis);
    if (!tipo) break;
    fila[tipo]--;
    chamadas.push(tipo);
    ultimo = tipo;
  }
  assert.deepEqual(chamadas, ["SP", "SE", "SP", "SG", "SG"]);
});

test("número da senha segue o padrão YYMMDD-PPSQ", () => {
  const data = new Date(2026, 9, 3); // 3 de outubro de 2026 (mês começa em 0)
  assert.equal(gerarNumero("SP", 1, data), "261003-SP001");
  assert.equal(gerarNumero("SG", 42, data), "261003-SG042");
  assert.equal(gerarNumero("SE", 123, data), "261003-SE123");
});
