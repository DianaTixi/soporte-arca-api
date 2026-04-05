const bcrypt = require("bcryptjs");
const { generarJWT } = require("../helpers/jwt");
const {
  obtenerUsuarioPorEmail, crearUsuario, obtenerUsuarios,
  obtenerUsuarioPorId, actualizarUsuario: actualizarUsuarioRepo, cambiarPassword: cambiarPasswordRepo,
} = require("../database/repositories/usuario_repo");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, msg: "Email y contraseña son requeridos" });
    }

    const usuario = await obtenerUsuarioPorEmail(email);
    console.log("🚀 ~ login ~ usuario:", usuario);
    if (!usuario) {
      return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    }
    console.log("🚀 ~ login ~ password:", password)

    const passwordValido = bcrypt.compareSync(password, usuario.usu_password);
    console.log("🚀 ~ login ~ passwordValido:", passwordValido)
    if (!passwordValido) {
      return res.status(401).json({ ok: false, msg: "Credenciales inválidas" });
    }

    const token = await generarJWT({
      id: usuario.usu_id,
      nombre: usuario.usu_nombre,
      email: usuario.usu_email,
      rol: usuario.usu_rol,
    });

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.usu_id,
        nombre: usuario.usu_nombre,
        email: usuario.usu_email,
        rol: usuario.usu_rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error en el login" });
  }
};

const registro = async (req, res) => {
  try {
    // Solo admin puede crear usuarios (validado por middleware en la ruta)
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, msg: "Nombre, email y contraseña son requeridos" });
    }

    const usuario = await crearUsuario({ nombre, email, password, rol });
    res.status(201).json({ ok: true, usuario });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ ok: false, msg: "El email ya está registrado" });
    }
    res.status(500).json({ ok: false, msg: "Error al crear usuario" });
  }
};

const renovarToken = async (req, res) => {
  try {
    const token = await generarJWT(req.usuario);
    res.json({ ok: true, token, usuario: req.usuario });
  } catch (error) {
    res.status(500).json({ ok: false, msg: "Error al renovar token" });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await obtenerUsuarios();
    res.json({ ok: true, usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener usuarios" });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, rol, activo } = req.body;
    if (nombre === undefined && rol === undefined && activo === undefined) {
      return res.status(400).json({ ok: false, msg: "No hay campos para actualizar" });
    }
    if (rol && !["admin", "soporte_tecnico", "soporte"].includes(rol)) {
      return res.status(400).json({ ok: false, msg: "Rol inválido" });
    }
    const usuario = await actualizarUsuarioRepo(id, { nombre, rol, activo });
    if (!usuario) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }
    res.json({ ok: true, usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al actualizar usuario" });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, passwordActual } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ ok: false, msg: "La contraseña debe tener al menos 4 caracteres" });
    }
    const isAdmin = req.usuario?.rol === "admin";
    const isSelf = String(req.usuario?.id) === String(id);
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ ok: false, msg: "No tienes permisos para cambiar esta contraseña" });
    }
    // Si no es admin, validar password actual
    if (!isAdmin && isSelf) {
      if (!passwordActual) {
        return res.status(400).json({ ok: false, msg: "Debes enviar tu contraseña actual" });
      }
      const usuarioDb = await obtenerUsuarioPorEmail(req.usuario.email);
      if (!usuarioDb || !bcrypt.compareSync(passwordActual, usuarioDb.usu_password)) {
        return res.status(401).json({ ok: false, msg: "Contraseña actual incorrecta" });
      }
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = await cambiarPasswordRepo(id, hash);
    if (!result) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }
    res.json({ ok: true, msg: "Contraseña actualizada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al cambiar contraseña" });
  }
};

module.exports = { login, registro, renovarToken, listarUsuarios, actualizarUsuario, cambiarPassword };
