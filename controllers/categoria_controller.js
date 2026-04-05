const {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} = require("../database/repositories/categoria_repo");

const getCategorias = async (req, res) => {
  try {
    const categorias = await obtenerCategorias();
    res.json({ ok: true, categorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener categorías" });
  }
};

const getCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await obtenerCategoriaPorId(id);
    if (!categoria) return res.status(404).json({ ok: false, msg: "Categoría no encontrada" });
    res.json({ ok: true, categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener categoría" });
  }
};

const postCategoria = async (req, res) => {
  try {
    const categoria = await crearCategoria(req.body);
    res.status(201).json({ ok: true, categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al crear categoría" });
  }
};

const putCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await actualizarCategoria(id, req.body);
    if (!categoria) return res.status(404).json({ ok: false, msg: "Categoría no encontrada" });
    res.json({ ok: true, categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al actualizar categoría" });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eliminarCategoria(id);
    if (!result) return res.status(404).json({ ok: false, msg: "Categoría no encontrada" });
    res.json({ ok: true, msg: "Categoría eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al eliminar categoría" });
  }
};

module.exports = { getCategorias, getCategoriaPorId, postCategoria, putCategoria, deleteCategoria };
