const { Router } = require("express");
const { getErrores, getErrorPorId, postError, putError, deleteError, getModulos } = require("../controllers/error_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

router.get("/",        validarJWT, validarRol("admin", "soporte_tecnico"), getErrores);
router.get("/modulos", validarJWT, validarRol("admin", "soporte_tecnico"), getModulos);
router.get("/:id",     validarJWT, validarRol("admin", "soporte_tecnico"), getErrorPorId);
router.post("/",       validarJWT, validarRol("admin"), postError);
router.put("/:id",     validarJWT, validarRol("admin"), putError);
router.delete("/:id",  validarJWT, validarRol("admin"), deleteError);

module.exports = router;
