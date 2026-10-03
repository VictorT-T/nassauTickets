// Proteção das rotas: exige login (token JWT) e, se necessário, um perfil específico.
const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Faça login para continuar." });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, nome, perfil }
    next();
  } catch {
    return res.status(401).json({ erro: "Sessão expirada. Faça login novamente." });
  }
}

function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: "Você não tem permissão para acessar este recurso." });
    }
    next();
  };
}

module.exports = { autenticar, exigirPerfil };
