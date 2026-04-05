const { Router } = require("express");
const {
  chatConAgente,
  chatSimple,
  getHistorialSesiones,
  getHistorialSesionDetalle,
  buscarHistorialChats,
} = require("../controllers/agente_controller");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = Router();

// Requiere autenticación - el rol del usuario determina cómo responde el agente
router.post("/chat",         validarJWT, chatConAgente);
router.post("/chat/simple",  validarJWT, chatSimple);
router.get("/historial/sesiones", validarJWT, getHistorialSesiones);
router.get("/historial/sesiones/:sessionId", validarJWT, getHistorialSesionDetalle);
router.get("/historial/buscar", validarJWT, buscarHistorialChats);

module.exports = router;
