// O Express 4 não captura erros de funções async sozinho.
// Este "embrulho" envia qualquer erro para o tratador de erros central (app.js).
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
