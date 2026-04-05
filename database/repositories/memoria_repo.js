/**
 * Repositorio de memorias del agente IA
 * Almacena y recupera aprendizajes persistentes
 */
const pool = require("../db");

/**
 * Buscar memorias relevantes por texto (full-text search + LIKE fallback)
 */
const buscarMemorias = async (query, { modulo, categoria, limite = 10 } = {}) => {
  let sql = `
    SELECT mem_id, mem_categoria, mem_titulo, mem_contenido, mem_modulo,
           mem_tags, mem_veces_usado, mem_fecha_creacion, mem_fecha_ultimo_uso
    FROM agente_memorias
    WHERE mem_activo = true
  `;
  const params = [];
  let paramIdx = 1;

  if (query) {
    sql += ` AND (
      to_tsvector('spanish', mem_titulo || ' ' || mem_contenido)
      @@ plainto_tsquery('spanish', $${paramIdx})
      OR LOWER(mem_titulo) LIKE LOWER($${paramIdx + 1})
      OR LOWER(mem_contenido) LIKE LOWER($${paramIdx + 1})
      OR LOWER(array_to_string(mem_tags, ' ')) LIKE LOWER($${paramIdx + 1})
    )`;
    params.push(query, `%${query}%`);
    paramIdx += 2;
  }

  if (modulo) {
    sql += ` AND (mem_modulo = $${paramIdx} OR mem_modulo = 'general' OR mem_modulo IS NULL)`;
    params.push(modulo);
    paramIdx++;
  }

  if (categoria) {
    sql += ` AND mem_categoria = $${paramIdx}`;
    params.push(categoria);
    paramIdx++;
  }

  sql += ` ORDER BY mem_veces_usado DESC, mem_fecha_ultimo_uso DESC NULLS LAST LIMIT $${paramIdx}`;
  params.push(limite);

  const { rows } = await pool.query(sql, params);
  return rows;
};

/**
 * Obtener memorias más usadas/recientes (para inyectar como contexto)
 */
const obtenerMemoriasTop = async ({ modulo, limite = 5 } = {}) => {
  let sql = `
    SELECT mem_id, mem_categoria, mem_titulo, mem_contenido, mem_modulo, mem_veces_usado
    FROM agente_memorias
    WHERE mem_activo = true
  `;
  const params = [];
  let paramIdx = 1;

  if (modulo) {
    sql += ` AND (mem_modulo = $${paramIdx} OR mem_modulo = 'general' OR mem_modulo IS NULL)`;
    params.push(modulo);
    paramIdx++;
  }

  sql += ` ORDER BY mem_veces_usado DESC, mem_fecha_ultimo_uso DESC NULLS LAST LIMIT $${paramIdx}`;
  params.push(limite);

  const { rows } = await pool.query(sql, params);
  return rows;
};

/**
 * Guardar una nueva memoria
 */
const guardarMemoria = async ({ categoria, titulo, contenido, modulo, tags, creadoPor }) => {
  // Verificar si ya existe una memoria muy similar (por título)
  const { rows: existentes } = await pool.query(
    `SELECT mem_id FROM agente_memorias
     WHERE mem_activo = true AND LOWER(TRIM(mem_titulo)) = LOWER(TRIM($1))`,
    [titulo]
  );

  if (existentes.length > 0) {
    // Actualizar contenido de la memoria existente
    const { rows } = await pool.query(
      `UPDATE agente_memorias SET
        mem_contenido = $1, mem_tags = $2, mem_fecha_ultimo_uso = NOW(), mem_veces_usado = mem_veces_usado + 1
       WHERE mem_id = $3 RETURNING *`,
      [contenido, tags || [], existentes[0].mem_id]
    );
    return { actualizada: true, memoria: rows[0] };
  }

  const { rows } = await pool.query(
    `INSERT INTO agente_memorias (mem_categoria, mem_titulo, mem_contenido, mem_modulo, mem_tags, mem_creado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [categoria || "patron", titulo, contenido, modulo || "general", tags || [], creadoPor || "agente"]
  );
  return { creada: true, memoria: rows[0] };
};

/**
 * Incrementar uso de una memoria
 */
const registrarUsoMemoria = async (memId) => {
  await pool.query(
    `UPDATE agente_memorias SET mem_veces_usado = mem_veces_usado + 1, mem_fecha_ultimo_uso = NOW() WHERE mem_id = $1`,
    [memId]
  );
};

const obtenerMemorias = async ({ modulo, categoria, activo, limit = 100, offset = 0 } = {}) => {
  let sql = `SELECT * FROM agente_memorias WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (activo !== undefined) { sql += ` AND mem_activo = $${idx++}`; params.push(activo); }
  else { sql += ` AND mem_activo = true`; }
  if (modulo) { sql += ` AND mem_modulo = $${idx++}`; params.push(modulo); }
  if (categoria) { sql += ` AND mem_categoria = $${idx++}`; params.push(categoria); }
  sql += ` ORDER BY mem_veces_usado DESC, mem_fecha_creacion DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(Math.min(limit, 200), Math.max(offset, 0));
  const { rows } = await pool.query(sql, params);
  return rows;
};

const obtenerMemoriaPorId = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM agente_memorias WHERE mem_id = $1`, [id]);
  return rows[0];
};

const actualizarMemoria = async (id, { titulo, contenido, categoria, modulo, tags, activo }) => {
  const sets = [];
  const params = [];
  let idx = 1;
  if (titulo !== undefined) { sets.push(`mem_titulo = $${idx++}`); params.push(titulo); }
  if (contenido !== undefined) { sets.push(`mem_contenido = $${idx++}`); params.push(contenido); }
  if (categoria !== undefined) { sets.push(`mem_categoria = $${idx++}`); params.push(categoria); }
  if (modulo !== undefined) { sets.push(`mem_modulo = $${idx++}`); params.push(modulo); }
  if (tags !== undefined) { sets.push(`mem_tags = $${idx++}`); params.push(tags); }
  if (activo !== undefined) { sets.push(`mem_activo = $${idx++}`); params.push(activo); }
  if (sets.length === 0) return null;
  params.push(id);
  const { rows } = await pool.query(
    `UPDATE agente_memorias SET ${sets.join(", ")} WHERE mem_id = $${idx} RETURNING *`,
    params
  );
  return rows[0];
};

const eliminarMemoria = async (id) => {
  const { rows } = await pool.query(
    `UPDATE agente_memorias SET mem_activo = false WHERE mem_id = $1 RETURNING mem_id`,
    [id]
  );
  return rows[0];
};

module.exports = {
  buscarMemorias,
  obtenerMemoriasTop,
  guardarMemoria,
  registrarUsoMemoria,
  obtenerMemorias,
  obtenerMemoriaPorId,
  actualizarMemoria,
  eliminarMemoria,
};
