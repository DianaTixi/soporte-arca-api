const express = require("express");
require("dotenv").config();

const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.static("public"));
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Rutas
app.use("/api/auth",       require("./routes/auth_route"));
app.use("/api/categorias", require("./routes/categoria_route"));
app.use("/api/articulos",  require("./routes/articulo_route"));
app.use("/api/agente",     require("./routes/agente_route"));
app.use("/api/errores",    require("./routes/error_route"));
app.use("/api/memorias",   require("./routes/memoria_route"));
app.use("/api/tickets",    require("./routes/ticket_route"));
app.use("/api/stats",      require("./routes/stats_route"));

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API Soporte ARCA corriendo", version: "1.0.0" });
});

const server = app.listen(process.env.PORT || 4500, () => {
  console.log(`🚀 API Soporte corriendo en puerto ${process.env.PORT || 4500}`);
});

server.timeout = 1000 * 60 * 5; // 5 minutos para respuestas del agente IA
