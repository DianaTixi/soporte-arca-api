const pool = require("../db");
const bcrypt = require("bcryptjs");

const obtenerUsuarioPorEmail = async (email) => {
  const consulta = `SELECT * FROM soporte_usuarios WHERE usu_email = '${email}' AND usu_activo = TRUE`;
  console.log("🚀 ~ obtenerUsuarioPorEmail ~ consulta:", consulta)
  const result = await pool.query(consulta);
  return result.rows[0];
};

const crearUsuario = async ({ nombre, email, password, rol = "soporte" }) => {
  const hash = bcrypt.hashSync(password, 10);
  const result = await pool.query(
    `INSERT INTO soporte_usuarios (usu_nombre, usu_email, usu_password, usu_rol)
     VALUES ($1,$2,$3,$4)
     RETURNING usu_id, usu_nombre, usu_email, usu_rol`,
    [nombre, email, hash, rol]
  );
  return result.rows[0];
};

const obtenerUsuarios = async () => {
  const result = await pool.query(
    `SELECT usu_id, usu_nombre, usu_email, usu_rol, usu_activo, usu_created_at
     FROM soporte_usuarios ORDER BY usu_created_at DESC`
  );
  return result.rows;
};

const guardarChatHistorial = async ({ sessionId, usuario, pregunta, respuesta, articulosUsados, tokensUsados, tokensInput, tokensOutput, costoUsd, modelo, complejidad }) => {
  const result = await pool.query(
    `INSERT INTO soporte_chat_historial
       (chat_session_id, chat_usuario, chat_pregunta, chat_respuesta, chat_articulos_usados, chat_tokens_usados, chat_tokens_input, chat_tokens_output, chat_costo_usd, chat_modelo, chat_complejidad)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING chat_id`,
    [
      sessionId, usuario || "anonimo", pregunta, respuesta,
      articulosUsados || [], tokensUsados || 0,
      tokensInput || 0, tokensOutput || 0, costoUsd || 0,
      modelo || null, complejidad || null,
    ]
  );
  return result.rows[0];
};

const obtenerSesionesChatUsuario = async ({ usuario, query = "", limit = 30, offset = 0, includeAll = false }) => {
  const usuarioFinal = usuario || "anonimo";
  const limitFinal = Math.max(1, Math.min(100, Number(limit) || 30));
  const offsetFinal = Math.max(0, Number(offset) || 0);
  const texto = (query || "").trim();
  const whereUsuario = includeAll ? "" : "WHERE chat_usuario = $1";
  const whereUsuarioAnd = includeAll ? "WHERE 1=1" : "WHERE chat_usuario = $1";
  const usuarioParamOffset = includeAll ? 0 : 1;

  if (!texto) {
    const paramsTotal = includeAll ? [] : [usuarioFinal];
    const { rows: [totalRow] } = await pool.query(
      `SELECT COUNT(DISTINCT chat_session_id)::int AS total
       FROM soporte_chat_historial
       ${whereUsuario}`,
      paramsTotal
    );

    const paramsData = includeAll
      ? [limitFinal, offsetFinal]
      : [usuarioFinal, limitFinal, offsetFinal];
    const { rows } = await pool.query(
      `WITH sesiones AS (
         SELECT
           chat_session_id,
           MAX(chat_usuario) AS chat_usuario,
           MAX(chat_created_at) AS ultima_fecha,
           MIN(chat_created_at) AS primera_fecha,
           COUNT(*)::int AS total_interacciones,
           COALESCE(SUM(chat_tokens_usados), 0)::int AS total_tokens
         FROM soporte_chat_historial
         ${whereUsuarioAnd}
         GROUP BY chat_session_id
         ORDER BY MAX(chat_created_at) DESC
         LIMIT $${usuarioParamOffset + 1} OFFSET $${usuarioParamOffset + 2}
       )
       SELECT
         s.chat_session_id,
         s.chat_usuario,
         s.ultima_fecha,
         s.primera_fecha,
         s.total_interacciones,
         s.total_tokens,
         u.chat_pregunta AS ultima_pregunta,
         u.chat_respuesta AS ultima_respuesta,
         0::int AS coincidencias,
         NULL::text AS preview_match
       FROM sesiones s
       JOIN LATERAL (
         SELECT chat_pregunta, chat_respuesta
         FROM soporte_chat_historial
         WHERE chat_session_id = s.chat_session_id
           AND chat_usuario = s.chat_usuario
         ORDER BY chat_created_at DESC
         LIMIT 1
       ) u ON TRUE
       ORDER BY s.ultima_fecha DESC`,
      paramsData
    );

    return { total: totalRow?.total || 0, sesiones: rows };
  }

  const likeQuery = `%${texto}%`;
  const paramsCount = includeAll ? [likeQuery] : [usuarioFinal, likeQuery];
  const paramsData = includeAll ? [likeQuery, limitFinal, offsetFinal] : [usuarioFinal, likeQuery, limitFinal, offsetFinal];
  const likeIdx = includeAll ? 1 : 2;
  const limitIdx = includeAll ? 2 : 3;
  const offsetIdx = includeAll ? 3 : 4;

  const { rows: [totalRow] } = await pool.query(
    `SELECT COUNT(DISTINCT chat_session_id)::int AS total
     FROM soporte_chat_historial
     ${whereUsuarioAnd}
       AND (
         chat_pregunta ILIKE $${likeIdx}
         OR COALESCE(chat_respuesta, '') ILIKE $${likeIdx}
       )`,
    paramsCount
  );

  const { rows } = await pool.query(
    `WITH sesiones AS (
       SELECT
         chat_session_id,
         MAX(chat_usuario) AS chat_usuario,
         MAX(chat_created_at) AS ultima_fecha,
         MIN(chat_created_at) AS primera_fecha,
         COUNT(*)::int AS total_interacciones,
         COALESCE(SUM(chat_tokens_usados), 0)::int AS total_tokens,
         COUNT(*) FILTER (
           WHERE chat_pregunta ILIKE $${likeIdx} OR COALESCE(chat_respuesta, '') ILIKE $${likeIdx}
         )::int AS coincidencias
       FROM soporte_chat_historial
       ${whereUsuarioAnd}
       GROUP BY chat_session_id
       HAVING COUNT(*) FILTER (
         WHERE chat_pregunta ILIKE $${likeIdx} OR COALESCE(chat_respuesta, '') ILIKE $${likeIdx}
       ) > 0
       ORDER BY MAX(chat_created_at) DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}
     )
     SELECT
       s.chat_session_id,
       s.chat_usuario,
       s.ultima_fecha,
       s.primera_fecha,
       s.total_interacciones,
       s.total_tokens,
       s.coincidencias,
       u.chat_pregunta AS ultima_pregunta,
       u.chat_respuesta AS ultima_respuesta,
       m.preview_match
     FROM sesiones s
     JOIN LATERAL (
       SELECT chat_pregunta, chat_respuesta
       FROM soporte_chat_historial
       WHERE chat_session_id = s.chat_session_id
         AND chat_usuario = s.chat_usuario
       ORDER BY chat_created_at DESC
       LIMIT 1
     ) u ON TRUE
     LEFT JOIN LATERAL (
       SELECT
         LEFT(
           CASE
             WHEN chat_pregunta ILIKE $${likeIdx} THEN chat_pregunta
             WHEN COALESCE(chat_respuesta, '') ILIKE $${likeIdx} THEN chat_respuesta
             ELSE COALESCE(chat_respuesta, chat_pregunta, '')
           END,
           220
         ) AS preview_match
       FROM soporte_chat_historial
       WHERE chat_session_id = s.chat_session_id
         AND chat_usuario = s.chat_usuario
         AND (
           chat_pregunta ILIKE $${likeIdx}
           OR COALESCE(chat_respuesta, '') ILIKE $${likeIdx}
         )
       ORDER BY chat_created_at DESC
       LIMIT 1
     ) m ON TRUE
     ORDER BY s.ultima_fecha DESC`,
    paramsData
  );

  return { total: totalRow?.total || 0, sesiones: rows };
};

const obtenerMensajesChatSesion = async ({ usuario, sessionId, limit = 300, includeAll = false }) => {
  const usuarioFinal = usuario || "anonimo";
  const limitFinal = Math.max(1, Math.min(500, Number(limit) || 300));
  const sessionIdFinal = (sessionId || "").trim();
  if (!sessionIdFinal) return [];

  const params = includeAll ? [sessionIdFinal, limitFinal] : [usuarioFinal, sessionIdFinal, limitFinal];
  const { rows } = await pool.query(
    `SELECT
       chat_id,
       chat_usuario,
       chat_session_id,
       chat_pregunta,
       chat_respuesta,
       chat_articulos_usados,
       chat_tokens_usados,
       chat_created_at
     FROM soporte_chat_historial
     WHERE ${includeAll ? "chat_session_id = $1" : "chat_usuario = $1 AND chat_session_id = $2"}
     ORDER BY chat_created_at ASC
     LIMIT $${includeAll ? 2 : 3}`,
    params
  );
  return rows;
};

const buscarEnHistorialChatsUsuario = async ({ usuario, query, limit = 50, includeAll = false }) => {
  const usuarioFinal = usuario || "anonimo";
  const texto = (query || "").trim();
  const limitFinal = Math.max(1, Math.min(100, Number(limit) || 50));
  if (!texto) return [];

  const likeQuery = `%${texto}%`;
  const params = includeAll ? [likeQuery, limitFinal] : [usuarioFinal, likeQuery, limitFinal];
  const likeIdx = includeAll ? 1 : 2;
  const limitIdx = includeAll ? 2 : 3;
  const { rows } = await pool.query(
    `SELECT
       chat_id,
       chat_usuario,
       chat_session_id,
       chat_created_at,
       LEFT(COALESCE(chat_pregunta, ''), 220) AS pregunta_preview,
       LEFT(COALESCE(chat_respuesta, ''), 220) AS respuesta_preview,
       (chat_pregunta ILIKE $${likeIdx}) AS coincide_pregunta,
       (COALESCE(chat_respuesta, '') ILIKE $${likeIdx}) AS coincide_respuesta
     FROM soporte_chat_historial
     WHERE ${includeAll ? "1=1" : "chat_usuario = $1"}
       AND (
         chat_pregunta ILIKE $${likeIdx}
         OR COALESCE(chat_respuesta, '') ILIKE $${likeIdx}
       )
     ORDER BY chat_created_at DESC
     LIMIT $${limitIdx}`,
    params
  );
  return rows;
};

const buscarChatsResueltos = async ({ query, limit = 4, sessionIdExcluir }) => {
  const texto = (query || "").trim();
  if (!texto) return [];

  const likeQuery = `%${texto}%`;
  const limitFinal = Math.max(1, Math.min(10, Number(limit) || 4));

  const params = [texto, likeQuery, limitFinal];
  let filtroSesion = "";
  if (sessionIdExcluir) {
    params.push(sessionIdExcluir);
    filtroSesion = "AND h.chat_session_id <> $4";
  }

  const { rows } = await pool.query(
    `SELECT
       h.chat_id,
       h.chat_session_id,
       h.chat_usuario,
       h.chat_pregunta,
       h.chat_respuesta,
       h.chat_created_at,
       ts_rank(
         to_tsvector('spanish', COALESCE(h.chat_pregunta, '') || ' ' || COALESCE(h.chat_respuesta, '')),
         plainto_tsquery('spanish', $1)
       ) AS score
     FROM soporte_chat_historial h
     WHERE h.chat_respuesta IS NOT NULL
       AND LENGTH(TRIM(h.chat_respuesta)) >= 30
       ${filtroSesion}
       AND (
         to_tsvector('spanish', COALESCE(h.chat_pregunta, '') || ' ' || COALESCE(h.chat_respuesta, ''))
           @@ plainto_tsquery('spanish', $1)
         OR h.chat_pregunta ILIKE $2
         OR h.chat_respuesta ILIKE $2
       )
     ORDER BY score DESC NULLS LAST, h.chat_created_at DESC
     LIMIT $3`,
    params
  );

  return rows;
};

const guardarBusquedaLog = async ({ query, resultados, usuario }) => {
  await pool.query(
    `INSERT INTO soporte_busquedas_log (log_query, log_resultados, log_usuario) VALUES ($1,$2,$3)`,
    [query, resultados || 0, usuario || "anonimo"]
  );
};

const obtenerUsuarioPorId = async (id) => {
  const result = await pool.query(
    `SELECT usu_id, usu_nombre, usu_email, usu_rol, usu_activo, usu_created_at
     FROM soporte_usuarios WHERE usu_id = $1`,
    [id]
  );
  return result.rows[0];
};

const actualizarUsuario = async (id, { nombre, rol, activo }) => {
  const sets = [];
  const params = [];
  let idx = 1;
  if (nombre !== undefined) { sets.push(`usu_nombre = $${idx++}`); params.push(nombre); }
  if (rol !== undefined) { sets.push(`usu_rol = $${idx++}`); params.push(rol); }
  if (activo !== undefined) { sets.push(`usu_activo = $${idx++}`); params.push(activo); }
  if (sets.length === 0) return null;
  params.push(id);
  const result = await pool.query(
    `UPDATE soporte_usuarios SET ${sets.join(", ")} WHERE usu_id = $${idx}
     RETURNING usu_id, usu_nombre, usu_email, usu_rol, usu_activo`,
    params
  );
  return result.rows[0];
};

const cambiarPassword = async (id, newPasswordHash) => {
  const result = await pool.query(
    `UPDATE soporte_usuarios SET usu_password = $1 WHERE usu_id = $2 RETURNING usu_id`,
    [newPasswordHash, id]
  );
  return result.rows[0];
};

const obtenerBusquedasPopulares = async (limit = 20) => {
  const { rows } = await pool.query(
    `SELECT log_query, COUNT(*)::int AS total, MAX(log_created_at) AS ultima_fecha
     FROM soporte_busquedas_log
     GROUP BY log_query ORDER BY total DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

const obtenerBusquedasSinResultados = async (limit = 20) => {
  const { rows } = await pool.query(
    `SELECT log_query, COUNT(*)::int AS total, MAX(log_created_at) AS ultima_fecha
     FROM soporte_busquedas_log
     WHERE log_resultados = 0
     GROUP BY log_query ORDER BY total DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

module.exports = {
  obtenerUsuarioPorEmail,
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  cambiarPassword,
  obtenerBusquedasPopulares,
  obtenerBusquedasSinResultados,
  guardarChatHistorial,
  obtenerSesionesChatUsuario,
  obtenerMensajesChatSesion,
  buscarEnHistorialChatsUsuario,
  buscarChatsResueltos,
  guardarBusquedaLog,
};
