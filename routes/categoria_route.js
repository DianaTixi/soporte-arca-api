const { Router } = require("express");
const {
  getCategorias, getCategoriaPorId, postCategoria, putCategoria, deleteCategoria,
} = require("../controllers/categoria_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

// Lectura pública
router.get("/",       getCategorias);
router.get("/:id",    getCategoriaPorId);

// Escritura solo admin
router.post("/",      validarJWT, validarRol("admin"), postCategoria);
router.put("/:id",    validarJWT, validarRol("admin"), putCategoria);
router.delete("/:id", validarJWT, validarRol("admin"), deleteCategoria);

module.exports = router;
