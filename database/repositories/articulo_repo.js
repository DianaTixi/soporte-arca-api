const pool = require("../db");

const obtenerArticulos = async ({ categoriaId, tipo, audiencia, activo = true } = {}) => {
  let conditions = ["a.art_activo = $1"];
  let params = [activo];
  let idx = 2;

  if (categoriaId) {
    conditions.push(`a.art_categoria_id = $${idx++}`);
    params.push(categoriaId);
  }
  if (tipo) {
    conditions.push(`a.art_tipo = $${idx++}`);
    params.push(tipo);
  }
  if (audiencia && audiencia !== "todos") {
    conditions.push(`(a.art_audiencia = $${idx++} OR a.art_audiencia = 'todos')`);
    params.push(audiencia);
  }

  const result = await pool.query(
    `SELECT a.art_id, a.art_titulo, a.art_slug, a.art_resumen, a.art_tipo,
            a.art_audiencia, a.art_categoria_id, a.art_tags, a.art_vistas,
            a.art_util_si, a.art_util_no, a.art_autor, a.art_created_at, a.art_updated_at,
            c.cat_nombre, c.cat_icono, c.cat_color, a.art_contenido
     FROM soporte_articulos a
     LEFT JOIN soporte_categorias c ON a.art_categoria_id = c.cat_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY a.art_updated_at DESC`,
    params
  );
  return result.rows;
};

const obtenerArticuloPorId = async (id) => {
  const result = await pool.query(
    `SELECT a.*, c.cat_nombre, c.cat_icono, c.cat_color
     FROM soporte_articulos a
     LEFT JOIN soporte_categorias c ON a.art_categoria_id = c.cat_id
     WHERE a.art_id = $1`,
    [id]
  );
  if (result.rows.length > 0) {
    await pool.query(
      `UPDATE soporte_articulos SET art_vistas = art_vistas + 1 WHERE art_id = $1`,
      [id]
    );
  }
  return result.rows[0];
};

const obtenerArticuloPorSlug = async (slug) => {
  const result = await pool.query(
    `SELECT a.*, c.cat_nombre, c.cat_icono, c.cat_color
     FROM soporte_articulos a
     LEFT JOIN soporte_categorias c ON a.art_categoria_id = c.cat_id
     WHERE a.art_slug = $1 AND a.art_activo = TRUE`,
    [slug]
  );
  if (result.rows.length > 0) {
    await pool.query(
      `UPDATE soporte_articulos SET art_vistas = art_vistas + 1 WHERE art_slug = $1`,
      [slug]
    );
  }
  return result.rows[0];
};

const buscarArticulos = async (query, { categoriaId, tipo, audiencia, limit = 10 } = {}) => {
  let conditions = ["a.art_activo = TRUE"];
  let params = [query];
  let idx = 2;

  if (categoriaId) {
    conditions.push(`a.art_categoria_id = $${idx++}`);
    params.push(categoriaId);
  }
  if (tipo) {
    conditions.push(`a.art_tipo = $${idx++}`);
    params.push(tipo);
  }
  if (audiencia && audiencia !== "todos") {
    conditions.push(`(a.art_audiencia = $${idx++} OR a.art_audiencia = 'todos')`);
    params.push(audiencia);
  }

  params.push(limit);
  const limitIdx = idx++;

  const result = await pool.query(
    `SELECT a.art_id, a.art_titulo, a.art_slug, a.art_resumen, a.art_tipo,
            a.art_audiencia, a.art_categoria_id, a.art_tags,
            c.cat_nombre, c.cat_icono, c.cat_color,
            ts_rank(
              to_tsvector('spanish', coalesce(a.art_titulo,'') || ' ' || coalesce(a.art_resumen,'') || ' ' || a.art_contenido),
              plainto_tsquery('spanish', $1)
            ) AS relevancia
     FROM soporte_articulos a
     LEFT JOIN soporte_categorias c ON a.art_categoria_id = c.cat_id
     WHERE ${conditions.join(" AND ")}
       AND to_tsvector('spanish', coalesce(a.art_titulo,'') || ' ' || coalesce(a.art_resumen,'') || ' ' || a.art_contenido)
           @@ plainto_tsquery('spanish', $1)
     ORDER BY relevancia DESC
     LIMIT $${limitIdx}`,
    params
  );
  return result.rows;
};

// Búsqueda simple por LIKE (fallback cuando full-text no encuentra)
const buscarArticulosLike = async (query, { limit = 10 } = {}) => {
  const result = await pool.query(
    `SELECT a.art_id, a.art_titulo, a.art_slug, a.art_resumen, a.art_tipo,
            a.art_audiencia, a.art_categoria_id, a.art_tags,
            c.cat_nombre, c.cat_icono, c.cat_color
     FROM soporte_articulos a
     LEFT JOIN soporte_categorias c ON a.art_categoria_id = c.cat_id
     WHERE a.art_activo = TRUE
       AND (lower(a.art_titulo) LIKE lower($1) OR lower(a.art_resumen) LIKE lower($1))
     ORDER BY a.art_vistas DESC
     LIMIT $2`,
    [`%${query}%`, limit]
  );
  return result.rows;
};

const buscarArticulosPorTags = async (tags = [], { limit = 10 } = {}) => {
  const tagsLimpios = Array.isArray(tags)
    ? tags
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean)
    : [];

  if (tagsLimpios.length === 0) return [];

  const result = await pool.query(
    `SELECT a.art_id, a.art_titulo, a.art_slug, a.art_resumen, a.art_tipo,
            a.art_audiencia, a.art_categoria_id, a.art_tags,
            c.cat_nombre, c.cat_icono, c.cat_color
     FROM soporte_articulos a
     LEFT JOIN soporte_categorias c ON a.art_categoria_id = c.cat_id
     WHERE a.art_activo = TRUE
       AND EXISTS (
         SELECT 1
         FROM unnest(a.art_tags) AS tag
         WHERE lower(tag) = ANY($1::text[])
       )
     ORDER BY a.art_vistas DESC, a.art_updated_at DESC
     LIMIT $2`,
    [tagsLimpios, limit]
  );
  return result.rows;
};

const crearArticulo = async (data) => {
  console.log("🚀 ~ crearArticulo ~ data:", data)
  const {
    art_titulo, art_slug, art_resumen, art_contenido, art_tipo, art_audiencia,
    art_categoria_id, art_tags, art_autor
  } = data;
    console.log("🚀 ~ crearArticulo ~ titulo:", art_titulo)
    console.log("🚀 ~ crearArticulo ~ slug:", art_slug)
 
  const slugFinal = art_slug || generarSlug(art_titulo);

  const result = await pool.query(
    `INSERT INTO soporte_articulos
      (art_titulo, art_slug, art_resumen, art_contenido, art_tipo, art_audiencia,
       art_categoria_id, art_tags, art_autor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [art_titulo, slugFinal, art_resumen, art_contenido, art_tipo || "faq", art_audiencia || "todos",
     art_categoria_id, art_tags || [], art_autor || "Sistema"]
  );
  return result.rows[0];
};

const actualizarArticulo = async (id, data) => {
  console.log("🚀 ~ actualizarArticulo ~ data:", data)
  const {
    art_titulo, art_slug, art_resumen, art_contenido, art_tipo, art_audiencia,
    cat_id, art_tags, art_autor
  } = data;

  const result = await pool.query(
    `UPDATE soporte_articulos
     SET art_titulo=$1, art_slug=$2, art_resumen=$3, art_contenido=$4,
         art_tipo=$5, art_audiencia=$6, art_categoria_id=$7,
         art_tags=$8, art_autor=$9, art_updated_at=CURRENT_TIMESTAMP
     WHERE art_id=$10
     RETURNING *`,
    [art_titulo, art_slug, art_resumen, art_contenido, art_tipo, art_audiencia,
     cat_id, art_tags, art_autor, id]
  );
  return result.rows[0];
};

const votarArticulo = async (id, tipo) => {
  const campo = tipo === "si" ? "art_util_si" : "art_util_no";
  const result = await pool.query(
    `UPDATE soporte_articulos SET ${campo} = ${campo} + 1 WHERE art_id=$1 RETURNING art_util_si, art_util_no`,
    [id]
  );
  return result.rows[0];
};

const eliminarArticulo = async (id) => {
  const result = await pool.query(
    `UPDATE soporte_articulos SET art_activo=FALSE WHERE art_id=$1 RETURNING art_id`,
    [id]
  );
  return result.rows[0];
};

const generarSlug = (titulo) => {
  if (!titulo) return ""; 

  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const obtenerArticulosPopulares = async (limit = 10) => {
  const { rows } = await pool.query(
    `SELECT art_id, art_titulo, art_slug, art_tipo, art_vistas, art_util_si, art_util_no
     FROM soporte_articulos WHERE art_activo = true
     ORDER BY art_vistas DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

const obtenerArticulosMasUtiles = async (limit = 10) => {
  const { rows } = await pool.query(
    `SELECT art_id, art_titulo, art_slug, art_tipo, art_vistas, art_util_si, art_util_no
     FROM soporte_articulos WHERE art_activo = true AND art_util_si > 0
     ORDER BY art_util_si DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

const obtenerArticulosMenosUtiles = async (limit = 10) => {
  const { rows } = await pool.query(
    `SELECT art_id, art_titulo, art_slug, art_tipo, art_vistas, art_util_si, art_util_no
     FROM soporte_articulos WHERE art_activo = true AND art_util_no > 0
     ORDER BY art_util_no DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

module.exports = {
  obtenerArticulos,
  obtenerArticuloPorId,
  obtenerArticuloPorSlug,
  buscarArticulos,
  buscarArticulosLike,
  buscarArticulosPorTags,
  crearArticulo,
  actualizarArticulo,
  votarArticulo,
  eliminarArticulo,
  obtenerArticulosPopulares,
  obtenerArticulosMasUtiles,
  obtenerArticulosMenosUtiles,
};
