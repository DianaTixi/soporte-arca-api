const pool = require("../database/db");
const {
  getIaConfig,
  updateIaConfig,
  getIaProviderConfig,
  updateIaProviderConfig,
  getIaUserLimits,
  upsertIaUserLimit,
  disableIaUserLimit,
} = require("../database/repositories/ia_config_repo");
const { getPricingConfig, calcularCostoDesdeTokens } = require("../helpers/ia_costos");
const { obtenerArticulosPopulares, obtenerArticulosMasUtiles, obtenerArticulosMenosUtiles } = require("../database/repositories/articulo_repo");
const { obtenerBusquedasPopulares, obtenerBusquedasSinResultados } = require("../database/repositories/usuario_repo");

/**
 * GET /api/stats/ia
 * Devuelve estadísticas completas del uso de IA para admin
 */
const obtenerStatsIA = async (req, res) => {
  try {
    // 1. Resumen general
    const { rows: [resumen] } = await pool.query(`
      SELECT
        COUNT(*) AS total_consultas,
        COUNT(DISTINCT chat_usuario) AS total_usuarios,
        COUNT(DISTINCT chat_session_id) AS total_sesiones,
        COALESCE(SUM(chat_tokens_usados), 0) AS total_tokens,
        COALESCE(AVG(chat_tokens_usados), 0) AS promedio_tokens_consulta,
        MIN(chat_created_at) AS primera_consulta,
        MAX(chat_created_at) AS ultima_consulta
      FROM soporte_chat_historial
    `);

    // 2. Uso mensual (últimos 12 meses)
    const { rows: usoMensual } = await pool.query(`
      SELECT
        TO_CHAR(chat_created_at, 'YYYY-MM') AS mes,
        COUNT(*) AS consultas,
        COUNT(DISTINCT chat_usuario) AS usuarios_unicos,
        COUNT(DISTINCT chat_session_id) AS sesiones,
        COALESCE(SUM(chat_tokens_usados), 0) AS tokens,
        COALESCE(AVG(chat_tokens_usados), 0) AS tokens_promedio
      FROM soporte_chat_historial
      WHERE chat_created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(chat_created_at, 'YYYY-MM')
      ORDER BY mes DESC
    `);

    // 3. Top usuarios por uso
    const { rows: topUsuarios } = await pool.query(`
      SELECT
        chat_usuario AS usuario,
        COUNT(*) AS consultas,
        COUNT(DISTINCT chat_session_id) AS sesiones,
        COALESCE(SUM(chat_tokens_usados), 0) AS tokens,
        MAX(chat_created_at) AS ultima_consulta
      FROM soporte_chat_historial
      GROUP BY chat_usuario
      ORDER BY consultas DESC
      LIMIT 20
    `);

    // 4. Uso por día de la semana
    const { rows: usoPorDia } = await pool.query(`
      SELECT
        EXTRACT(DOW FROM chat_created_at) AS dia_num,
        TO_CHAR(chat_created_at, 'Day') AS dia_nombre,
        COUNT(*) AS consultas,
        COALESCE(SUM(chat_tokens_usados), 0) AS tokens
      FROM soporte_chat_historial
      GROUP BY EXTRACT(DOW FROM chat_created_at), TO_CHAR(chat_created_at, 'Day')
      ORDER BY dia_num
    `);

    // 5. Uso por hora del día
    const { rows: usoPorHora } = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM chat_created_at) AS hora,
        COUNT(*) AS consultas
      FROM soporte_chat_historial
      GROUP BY EXTRACT(HOUR FROM chat_created_at)
      ORDER BY hora
    `);

    // 6. Artículos más referenciados
    const { rows: articulosMasUsados } = await pool.query(`
      SELECT
        unnest(chat_articulos_usados) AS articulo_id,
        COUNT(*) AS veces_usado
      FROM soporte_chat_historial
      WHERE chat_articulos_usados IS NOT NULL AND array_length(chat_articulos_usados, 1) > 0
      GROUP BY unnest(chat_articulos_usados)
      ORDER BY veces_usado DESC
      LIMIT 10
    `);

    // 7. Stats de memorias del agente
    const { rows: [memStats] } = await pool.query(`
      SELECT
        COUNT(*) AS total_memorias,
        COUNT(*) FILTER (WHERE mem_activo = true) AS memorias_activas,
        COALESCE(SUM(mem_veces_usado), 0) AS total_usos_memoria,
        MAX(mem_fecha_ultimo_uso) AS ultimo_uso_memoria
      FROM agente_memorias
    `);

    // 8. Top memorias más usadas
    const { rows: topMemorias } = await pool.query(`
      SELECT mem_id, mem_titulo, mem_categoria, mem_modulo, mem_veces_usado, mem_fecha_ultimo_uso
      FROM agente_memorias
      WHERE mem_activo = true
      ORDER BY mem_veces_usado DESC
      LIMIT 10
    `);

    // 9. Consultas de los últimos 30 días (para gráfico diario)
    const { rows: usoDiario } = await pool.query(`
      SELECT
        TO_CHAR(chat_created_at, 'YYYY-MM-DD') AS fecha,
        COUNT(*) AS consultas,
        COALESCE(SUM(chat_tokens_usados), 0) AS tokens
      FROM soporte_chat_historial
      WHERE chat_created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(chat_created_at, 'YYYY-MM-DD')
      ORDER BY fecha
    `);

    const {
      costoInput: COSTO_INPUT,
      costoOutput: COSTO_OUTPUT,
      pctInput: PCT_INPUT,
      pctOutput: PCT_OUTPUT,
    } = getPricingConfig();

    const totalTokens = parseInt(resumen.total_tokens) || 0;
    const costoGeneral = calcularCostoDesdeTokens(totalTokens);

    const costosMensuales = usoMensual.map((m) => {
      const c = calcularCostoDesdeTokens(m.tokens);
      return { ...m, costo_estimado: c.costoTotalUsd.toFixed(4) };
    });

    const topUsuariosConCosto = topUsuarios.map((u) => {
      const c = calcularCostoDesdeTokens(u.tokens);
      return {
        ...u,
        costo_estimado_usd: c.costoTotalUsd.toFixed(4),
      };
    });

    const { rows: [consumoMesActualRow] } = await pool.query(
      `SELECT
         COALESCE(SUM(chat_tokens_usados), 0)::bigint AS tokens_mes_actual
       FROM soporte_chat_historial
       WHERE date_trunc('month', chat_created_at) = date_trunc('month', NOW())`
    );
    const consumoMesActual = calcularCostoDesdeTokens(consumoMesActualRow?.tokens_mes_actual || 0);

    const iaConfig = await getIaConfig();
    const iaProviderConfig = await getIaProviderConfig();
    const iaUserLimits = await getIaUserLimits();

    res.json({
      ok: true,
      data: {
        resumen: {
          ...resumen,
          total_tokens: totalTokens,
          tokens_input_estimado: costoGeneral.tokensInput,
          tokens_output_estimado: costoGeneral.tokensOutput,
          costo_input_usd: costoGeneral.costoInputUsd.toFixed(4),
          costo_output_usd: costoGeneral.costoOutputUsd.toFixed(4),
          costo_total_usd: costoGeneral.costoTotalUsd.toFixed(4),
        },
        pricing: {
          costo_input_por_millon: COSTO_INPUT,
          costo_output_por_millon: COSTO_OUTPUT,
          pct_input: PCT_INPUT,
          pct_output: PCT_OUTPUT,
        },
        uso_mensual: costosMensuales,
        uso_diario: usoDiario,
        top_usuarios: topUsuariosConCosto,
        uso_por_dia: usoPorDia,
        uso_por_hora: usoPorHora,
        articulos_mas_usados: articulosMasUsados,
        memorias: {
          stats: memStats,
          top: topMemorias,
        },
        limites_ia: {
          config: iaConfig,
          proveedor: iaProviderConfig,
          usuarios: iaUserLimits,
          consumo_mes_actual: {
            tokens: consumoMesActual.totalTokens,
            costo_usd: consumoMesActual.costoTotalUsd.toFixed(4),
          },
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo stats IA:", error);
    res.status(500).json({ ok: false, msg: "Error obteniendo estadísticas de IA" });
  }
};

const parseNullableUsd = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Number(n.toFixed(2));
};

const obtenerLimitesIA = async (req, res) => {
  try {
    const config = await getIaConfig();
    const providerConfig = await getIaProviderConfig();
    const limitsByUser = await getIaUserLimits();

    const { rows: consumoUsuariosMes } = await pool.query(
      `SELECT
         chat_usuario AS usuario,
         COALESCE(SUM(chat_tokens_usados), 0)::bigint AS tokens
       FROM soporte_chat_historial
       WHERE date_trunc('month', chat_created_at) = date_trunc('month', NOW())
       GROUP BY chat_usuario
       ORDER BY tokens DESC`
    );

    const consumoUsuariosCosto = consumoUsuariosMes.map((u) => {
      const c = calcularCostoDesdeTokens(u.tokens);
      return {
        usuario: u.usuario,
        tokens: c.totalTokens,
        costo_usd: c.costoTotalUsd.toFixed(4),
      };
    });

    res.json({
      ok: true,
      data: {
        config,
        proveedor: providerConfig,
        usuarios_limites: limitsByUser,
        consumo_usuarios_mes: consumoUsuariosCosto,
      },
    });
  } catch (error) {
    console.error("Error obteniendo límites IA:", error);
    res.status(500).json({ ok: false, msg: "Error obteniendo límites IA" });
  }
};

const obtenerProveedorIA = async (req, res) => {
  try {
    const providerConfig = await getIaProviderConfig();
    res.json({ ok: true, data: providerConfig });
  } catch (error) {
    console.error("Error obteniendo proveedor IA:", error);
    res.status(500).json({ ok: false, msg: "Error obteniendo configuración del proveedor IA" });
  }
};

const actualizarProveedorIA = async (req, res) => {
  try {
    const {
      provider,
      geminiApiKey,
      deepseekApiKey,
      clearGeminiApiKey = false,
      clearDeepseekApiKey = false,
    } = req.body || {};

    if (provider !== undefined && !["gemini", "deepseek"].includes(String(provider).toLowerCase())) {
      return res.status(400).json({ ok: false, msg: "provider debe ser 'gemini' o 'deepseek'" });
    }

    if (geminiApiKey !== undefined && typeof geminiApiKey !== "string") {
      return res.status(400).json({ ok: false, msg: "geminiApiKey debe ser texto" });
    }
    if (deepseekApiKey !== undefined && typeof deepseekApiKey !== "string") {
      return res.status(400).json({ ok: false, msg: "deepseekApiKey debe ser texto" });
    }

    const data = await updateIaProviderConfig({
      provider: provider ? String(provider).toLowerCase() : undefined,
      geminiApiKey,
      deepseekApiKey,
      clearGeminiApiKey: clearGeminiApiKey === true,
      clearDeepseekApiKey: clearDeepseekApiKey === true,
      updatedBy: req.usuario?.email || "admin",
    });

    res.json({ ok: true, data });
  } catch (error) {
    console.error("Error actualizando proveedor IA:", error);
    res.status(500).json({ ok: false, msg: error.message || "Error actualizando configuración del proveedor IA" });
  }
};

const actualizarLimitesIA = async (req, res) => {
  try {
    const { limiteGlobalUsd, limiteUsuarioDefaultUsd, bloquearAlSuperar } = req.body || {};
    const globalParsed = parseNullableUsd(limiteGlobalUsd);
    const userDefaultParsed = parseNullableUsd(limiteUsuarioDefaultUsd);
    const bloquear = bloquearAlSuperar !== false;

    if (limiteGlobalUsd !== null && limiteGlobalUsd !== undefined && limiteGlobalUsd !== "" && globalParsed === null) {
      return res.status(400).json({ ok: false, msg: "limiteGlobalUsd debe ser numérico >= 0 o null" });
    }
    if (limiteUsuarioDefaultUsd !== null && limiteUsuarioDefaultUsd !== undefined && limiteUsuarioDefaultUsd !== "" && userDefaultParsed === null) {
      return res.status(400).json({ ok: false, msg: "limiteUsuarioDefaultUsd debe ser numérico >= 0 o null" });
    }

    const updated = await updateIaConfig({
      limiteGlobalUsd: globalParsed,
      limiteUsuarioDefaultUsd: userDefaultParsed,
      bloquearAlSuperar: bloquear,
      updatedBy: req.usuario?.email || "admin",
    });

    res.json({ ok: true, config: updated });
  } catch (error) {
    console.error("Error actualizando límites IA:", error);
    res.status(500).json({ ok: false, msg: "Error actualizando límites IA" });
  }
};

const actualizarLimiteIAUsuario = async (req, res) => {
  try {
    const { usuario, limiteUsd, activo = true } = req.body || {};
    const usuarioNorm = String(usuario || "").trim().toLowerCase();
    const limiteParsed = parseNullableUsd(limiteUsd);

    if (!usuarioNorm) {
      return res.status(400).json({ ok: false, msg: "usuario es requerido" });
    }
    if (limiteParsed === null) {
      return res.status(400).json({ ok: false, msg: "limiteUsd debe ser numérico >= 0" });
    }

    const row = await upsertIaUserLimit({
      usuario: usuarioNorm,
      limiteUsd: limiteParsed,
      activo: activo !== false,
      updatedBy: req.usuario?.email || "admin",
    });

    res.json({ ok: true, limite_usuario: row });
  } catch (error) {
    console.error("Error actualizando límite IA por usuario:", error);
    res.status(500).json({ ok: false, msg: "Error actualizando límite por usuario" });
  }
};

const desactivarLimiteIAUsuario = async (req, res) => {
  try {
    const usuario = decodeURIComponent(req.params.usuario || "").trim().toLowerCase();
    if (!usuario) {
      return res.status(400).json({ ok: false, msg: "usuario es requerido" });
    }

    const row = await disableIaUserLimit({
      usuario,
      updatedBy: req.usuario?.email || "admin",
    });

    if (!row) {
      return res.status(404).json({ ok: false, msg: "No existe límite configurado para ese usuario" });
    }

    res.json({ ok: true, limite_usuario: row });
  } catch (error) {
    console.error("Error desactivando límite IA por usuario:", error);
    res.status(500).json({ ok: false, msg: "Error desactivando límite por usuario" });
  }
};

/**
 * GET /api/stats/ia/chats
 * Lista chats con desglose de costo por consulta, paginado y filtrable
 * Query params: limit, offset, usuario, modelo, complejidad
 */
const obtenerChatsConCosto = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const usuario = (req.query.usuario || "").trim().toLowerCase();
    const modelo = (req.query.modelo || "").trim();
    const complejidad = (req.query.complejidad || "").trim();

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (usuario) {
      conditions.push(`chat_usuario ILIKE $${paramIdx}`);
      params.push(`%${usuario}%`);
      paramIdx++;
    }
    if (modelo) {
      conditions.push(`chat_modelo = $${paramIdx}`);
      params.push(modelo);
      paramIdx++;
    }
    if (complejidad) {
      conditions.push(`chat_complejidad = $${paramIdx}`);
      params.push(complejidad);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [countResult, chatsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM soporte_chat_historial ${whereClause}`, params),
      pool.query(
        `SELECT
           chat_id, chat_session_id, chat_usuario, chat_pregunta, chat_respuesta,
           chat_tokens_usados, chat_tokens_input, chat_tokens_output,
           chat_costo_usd, chat_modelo, chat_complejidad, chat_created_at
         FROM soporte_chat_historial
         ${whereClause}
         ORDER BY chat_created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total, 10) || 0;

    // Resumen de costos para los filtros aplicados
    const resumenResult = await pool.query(
      `SELECT
         COUNT(*) AS total_chats,
         COALESCE(SUM(chat_tokens_usados), 0) AS total_tokens,
         COALESCE(SUM(chat_tokens_input), 0) AS total_tokens_input,
         COALESCE(SUM(chat_tokens_output), 0) AS total_tokens_output,
         COALESCE(SUM(chat_costo_usd), 0) AS total_costo_usd,
         COALESCE(AVG(chat_costo_usd), 0) AS promedio_costo_usd
       FROM soporte_chat_historial
       ${whereClause}`,
      params
    );

    res.json({
      ok: true,
      data: {
        chats: chatsResult.rows.map((c) => ({
          ...c,
          chat_pregunta: (c.chat_pregunta || "").substring(0, 200),
          chat_respuesta: (c.chat_respuesta || "").substring(0, 200),
          chat_costo_usd: parseFloat(c.chat_costo_usd) || 0,
        })),
        resumen: {
          total_chats: parseInt(resumenResult.rows[0]?.total_chats, 10) || 0,
          total_tokens: parseInt(resumenResult.rows[0]?.total_tokens, 10) || 0,
          total_tokens_input: parseInt(resumenResult.rows[0]?.total_tokens_input, 10) || 0,
          total_tokens_output: parseInt(resumenResult.rows[0]?.total_tokens_output, 10) || 0,
          total_costo_usd: parseFloat(resumenResult.rows[0]?.total_costo_usd) || 0,
          promedio_costo_usd: parseFloat(resumenResult.rows[0]?.promedio_costo_usd) || 0,
        },
        pagination: { total, limit, offset },
      },
    });
  } catch (error) {
    console.error("Error obteniendo chats con costo:", error);
    res.status(500).json({ ok: false, msg: "Error obteniendo historial de costos" });
  }
};

const obtenerStatsKB = async (req, res) => {
  try {
    const [
      resumenRow, porCategoriaRows, porTipoRows,
      populares, masUtiles, menosUtiles,
      busquedasPop, busquedasSin,
    ] = await Promise.all([
      pool.query(`SELECT
        COUNT(*)::int AS total_articulos,
        COALESCE(SUM(art_vistas), 0)::int AS total_vistas,
        COALESCE(SUM(art_util_si), 0)::int AS total_votos_si,
        COALESCE(SUM(art_util_no), 0)::int AS total_votos_no
        FROM soporte_articulos WHERE art_activo = true`),
      pool.query(`SELECT c.cat_nombre, COUNT(a.art_id)::int AS total
        FROM soporte_categorias c
        LEFT JOIN soporte_articulos a ON a.art_categoria_id = c.cat_id AND a.art_activo = true
        WHERE c.cat_activo = true
        GROUP BY c.cat_id, c.cat_nombre ORDER BY total DESC`),
      pool.query(`SELECT art_tipo, COUNT(*)::int AS total
        FROM soporte_articulos WHERE art_activo = true
        GROUP BY art_tipo ORDER BY total DESC`),
      obtenerArticulosPopulares(10),
      obtenerArticulosMasUtiles(10),
      obtenerArticulosMenosUtiles(10),
      obtenerBusquedasPopulares(20),
      obtenerBusquedasSinResultados(20),
    ]);

    const totalCategorias = porCategoriaRows.rows.length;

    res.json({
      ok: true,
      resumen: { ...resumenRow.rows[0], total_categorias: totalCategorias },
      articulos_populares: populares,
      articulos_utiles: masUtiles,
      articulos_menos_utiles: menosUtiles,
      busquedas_populares: busquedasPop,
      busquedas_sin_resultados: busquedasSin,
      articulos_por_categoria: porCategoriaRows.rows,
      articulos_por_tipo: porTipoRows.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al obtener estadísticas de KB" });
  }
};

module.exports = {
  obtenerStatsIA,
  obtenerLimitesIA,
  obtenerProveedorIA,
  actualizarLimitesIA,
  actualizarProveedorIA,
  actualizarLimiteIAUsuario,
  desactivarLimiteIAUsuario,
  obtenerChatsConCosto,
  obtenerStatsKB,
};
