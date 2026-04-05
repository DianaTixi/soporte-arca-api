const {
  obtenerMemorias, obtenerMemoriaPorId, guardarMemoria,
  actualizarMemoria, eliminarMemoria,
} = require("../database/repositories/memoria_repo");

const getMemorias = async (req, res) => {
  try {
    const { modulo, categoria, activo, limit, offset } = req.query;
    const filtros = {};
    if (modulo) filtros.modulo = modulo;
    if (categoria) filtros.categoria = categoria;
    if (activo !== undefined) filtros.activo = activo === "true";
    if (limit) filtros.limit = Number(limit);
    if (offset) filtros.offset = Number(offset);
    const memorias = await obtenerMemorias(filtros);
    res.json({ ok: true, memorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener memorias" });
  }
};

const getMemoriaPorId = async (req, res) => {
  try {
    const memoria = await obtenerMemoriaPorId(req.params.id);
    if (!memoria) return res.status(404).json({ ok: false, msg: "Memoria no encontrada" });
    res.json({ ok: true, memoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener memoria" });
  }
};

const postMemoria = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;
    if (!titulo || !contenido) {
      return res.status(400).json({ ok: false, msg: "Título y contenido son requeridos" });
    }
    const resultado = await guardarMemoria({
      ...req.body,
      creadoPor: req.usuario?.email || "admin",
    });
    res.status(201).json({ ok: true, ...resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al crear memoria" });
  }
};

const putMemoria = async (req, res) => {
  try {
    const memoria = await actualizarMemoria(req.params.id, req.body);
    if (!memoria) return res.status(404).json({ ok: false, msg: "Memoria no encontrada" });
    res.json({ ok: true, memoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al actualizar memoria" });
  }
};

const deleteMemoria = async (req, res) => {
  try {
    const resultado = await eliminarMemoria(req.params.id);
    if (!resultado) return res.status(404).json({ ok: false, msg: "Memoria no encontrada" });
    res.json({ ok: true, msg: "Memoria desactivada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al eliminar memoria" });
  }
};

module.exports = { getMemorias, getMemoriaPorId, postMemoria, putMemoria, deleteMemoria };
