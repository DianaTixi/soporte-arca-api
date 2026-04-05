const pool = require("../db");

const obtenerCategorias = async () => {
  const result = await pool.query(
    `SELECT cat_id, cat_nombre, cat_descripcion, cat_icono, cat_color, cat_tipo, cat_orden
     FROM soporte_categorias
     WHERE cat_activo = TRUE
     ORDER BY cat_orden ASC`
  );
  return result.rows;
};

const obtenerCategoriaPorId = async (id) => {
  const result = await pool.query(
    `SELECT * FROM soporte_categorias WHERE cat_id = $1`,
    [id]
  );
  return result.rows[0];
};

const crearCategoria = async (data) => {
  const { nombre, descripcion, icono, color, tipo, orden } = data;
  const result = await pool.query(
    `INSERT INTO soporte_categorias (cat_nombre, cat_descripcion, cat_icono, cat_color, cat_tipo, cat_orden)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nombre, descripcion, icono, color || "#1976d2", tipo || "general", orden || 0]
  );
  return result.rows[0];
};

const actualizarCategoria = async (id, data) => {
  const { nombre, descripcion, icono, color, tipo, orden } = data;
  const result = await pool.query(
    `UPDATE soporte_categorias
     SET cat_nombre=$1, cat_descripcion=$2, cat_icono=$3, cat_color=$4, cat_tipo=$5, cat_orden=$6
     WHERE cat_id=$7
     RETURNING *`,
    [nombre, descripcion, icono, color, tipo, orden, id]
  );
  return result.rows[0];
};

const eliminarCategoria = async (id) => {
  const result = await pool.query(
    `UPDATE soporte_categorias SET cat_activo=FALSE WHERE cat_id=$1 RETURNING cat_id`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};
