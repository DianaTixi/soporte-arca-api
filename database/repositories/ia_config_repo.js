const pool = require("../db");
const { encryptSecret, decryptSecret, maskSecret } = require("../../helpers/secret_crypto");

const IA_PROVIDER_DEFAULT = "gemini";
const IA_PROVIDERS = new Set(["gemini", "deepseek"]);

const normalizeProvider = (value) => {
  const v = String(value || IA_PROVIDER_DEFAULT).trim().toLowerCase();
  return IA_PROVIDERS.has(v) ? v : IA_PROVIDER_DEFAULT;
};

const safeDecrypt = (value) => {
  try {
    return decryptSecret(value);
  } catch (_e) {
    return null;
  }
};

const toProviderPublicConfig = (row) => {
  const geminiKey = safeDecrypt(row?.cfg_gemini_api_key_enc);
  const deepseekKey = safeDecrypt(row?.cfg_deepseek_api_key_enc);
  return {
    provider: normalizeProvider(row?.cfg_agente_provider),
    gemini: {
      configurado: Boolean(geminiKey),
      api_key_masked: geminiKey ? maskSecret(geminiKey) : null,
    },
    deepseek: {
      configurado: Boolean(deepseekKey),
      api_key_masked: deepseekKey ? maskSecret(deepseekKey) : null,
    },
    updated_by: row?.cfg_updated_by || null,
    updated_at: row?.cfg_updated_at || null,
  };
};

const ensureIaTables = async () => {
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

    ALTER TABLE soporte_ia_config
      ADD COLUMN IF NOT EXISTS cfg_agente_provider TEXT DEFAULT 'gemini';
    ALTER TABLE soporte_ia_config
      ADD COLUMN IF NOT EXISTS cfg_gemini_api_key_enc TEXT;
    ALTER TABLE soporte_ia_config
      ADD COLUMN IF NOT EXISTS cfg_deepseek_api_key_enc TEXT;
  `);
};

const ensureConfigRow = async () => {
  await ensureIaTables();
  await pool.query(
    `INSERT INTO soporte_ia_config (cfg_id)
     VALUES (1)
     ON CONFLICT (cfg_id) DO NOTHING`
  );
};

const getIaConfig = async () => {
  await ensureConfigRow();
  const { rows: [row] } = await pool.query(
    `SELECT
      cfg_id,
      cfg_limite_global_usd,
      cfg_limite_usuario_default_usd,
      cfg_bloquear_al_superar,
      cfg_agente_provider,
      cfg_updated_by,
      cfg_updated_at
     FROM soporte_ia_config
     WHERE cfg_id = 1`
  );
  return row;
};

const updateIaConfig = async ({ limiteGlobalUsd, limiteUsuarioDefaultUsd, bloquearAlSuperar = true, updatedBy }) => {
  await ensureConfigRow();
  const { rows: [row] } = await pool.query(
    `UPDATE soporte_ia_config
     SET
      cfg_limite_global_usd = $1,
      cfg_limite_usuario_default_usd = $2,
      cfg_bloquear_al_superar = $3,
      cfg_updated_by = $4,
      cfg_updated_at = NOW()
     WHERE cfg_id = 1
     RETURNING cfg_id, cfg_limite_global_usd, cfg_limite_usuario_default_usd, cfg_bloquear_al_superar, cfg_agente_provider, cfg_updated_by, cfg_updated_at`,
    [limiteGlobalUsd, limiteUsuarioDefaultUsd, bloquearAlSuperar, updatedBy || "admin"]
  );
  return row;
};

const getIaProviderConfig = async () => {
  await ensureConfigRow();
  const { rows: [row] } = await pool.query(
    `SELECT
      cfg_agente_provider,
      cfg_gemini_api_key_enc,
      cfg_deepseek_api_key_enc,
      cfg_updated_by,
      cfg_updated_at
     FROM soporte_ia_config
     WHERE cfg_id = 1`
  );
  return toProviderPublicConfig(row);
};

const getIaRuntimeConfig = async () => {
  await ensureConfigRow();
  const { rows: [row] } = await pool.query(
    `SELECT
      cfg_agente_provider,
      cfg_gemini_api_key_enc,
      cfg_deepseek_api_key_enc
     FROM soporte_ia_config
     WHERE cfg_id = 1`
  );

  return {
    provider: normalizeProvider(row?.cfg_agente_provider),
    geminiApiKey: safeDecrypt(row?.cfg_gemini_api_key_enc),
    deepseekApiKey: safeDecrypt(row?.cfg_deepseek_api_key_enc),
  };
};

const updateIaProviderConfig = async ({
  provider,
  geminiApiKey,
  deepseekApiKey,
  clearGeminiApiKey = false,
  clearDeepseekApiKey = false,
  updatedBy,
}) => {
  await ensureConfigRow();

  const { rows: [actual] } = await pool.query(
    `SELECT cfg_agente_provider, cfg_gemini_api_key_enc, cfg_deepseek_api_key_enc
     FROM soporte_ia_config
     WHERE cfg_id = 1`
  );

  let geminiEncrypted = actual?.cfg_gemini_api_key_enc || null;
  let deepseekEncrypted = actual?.cfg_deepseek_api_key_enc || null;

  if (clearGeminiApiKey) {
    geminiEncrypted = null;
  } else if (typeof geminiApiKey === "string" && geminiApiKey.trim()) {
    geminiEncrypted = encryptSecret(geminiApiKey.trim());
  }

  if (clearDeepseekApiKey) {
    deepseekEncrypted = null;
  } else if (typeof deepseekApiKey === "string" && deepseekApiKey.trim()) {
    deepseekEncrypted = encryptSecret(deepseekApiKey.trim());
  }

  const providerFinal = normalizeProvider(provider || actual?.cfg_agente_provider);

  const { rows: [updated] } = await pool.query(
    `UPDATE soporte_ia_config
     SET
      cfg_agente_provider = $1,
      cfg_gemini_api_key_enc = $2,
      cfg_deepseek_api_key_enc = $3,
      cfg_updated_by = $4,
      cfg_updated_at = NOW()
     WHERE cfg_id = 1
     RETURNING cfg_agente_provider, cfg_gemini_api_key_enc, cfg_deepseek_api_key_enc, cfg_updated_by, cfg_updated_at`,
    [providerFinal, geminiEncrypted, deepseekEncrypted, updatedBy || "admin"]
  );

  return toProviderPublicConfig(updated);
};

const upsertIaUserLimit = async ({ usuario, limiteUsd, activo = true, updatedBy }) => {
  await ensureIaTables();
  const usuarioFinal = (usuario || "").trim().toLowerCase();
  if (!usuarioFinal) throw new Error("Usuario requerido");

  const { rows: [row] } = await pool.query(
    `INSERT INTO soporte_ia_limite_usuario (lim_usuario, lim_limite_usd, lim_activo, lim_updated_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (lim_usuario)
     DO UPDATE SET
      lim_limite_usd = EXCLUDED.lim_limite_usd,
      lim_activo = EXCLUDED.lim_activo,
      lim_updated_by = EXCLUDED.lim_updated_by,
      lim_updated_at = NOW()
     RETURNING lim_id, lim_usuario, lim_limite_usd, lim_activo, lim_updated_by, lim_updated_at`,
    [usuarioFinal, limiteUsd, activo, updatedBy || "admin"]
  );
  return row;
};

const disableIaUserLimit = async ({ usuario, updatedBy }) => {
  await ensureIaTables();
  const usuarioFinal = (usuario || "").trim().toLowerCase();
  if (!usuarioFinal) throw new Error("Usuario requerido");

  const { rows: [row] } = await pool.query(
    `UPDATE soporte_ia_limite_usuario
     SET lim_activo = false,
         lim_updated_by = $2,
         lim_updated_at = NOW()
     WHERE lim_usuario = $1
     RETURNING lim_id, lim_usuario, lim_limite_usd, lim_activo, lim_updated_by, lim_updated_at`,
    [usuarioFinal, updatedBy || "admin"]
  );
  return row;
};

const getIaUserLimits = async () => {
  await ensureIaTables();
  const { rows } = await pool.query(
    `SELECT lim_id, lim_usuario, lim_limite_usd, lim_activo, lim_updated_by, lim_updated_at
     FROM soporte_ia_limite_usuario
     ORDER BY lim_activo DESC, lim_updated_at DESC NULLS LAST, lim_usuario ASC`
  );
  return rows;
};

const getIaUserLimit = async (usuario) => {
  await ensureIaTables();
  const usuarioFinal = (usuario || "").trim().toLowerCase();
  if (!usuarioFinal) return null;

  const { rows: [row] } = await pool.query(
    `SELECT lim_id, lim_usuario, lim_limite_usd, lim_activo
     FROM soporte_ia_limite_usuario
     WHERE lim_usuario = $1
     LIMIT 1`,
    [usuarioFinal]
  );
  return row || null;
};

module.exports = {
  getIaConfig,
  updateIaConfig,
  getIaProviderConfig,
  getIaRuntimeConfig,
  updateIaProviderConfig,
  upsertIaUserLimit,
  disableIaUserLimit,
  getIaUserLimits,
  getIaUserLimit,
};
