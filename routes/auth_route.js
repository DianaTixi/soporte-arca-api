const { Router } = require("express");
const { login, registro, renovarToken, listarUsuarios, actualizarUsuario, cambiarPassword } = require("../controllers/auth_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

router.post("/login",   login);
router.post("/registro", validarJWT, validarRol("admin"), registro);
router.get("/renovar",  validarJWT, renovarToken);
router.get("/usuarios", validarJWT, validarRol("admin"), listarUsuarios);
router.put("/usuarios/:id", validarJWT, validarRol("admin"), actualizarUsuario);
router.patch("/usuarios/:id/password", validarJWT, cambiarPassword);

module.exports = router;
