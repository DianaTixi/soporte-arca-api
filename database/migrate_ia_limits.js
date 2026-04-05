/**
 * Migración: tablas de configuración y límites de costo IA
 * Ejecutar: node database/migrate_ia_limits.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const migrate = async () => {
  console.log("💵 Creando tablas de límites IA...\n");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS soporte_ia_config (
      cfg_id                          INTEGER PRIMARY KEY DEFAULT 1 CHECK (cfg_id = 1),
      cfg_limite_global_usd           NUMERIC(12,2),
      cfg_limite_usuario_default_usd  NUMERIC(12,2),
      cfg_bloquear_al_superar         BOOLEAN DEFAULT true,
      cfg_agente_provider             TEXT DEFAULT 'gemini',
      cfg_gemini_api_key_enc          TEXT,
      cfg_deepseek_api_key_enc        TEXT,
      cfg_updated_by                  TEXT,
      cfg_updated_at                  TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE soporte_ia_config
      ADD COLUMN IF NOT EXISTS cfg_agente_provider TEXT DEFAULT 'gemini';
    ALTER TABLE soporte_ia_config
      ADD COLUMN IF NOT EXISTS cfg_gemini_api_key_enc TEXT;
    ALTER TABLE soporte_ia_config
      ADD COLUMN IF NOT EXISTS cfg_deepseek_api_key_enc TEXT;

    INSERT INTO soporte_ia_config (cfg_id)
    VALUES (1)
    ON CONFLICT (cfg_id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS soporte_ia_limite_usuario (
      lim_id          SERIAL PRIMARY KEY,
      lim_usuario     TEXT UNIQUE NOT NULL,
      lim_limite_usd  NUMERIC(12,2) NOT NULL,
      lim_activo      BOOLEAN DEFAULT true,
      lim_updated_by  TEXT,
      lim_updated_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ia_limite_usuario_activo
      ON soporte_ia_limite_usuario(lim_usuario)
      WHERE lim_activo = true;
  `);

  console.log("✅ Tablas de límites IA creadas/verificadas.");
  await pool.end();
};

migrate().catch(async (err) => {
  console.error("❌ Error en migración de límites IA:", err);
  try {
    await pool.end();
  } catch (_e) {
    // ignore
  }
  process.exit(1);
});
