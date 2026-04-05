const pool = require("../db");

const registrarHistorial = async ({ ticketId, usuarioId, accion, detalle }) => {
  const { rows } = await pool.query(`
    INSERT INTO soporte_ticket_historial (this_ticket_id, this_usuario_id, this_accion, this_detalle)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [ticketId, usuarioId, accion, detalle || null]);
  return rows[0];
};

const obtenerHistorial = async (ticketId) => {
  const { rows } = await pool.query(`
    SELECT h.*, u.usu_nombre AS usuario_nombre
    FROM soporte_ticket_historial h
    LEFT JOIN soporte_usuarios u ON u.usu_id = h.this_usuario_id
    WHERE h.this_ticket_id = $1
    ORDER BY h.this_created_at ASC
  `, [ticketId]);
  return rows;
};

module.exports = {
  registrarHistorial,
  obtenerHistorial,
};
