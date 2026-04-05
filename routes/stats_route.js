const { Router } = require("express");
const {
  obtenerStatsIA,
  obtenerLimitesIA,
  obtenerProveedorIA,
  actualizarLimitesIA,
  actualizarProveedorIA,
  actualizarLimiteIAUsuario,
  desactivarLimiteIAUsuario,
  obtenerChatsConCosto,
  obtenerStatsKB,
} = require("../controllers/stats_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

// Solo admin puede ver estadísticas de uso IA
router.get("/ia", validarJWT, validarRol("admin"), obtenerStatsIA);
router.get("/ia/limites", validarJWT, validarRol("admin"), obtenerLimitesIA);
router.get("/ia/proveedor", validarJWT, validarRol("admin"), obtenerProveedorIA);
router.put("/ia/limites", validarJWT, validarRol("admin"), actualizarLimitesIA);
router.put("/ia/proveedor", validarJWT, validarRol("admin"), actualizarProveedorIA);
router.put("/ia/limites/usuario", validarJWT, validarRol("admin"), actualizarLimiteIAUsuario);
router.delete("/ia/limites/usuario/:usuario", validarJWT, validarRol("admin"), desactivarLimiteIAUsuario);
router.get("/ia/chats", validarJWT, validarRol("admin"), obtenerChatsConCosto);
router.get("/kb", validarJWT, validarRol("admin", "soporte_tecnico"), obtenerStatsKB);

module.exports = router;
