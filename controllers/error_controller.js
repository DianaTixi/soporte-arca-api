const {
  obtenerErrores, obtenerErrorPorId, crearError, actualizarError,
  eliminarError, obtenerModulosConErrores,
} = require("../database/repositories/error_repo");

const getErrores = async (req, res) => {
  try {
    const { modulo, activo } = req.query;
    const filtros = {};
    if (modulo) filtros.modulo = modulo;
    if (activo !== undefined) filtros.activo = activo === "true";
    const errores = await obtenerErrores(filtros);
    res.json({ ok: true, errores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener errores" });
  }
};

const getErrorPorId = async (req, res) => {
  try {
    const error = await obtenerErrorPorId(req.params.id);
    if (!error) return res.status(404).json({ ok: false, msg: "Error no encontrado" });
    res.json({ ok: true, error });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener el registro" });
  }
};

const postError = async (req, res) => {
  try {
    const { modulo, mensaje, causa } = req.body;
    if (!modulo || !mensaje || !causa) {
      return res.status(400).json({ ok: false, msg: "Módulo, mensaje y causa son requeridos" });
    }
    const nuevoError = await crearError(req.body);
    res.status(201).json({ ok: true, error: nuevoError });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al crear mapeo de error" });
  }
};

const putError = async (req, res) => {
  try {
    const resultado = await actualizarError(req.params.id, req.body);
    if (!resultado) return res.status(404).json({ ok: false, msg: "Error no encontrado" });
    res.json({ ok: true, error: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al actualizar" });
  }
};

const deleteError = async (req, res) => {
  try {
    const resultado = await eliminarError(req.params.id);
    if (!resultado) return res.status(404).json({ ok: false, msg: "Error no encontrado" });
    res.json({ ok: true, msg: "Error desactivado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al eliminar" });
  }
};

const getModulos = async (req, res) => {
  try {
    const modulos = await obtenerModulosConErrores();
    res.json({ ok: true, modulos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener módulos" });
  }
};

module.exports = { getErrores, getErrorPorId, postError, putError, deleteError, getModulos };
