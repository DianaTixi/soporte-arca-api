const pool = require("../db");

const obtenerPasosDeArticulo = async (articuloId) => {
  const result = await pool.query(
    `SELECT * FROM soporte_diagnostico_pasos
     WHERE paso_articulo_id = $1
     ORDER BY paso_orden ASC`,
    [articuloId]
  );
  return result.rows;
};

const obtenerPasoPorId = async (pasoId) => {
  const result = await pool.query(
    `SELECT p.*,
            si.paso_pregunta AS si_pregunta, si.paso_es_solucion AS si_es_solucion, si.paso_solucion AS si_solucion,
            no.paso_pregunta AS no_pregunta, no.paso_es_solucion AS no_es_solucion, no.paso_solucion AS no_solucion
     FROM soporte_diagnostico_pasos p
     LEFT JOIN soporte_diagnostico_pasos si ON p.paso_si_id = si.paso_id
     LEFT JOIN soporte_diagnostico_pasos no ON p.paso_no_id = no.paso_id
     WHERE p.paso_id = $1`,
    [pasoId]
  );
  return result.rows[0];
};

const crearPaso = async (data) => {
  const { articuloId, orden, pregunta, siId, noId, esSolucion, solucion, linkArticulo } = data;
  const result = await pool.query(
    `INSERT INTO soporte_diagnostico_pasos
      (paso_articulo_id, paso_orden, paso_pregunta, paso_si_id, paso_no_id, paso_es_solucion, paso_solucion, paso_link_articulo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [articuloId, orden, pregunta, siId || null, noId || null, esSolucion || false, solucion, linkArticulo || null]
  );
  return result.rows[0];
};

const actualizarPaso = async (pasoId, data) => {
  const { orden, pregunta, siId, noId, esSolucion, solucion, linkArticulo } = data;
  const result = await pool.query(
    `UPDATE soporte_diagnostico_pasos
     SET paso_orden=$1, paso_pregunta=$2, paso_si_id=$3, paso_no_id=$4,
         paso_es_solucion=$5, paso_solucion=$6, paso_link_articulo=$7
     WHERE paso_id=$8
     RETURNING *`,
    [orden, pregunta, siId || null, noId || null, esSolucion || false, solucion, linkArticulo || null, pasoId]
  );
  return result.rows[0];
};

const eliminarPasosDeArticulo = async (articuloId) => {
  await pool.query(
    `DELETE FROM soporte_diagnostico_pasos WHERE paso_articulo_id = $1`,
    [articuloId]
  );
};

module.exports = {
  obtenerPasosDeArticulo,
  obtenerPasoPorId,
  crearPaso,
  actualizarPaso,
  eliminarPasosDeArticulo,
};
