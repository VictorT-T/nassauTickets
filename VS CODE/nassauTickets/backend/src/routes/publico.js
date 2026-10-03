// Rotas abertas: usadas pelo totem (cliente anônimo) e pelo painel de chamadas.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const senhas = require("../services/senhas");

const router = express.Router();

// POST /api/senhas   { tipo: "SP" | "SG" | "SE" }
router.post(
  "/senhas",
  asyncHandler(async (req, res) => {
    const senha = await senhas.emitir((req.body || {}).tipo);
    res.status(201).json(senha);
  })
);

// GET /api/painel  -> as 5 últimas senhas chamadas
router.get(
  "/painel",
  asyncHandler(async (req, res) => {
    res.json(await senhas.painel());
  })
);

module.exports = router;
