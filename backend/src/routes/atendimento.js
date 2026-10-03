// Rotas do atendente (AA). O gestor também pode atender.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { autenticar, exigirPerfil } = require("../middlewares/auth");
const senhas = require("../services/senhas");

const router = express.Router();
router.use(autenticar, exigirPerfil("ATENDENTE", "GESTOR"));

router.get("/fila", asyncHandler(async (req, res) => res.json(await senhas.resumoDaFila())));

router.get("/atual", asyncHandler(async (req, res) => res.json(await senhas.senhaAtual(req.usuario.id))));

// POST /api/atendimento/chamar   { guiche }
router.post(
  "/chamar",
  asyncHandler(async (req, res) => {
    res.json(await senhas.chamarProxima(req.usuario.id, (req.body || {}).guiche));
  })
);

router.post("/:id/chamar-novamente", asyncHandler(async (req, res) => res.json(await senhas.chamarNovamente(req.params.id, req.usuario.id))));
router.post("/:id/iniciar", asyncHandler(async (req, res) => res.json(await senhas.iniciarAtendimento(req.params.id, req.usuario.id))));
router.post("/:id/finalizar", asyncHandler(async (req, res) => res.json(await senhas.finalizarAtendimento(req.params.id, req.usuario.id))));
router.post("/:id/nao-compareceu", asyncHandler(async (req, res) => res.json(await senhas.naoCompareceu(req.params.id, req.usuario.id))));

module.exports = router;
