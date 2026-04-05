const pool = require("../db");

const generarNumeroTicket = async () => {
  const year = new Date().getFullYear();
  const { rows } = await pool.query("SELECT nextval('soporte_ticket_seq') AS seq");
  const seq = String(rows[0].seq).padStart(4, "0");
  return `TIC-${year}${seq}`;
};

const obtenerTickets = async ({
  estado, prioridad, modulo, creadoPor, asignadoA,
  misTickets, asignadosAMi, usuarioId,
  q, limit = 50, offset = 0,
} = {}) => {
  const conditions = ["t.tick_activo = TRUE"];
  const params = [];
  let idx = 1;

  if (estado) { conditions.push(`t.tick_estado = $${idx++}`); params.push(estado); }
  if (prioridad) { conditions.push(`t.tick_prioridad = $${idx++}`); params.push(prioridad); }
  if (modulo) { conditions.push(`t.tick_modulo = $${idx++}`); params.push(modulo); }
  if (creadoPor) { conditions.push(`t.tick_creado_por = $${idx++}`); params.push(creadoPor); }
  if (asignadoA) { conditions.push(`t.tick_asignado_a = $${idx++}`); params.push(asignadoA); }

  if (misTickets && usuarioId) {
    conditions.push(`t.tick_creado_por = $${idx++}`);
    params.push(usuarioId);
  }
  if (asignadosAMi && usuarioId) {
    conditions.push(`t.tick_asignado_a = $${idx++}`);
    params.push(usuarioId);
  }

  if (q && q.trim()) {
    conditions.push(`(t.tick_titulo ILIKE $${idx} OR t.tick_descripcion ILIKE $${idx})`);
    params.push(`%${q.trim()}%`);
    idx++;
  }

  const limitFinal = Math.max(1, Math.min(200, Number(limit) || 50));
  const offsetFinal = Math.max(0, Number(offset) || 0);
  params.push(limitFinal, offsetFinal);

  const { rows } = await pool.query(`
    SELECT t.*,
           c.usu_nombre AS creador_nombre,
           a.usu_nombre AS asignado_nombre
    FROM soporte_tickets t
    LEFT JOIN soporte_usuarios c ON c.usu_id = t.tick_creado_por
    LEFT JOIN soporte_usuarios a ON a.usu_id = t.tick_asignado_a
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      CASE t.tick_prioridad WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END,
      t.tick_created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, params);

  // Count total
  const countParams = params.slice(0, -2);
  const { rows: countRows } = await pool.query(`
    SELECT COUNT(*)::int AS total FROM soporte_tickets t
    WHERE ${conditions.join(" AND ")}
  `, countParams);

  return { tickets: rows, total: countRows[0]?.total || 0 };
};

const obtenerTicketPorId = async (id) => {
  const { rows } = await pool.query(`
    SELECT t.*,
           c.usu_nombre AS creador_nombre, c.usu_email AS creador_email,
           a.usu_nombre AS asignado_nombre, a.usu_email AS asignado_email
    FROM soporte_tickets t
    LEFT JOIN soporte_usuarios c ON c.usu_id = t.tick_creado_por
    LEFT JOIN soporte_usuarios a ON a.usu_id = t.tick_asignado_a
    WHERE t.tick_id = $1
  `, [id]);
  return rows[0] || null;
};

const crearTicket = async ({ titulo, descripcion, modulo, prioridad, creadoPor, chatSessionId, tags }) => {
  const numero = await generarNumeroTicket();
  const { rows } = await pool.query(`
    INSERT INTO soporte_tickets (tick_numero, tick_titulo, tick_descripcion, tick_modulo, tick_prioridad, tick_creado_por, tick_chat_session_id, tick_tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [numero, titulo, descripcion || null, modulo || null, prioridad || "media", creadoPor, chatSessionId || null, tags || []]);
  return rows[0];
};

const actualizarTicket = async (id, { titulo, descripcion, modulo, prioridad, tags }) => {
  const sets = [];
  const params = [];
  let idx = 1;

  if (titulo !== undefined) { sets.push(`tick_titulo = $${idx++}`); params.push(titulo); }
  if (descripcion !== undefined) { sets.push(`tick_descripcion = $${idx++}`); params.push(descripcion); }
  if (modulo !== undefined) { sets.push(`tick_modulo = $${idx++}`); params.push(modulo); }
  if (prioridad !== undefined) { sets.push(`tick_prioridad = $${idx++}`); params.push(prioridad); }
  if (tags !== undefined) { sets.push(`tick_tags = $${idx++}`); params.push(tags); }

  if (sets.length === 0) return null;
  sets.push("tick_updated_at = CURRENT_TIMESTAMP");

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE soporte_tickets SET ${sets.join(", ")} WHERE tick_id = $${idx} RETURNING *`,
    params
  );
  return rows[0] || null;
};

const asignarTicket = async (id, asignadoA) => {
  const { rows } = await pool.query(`
    UPDATE soporte_tickets
    SET tick_asignado_a = $2, tick_updated_at = CURRENT_TIMESTAMP
    WHERE tick_id = $1
    RETURNING *
  `, [id, asignadoA]);
  return rows[0] || null;
};

const cambiarEstadoTicket = async (id, estado, { solucion, fechaPrimeraRespuesta } = {}) => {
  const sets = ["tick_estado = $2", "tick_updated_at = CURRENT_TIMESTAMP"];
  const params = [id, estado];
  let idx = 3;

  if (solucion !== undefined) { sets.push(`tick_solucion = $${idx++}`); params.push(solucion); }
  if (estado === "resuelto") { sets.push(`tick_fecha_resolucion = CURRENT_TIMESTAMP`); }
  if (fechaPrimeraRespuesta) { sets.push(`tick_fecha_primera_respuesta = COALESCE(tick_fecha_primera_respuesta, CURRENT_TIMESTAMP)`); }
  if (estado === "escalado") { sets.push("tick_asignado_a = NULL"); }

  const { rows } = await pool.query(
    `UPDATE soporte_tickets SET ${sets.join(", ")} WHERE tick_id = $1 RETURNING *`,
    params
  );
  return rows[0] || null;
};

const eliminarTicket = async (id) => {
  const { rows } = await pool.query(
    "UPDATE soporte_tickets SET tick_activo = FALSE, tick_updated_at = CURRENT_TIMESTAMP WHERE tick_id = $1 RETURNING *",
    [id]
  );
  return rows[0] || null;
};

const contarTicketsPorEstado = async () => {
  const { rows } = await pool.query(`
    SELECT tick_estado, COUNT(*)::int AS total
    FROM soporte_tickets WHERE tick_activo = TRUE
    GROUP BY tick_estado
  `);
  return rows;
};

const obtenerEstadisticasTickets = async () => {
  const [estadoRes, prioridadRes, moduloRes, tiemposRes, totalRes] = await Promise.all([
    pool.query(`
      SELECT tick_estado, COUNT(*)::int AS total
      FROM soporte_tickets WHERE tick_activo = TRUE
      GROUP BY tick_estado ORDER BY total DESC
    `),
    pool.query(`
      SELECT tick_prioridad, COUNT(*)::int AS total
      FROM soporte_tickets WHERE tick_activo = TRUE
      GROUP BY tick_prioridad ORDER BY total DESC
    `),
    pool.query(`
      SELECT tick_modulo, COUNT(*)::int AS total
      FROM soporte_tickets WHERE tick_activo = TRUE AND tick_modulo IS NOT NULL
      GROUP BY tick_modulo ORDER BY total DESC
    `),
    pool.query(`
      SELECT
        AVG(EXTRACT(EPOCH FROM (tick_fecha_primera_respuesta - tick_created_at)))::int AS promedio_primera_respuesta_seg,
        AVG(EXTRACT(EPOCH FROM (tick_fecha_resolucion - tick_created_at)))::int AS promedio_resolucion_seg
      FROM soporte_tickets
      WHERE tick_activo = TRUE AND tick_fecha_resolucion IS NOT NULL
    `),
    pool.query(`SELECT COUNT(*)::int AS total FROM soporte_tickets WHERE tick_activo = TRUE`),
  ]);

  return {
    total: totalRes.rows[0]?.total || 0,
    por_estado: estadoRes.rows,
    por_prioridad: prioridadRes.rows,
    por_modulo: moduloRes.rows,
    tiempos: tiemposRes.rows[0] || {},
  };
};

module.exports = {
  generarNumeroTicket,
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  actualizarTicket,
  asignarTicket,
  cambiarEstadoTicket,
  eliminarTicket,
  contarTicketsPorEstado,
  obtenerEstadisticasTickets,
};
