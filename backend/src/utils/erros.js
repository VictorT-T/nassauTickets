// Erro "esperado" (regra de negócio violada). O status HTTP acompanha a mensagem.
class ErroNegocio extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.name = "ErroNegocio";
    this.status = status;
  }
}

module.exports = { ErroNegocio };
