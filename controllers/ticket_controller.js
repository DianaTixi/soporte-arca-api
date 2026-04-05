const {
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  actualizarTicket,
  asignarTicket,
  cambiarEstadoTicket,
  eliminarTicket,
  obtenerEstadisticasTickets,
} = require("../database/repositories/ticket_repo");
const { obtenerComentarios, crearComentario } = require("../database/repositories/ticket_comentario_repo");
const { registrarHistorial, obtenerHistorial } = require("../database/repositories/ticket_historial_repo");

// ── helpers ──────────────────────────────────────────────────
const esRolTecnico = (rol) => rol === "admin" || rol === "soporte_tecnico";

const puedeVerTicket = (ticket, usuario) => {
  if (esRolTecnico(usuario.rol)) return true;
  return ticket.tick_creado_por === usuario.id || ticket.tick_asignado_a === usuario.id;
};

// ── GET /tickets ─────────────────────────────────────────────
const getTickets = async (req, res) => {
  try {
    const { estado, prioridad, modulo, creado_por, asignado_a, mis_tickets, asignados_a_mi, q, limit, offset } = req.query;
    const usuario = req.usuario;

    const filtros = {
      estado, prioridad, modulo, q,
      creadoPor: creado_por, asignadoA: asignado_a,
      misTickets: mis_tickets === "true",
      asignadosAMi: asignados_a_mi === "true",
      usuarioId: usuario.id,
      limit, offset,
    };

    // Soporte solo ve los suyos (creados + asignados)
    if (usuario.rol === "soporte" && !filtros.misTickets && !filtros.asignadosAMi) {
      filtros.misTickets = false;
      filtros.asignadosAMi = false;
      // Override: forzar filtro de visibilidad
      const result = await obtenerTickets({ ...filtros });
      const filtered = result.tickets.filter(
        (t) => t.tick_creado_por === usuario.id || t.tick_asignado_a === usuario.id
      );
      return res.json({ ok: true, tickets: filtered, total: filtered.length });
    }

    const result = await obtenerTickets(filtros);
    res.json({ ok: true, tickets: result.tickets, total: result.total });
  } catch (error) {
    console.error("Error getTickets:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener tickets" });
  }
};

// ── GET /tickets/estadisticas ────────────────────────────────
const getEstadisticasTickets = async (req, res) => {
  try {
    const stats = await obtenerEstadisticasTickets();
    res.json({ ok: true, ...stats });
  } catch (error) {
    console.error("Error getEstadisticasTickets:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener estadísticas" });
  }
};

// ── GET /tickets/:id ─────────────────────────────────────────
const getTicketPorId = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });
    if (!puedeVerTicket(ticket, req.usuario)) {
      return res.status(403).json({ ok: false, msg: "No tienes permisos para ver este ticket" });
    }
    res.json({ ok: true, ticket });
  } catch (error) {
    console.error("Error getTicketPorId:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener ticket" });
  }
};

// ── GET /tickets/:id/comentarios ─────────────────────────────
const getComentarios = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });
    if (!puedeVerTicket(ticket, req.usuario)) {
      return res.status(403).json({ ok: false, msg: "Sin permisos" });
    }

    const incluirInternos = esRolTecnico(req.usuario.rol);
    const comentarios = await obtenerComentarios(req.params.id, { incluirInternos });
    res.json({ ok: true, comentarios });
  } catch (error) {
    console.error("Error getComentarios:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener comentarios" });
  }
};

// ── GET /tickets/:id/historial ───────────────────────────────
const getHistorial = async (req, res) => {
  try {
    const historial = await obtenerHistorial(req.params.id);
    res.json({ ok: true, historial });
  } catch (error) {
    console.error("Error getHistorial:", error);
    res.status(500).json({ ok: false, msg: "Error al obtener historial" });
  }
};

// ── POST /tickets ────────────────────────────────────────────
const postTicket = async (req, res) => {
  try {
    const { titulo, descripcion, modulo, prioridad, chatSessionId, tags } = req.body;
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ ok: false, msg: "El título es obligatorio" });
    }

    const ticket = await crearTicket({
      titulo: titulo.trim(),
      descripcion,
      modulo,
      prioridad,
      creadoPor: req.usuario.id,
      chatSessionId,
      tags: tags || [],
    });

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "creado",
      detalle: `Ticket ${ticket.tick_numero} creado`,
    });

    res.status(201).json({ ok: true, ticket });
  } catch (error) {
    console.error("Error postTicket:", error);
    res.status(500).json({ ok: false, msg: "Error al crear ticket" });
  }
};

// ── POST /tickets/:id/comentarios ────────────────────────────
const postComentario = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });
    if (!puedeVerTicket(ticket, req.usuario)) {
      return res.status(403).json({ ok: false, msg: "Sin permisos" });
    }

    const { contenido, tipo, esInterno } = req.body;
    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ ok: false, msg: "El contenido es obligatorio" });
    }

    // Solo tecnico/admin pueden crear notas internas
    const esInternoFinal = esInterno && esRolTecnico(req.usuario.rol);

    const comentario = await crearComentario({
      ticketId: ticket.tick_id,
      autorId: req.usuario.id,
      contenido: contenido.trim(),
      tipo: tipo || "respuesta",
      esInterno: esInternoFinal,
    });

    // Registrar primera respuesta si es la primera vez
    if (!ticket.tick_fecha_primera_respuesta && ticket.tick_creado_por !== req.usuario.id) {
      await cambiarEstadoTicket(ticket.tick_id, ticket.tick_estado, { fechaPrimeraRespuesta: true });
    }

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "comentado",
      detalle: esInternoFinal ? "Nota interna agregada" : "Comentario agregado",
    });

    res.status(201).json({ ok: true, comentario });
  } catch (error) {
    console.error("Error postComentario:", error);
    res.status(500).json({ ok: false, msg: "Error al agregar comentario" });
  }
};

// ── PUT /tickets/:id ─────────────────────────────────────────
const putTicket = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    const usuario = req.usuario;
    if (!esRolTecnico(usuario.rol) && ticket.tick_creado_por !== usuario.id) {
      return res.status(403).json({ ok: false, msg: "Sin permisos para editar" });
    }

    const { titulo, descripcion, modulo, prioridad, tags } = req.body;
    const changes = [];
    if (prioridad && prioridad !== ticket.tick_prioridad) {
      changes.push(`Prioridad: ${ticket.tick_prioridad} → ${prioridad}`);
    }

    const updated = await actualizarTicket(req.params.id, { titulo, descripcion, modulo, prioridad, tags });

    if (changes.length > 0) {
      await registrarHistorial({
        ticketId: ticket.tick_id,
        usuarioId: usuario.id,
        accion: "prioridad_cambiada",
        detalle: changes.join(", "),
      });
    }

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error putTicket:", error);
    res.status(500).json({ ok: false, msg: "Error al actualizar ticket" });
  }
};

// ── PATCH /tickets/:id/tomar ─────────────────────────────────
const patchTomar = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    if (!["abierto", "escalado"].includes(ticket.tick_estado)) {
      return res.status(400).json({ ok: false, msg: "Solo se pueden tomar tickets abiertos o escalados" });
    }

    await asignarTicket(ticket.tick_id, req.usuario.id);
    const updated = await cambiarEstadoTicket(ticket.tick_id, "en_progreso");

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "asignado",
      detalle: `Tomado por ${req.usuario.nombre}`,
    });

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error patchTomar:", error);
    res.status(500).json({ ok: false, msg: "Error al tomar ticket" });
  }
};

// ── PATCH /tickets/:id/asignar ───────────────────────────────
const patchAsignar = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    const { asignadoA } = req.body;
    if (!asignadoA) return res.status(400).json({ ok: false, msg: "Debe indicar a quién asignar" });

    const updated = await asignarTicket(ticket.tick_id, asignadoA);
    if (ticket.tick_estado === "abierto") {
      await cambiarEstadoTicket(ticket.tick_id, "en_progreso");
    }

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "asignado",
      detalle: `Asignado por ${req.usuario.nombre}`,
    });

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error patchAsignar:", error);
    res.status(500).json({ ok: false, msg: "Error al asignar ticket" });
  }
};

// ── PATCH /tickets/:id/escalar ───────────────────────────────
const patchEscalar = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    if (!["abierto", "en_progreso"].includes(ticket.tick_estado)) {
      return res.status(400).json({ ok: false, msg: "Solo se pueden escalar tickets abiertos o en progreso" });
    }

    const updated = await cambiarEstadoTicket(ticket.tick_id, "escalado");

    const { motivo } = req.body;
    if (motivo) {
      await crearComentario({
        ticketId: ticket.tick_id,
        autorId: req.usuario.id,
        contenido: motivo,
        tipo: "escalamiento",
        esInterno: false,
      });
    }

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "escalado",
      detalle: motivo || "Escalado a soporte técnico",
    });

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error patchEscalar:", error);
    res.status(500).json({ ok: false, msg: "Error al escalar ticket" });
  }
};

// ── PATCH /tickets/:id/resolver ──────────────────────────────
const patchResolver = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    const usuario = req.usuario;
    if (!esRolTecnico(usuario.rol) && ticket.tick_creado_por !== usuario.id) {
      return res.status(403).json({ ok: false, msg: "Sin permisos para resolver" });
    }

    if (["cerrado"].includes(ticket.tick_estado)) {
      return res.status(400).json({ ok: false, msg: "No se puede resolver un ticket cerrado" });
    }

    const { solucion } = req.body;
    if (!solucion || !solucion.trim()) {
      return res.status(400).json({ ok: false, msg: "Debe incluir la solución" });
    }

    const updated = await cambiarEstadoTicket(ticket.tick_id, "resuelto", { solucion: solucion.trim() });

    await crearComentario({
      ticketId: ticket.tick_id,
      autorId: usuario.id,
      contenido: solucion.trim(),
      tipo: "resolucion",
      esInterno: false,
    });

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: usuario.id,
      accion: "resuelto",
      detalle: `Resuelto por ${usuario.nombre}`,
    });

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error patchResolver:", error);
    res.status(500).json({ ok: false, msg: "Error al resolver ticket" });
  }
};

// ── PATCH /tickets/:id/cerrar ────────────────────────────────
const patchCerrar = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    if (ticket.tick_estado !== "resuelto") {
      return res.status(400).json({ ok: false, msg: "Solo se pueden cerrar tickets resueltos" });
    }

    const updated = await cambiarEstadoTicket(ticket.tick_id, "cerrado");

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "cerrado",
      detalle: `Cerrado por ${req.usuario.nombre}`,
    });

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error patchCerrar:", error);
    res.status(500).json({ ok: false, msg: "Error al cerrar ticket" });
  }
};

// ── PATCH /tickets/:id/reabrir ───────────────────────────────
const patchReabrir = async (req, res) => {
  try {
    const ticket = await obtenerTicketPorId(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    if (!["resuelto", "cerrado"].includes(ticket.tick_estado)) {
      return res.status(400).json({ ok: false, msg: "Solo se pueden reabrir tickets resueltos o cerrados" });
    }

    const updated = await cambiarEstadoTicket(ticket.tick_id, "abierto");

    const { motivo } = req.body;
    if (motivo) {
      await crearComentario({
        ticketId: ticket.tick_id,
        autorId: req.usuario.id,
        contenido: motivo,
        tipo: "respuesta",
        esInterno: false,
      });
    }

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "reabierto",
      detalle: motivo || `Reabierto por ${req.usuario.nombre}`,
    });

    res.json({ ok: true, ticket: updated });
  } catch (error) {
    console.error("Error patchReabrir:", error);
    res.status(500).json({ ok: false, msg: "Error al reabrir ticket" });
  }
};

// ── DELETE /tickets/:id ──────────────────────────────────────
const deleteTicket = async (req, res) => {
  try {
    const ticket = await eliminarTicket(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, msg: "Ticket no encontrado" });

    await registrarHistorial({
      ticketId: ticket.tick_id,
      usuarioId: req.usuario.id,
      accion: "eliminado",
      detalle: `Eliminado por ${req.usuario.nombre}`,
    });

    res.json({ ok: true, msg: "Ticket eliminado" });
  } catch (error) {
    console.error("Error deleteTicket:", error);
    res.status(500).json({ ok: false, msg: "Error al eliminar ticket" });
  }
};

module.exports = {
  getTickets,
  getEstadisticasTickets,
  getTicketPorId,
  getComentarios,
  getHistorial,
  postTicket,
  postComentario,
  putTicket,
  patchTomar,
  patchAsignar,
  patchEscalar,
  patchResolver,
  patchCerrar,
  patchReabrir,
  deleteTicket,
};
