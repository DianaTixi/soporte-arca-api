const { Router } = require("express");
const {
  getTickets, getEstadisticasTickets, getTicketPorId, getComentarios, getHistorial,
  postTicket, postComentario, putTicket,
  patchTomar, patchAsignar, patchEscalar, patchResolver, patchCerrar, patchReabrir,
  deleteTicket,
} = require("../controllers/ticket_controller");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validar-rol");

const router = Router();

// Lectura — todos los roles autenticados (controller filtra por permisos)
router.get("/", validarJWT, getTickets);
router.get("/estadisticas", validarJWT, validarRol("admin", "soporte_tecnico"), getEstadisticasTickets);
router.get("/:id", validarJWT, getTicketPorId);
router.get("/:id/comentarios", validarJWT, getComentarios);
router.get("/:id/historial", validarJWT, validarRol("admin", "soporte_tecnico"), getHistorial);

// Crear
router.post("/", validarJWT, postTicket);
router.post("/:id/comentarios", validarJWT, postComentario);

// Actualizar
router.put("/:id", validarJWT, putTicket);

// Acciones de estado
router.patch("/:id/tomar", validarJWT, patchTomar);
router.patch("/:id/asignar", validarJWT, validarRol("admin"), patchAsignar);
router.patch("/:id/escalar", validarJWT, patchEscalar);
router.patch("/:id/resolver", validarJWT, patchResolver);
router.patch("/:id/cerrar", validarJWT, validarRol("admin", "soporte_tecnico"), patchCerrar);
router.patch("/:id/reabrir", validarJWT, patchReabrir);

// Eliminar
router.delete("/:id", validarJWT, validarRol("admin"), deleteTicket);

module.exports = router;
