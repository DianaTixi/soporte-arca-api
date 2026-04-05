const {
  obtenerArticulos,
  obtenerArticuloPorId,
  obtenerArticuloPorSlug,
  buscarArticulos,
  buscarArticulosLike,
  crearArticulo,
  actualizarArticulo,
  votarArticulo,
  eliminarArticulo,
} = require("../database/repositories/articulo_repo");
const { guardarBusquedaLog } = require("../database/repositories/usuario_repo");

const getArticulos = async (req, res) => {
  try {
    const { categoriaId, tipo, audiencia } = req.query;
    const articulos = await obtenerArticulos({ categoriaId, tipo, audiencia });
    res.json({ ok: true, articulos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener artículos" });
  }
};

const getArticuloPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const articulo = await obtenerArticuloPorId(id);
    if (!articulo) return res.status(404).json({ ok: false, msg: "Artículo no encontrado" });
    res.json({ ok: true, articulo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener artículo" });
  }
};

const getArticuloPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const articulo = await obtenerArticuloPorSlug(slug);
    if (!articulo) return res.status(404).json({ ok: false, msg: "Artículo no encontrado" });
    res.json({ ok: true, articulo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener artículo" });
  }
};

const getBuscarArticulos = async (req, res) => {
  try {
    const { q, categoriaId, tipo, audiencia, limit } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ ok: false, msg: "Query debe tener al menos 2 caracteres" });
    }

    let articulos = await buscarArticulos(q.trim(), { categoriaId, tipo, audiencia, limit: parseInt(limit) || 10 });

    // Fallback a búsqueda LIKE si full-text no encuentra resultados
    if (articulos.length === 0) {
      articulos = await buscarArticulosLike(q.trim(), { limit: parseInt(limit) || 10 });
    }

    // Log de búsqueda
    await guardarBusquedaLog({
      query: q.trim(),
      resultados: articulos.length,
      usuario: req.usuario?.email || "anonimo",
    });

    res.json({ ok: true, articulos, total: articulos.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error en la búsqueda" });
  }
};

const postArticulo = async (req, res) => {
  try {
    const articulo = await crearArticulo({
      ...req.body,
      autor: req.usuario?.nombre || req.body.autor || "Sistema",
    });
    res.status(201).json({ ok: true, articulo });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ ok: false, msg: "Ya existe un artículo con ese slug" });
    }
    res.status(500).json({ ok: false, msg: "Error al crear artículo" });
  }
};

const putArticulo = async (req, res) => {
  try {
    const { id } = req.params;
    const articulo = await actualizarArticulo(id, req.body);
    if (!articulo) return res.status(404).json({ ok: false, msg: "Artículo no encontrado" });
    res.json({ ok: true, articulo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al actualizar artículo" });
  }
};

const patchVotar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body; // 'si' o 'no'
    if (!["si", "no"].includes(tipo)) {
      return res.status(400).json({ ok: false, msg: "Tipo debe ser 'si' o 'no'" });
    }
    const votos = await votarArticulo(id, tipo);
    res.json({ ok: true, votos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al registrar voto" });
  }
};

const deleteArticulo = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eliminarArticulo(id);
    if (!result) return res.status(404).json({ ok: false, msg: "Artículo no encontrado" });
    res.json({ ok: true, msg: "Artículo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al eliminar artículo" });
  }
};

module.exports = {
  getArticulos,
  getArticuloPorId,
  getArticuloPorSlug,
  getBuscarArticulos,
  postArticulo,
  putArticulo,
  patchVotar,
  deleteArticulo,
};
