/**
 * Migración: índices para historial de chat (búsqueda y listado eficiente)
 * Ejecutar: node database/migrate_chat_historial_indices.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const migrate = async () => {
  console.log("💬 Creando índices de soporte_chat_historial...\n");

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_session ON soporte_chat_historial(chat_session_id);

    CREATE INDEX IF NOT EXISTS idx_chat_usuario_fecha
      ON soporte_chat_historial(chat_usuario, chat_created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_chat_historial_fts
      ON soporte_chat_historial
      USING GIN(to_tsvector('spanish', COALESCE(chat_pregunta, '') || ' ' || COALESCE(chat_respuesta, '')));
  `);

  console.log("✅ Índices de historial de chat creados/verificados.");
  await pool.end();
};

migrate().catch(async (err) => {
  console.error("❌ Error en migración de historial de chat:", err);
  try {
    await pool.end();
  } catch (_e) {
    // ignore
  }
  process.exit(1);
});
