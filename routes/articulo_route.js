const { Router } = require("express");
const {
  getArticulos, getArticuloPorId, getArticuloPorSlug,
  getBuscarArticulos, postArticulo, putArticulo, patchVotar, deleteArticulo,
} = require("../controllers/articulo_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

// Lectura pública - cualquier usuario autenticado puede leer
router.get("/",              getArticulos);
router.get("/buscar",        getBuscarArticulos);
router.get("/slug/:slug",    getArticuloPorSlug);
router.get("/:id",           getArticuloPorId);
router.patch("/:id/votar",   patchVotar);

// Escritura solo admin
router.post("/",             validarJWT, validarRol("admin"), postArticulo);
router.put("/:id",           validarJWT, validarRol("admin"), putArticulo);
router.delete("/:id",        validarJWT, validarRol("admin"), deleteArticulo);

module.exports = router;
