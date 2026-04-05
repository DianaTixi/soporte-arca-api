const pool = require("../db");

/**
 * Busca errores por mensaje exacto o parcial (case-insensitive)
 * Es la herramienta principal del agente para resolver errores reportados
 */
const buscarErrorPorMensaje = async (mensaje) => {
  // Primero intenta match exacto (case-insensitive)
  let result = await pool.query(
    `SELECT e.*, a.art_titulo, a.art_slug
     FROM soporte_errores e
     LEFT JOIN soporte_articulos a ON e.err_articulo_id = a.art_id
     WHERE e.err_activo = TRUE
       AND LOWER(e.err_mensaje) = LOWER($1)`,
    [mensaje.trim()]
  );

  // Si no hay match exacto, buscar con LIKE
  if (result.rows.length === 0) {
    result = await pool.query(
      `SELECT e.*, a.art_titulo, a.art_slug
       FROM soporte_errores e
       LEFT JOIN soporte_articulos a ON e.err_articulo_id = a.art_id
       WHERE e.err_activo = TRUE
         AND LOWER(e.err_mensaje) LIKE LOWER($1)
       ORDER BY LENGTH(e.err_mensaje) ASC
       LIMIT 5`,
      [`%${mensaje.trim()}%`]
    );
  }

  // Si aún no hay resultados, intentar full-text search
  if (result.rows.length === 0) {
    result = await pool.query(
      `SELECT e.*, a.art_titulo, a.art_slug,
              ts_rank(
                to_tsvector('spanish', e.err_mensaje || ' ' || coalesce(e.err_causa, '')),
                plainto_tsquery('spanish', $1)
              ) AS relevancia
       FROM soporte_errores e
       LEFT JOIN soporte_articulos a ON e.err_articulo_id = a.art_id
       WHERE e.err_activo = TRUE
         AND to_tsvector('spanish', e.err_mensaje || ' ' || coalesce(e.err_causa, ''))
             @@ plainto_tsquery('spanish', $1)
       ORDER BY relevancia DESC
       LIMIT 5`,
      [mensaje.trim()]
    );
  }

  return result.rows;
};

/**
 * Busca todos los errores de un módulo específico
 */
const buscarErroresPorModulo = async (modulo) => {
  const result = await pool.query(
    `SELECT e.*, a.art_titulo, a.art_slug
     FROM soporte_errores e
     LEFT JOIN soporte_articulos a ON e.err_articulo_id = a.art_id
     WHERE e.err_activo = TRUE
       AND LOWER(e.err_modulo) = LOWER($1)
     ORDER BY e.err_http_code, e.err_mensaje`,
    [modulo.trim()]
  );
  return result.rows;
};

/**
 * Crear un nuevo mapeo de error
 */
const crearError = async (data) => {
  const {
    modulo, mensaje, endpoint, httpCode, causa,
    solucionTecnica, solucionUsuario, navegacion,
    queryDiagnostico, articuloId, tags
  } = data;

  const result = await pool.query(
    `INSERT INTO soporte_errores
      (err_modulo, err_mensaje, err_endpoint, err_http_code, err_causa,
       err_solucion_tecnica, err_solucion_usuario, err_navegacion,
       err_query_diagnostico, err_articulo_id, err_tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [modulo, mensaje, endpoint, httpCode || 400, causa,
     solucionTecnica, solucionUsuario, navegacion,
     queryDiagnostico, articuloId || null, tags || []]
  );
  return result.rows[0];
};

/**
 * Actualizar un mapeo de error existente
 */
const actualizarError = async (id, data) => {
  const {
    modulo, mensaje, endpoint, httpCode, causa,
    solucionTecnica, solucionUsuario, navegacion,
    queryDiagnostico, articuloId, tags
  } = data;

  const result = await pool.query(
    `UPDATE soporte_errores
     SET err_modulo=$1, err_mensaje=$2, err_endpoint=$3, err_http_code=$4,
         err_causa=$5, err_solucion_tecnica=$6, err_solucion_usuario=$7,
         err_navegacion=$8, err_query_diagnostico=$9, err_articulo_id=$10, err_tags=$11
     WHERE err_id=$12
     RETURNING *`,
    [modulo, mensaje, endpoint, httpCode, causa,
     solucionTecnica, solucionUsuario, navegacion,
     queryDiagnostico, articuloId, tags, id]
  );
  return result.rows[0];
};

/**
 * Obtener todos los módulos que tienen errores mapeados
 */
const obtenerModulosConErrores = async () => {
  const result = await pool.query(
    `SELECT err_modulo, COUNT(*) AS total
     FROM soporte_errores
     WHERE err_activo = TRUE
     GROUP BY err_modulo
     ORDER BY err_modulo`
  );
  return result.rows;
};

const obtenerErrores = async ({ modulo, activo } = {}) => {
  let sql = `SELECT e.*, a.art_titulo, a.art_slug
             FROM soporte_errores e
             LEFT JOIN soporte_articulos a ON e.err_articulo_id = a.art_id
             WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (modulo) { sql += ` AND LOWER(e.err_modulo) = LOWER($${idx++})`; params.push(modulo); }
  if (activo !== undefined) { sql += ` AND e.err_activo = $${idx++}`; params.push(activo); }
  sql += ` ORDER BY e.err_modulo, e.err_created_at DESC`;
  const { rows } = await pool.query(sql, params);
  return rows;
};

const obtenerErrorPorId = async (id) => {
  const { rows } = await pool.query(
    `SELECT e.*, a.art_titulo, a.art_slug
     FROM soporte_errores e
     LEFT JOIN soporte_articulos a ON e.err_articulo_id = a.art_id
     WHERE e.err_id = $1`,
    [id]
  );
  return rows[0];
};

const eliminarError = async (id) => {
  const { rows } = await pool.query(
    `UPDATE soporte_errores SET err_activo = false WHERE err_id = $1 RETURNING err_id`,
    [id]
  );
  return rows[0];
};

module.exports = {
  buscarErrorPorMensaje,
  buscarErroresPorModulo,
  crearError,
  actualizarError,
  obtenerModulosConErrores,
  obtenerErrores,
  obtenerErrorPorId,
  eliminarError,
};
