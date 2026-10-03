const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Segurança: no máximo 10 tentativas de login a cada 15 minutos por IP (contra força bruta).
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas de login. Aguarde alguns minutos." },
});

// POST /api/auth/login   { login, senha }
router.post(
  "/login",
  limitarLogin,
  asyncHandler(async (req, res) => {
    const { login, senha } = req.body || {};
    if (!login || !senha) {
      return res.status(400).json({ erro: "Informe login e senha." });
    }

    const [linhas] = await pool.query(
      "SELECT id, nome, login, senha_hash, perfil FROM usuarios WHERE login = ? AND ativo = 1",
      [String(login)]
    );
    const usuario = linhas[0];

    // Mesma mensagem para "usuário não existe" e "senha errada" (não revela qual falhou).
    const senhaCorreta = usuario && (await bcrypt.compare(String(senha), usuario.senha_hash));
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Login ou senha inválidos." });
    }

    const dados = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
    const token = jwt.sign(dados, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, usuario: dados });
  })
);

module.exports = router;
