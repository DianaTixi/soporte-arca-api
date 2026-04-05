const jwt = require("jsonwebtoken");

const generarJWT = (uid) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { usuario: uid },
      process.env.SECRET_JWT_SEED,
      { expiresIn: "8760h" }, // 1 año
      (error, token) => {
        if (error) {
          console.log(error);
          reject("No se pudo generar el token");
        }
        resolve(token);
      }
    );
  });
};

module.exports = { generarJWT };
