/**
 * Middleware para validar roles de usuario en api_soporte
 * Roles válidos: 'admin', 'soporte_tecnico', 'soporte'
 *
 * Uso: router.post("/ruta", validarJWT, validarRol("admin"), controller)
 *      router.get("/ruta", validarJWT, validarRol("admin", "soporte_tecnico"), controller)
 */
const validarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        msg: "No hay usuario autenticado",
      });
    }

    const rolUsuario = req.usuario.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permisos para realizar esta acción",
      });
    }

    next();
  };
};

module.exports = { validarRol };
