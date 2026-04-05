const { Router } = require("express");
const { getMemorias, getMemoriaPorId, postMemoria, putMemoria, deleteMemoria } = require("../controllers/memoria_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

router.get("/",       validarJWT, validarRol("admin", "soporte_tecnico"), getMemorias);
router.get("/:id",    validarJWT, validarRol("admin", "soporte_tecnico"), getMemoriaPorId);
router.post("/",      validarJWT, validarRol("admin"), postMemoria);
router.put("/:id",    validarJWT, validarRol("admin"), putMemoria);
router.delete("/:id", validarJWT, validarRol("admin"), deleteMemoria);

module.exports = router;
