const jwt = require("jsonwebtoken");

const validarJWT = (req, res, next) => {
  const token = req.header("x-token");
  if (!token) {
    return res.status(401).json({ ok: false, msg: "No hay token en la petición" });
  }
  try {
    const { usuario } = jwt.verify(token, process.env.SECRET_JWT_SEED);
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, msg: "Token no válido" });
  }
};

module.exports = { validarJWT };
