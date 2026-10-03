// Relatórios: somente o gestor.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { autenticar, exigirPerfil } = require("../middlewares/auth");
const relatorios = require("../services/relatorios");

const router = express.Router();
router.use(autenticar, exigirPerfil("GESTOR"));

// GET /api/relatorios?tipo=diario|mensal&data=AAAA-MM-DD
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await relatorios.gerar(req.query.tipo, req.query.data));
  })
);

module.exports = router;
