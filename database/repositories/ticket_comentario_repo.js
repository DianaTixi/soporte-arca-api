const pool = require("../db");

const obtenerComentarios = async (ticketId, { incluirInternos = false } = {}) => {
  const conditions = ["c.tcom_ticket_id = $1"];
  if (!incluirInternos) {
    conditions.push("c.tcom_es_interno = FALSE");
  }

  const { rows } = await pool.query(`
    SELECT c.*, u.usu_nombre AS autor_nombre, u.usu_rol AS autor_rol
    FROM soporte_ticket_comentarios c
    LEFT JOIN soporte_usuarios u ON u.usu_id = c.tcom_autor_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY c.tcom_created_at ASC
  `, [ticketId]);
  return rows;
};

const crearComentario = async ({ ticketId, autorId, contenido, tipo, esInterno }) => {
  const { rows } = await pool.query(`
    INSERT INTO soporte_ticket_comentarios (tcom_ticket_id, tcom_autor_id, tcom_contenido, tcom_tipo, tcom_es_interno)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [ticketId, autorId, contenido, tipo || "respuesta", esInterno || false]);
  return rows[0];
};

module.exports = {
  obtenerComentarios,
  crearComentario,
};
