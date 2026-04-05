const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getSystemPrompt } = require("../helpers/agente_prompt");
const {
  buscarArticulos,
  buscarArticulosLike,
  buscarArticulosPorTags,
  obtenerArticuloPorId,
  obtenerArticuloPorSlug,
  obtenerArticulos,
} = require("../database/repositories/articulo_repo");
const {
  guardarChatHistorial,
  obtenerSesionesChatUsuario,
  obtenerMensajesChatSesion,
  buscarEnHistorialChatsUsuario,
  buscarChatsResueltos,
} = require("../database/repositories/usuario_repo");
const { buscarErrorPorMensaje, buscarErroresPorModulo } = require("../database/repositories/error_repo");
const { buscarMemorias, obtenerMemoriasTop, guardarMemoria, registrarUsoMemoria } = require("../database/repositories/memoria_repo");
const { getIaConfig, getIaUserLimit, getIaRuntimeConfig } = require("../database/repositories/ia_config_repo");
const { calcularCostoDesdeTokens, calcularCostoReal, estimarCostoConsulta } = require("../helpers/ia_costos");

const pool = require("../database/db");

// ─── Configuración de límites (optimización de tokens) ──────────────────────
const QUERY_TIMEOUT_MS = parseInt(process.env.IA_QUERY_TIMEOUT_MS || "8000", 10); // 8 segundos máximo por query SQL
const MAX_ROWS = 50; // Máximo 50 filas por query
const MAX_TOOL_RESULT_CHARS = 4000; // Truncar resultados de tools grandes
const MAX_ITERACIONES_AGENTE = parseInt(process.env.IA_MAX_ITERACIONES || "4", 10); // Máximo 4 ciclos tool-calling
const MAX_AGENT_TIME_MS = parseInt(process.env.IA_MAX_AGENT_TIME_MS || "45000", 10); // Máximo 45s por request
const KB_FAST_PATH_ENABLED = process.env.IA_KB_FAST_PATH_ENABLED !== "false";
const KB_FAST_PATH_MAX_RESULTS = parseInt(process.env.IA_KB_FAST_PATH_MAX_RESULTS || "4", 10);
const KB_FAST_PATH_MIN_RELEVANCE = parseFloat(process.env.IA_KB_FAST_PATH_MIN_RELEVANCE || "0.08");
const MAX_OUTPUT_TOKENS_SOPORTE = parseInt(process.env.IA_MAX_OUTPUT_TOKENS_SOPORTE || "220", 10);
const MAX_OUTPUT_TOKENS_TECNICO = parseInt(process.env.IA_MAX_OUTPUT_TOKENS_TECNICO || "380", 10);
const MAX_OUTPUT_TOKENS_ADMIN = parseInt(process.env.IA_MAX_OUTPUT_TOKENS_ADMIN || "420", 10);
const HISTORY_MESSAGES_SOPORTE = parseInt(process.env.IA_HISTORY_MESSAGES_SOPORTE || "2", 10);
const HISTORY_MESSAGES_TECNICO = parseInt(process.env.IA_HISTORY_MESSAGES_TECNICO || "5", 10);
const HISTORY_MESSAGES_ADMIN = parseInt(process.env.IA_HISTORY_MESSAGES_ADMIN || "5", 10);
const HISTORY_CHARS_SOPORTE = parseInt(process.env.IA_HISTORY_CHARS_SOPORTE || "260", 10);
const HISTORY_CHARS_TECNICO = parseInt(process.env.IA_HISTORY_CHARS_TECNICO || "750", 10);
const HISTORY_CHARS_ADMIN = parseInt(process.env.IA_HISTORY_CHARS_ADMIN || "900", 10);
const MIN_FINAL_RESPONSE_CHARS = parseInt(process.env.IA_MIN_FINAL_RESPONSE_CHARS || "80", 10);

// Modelos (3 niveles: Lite para FAQ, Flash para normal, Pro para complejo)
const MODEL_LITE = process.env.GEMINI_MODEL_LITE || "gemini-2.5-flash-lite";
const MODEL_FLASH = process.env.GEMINI_MODEL_FLASH || "gemini-2.5-flash";
const MODEL_PRO = process.env.GEMINI_MODEL_PRO || "gemini-2.5-pro";
const MODEL_DEEPSEEK = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
const IA_FORCE_FLASH = process.env.IA_FORCE_FLASH === "true";
const IA_PROVIDER_RUNTIME_TTL_MS = parseInt(process.env.IA_PROVIDER_RUNTIME_TTL_MS || "30000", 10);

// Fallback chain: Lite → Flash → Pro (si 503/429/overloaded)
const FALLBACK_MODEL_MAP = {
  [MODEL_LITE]: MODEL_FLASH,
  [MODEL_FLASH]: MODEL_PRO,
};
const RETRY_DELAY_MS = 1500;

/**
 * Intenta generateContentStream con retry + fallback automático a modelo superior.
 * Retorna { result, modeloUsado } donde modeloUsado puede diferir del original si hubo fallback.
 */
async function streamConFallback(genAI, modeloOriginal, modelConfig, streamArgs, onFallback) {
  const intentos = [
    { modelo: modeloOriginal, delay: 0 },
    { modelo: modeloOriginal, delay: RETRY_DELAY_MS }, // retry mismo modelo
  ];
  const fallbackModelo = FALLBACK_MODEL_MAP[modeloOriginal];
  if (fallbackModelo) {
    intentos.push({ modelo: fallbackModelo, delay: 0 }); // escalar a modelo superior
  }

  for (let i = 0; i < intentos.length; i++) {
    const { modelo, delay } = intentos[i];
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    try {
      const m = genAI.getGenerativeModel({ ...modelConfig, model: modelo });
      const result = await m.generateContentStream(streamArgs);
      if (modelo !== modeloOriginal && onFallback) {
        onFallback(modelo);
      }
      return { result, modeloUsado: modelo };
    } catch (err) {
      const esRecuperable = err.status === 503 || err.status === 429;
      if (esRecuperable && i < intentos.length - 1) {
        console.warn(`[FALLBACK] ${modelo} retornó ${err.status}, intento ${i + 1}/${intentos.length}...`);
        continue;
      }
      throw err; // no más intentos, propagar error
    }
  }
}

let iaRuntimeCache = {
  ts: 0,
  data: null,
};

// Rate limit básico en memoria por usuario
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.IA_RATE_LIMIT_WINDOW_MS || "60000", 10);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.IA_RATE_LIMIT_MAX_REQUESTS || "6", 10);
const rateLimitByUser = new Map();

// Cache breve en memoria para respuestas repetidas (TTL variable por complejidad)
const CHAT_CACHE_TTL_SIMPLE = 600000;   // 10 min para simple
const CHAT_CACHE_TTL_NORMAL = 300000;   // 5 min para normal
const CHAT_CACHE_TTL_DEFAULT = 120000;  // 2 min para compleja
const CHAT_CACHE_MAX_ENTRIES = parseInt(process.env.IA_CACHE_MAX_ENTRIES || "200", 10);
const chatResponseCache = new Map();
const sessionPreferenceMap = new Map();

// ─── Ejecución segura de queries read-only ──────────────────────────────────

const limpiarIdentificador = (valor = "") =>
  String(valor || "")
    .replace(/["'`;]/g, "")
    .trim();

const parseTablaSchema = (entrada = "") => {
  const limpio = limpiarIdentificador(entrada);
  if (!limpio) return { schema: null, tabla: null };
  if (!limpio.includes(".")) return { schema: null, tabla: limpio.toLowerCase() };

  const partes = limpio.split(".");
  if (partes.length < 2) return { schema: null, tabla: limpio.toLowerCase() };
  const tabla = partes.pop();
  const schema = partes.pop();
  return {
    schema: schema ? schema.toLowerCase() : null,
    tabla: tabla ? tabla.toLowerCase() : null,
  };
};

const extraerTablasDesdeSQL = (sql = "") => {
  const texto = String(sql || "")
    .replace(/--.*$/gm, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  const regex = /\b(?:FROM|JOIN)\s+([a-zA-Z0-9_."$]+)/gi;
  const tablas = new Set();
  let match = regex.exec(texto);
  while (match) {
    const ref = limpiarIdentificador(match[1] || "");
    if (ref) tablas.add(ref.toLowerCase());
    match = regex.exec(texto);
  }
  return Array.from(tablas);
};

const levenshtein = (a = "", b = "") => {
  const s = String(a || "");
  const t = String(b || "");
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const prev = new Array(t.length + 1);
  const curr = new Array(t.length + 1);
  for (let j = 0; j <= t.length; j++) prev[j] = j;

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const costo = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + costo
      );
    }
    for (let j = 0; j <= t.length; j++) prev[j] = curr[j];
  }
  return prev[t.length];
};

const obtenerEstructuraTablaClient = async (clientDb, tablaEntrada, schemaPreferido = null) => {
  const parsed = parseTablaSchema(tablaEntrada);
  const tabla = parsed.tabla;
  const schema = schemaPreferido ? String(schemaPreferido).toLowerCase() : parsed.schema;

  if (!tabla) {
    return { encontrada: false, error: "Debes indicar una tabla válida." };
  }

  const params = [tabla];
  let sqlTablas = `
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      AND lower(table_name) = lower($1)
  `;
  if (schema) {
    params.push(schema);
    sqlTablas += " AND lower(table_schema) = lower($2) ";
  }
  sqlTablas += " ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END LIMIT 5";

  const { rows: tablas } = await clientDb.query(sqlTablas, params);
  if (!tablas.length) {
    return {
      encontrada: false,
      tabla: tablaEntrada,
      sugerencia: "La tabla no existe en los esquemas visibles.",
    };
  }

  const principal = tablas[0];
  const { rows: columnasRows } = await clientDb.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [principal.table_schema, principal.table_name]
  );

  const columnas = columnasRows.map((c) => c.column_name);
  return {
    encontrada: true,
    tabla: `${principal.table_schema}.${principal.table_name}`,
    schema: principal.table_schema,
    table: principal.table_name,
    total_columnas: columnas.length,
    columnas: columnas.slice(0, 80),
    otras_coincidencias: tablas.slice(1).map((t) => `${t.table_schema}.${t.table_name}`),
  };
};

const buscarTablasSimilaresClient = async (clientDb, termino = "") => {
  const base = limpiarIdentificador(termino).toLowerCase();
  if (!base) return [];
  const like = `%${base.replace(/[_%]/g, "\\$&")}%`;
  const { rows } = await clientDb.query(
    `SELECT table_schema, table_name
     FROM information_schema.tables
     WHERE table_type = 'BASE TABLE'
       AND table_schema NOT IN ('pg_catalog', 'information_schema')
       AND lower(table_name) LIKE lower($1) ESCAPE '\\'
     ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END, table_name
     LIMIT 12`,
    [like]
  );
  return rows.map((r) => `${r.table_schema}.${r.table_name}`);
};

const extraerIdentificadorError = (mensaje = "") => {
  const match = String(mensaje || "").match(/"([^"]+)"/);
  return match?.[1] || null;
};

const buildSchemaDiagnostic = async ({ clientDb, sql, error }) => {
  const codigo = error?.code;
  if (!["42703", "42P01"].includes(codigo)) return null;

  const mensaje = String(error?.message || "");
  const identificadorError = extraerIdentificadorError(mensaje);
  const tablasDesdeSql = extraerTablasDesdeSQL(sql);
  const tablasObjetivo = new Set(tablasDesdeSql);
  if (codigo === "42P01" && identificadorError) tablasObjetivo.add(identificadorError);

  const estructuras = [];
  for (const tablaRef of tablasObjetivo) {
    try {
      const estructura = await obtenerEstructuraTablaClient(clientDb, tablaRef);
      estructuras.push({
        tabla_consultada: tablaRef,
        ...estructura,
      });
    } catch (e) {
      estructuras.push({
        tabla_consultada: tablaRef,
        encontrada: false,
        error: e?.message || "No se pudo inspeccionar la tabla.",
      });
    }
  }

  let columnasSugeridas = [];
  if (codigo === "42703" && identificadorError) {
    const objetivo = identificadorError.toLowerCase();
    const candidatas = [];
    for (const e of estructuras) {
      if (!e?.encontrada || !Array.isArray(e.columnas)) continue;
      for (const c of e.columnas) {
        const col = String(c || "").toLowerCase();
        const dist = levenshtein(objetivo, col);
        const matchParcial = col.includes(objetivo) || objetivo.includes(col);
        const score = matchParcial ? -1 : dist;
        candidatas.push({ tabla: e.tabla, columna: c, score });
      }
    }
    candidatas.sort((a, b) => a.score - b.score);
    const dedup = new Set();
    columnasSugeridas = candidatas
      .filter((c) => {
        const key = `${c.tabla}:${c.columna}`;
        if (dedup.has(key)) return false;
        dedup.add(key);
        return true;
      })
      .slice(0, 8);
  }

  let tablasSimilares = [];
  if (codigo === "42P01" && identificadorError) {
    tablasSimilares = await buscarTablasSimilaresClient(clientDb, identificadorError);
  }

  return {
    codigo_error: codigo,
    identificador_error: identificadorError,
    tablas_detectadas_sql: tablasDesdeSql,
    estructuras: estructuras.slice(0, 3),
    columnas_sugeridas: columnasSugeridas.slice(0, 5),
    tablas_similares: tablasSimilares.slice(0, 6),
    recomendacion: codigo === "42703"
      ? "La columna no existe en la estructura actual. Ajusta el SQL con columnas reales."
      : "La tabla no existe (o cambió de esquema/nombre). Usa una tabla válida de la BD actual.",
  };
};

const obtenerEstructuraTablaDB = async ({ tabla, schema = null }) => {
  const clientDb = await pool.connect();
  try {
    const estructura = await obtenerEstructuraTablaClient(clientDb, tabla, schema);
    if (!estructura.encontrada) {
      const simil = await buscarTablasSimilaresClient(clientDb, tabla);
      return {
        ok: false,
        ...estructura,
        tablas_similares: simil,
      };
    }
    return {
      ok: true,
      ...estructura,
    };
  } finally {
    clientDb.release();
  }
};

/**
 * Valida que un query sea estrictamente de solo lectura (SELECT).
 * Rechaza cualquier instrucción que modifique datos o estructura.
 */
const validarQueryReadOnly = (sql) => {
  const sqlNormalizado = sql
    .replace(/--.*$/gm, "")     // Quitar comentarios de línea
    .replace(/\/\*[\s\S]*?\*\//g, "") // Quitar comentarios de bloque
    .replace(/\s+/g, " ")       // Normalizar espacios
    .trim()
    .toUpperCase();

  // Lista negra de operaciones peligrosas
  const operacionesProhibidas = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL",
    "COPY", "VACUUM", "REINDEX", "CLUSTER", "REFRESH",
    "SET ", "RESET ", "LOCK", "UNLISTEN", "NOTIFY", "LISTEN",
    "DO ", "BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT",
    "PREPARE", "DEALLOCATE", "DISCARD",
  ];

  for (const op of operacionesProhibidas) {
    const regex = new RegExp(`(^|[\\s;(])${op.trim()}([\\s;(]|$)`);
    if (regex.test(sqlNormalizado)) {
      return { valido: false, error: `Operación prohibida detectada: ${op.trim()}. Solo se permiten consultas SELECT.` };
    }
  }

  if (!sqlNormalizado.startsWith("SELECT") && !sqlNormalizado.startsWith("WITH")) {
    return { valido: false, error: "La consulta debe comenzar con SELECT o WITH. Solo se permiten consultas de lectura." };
  }

  const sinStrings = sqlNormalizado.replace(/'[^']*'/g, "''");
  if (sinStrings.includes(";") && sinStrings.indexOf(";") < sinStrings.length - 1) {
    return { valido: false, error: "No se permiten múltiples sentencias SQL. Envía una sola consulta SELECT." };
  }

  return { valido: true };
};

/**
 * Ejecuta un query SELECT de forma segura con timeout y límite de filas.
 */
const ejecutarQueryReadOnly = async (sql) => {
  const validacion = validarQueryReadOnly(sql);
  if (!validacion.valido) {
    return JSON.stringify({ error: validacion.error, ejecutado: false });
  }

  const sqlUpper = sql.replace(/\s+/g, " ").trim().toUpperCase();
  let queryFinal = sql.trim().replace(/;$/, "");
  if (!sqlUpper.includes("LIMIT")) {
    queryFinal += ` LIMIT ${MAX_ROWS}`;
  }

  const clientDb = await pool.connect();
  try {
    await clientDb.query(`SET statement_timeout = '${QUERY_TIMEOUT_MS}'`);
    await clientDb.query("SET default_transaction_read_only = ON");

    const resultado = await clientDb.query(queryFinal);

    return JSON.stringify({
      ejecutado: true,
      filas: resultado.rows.length,
      total_filas: resultado.rowCount,
      columnas: resultado.fields?.map((f) => f.name) || [],
      datos: resultado.rows,
      query_ejecutado: queryFinal,
      nota: resultado.rows.length >= MAX_ROWS
        ? `Se mostraron las primeras ${MAX_ROWS} filas. Ajusta tu query con WHERE o LIMIT para refinar.`
        : null,
    });
  } catch (error) {
    const mensajeError = error.message || "Error desconocido";
    if (mensajeError.includes("statement timeout")) {
      return JSON.stringify({
        error: `La consulta excedió el tiempo máximo de ${QUERY_TIMEOUT_MS / 1000} segundos. Intenta una consulta más específica con filtros WHERE.`,
        ejecutado: false,
      });
    }

    let diagnosticoSchema = null;
    try {
      diagnosticoSchema = await buildSchemaDiagnostic({
        clientDb,
        sql: queryFinal,
        error,
      });
    } catch (diagError) {
      console.error("Error generando diagnóstico de schema:", diagError.message);
    }

    return JSON.stringify({
      error: `Error al ejecutar la consulta: ${mensajeError}`,
      ejecutado: false,
      codigo_error: error.code || null,
      sugerencia: diagnosticoSchema
        ? "Usa el diagnóstico de esquema para corregir tabla/columnas y vuelve a ejecutar."
        : "Verifica la sintaxis SQL, nombres de tablas y columnas.",
      diagnostico_schema: diagnosticoSchema,
    });
  } finally {
    try {
      await clientDb.query("SET default_transaction_read_only = OFF");
      await clientDb.query("RESET statement_timeout");
    } catch (e) { /* ignorar */ }
    clientDb.release();
  }
};

// ─── Biblioteca de queries SQL diagnósticos por módulo ───────────────────────
const QUERIES_SQL = {
  formulario: {
    descripcion: "Queries para diagnosticar problemas con formularios",
    queries: [
      { nombre: "Buscar formulario por nombre (incluye inactivos)", sql: `SELECT frm_id, frm_nombre, frm_tipo, frm_activo FROM formulario WHERE UPPER(TRIM(frm_nombre)) = UPPER(TRIM('[NOMBRE_DEL_FORMULARIO]'));`, cuando: "Verificar si ya existe un formulario con ese nombre (incluyendo inactivos)" },
      { nombre: "Ver estructura completa de un formulario", sql: `SELECT f.frm_id, f.frm_nombre, f.frm_tipo, f.frm_activo, s.fsg_id, s.fsg_nombre, s.fsg_orden, s.fsg_activo, p.frp_id, p.frp_pregunta, p.frp_tipo, p.frp_orden, p.frp_activo, COUNT(d.fpd_id) AS num_opciones FROM formulario f LEFT JOIN formulario_segmento s ON f.frm_id = s.frm_id LEFT JOIN formulario_pregunta p ON f.frm_id = p.frm_id AND (s.fsg_id = p.fsg_id OR p.fsg_id IS NULL) LEFT JOIN formulario_pregunta_detalle d ON p.frp_id = d.frp_id WHERE f.frm_id = [ID_FORMULARIO] GROUP BY f.frm_id, f.frm_nombre, f.frm_tipo, f.frm_activo, s.fsg_id, s.fsg_nombre, s.fsg_orden, s.fsg_activo, p.frp_id, p.frp_pregunta, p.frp_tipo, p.frp_orden, p.frp_activo ORDER BY s.fsg_orden, p.frp_orden;`, cuando: "Ver toda la estructura del formulario: segmentos, preguntas y cantidad de opciones" },
      { nombre: "Verificar si formulario tiene actividades activas", sql: `SELECT acs_id, acs_nombre, acs_activo, acs_fecha FROM actividad_seguridad WHERE frm_id = [ID_FORMULARIO] AND acs_activo = true;`, cuando: "El sistema no permite desactivar el formulario porque tiene actividades activas vinculadas" },
      { nombre: "Contar respuestas registradas del formulario", sql: `SELECT COUNT(*) AS total_respuestas, COUNT(DISTINCT tar_id) AS tareas_con_respuesta FROM tarea_formulario_respuesta WHERE frm_id = [ID_FORMULARIO];`, cuando: "Saber cuántos usuarios ya respondieron tareas de este formulario" },
    ],
  },
  usuario: {
    descripcion: "Queries para diagnosticar problemas de usuarios",
    queries: [
      { nombre: "Buscar usuario por email", sql: `SELECT usu_id, usu_email, usu_nombre, usu_tipo, usu_activo, usu_fecha_ingreso FROM usuario WHERE LOWER(usu_email) = LOWER('[EMAIL_DEL_USUARIO]');`, cuando: "Verificar si el usuario existe y está activo" },
      { nombre: "Ver asignaciones completas del usuario", sql: `SELECT u.usu_id, u.usu_nombre, u.usu_email, u.usu_activo, e.emp_nombre, l.loc_nombre, a.are_nombre, ul.usl_activo FROM usuario u LEFT JOIN usuario_localidad ul ON u.usu_id = ul.usu_id AND ul.usl_activo = true LEFT JOIN localidad l ON ul.loc_id = l.loc_id LEFT JOIN area a ON ul.are_id = a.are_id LEFT JOIN empresa e ON ul.emp_id = e.emp_id WHERE u.usu_id = [ID_USUARIO];`, cuando: "Ver si el usuario tiene asignaciones correctas" },
      { nombre: "Buscar usuarios por nombre", sql: `SELECT usu_id, usu_email, usu_nombre, usu_tipo, usu_activo FROM usuario WHERE LOWER(usu_nombre) LIKE LOWER('%[NOMBRE_PARCIAL]%') ORDER BY usu_activo DESC, usu_nombre;`, cuando: "Buscar usuarios cuando no se sabe el email exacto" },
    ],
  },
  charla: {
    descripcion: "Queries para diagnosticar problemas con charlas",
    queries: [
      { nombre: "Buscar charla por nombre", sql: `SELECT cha_id, cha_nombre, cha_activo, cha_fecha_inicio, cha_fecha_fin, cha_rating FROM charla WHERE UPPER(TRIM(cha_nombre)) = UPPER(TRIM('[NOMBRE_CHARLA]')) OR LOWER(cha_nombre) LIKE LOWER('%[NOMBRE_PARCIAL]%');`, cuando: "Verificar si ya existe una charla con ese nombre" },
      { nombre: "Ver estado de asignación de una charla", sql: `SELECT u.usu_nombre, u.usu_email, chu.chu_fecha_respuesta, CASE WHEN chu.chu_fecha_respuesta IS NULL THEN 'PENDIENTE' ELSE 'COMPLETADA' END AS estado FROM charla_usuario chu JOIN usuario u ON chu.usu_id = u.usu_id WHERE chu.cha_id = [ID_CHARLA] AND chu.chu_activo = true ORDER BY estado, u.usu_nombre;`, cuando: "Ver quién completó la charla y quién no" },
    ],
  },
  tarea: {
    descripcion: "Queries para diagnosticar problemas con tareas",
    queries: [
      { nombre: "Ver tareas asignadas a un usuario", sql: `SELECT t.tar_id, t.tar_descripcion, t.tar_fecha, t.tar_activo, ta.tas_activo AS asignacion_activa, e.emp_nombre, l.loc_nombre, a.are_nombre FROM tarea t JOIN tarea_asignacion ta ON t.tar_id = ta.tar_id LEFT JOIN empresa e ON ta.emp_id = e.emp_id LEFT JOIN localidad l ON ta.loc_id = l.loc_id LEFT JOIN area a ON ta.are_id = a.are_id WHERE ta.usu_id = [ID_USUARIO] AND t.tar_activo = true AND ta.tas_activo = true ORDER BY t.tar_fecha DESC;`, cuando: "El usuario dice que no ve sus tareas asignadas" },
      { nombre: "Verificar respuesta de tarea", sql: `SELECT tfr.tar_id, u.usu_nombre, tfr.frp_id, p.frp_pregunta, tfr.tfr_respuesta, tfr.tfr_fecha FROM tarea_formulario_respuesta tfr JOIN usuario u ON tfr.usu_id = u.usu_id JOIN formulario_pregunta p ON tfr.frp_id = p.frp_id WHERE tfr.tar_id = [ID_TAREA] AND tfr.usu_id = [ID_USUARIO];`, cuando: "Verificar si el usuario ya respondió la tarea" },
    ],
  },
  incidencia: {
    descripcion: "Queries para diagnosticar problemas con incidencias",
    queries: [
      { nombre: "Ver incidencias recientes", sql: `SELECT inc_id, inc_numero, inc_fecha, inc_estado, inc_est_estado, inc_desc_observacion, inc_reincidencia FROM incidencia WHERE usu_id = [ID_USUARIO] ORDER BY inc_fecha DESC LIMIT 20;`, cuando: "Ver las últimas incidencias de un usuario" },
      { nombre: "Verificar gaps en numeración", sql: `SELECT usu_id, COUNT(*) AS total, MAX(inc_numero) AS max_numero, array_agg(inc_numero ORDER BY inc_numero) AS numeros FROM incidencia WHERE usu_id = [ID_USUARIO] GROUP BY usu_id;`, cuando: "Verificar si hay gaps en la numeración de incidencias" },
    ],
  },
  notificaciones: {
    descripcion: "Queries para diagnosticar problemas de notificaciones push",
    queries: [
      { nombre: "Verificar token Firebase", sql: `SELECT usu_id, usu_nombre, usu_email, usu_firebase_token, usu_fecha_token_update FROM usuario WHERE usu_id = [ID_USUARIO];`, cuando: "Verificar si el usuario tiene token Firebase registrado" },
    ],
  },
  actividad_seguridad: {
    descripcion: "Queries para diagnosticar problemas con actividades de seguridad",
    queries: [
      { nombre: "Ver actividades de un formulario", sql: `SELECT acs_id, acs_nombre, acs_activo, frm_id FROM actividad_seguridad WHERE frm_id = [ID_FORMULARIO] ORDER BY acs_activo DESC;`, cuando: "Ver qué actividades usan un formulario" },
      { nombre: "Ver actividades activas por empresa", sql: `SELECT acs_id, acs_nombre, acs_activo, emp_id, loc_id FROM actividad_seguridad WHERE emp_id = [ID_EMPRESA] AND acs_activo = true ORDER BY acs_nombre;`, cuando: "Listar las actividades activas de una empresa" },
    ],
  },
  inspeccion: {
    descripcion: "Queries para diagnosticar problemas con inspecciones",
    queries: [
      { nombre: "Ver inspecciones de un usuario", sql: `SELECT ins_id, ins_fecha, ins_activo, ins_calificacion, ins_tipo FROM inspeccion WHERE usu_id = [ID_USUARIO] ORDER BY ins_fecha DESC LIMIT 20;`, cuando: "Ver inspecciones recientes del usuario" },
      { nombre: "Ver detalle de inspección", sql: `SELECT i.ins_id, i.ins_fecha, i.ins_calificacion, fp.frp_pregunta, ir.inr_respuesta FROM inspeccion i JOIN inspeccion_respuesta ir ON ir.ins_id = i.ins_id JOIN formulario_pregunta fp ON fp.frp_id = ir.frp_id WHERE i.ins_id = [ID_INSPECCION] ORDER BY fp.frp_orden;`, cuando: "Ver qué respondió el usuario en una inspección" },
    ],
  },
  reporte: {
    descripcion: "Queries para diagnosticar problemas con reportes",
    queries: [
      { nombre: "Verificar datos para reporte", sql: `SELECT COUNT(*) AS total, MIN(inc_fecha) AS primera, MAX(inc_fecha) AS ultima FROM incidencia WHERE emp_id = [ID_EMPRESA] AND EXTRACT(YEAR FROM inc_fecha) = [ANIO] AND EXTRACT(MONTH FROM inc_fecha) = [MES];`, cuando: "El reporte sale vacío" },
      { nombre: "Verificar datos de ratings", sql: `SELECT COUNT(*) AS total_inspecciones, AVG(ins_calificacion) AS promedio FROM inspeccion WHERE loc_id = [ID_LOCALIDAD] AND ins_fecha BETWEEN '[FECHA_INICIO]' AND '[FECHA_FIN]';`, cuando: "El reporte de ratings muestra 0 o está vacío" },
    ],
  },
  ranking: {
    descripcion: "Queries para diagnosticar problemas con rankings",
    queries: [
      { nombre: "Ver ranking de un usuario", sql: `SELECT r.ran_id, r.ran_posicion, r.ran_puntos, r.ran_periodo, u.usu_nombre FROM ranking r JOIN usuario u ON u.usu_id = r.usu_id WHERE r.usu_id = [ID_USUARIO] ORDER BY r.ran_periodo DESC;`, cuando: "Ver la posición y puntos de un usuario" },
      { nombre: "Top 10 ranking por empresa", sql: `SELECT r.ran_posicion, u.usu_nombre, r.ran_puntos FROM ranking r JOIN usuario u ON u.usu_id = r.usu_id WHERE r.emp_id = [ID_EMPRESA] AND r.ran_periodo = '[PERIODO]' ORDER BY r.ran_posicion ASC LIMIT 10;`, cuando: "Ver el ranking general de una empresa" },
    ],
  },
  recompensa: {
    descripcion: "Queries para diagnosticar problemas con recompensas y kardex",
    queries: [
      { nombre: "Ver kardex de un usuario", sql: `SELECT k.kar_id, k.kar_puntos, k.kar_descripcion, k.kar_fecha, k.kar_tipo FROM kardex k WHERE k.usu_id = [ID_USUARIO] ORDER BY k.kar_fecha DESC LIMIT 20;`, cuando: "Ver historial de puntos del usuario" },
      { nombre: "Ver recompensas disponibles", sql: `SELECT rec_id, rec_nombre, rec_puntos, rec_activo, rec_stock FROM recompensa WHERE rec_activo = true AND emp_id = [ID_EMPRESA] ORDER BY rec_puntos;`, cuando: "Listar recompensas canjeables en una empresa" },
    ],
  },
  meta: {
    descripcion: "Queries para diagnosticar problemas con metas",
    queries: [
      { nombre: "Ver metas activas de una empresa", sql: `SELECT met_id, met_nombre, met_activo, met_valor_objetivo, met_fecha_inicio, met_fecha_fin FROM meta WHERE emp_id = [ID_EMPRESA] AND met_activo = true ORDER BY met_fecha_inicio DESC;`, cuando: "Listar las metas activas de una empresa" },
      { nombre: "Verificar actividades de una meta", sql: `SELECT ma.acs_id, a.acs_nombre, a.acs_activo FROM meta_actividad ma JOIN actividad_seguridad a ON a.acs_id = ma.acs_id WHERE ma.met_id = [ID_META];`, cuando: "Ver qué actividades están vinculadas a una meta" },
    ],
  },
  estructura: {
    descripcion: "Queries para diagnosticar problemas con empresa, región, localidad, área y cargos",
    queries: [
      { nombre: "Ver empresas", sql: `SELECT emp_id, emp_nombre, emp_activo FROM empresa ORDER BY emp_nombre;`, cuando: "Listar todas las empresas del sistema" },
      { nombre: "Ver regiones de una empresa", sql: `SELECT reg_id, reg_nombre, reg_activo FROM region WHERE emp_id = [ID_EMPRESA] ORDER BY reg_nombre;`, cuando: "Listar regiones de una empresa" },
      { nombre: "Estructura completa", sql: `SELECT e.emp_nombre, r.reg_nombre, l.loc_nombre, l.loc_activo FROM localidad l JOIN region r ON r.reg_id = l.reg_id JOIN empresa e ON e.emp_id = r.emp_id WHERE e.emp_id = [ID_EMPRESA] ORDER BY r.reg_nombre, l.loc_nombre;`, cuando: "Ver toda la estructura organizacional de una empresa" },
    ],
  },
  menu: {
    descripcion: "Queries para diagnosticar problemas con menús y permisos",
    queries: [
      { nombre: "Ver menús por tipo de usuario", sql: `SELECT m.men_id, m.men_nombre, m.men_ruta, m.men_activo FROM menu m JOIN menu_tipo_usuario mtu ON mtu.men_id = m.men_id WHERE mtu.tip_id = [TIPO_USUARIO_ID] AND m.men_activo = true ORDER BY m.men_orden;`, cuando: "El usuario no ve un módulo en el menú del panel" },
    ],
  },
};

// Devuelve queries SQL para un módulo específico
const obtenerQueriesSQL = (modulo, problema) => {
  const moduloNorm = modulo.toLowerCase().replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i").replace(/[óòö]/g,"o").replace(/[úùü]/g,"u");

  const mapeo = {
    formulario: "formulario", formularios: "formulario", form: "formulario",
    usuario: "usuario", usuarios: "usuario", user: "usuario",
    charla: "charla", charlas: "charla", capacitacion: "charla", capacitaciones: "charla",
    tarea: "tarea", tareas: "tarea", task: "tarea",
    incidencia: "incidencia", incidencias: "incidencia", incidente: "incidencia",
    notificacion: "notificaciones", notificaciones: "notificaciones", push: "notificaciones",
    actividad: "actividad_seguridad", actividades: "actividad_seguridad",
    inspeccion: "inspeccion", inspecciones: "inspeccion",
    reporte: "reporte", reportes: "reporte",
    ranking: "ranking", rankings: "ranking",
    recompensa: "recompensa", recompensas: "recompensa", kardex: "recompensa",
    meta: "meta", metas: "meta",
    estructura: "estructura", empresa: "estructura", region: "estructura", localidad: "estructura", area: "estructura", cargo: "estructura",
    menu: "menu", menus: "menu", permiso: "menu", permisos: "menu",
  };

  const moduloKey = mapeo[moduloNorm] || moduloNorm;
  const datos = QUERIES_SQL[moduloKey];

  if (!datos) {
    const disponibles = Object.keys(QUERIES_SQL).join(", ");
    return JSON.stringify({
      error: `No hay queries para el módulo "${modulo}". Módulos disponibles: ${disponibles}`,
      modulos_disponibles: Object.keys(QUERIES_SQL),
    });
  }

  let queries = datos.queries;
  if (problema) {
    const probNorm = problema.toLowerCase();
    const filtrados = queries.filter(q =>
      q.cuando.toLowerCase().includes(probNorm) ||
      q.nombre.toLowerCase().includes(probNorm)
    );
    if (filtrados.length > 0) queries = filtrados;
  }

  return JSON.stringify({
    modulo: moduloKey,
    descripcion: datos.descripcion,
    nota: "Reemplaza los valores entre corchetes [VALOR] con los datos reales. Son queries de solo lectura (SELECT).",
    queries: queries,
    total: queries.length,
  });
};

// ─── Definición de tools (formato interno, se convierten a Gemini format) ────
const TOOLS = [
  {
    name: "buscar_articulos",
    description: "Busca artículos en la base de conocimiento de ARCA por texto libre. Úsala cuando el usuario pregunta algo y necesitas encontrar guías o FAQs relevantes.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "El texto de búsqueda. Ej: 'usuario no puede iniciar sesion', 'crear incidencia'" },
        limite: { type: "number", description: "Número máximo de resultados a retornar (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "obtener_articulo",
    description: "Obtiene el contenido completo de un artículo de la base de conocimiento por su ID.",
    parameters: {
      type: "object",
      properties: {
        articulo_id: { type: "number", description: "El ID numérico del artículo a obtener" },
      },
      required: ["articulo_id"],
    },
  },
  {
    name: "buscar_por_categoria",
    description: "Lista artículos de una categoría específica del sistema ARCA.",
    parameters: {
      type: "object",
      properties: {
        categoria_id: { type: "number", description: "ID de la categoría. 1=Usuarios, 2=App General, 3=App Actividades, 4=App Incidencias, 5=App Inspecciones, 6=App Charlas, 7=Panel Usuarios, 8=Panel Incidencias, 9=Panel Inspecciones, 10=Panel Charlas, 11=Panel Tareas, 12=Panel Reportes, 13=Estructura Org, 14=Rankings, 15=Notificaciones, 16=Diagnósticos Técnicos" },
        tipo: { type: "string", description: "Filtrar por tipo: 'faq', 'guia', 'tecnico', 'diagnostico'", enum: ["faq", "guia", "tecnico", "diagnostico"] },
      },
      required: ["categoria_id"],
    },
  },
  {
    name: "buscar_diagnostico",
    description: "Busca guías de diagnóstico paso a paso para problemas específicos.",
    parameters: {
      type: "object",
      properties: {
        sintoma: { type: "string", description: "Descripción del problema o síntoma. Ej: 'no recibe notificaciones', 'app no carga'" },
      },
      required: ["sintoma"],
    },
  },
  {
    name: "buscar_historial_resuelto",
    description: "Busca casos ya resueltos en el historial de chats para reutilizar soluciones previas y responder con menos consultas.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texto del problema o error a buscar en conversaciones previas" },
        limite: { type: "number", description: "Cantidad máxima de casos (default 3, max 6)" },
      },
      required: ["query"],
    },
  },
  {
    name: "obtener_estructura_tabla",
    description: "Inspecciona la estructura REAL de una tabla en PostgreSQL (columnas, tipos y esquema). Úsala antes de ejecutar SQL cuando tengas duda de nombres de columnas/tablas o cuando recibas errores 42703/42P01.",
    parameters: {
      type: "object",
      properties: {
        tabla: { type: "string", description: "Nombre de tabla, opcionalmente con schema. Ej: usuario o public.usuario" },
        schema: { type: "string", description: "Schema opcional (si no se envía, se busca automáticamente)." },
      },
      required: ["tabla"],
    },
  },
  {
    name: "obtener_queries_sql",
    description: "Devuelve queries SQL SELECT de diagnóstico para un módulo del sistema ARCA. Úsala SOLO cuando el usuario es técnico y necesita queries para revisar datos en PostgreSQL.",
    parameters: {
      type: "object",
      properties: {
        modulo: { type: "string", description: "El módulo del sistema: formulario, usuario, charla, tarea, incidencia, notificaciones, actividad_seguridad, inspeccion, reporte, ranking, recompensa, meta, estructura, menu" },
        problema: { type: "string", description: "Descripción opcional del problema para filtrar queries relevantes" },
      },
      required: ["modulo"],
    },
  },
  {
    name: "buscar_error_exacto",
    description: "Busca un mensaje de error exacto del sistema ARCA. Úsala SIEMPRE que el usuario reporte un error con texto específico. Devuelve causa, solución técnica y no técnica, y query de diagnóstico.",
    parameters: {
      type: "object",
      properties: {
        mensaje_error: { type: "string", description: "El mensaje de error exacto o parcial que reporta el usuario" },
        modulo: { type: "string", description: "Opcional. Si no hay mensaje exacto, busca todos los errores del módulo" },
      },
      required: [],
    },
  },
  {
    name: "ejecutar_query",
    description: `Ejecuta una consulta SQL SELECT de solo lectura contra la base de datos PostgreSQL de ARCA. Usa esta tool para investigar datos reales, verificar duplicados, analizar estado de registros y diagnosticar problemas en vivo. SOLO SELECT/WITH. Máximo ${MAX_ROWS} filas. Timeout ${QUERY_TIMEOUT_MS / 1000}s. NUNCA ejecutes modificaciones, proponlas como scripts.`,
    parameters: {
      type: "object",
      properties: {
        sql: { type: "string", description: "La consulta SQL SELECT a ejecutar" },
        motivo: { type: "string", description: "Breve explicación de por qué ejecutas esta consulta" },
      },
      required: ["sql", "motivo"],
    },
  },
  {
    name: "buscar_memorias",
    description: "Busca en tu memoria de aprendizajes persistentes. Usa SIEMPRE esta tool al inicio de una conversación para recordar patrones, soluciones y diagnósticos que aprendiste antes. También úsala cuando te pregunten algo que podrías haber resuelto antes.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texto de búsqueda: problema, módulo, patrón o palabra clave" },
        modulo: { type: "string", description: "Filtrar por módulo: usuarios, formularios, charlas, tareas, incidencias, inspecciones, reportes, actividades, rankings, estructura, general" },
        categoria: { type: "string", description: "Filtrar por tipo de memoria: patron, solucion, error_comun, diagnostico, tip" },
      },
      required: ["query"],
    },
  },
  {
    name: "guardar_memoria",
    description: "Guarda un aprendizaje nuevo en tu memoria persistente. DEBES usar esta tool cuando: 1) Descubres la causa raíz de un problema que podría repetirse, 2) Encuentras un patrón de datos inusual, 3) Resuelves un caso complejo que podría servir de referencia, 4) El usuario te da información importante sobre cómo funciona el sistema. NO guardes cosas triviales o genéricas.",
    parameters: {
      type: "object",
      properties: {
        categoria: { type: "string", description: "Tipo de memoria: patron, solucion, error_comun, diagnostico, tip", enum: ["patron", "solucion", "error_comun", "diagnostico", "tip"] },
        titulo: { type: "string", description: "Título corto y descriptivo del aprendizaje (máx 100 chars)" },
        contenido: { type: "string", description: "Descripción detallada del aprendizaje: causa, solución, contexto, datos relevantes" },
        modulo: { type: "string", description: "Módulo relacionado: usuarios, formularios, charlas, tareas, incidencias, inspecciones, reportes, actividades, rankings, estructura, general" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Palabras clave para búsqueda futura (3-6 tags)",
        },
      },
      required: ["categoria", "titulo", "contenido"],
    },
  },
];

// ─── Convertir tools a formato Gemini functionDeclarations ───────────────────
const convertirToolsAGemini = (tools) => {
  if (!tools || tools.length === 0) return undefined;
  return [{
    functionDeclarations: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }];
};

// ─── Truncar resultados grandes de tools para ahorrar tokens ────────────────
const truncarResultado = (resultado) => {
  const json = typeof resultado === "string" ? resultado : JSON.stringify(resultado);
  if (json.length <= MAX_TOOL_RESULT_CHARS) return resultado;

  // Si es un objeto con datos/filas, truncar los datos
  if (resultado.datos && Array.isArray(resultado.datos)) {
    const maxFilas = Math.min(resultado.datos.length, 20);
    return {
      ...resultado,
      datos: resultado.datos.slice(0, maxFilas),
      _truncado: true,
      _nota: `Mostrando ${maxFilas} de ${resultado.datos.length} filas. Usa WHERE o LIMIT para refinar.`,
    };
  }

  // Si es un objeto con artículos/memorias, limitar
  if (resultado.articulos && Array.isArray(resultado.articulos)) {
    return { ...resultado, articulos: resultado.articulos.slice(0, 5) };
  }
  if (resultado.memorias && Array.isArray(resultado.memorias)) {
    return { ...resultado, memorias: resultado.memorias.slice(0, 5) };
  }
  if (resultado.casos && Array.isArray(resultado.casos)) {
    return { ...resultado, casos: resultado.casos.slice(0, 5) };
  }

  // Fallback: truncar como string
  if (json.length > MAX_TOOL_RESULT_CHARS) {
    return { _resumen: json.substring(0, MAX_TOOL_RESULT_CHARS), _truncado: true };
  }
  return resultado;
};

// ─── Ejecuta la tool solicitada ──────────────────────────────────────────────
const ejecutarTool = async (toolName, toolInput) => {
  try {
    if (toolName === "buscar_articulos") {
      const { query, limite = 5 } = toolInput;
      let articulos = await buscarArticulos(query, { limit: limite });
      if (articulos.length === 0) {
        articulos = await buscarArticulosLike(query, { limit: limite });
      }
      if (articulos.length === 0) {
        return { encontrados: 0, mensaje: "No se encontraron artículos para esa búsqueda.", articulos: [] };
      }
      return {
        encontrados: articulos.length,
        articulos: articulos.map((a) => ({
          id: a.art_id, titulo: a.art_titulo, slug: a.art_slug,
          resumen: a.art_resumen || "", tipo: a.art_tipo, categoria: a.cat_nombre,
        })),
      };
    }

    if (toolName === "obtener_articulo") {
      const { articulo_id } = toolInput;
      const articulo = await obtenerArticuloPorId(articulo_id);
      if (!articulo) return { error: "Artículo no encontrado" };
      return {
        id: articulo.art_id, titulo: articulo.art_titulo, slug: articulo.art_slug,
        resumen: articulo.art_resumen, contenido: articulo.art_contenido,
        tipo: articulo.art_tipo, audiencia: articulo.art_audiencia,
        categoria: articulo.cat_nombre, tags: articulo.art_tags,
      };
    }

    if (toolName === "buscar_por_categoria") {
      const { categoria_id, tipo } = toolInput;
      const articulos = await obtenerArticulos({ categoriaId: categoria_id, tipo });
      if (articulos.length === 0) return { encontrados: 0, mensaje: "No hay artículos en esa categoría aún.", articulos: [] };
      return {
        encontrados: articulos.length,
        articulos: articulos.map((a) => ({
          id: a.art_id, titulo: a.art_titulo, slug: a.art_slug,
          resumen: a.art_resumen || "", tipo: a.art_tipo,
        })),
      };
    }

    if (toolName === "buscar_diagnostico") {
      const { sintoma } = toolInput;
      let resultado = await buscarArticulos(sintoma, { tipo: "diagnostico", limit: 5 });
      if (resultado.length === 0) resultado = await buscarArticulos(sintoma, { limit: 5 });
      return {
        encontrados: resultado.length,
        articulos: resultado.map((a) => ({
          id: a.art_id, titulo: a.art_titulo, slug: a.art_slug,
          resumen: a.art_resumen || "", tipo: a.art_tipo, categoria: a.cat_nombre,
        })),
      };
    }

    if (toolName === "buscar_historial_resuelto") {
      const { query, limite = 3 } = toolInput;
      const casos = await buscarChatsResueltos({ query, limit: limite });
      if (casos.length === 0) {
        return { encontrados: 0, mensaje: "No encontré casos previos resueltos para ese texto." };
      }
      return {
        encontrados: casos.length,
        casos: casos.map((c) => ({
          id: c.chat_id,
          session_id: c.chat_session_id,
          pregunta: c.chat_pregunta,
          respuesta_resumen: (c.chat_respuesta || "").substring(0, 500),
          fecha: c.chat_created_at,
        })),
      };
    }

    if (toolName === "obtener_queries_sql") {
      const { modulo, problema } = toolInput;
      return JSON.parse(obtenerQueriesSQL(modulo, problema));
    }

    if (toolName === "obtener_estructura_tabla") {
      const { tabla, schema } = toolInput;
      return await obtenerEstructuraTablaDB({ tabla, schema: schema || null });
    }

    if (toolName === "ejecutar_query") {
      const { sql, motivo } = toolInput;
      console.log(`[AGENTE] Ejecutando query read-only. Motivo: ${motivo}`);
      console.log(`[AGENTE] SQL: ${sql}`);
      return JSON.parse(await ejecutarQueryReadOnly(sql));
    }

    if (toolName === "buscar_memorias") {
      const { query, modulo, categoria } = toolInput;
      const memorias = await buscarMemorias(query, { modulo, categoria, limite: 8 });
      if (memorias.length === 0) {
        return { encontradas: 0, mensaje: "No encontré memorias relacionadas. Si descubres algo importante, guárdalo con guardar_memoria." };
      }
      // Registrar uso de cada memoria encontrada
      for (const m of memorias) {
        registrarUsoMemoria(m.mem_id).catch(() => {});
      }
      return {
        encontradas: memorias.length,
        memorias: memorias.map((m) => ({
          id: m.mem_id,
          categoria: m.mem_categoria,
          titulo: m.mem_titulo,
          contenido: m.mem_contenido,
          modulo: m.mem_modulo,
          veces_usado: m.mem_veces_usado,
        })),
      };
    }

    if (toolName === "guardar_memoria") {
      const { categoria, titulo, contenido, modulo, tags } = toolInput;
      const resultado = await guardarMemoria({
        categoria, titulo, contenido,
        modulo: modulo || "general",
        tags: tags || [],
        creadoPor: "agente",
      });
      if (resultado.actualizada) {
        return { guardada: true, accion: "actualizada", mensaje: `Memoria actualizada: "${titulo}"`, id: resultado.memoria.mem_id };
      }
      return { guardada: true, accion: "creada", mensaje: `Nueva memoria guardada: "${titulo}"`, id: resultado.memoria.mem_id };
    }

    if (toolName === "buscar_error_exacto") {
      const { mensaje_error, modulo } = toolInput;

      if (mensaje_error) {
        const errores = await buscarErrorPorMensaje(mensaje_error);
        if (errores.length === 0) {
          return { encontrados: 0, mensaje: `No se encontró un error mapeado para "${mensaje_error}". Intenta con buscar_articulos o buscar_diagnostico.` };
        }
        return {
          encontrados: errores.length,
          errores: errores.map((e) => ({
            modulo: e.err_modulo, mensaje: e.err_mensaje, endpoint: e.err_endpoint,
            http_code: e.err_http_code, causa: e.err_causa,
            solucion_tecnica: e.err_solucion_tecnica, solucion_usuario: e.err_solucion_usuario,
            navegacion: e.err_navegacion, query_diagnostico: e.err_query_diagnostico,
            articulo_relacionado: e.art_titulo ? { titulo: e.art_titulo, slug: e.art_slug } : null,
          })),
        };
      }

      if (modulo) {
        const errores = await buscarErroresPorModulo(modulo);
        if (errores.length === 0) return { encontrados: 0, mensaje: `No hay errores mapeados para el módulo "${modulo}".` };
        return {
          encontrados: errores.length, modulo,
          errores: errores.map((e) => ({
            mensaje: e.err_mensaje, http_code: e.err_http_code, causa: e.err_causa,
            solucion_tecnica: e.err_solucion_tecnica, solucion_usuario: e.err_solucion_usuario,
          })),
        };
      }

      return { error: "Debes proporcionar mensaje_error o modulo" };
    }

    return { error: `Tool desconocida: ${toolName}` };
  } catch (error) {
    console.error(`Error ejecutando tool ${toolName}:`, error);
    return { error: "Error interno al ejecutar la herramienta" };
  }
};

// ─── Contexto de módulo para el prompt (enriquecido: DB + pantallas + flujos + errores) ──
const CONTEXTOS_MODULO = {
  usuarios: `MÓDULO USUARIOS
DB: usuario, usuario_localidad, cargo_nivel. Relación: usuario.usu_reporta → usuario.usu_id (jefe).
PANEL: 3 tipos: Seguridad (/usuarios), Salud (/usuariossalud), Comercial (/usuario_comercial). Cada uno tiene: crear, editar, eliminar, carga masiva Excel, cambiar jefe.
APP: Login (cédula+contraseña), perfil, cambiar contraseña, cerrar sesión.
Pantallas clave: UserSecurityPage, UserHealthPage, UserComercialPage, InactivarPage, UsuarioLocalidadPage.
ERRORES COMUNES: "Usuario ya existe" (email duplicado), "No se puede eliminar" (tiene registros asociados), usuario no ve módulos (verificar flags: usu_seguridad, usu_salud, incidencias, charlas, inspecciones, tareas).
FLUJOS: Panel→Usuarios→Nuevo→Llenar datos→Guardar | Panel→Usuarios→Editar→Cambiar jefe | Panel→Usuarios→Carga masiva→Subir Excel.`,

  formularios: `MÓDULO FORMULARIOS
DB: formulario, formulario_segmento, formulario_pregunta, formulario_pregunta_detalle. Relación: formulario ← actividad_seguridad ← tarea.
PANEL: FormularioPage (/formularios). Crear con segmentos y preguntas. Tipos: Tipo 1 (inspección con segmentos), Tipo 2 (con opciones múltiples directas).
Pantallas: FormularioPage, AddEditFormulario.
ERRORES: "No se puede desactivar" (tiene actividades activas vinculadas), "Pregunta sin opciones" (tipo 2 requiere detalle), nombre duplicado (UNIQUE UPPER+TRIM).
FLUJOS: Panel→Formularios→Nuevo→Agregar segmentos→Agregar preguntas por segmento→Guardar | Panel→Formularios→Editar→Modificar preguntas.`,

  charlas: `MÓDULO CHARLAS/CAPACITACIONES
DB: charla, charla_usuario, charla_pregunta, charla_respuesta. cha_rating=true para rating, cha_capacitacion=true para capacitación.
PANEL SEGURIDAD: TalksPage (/charlas). Crear charla con preguntas, asignar por empresa/localidad/área/cargo. Reportes: ReporteCharlasPage, ReporteCharlasAutPage.
PANEL COMERCIAL: TalksPageComercial (/charla_comercial). Mismo flujo pero para escuela comercial.
APP: ChatListPage (ver charlas asignadas), NewChatPage (ver video + responder quiz). tipo_video=4 para video.
ERRORES: "Charla no aparece al usuario" (verificar asignación en charla_usuario), "Video no reproduce" (verificar URL y conexión), "No puede responder" (charla vencida o ya respondida).
FLUJOS: Panel→Charlas→Nueva→Agregar preguntas→Asignar→Guardar | App→Charlas→Seleccionar→Ver video→Responder quiz→Confirmar.`,

  tareas: `MÓDULO TAREAS
DB: tarea, tarea_asignacion, tarea_formulario_respuesta. tar_tipo: 0=normal, 3=cron recurrente. Relación: actividad_seguridad → tarea → tarea_asignacion.
PANEL: TareaPage (/tareas) con tabs Primarias/Secundarias. Crear, asignar por empresa/localidad/área/usuario. Dashboard: TareasDashReportePage. Respuestas: TareaRespuestaGeneral.
APP: TaskListPage (ver asignadas), NewTaskPage (crear), DetailTaskPage (detalle), RegisterTaskPage (registrar cumplimiento), TaskExpireListPage (vencidas), CalendarListTaskPage (calendario).
ERRORES: "Tarea no aparece" (verificar tarea_asignacion), "No puede registrar" (tarea vencida), "Calendario vacío" (no hay tareas asignadas en ese periodo).
FLUJOS: Panel→Tareas→Nueva→Seleccionar actividad→Asignar→Guardar | App→Tareas→Seleccionar→Ver detalle→Registrar cumplimiento.`,

  incidencias: `MÓDULO INCIDENCIAS (Actos y Condiciones Inseguras)
DB: incidencia, incidencia_imagenes. Campos desnormalizados: emp_id, emp_nombre, loc_id, loc_nombre. inc_numero auto-incremental por usuario.
PANEL: IncidencePage (/incidencias). Filtros: fecha, área, localidad, empresa, estado, condición, usuario. Estados: Resuelto/No resuelto. Condiciones: Pendiente, Aprobado, Rechazado, Revisión. EditCondition para cambiar condición.
APP: IncidenceListPage (listado con filtros mes/estado), NewIncidencePage (3 pasos: info básica → observación → fotos). Hasta 5 fotos por incidencia.
ERRORES: "Error al subir foto" (conexión o permisos cámara), "No se puede guardar" (campos obligatorios faltantes), "Incidencia no aparece" (filtro de fecha/estado incorrecto).
FLUJOS: App→Incidencias→Nueva→Paso1 datos→Paso2 observación→Paso3 fotos→Guardar | Panel→Incidencias→Filtrar→Seleccionar→Cambiar condición.`,

  inspecciones: `MÓDULO INSPECCIONES
DB: inspeccion, inspeccion_respuesta. Relación con formulario_pregunta. ins_calificacion, ins_tipo.
PANEL: InspectionPage (/inspecciones). Filtros, exportar Excel, ver detalle. InspectionDetailView.
APP: InspectionListPage (listado), NewInspectionPage (formulario paso a paso con preguntas del formulario asociado).
ERRORES: "No hay formulario asociado" (verificar que la actividad tiene formulario vinculado), "Inspección incompleta" (todas las preguntas son obligatorias).
FLUJOS: App→Inspecciones→Nueva→Responder preguntas→Guardar | Panel→Inspecciones→Filtrar→Ver detalle→Exportar.`,

  reportes: `MÓDULO REPORTES
DB: semana_reporte, reporte_rating (precalculado), charla_respuesta.
TIPOS:
- LV (Liderazgo Visible): semana_reporte + jerarquía usu_reporta. Páginas: LvPage, LvPage2, LvCortePage.
- OPE (Observaciones): tipo_observacion + potencial. Páginas: OpePage, OpePage2, OpeCortePage.
- P5M (5 Pilares): charla_respuesta.usu_id_jefe + cargo_nivel. Páginas: P5mPage, P5mPage2, P5mCortePage, P5mComercialPage.
- Ratings: reporte_rating precalculado. Seguridad: RatingSeguridadPage. Comercial: RatingComercialPage. Corte: RatingSeguridadCortePage.
- Charlas: ReporteCharlasPage, ReporteCharlasComercialPage.
- Actividades: ReporteActividadesPage, DashboardActividadesPage.
ERRORES: "Reporte sin datos" (verificar periodo/filtros/registros en rango), "Rating no calculado" (reporte_rating necesita datos previos).
FLUJOS: Panel→Reportes→Seleccionar tipo→Aplicar filtros (fecha/empresa/localidad)→Ver→Exportar Excel.`,

  actividades: `MÓDULO ACTIVIDADES DE SEGURIDAD
DB: actividad_seguridad, meta_actividad. Relación: actividad_seguridad.frm_id → formulario.
PANEL: ActividadPage (/actividades), ActividadSeguridadPage (/actividades-seguridad), AddEditActividadSeguridad (crear/editar con PDF).
ERRORES: "No se puede eliminar" (tiene tareas activas vinculadas), "Sin formulario" (debe tener formulario antes de crear tareas).
FLUJOS: Panel→Actividades→Nueva→Vincular formulario→Guardar | Panel→Actividades→Ver→Crear tarea desde actividad.`,

  rankings: `MÓDULO RANKINGS Y RECOMPENSAS
DB: ranking, recompensa, kardex. Rankings por puntos/período. Kardex = historial de movimientos de puntos.
PANEL: RecompensaPage (/recompensas), RecompesasSeguridad (/recompensas_seguridad), KardexPage (/ranking_kardex). RankingUsuarioPage (/ranking_usuario) rankings por módulo.
APP: RankingPage (ver posición y puntos), KardexRankingPage (historial de puntos), TopPage (top 10 diario con podio visual).
ERRORES: "Sin ranking" (no hay registros en el periodo seleccionado), "Puntos no se suman" (verificar módulo y periodo de kardex).
FLUJOS: Panel→Recompensas→Ver ranking→Seleccionar módulo→Filtrar mes/año | Panel→Kardex→Buscar usuario→Ver movimientos→Canjear puntos | App→Rankings→Ver posición→Ver kardex.`,

  estructura: `MÓDULO ESTRUCTURA ORGANIZACIONAL
DB: empresa, region, subregion, localidad, area, cargo, cargo_nivel, pais, ciudad, negocio, manufactura, tipo_persona, potencial, tipo_observacion, requisito, causa.
PANEL JERARQUÍA: PaisPage→RegionPage→SubregionPage→LocalidadPage→AreaPage. Cada nivel tiene CRUD completo.
PANEL ORGANIZACIÓN: EmpresaPage, NegocioPage, ManufacturaPage, CargoPage, ChargeLevelPage, TipoPersonaPage.
PANEL CONFIG: ParametroPage (fechas de corte, márgenes, porcentajes), MenuPage (estructura del menú y permisos).
ERRORES: "No se puede eliminar" (tiene registros hijos), "Localidad sin área" (crear áreas primero).
FLUJOS: Panel→Estructura→País→Crear→Región→Crear→Localidad→Crear→Área→Crear (de arriba hacia abajo).`,

  general: "",
};

const normalizarTexto = (texto = "") =>
  texto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 2000);

const quitarAcentos = (txt = "") =>
  String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const STOPWORDS_SEMANTICA = new Set([
  "el", "la", "los", "las", "de", "del", "y", "o", "en", "con", "para", "por",
  "que", "se", "es", "un", "una", "al", "lo", "mi", "me", "no", "si", "ya",
  "como", "porque", "solo", "favor", "modulo", "modulos",
]);

const normalizarSemanticaTexto = (texto = "") => {
  let t = quitarAcentos(texto).toLowerCase();
  t = t.replace(/capacitaciones?/g, "charlas");
  t = t.replace(/menu/g, "modulo");
  t = t.replace(/ingresar|entrar/g, "acceder");
  t = t.replace(/no me aparece|no aparece|no veo|no me sale|no sale/g, "no_visible");
  t = t.replace(/[^a-z0-9_\\s]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
};

const inferirIntencionSoporte = (pregunta = "") => {
  const t = normalizarSemanticaTexto(pregunta);
  if (!t) return null;

  const hablaCharlas = /\bcharlas?\b/.test(t);
  const noVisible = /\bno_visible\b/.test(t);
  const hablaModulo = /\bmodulo\b/.test(t);

  if (hablaCharlas && (noVisible || hablaModulo)) {
    return { key: "charlas_no_visible", slug: "charla-asignada-no-aparece", tags: ["charlas", "menu", "permisos", "tipo_usuario", "modulo"], kbQuery: "charlas no aparece modulo permisos" };
  }

  const accesoModulo = /\bacceder\b/.test(t) && /\bmodulo\b/.test(t);
  if (accesoModulo) {
    return { key: "modulo_sin_acceso", slug: "usuario-no-ve-modulo", tags: ["menu", "permisos", "tipo_usuario", "usuario"], kbQuery: "modulo permisos usuario menu" };
  }

  // ── Intents de login / sesión / contraseña ──
  if (/\b(acceder|sesion|login|iniciar)\b/.test(t) && /\b(app|aplicacion|arca)\b/.test(t)) {
    return { key: "como_iniciar_sesion", slug: "perfil-cambiar-contrasena-app", tags: ["login", "sesión", "contraseña", "app"] };
  }
  if (/\b(contrasena|clave|password)\b/.test(t) && /\b(cambiar|modificar|nueva|olvi|reset)\b/.test(t)) {
    return { key: "cambiar_contrasena", slug: "perfil-cambiar-contrasena-app", tags: ["contraseña", "cambiar", "perfil"] };
  }

  // ── Intents de incidencias ──
  if (/\b(incidencia|acto|condicion)\b/.test(t) && /\b(crear|nueva|reportar|registrar|como)\b/.test(t)) {
    return { key: "crear_incidencia", slug: null, tags: ["incidencia", "crear", "reportar", "acto"], kbQuery: "crear incidencia app pasos" };
  }

  // ── Intents de tareas ──
  if (/\b(tarea|tareas)\b/.test(t) && /\b(registrar|cumplir|completar|como)\b/.test(t)) {
    return { key: "registrar_tarea", slug: "registrar-cumplimiento-tarea-app", tags: ["tarea", "registrar", "cumplimiento"] };
  }
  if (/\b(tarea|tareas)\b/.test(t) && /\b(calendario|vencida|expirada)\b/.test(t)) {
    return { key: "ver_calendario_tareas", slug: "tareas-vencidas-calendario-app", tags: ["calendario", "tareas", "vencidas"] };
  }

  // ── Intents de ranking / puntos ──
  if (/\b(ranking|puntos|posicion|puntaje)\b/.test(t)) {
    return { key: "ver_ranking", slug: "ranking-puntos-app", tags: ["ranking", "puntos", "posición"] };
  }

  // ── Intents de notificaciones ──
  if (/\b(notificacion|push|campana)\b/.test(t) && /\b(no_visible|no|llegan|recibo)\b/.test(t)) {
    return { key: "no_recibo_notificaciones", slug: "notificaciones-app", tags: ["notificaciones", "push", "no recibo"] };
  }

  // ── Intents de video / charlas ──
  if (/\b(video|reproduce|reproducir)\b/.test(t) && /\b(no|charlas?|error)\b/.test(t)) {
    return { key: "video_no_reproduce", slug: "charla-no-reproduce-video", tags: ["video", "charla", "no reproduce"] };
  }

  // ── Intents de sincronización / offline ──
  if (/\b(sincroniz|sync|datos)\b/.test(t) && /\b(no|problema|error)\b/.test(t)) {
    return { key: "app_no_sincroniza", slug: "datos-no-sincronizan", tags: ["sincronización", "datos", "offline"] };
  }
  if (/\b(offline|sin internet|sin conexion|sqlite)\b/.test(t)) {
    return { key: "modo_offline", slug: "modo-offline-app", tags: ["offline", "sin internet", "sqlite"] };
  }

  // ── Intents de fotos / cámara ──
  if (/\b(foto|fotos|camara|galeria|imagen)\b/.test(t) && /\b(no|error|problema|permiso)\b/.test(t)) {
    return { key: "problema_fotos", slug: "problemas-fotos-app", tags: ["fotos", "cámara", "permisos"] };
  }

  // ── Intents de app crash ──
  if (/\b(cierra|crash|blanca|congela|cuelga)\b/.test(t) && /\b(app|aplicacion|pantalla)\b/.test(t)) {
    return { key: "app_se_cierra", slug: "app-cierra-pantalla-blanca", tags: ["cierra", "crash", "pantalla blanca"] };
  }

  // ── Intents de charlas comerciales ──
  if (/\b(charlas?)\b/.test(t) && /\b(comercial|escuela|ventas)\b/.test(t)) {
    return { key: "charlas_comerciales", slug: "charlas-comerciales-app", tags: ["charlas", "comercial", "escuela comercial"] };
  }

  // ── Intents de navegación general ──
  if (/\b(navegacion|menu|modulos|pantallas)\b/.test(t) && /\b(app|general|principal)\b/.test(t)) {
    return { key: "navegacion_app", slug: "navegacion-general-app", tags: ["navegación", "menú", "módulos", "app"] };
  }

  return null;
};

const firmaSemanticaPregunta = (pregunta = "", rolUsuario = "soporte") => {
  const intent = rolUsuario === "soporte" ? inferirIntencionSoporte(pregunta) : null;
  if (intent?.key) return `intent:${intent.key}`;

  const tokens = normalizarSemanticaTexto(pregunta)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t && t.length > 2 && !STOPWORDS_SEMANTICA.has(t));

  const unicos = Array.from(new Set(tokens)).sort();
  return unicos.slice(0, 24).join("|");
};

const limpiarRateLimitViejo = (arr, nowMs) =>
  arr.filter((ts) => nowMs - ts < RATE_LIMIT_WINDOW_MS);

const checkRateLimit = (userKey) => {
  const now = Date.now();
  const historial = rateLimitByUser.get(userKey) || [];
  const vigente = limpiarRateLimitViejo(historial, now);
  if (vigente.length === 0) {
    rateLimitByUser.delete(userKey);
  }

  if (vigente.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = vigente[0];
    const retryMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - oldest));
    return {
      allowed: false,
      retryAfterSec: Math.ceil(retryMs / 1000),
    };
  }

  vigente.push(now);
  rateLimitByUser.set(userKey, vigente);
  return { allowed: true, retryAfterSec: 0 };
};

const makeCacheKey = ({ rolUsuario, contexto_modulo, pregunta, historial }) => {
  const resumenHistorial = (historial || [])
    .slice(-4)
    .map((m) => `${m.role}:${firmaSemanticaPregunta(String(m.content || ""), rolUsuario).slice(0, 180)}`)
    .join("|");

  const base = JSON.stringify({
    rolUsuario,
    contexto_modulo: contexto_modulo || "general",
    pregunta: firmaSemanticaPregunta(pregunta, rolUsuario),
    historial: normalizarTexto(resumenHistorial),
  });

  return crypto.createHash("sha1").update(base).digest("hex");
};

const getCacheTtl = (complejidad) => {
  if (complejidad === "simple") return CHAT_CACHE_TTL_SIMPLE;
  if (complejidad === "normal") return CHAT_CACHE_TTL_NORMAL;
  return CHAT_CACHE_TTL_DEFAULT;
};

const getCachedResponse = (cacheKey) => {
  const entry = chatResponseCache.get(cacheKey);
  if (!entry) return null;
  const ttl = getCacheTtl(entry.complejidad);
  if (Date.now() - entry.createdAt > ttl) {
    chatResponseCache.delete(cacheKey);
    return null;
  }
  return entry;
};

const setCachedResponse = (cacheKey, data) => {
  if (chatResponseCache.size >= CHAT_CACHE_MAX_ENTRIES) {
    const firstKey = chatResponseCache.keys().next().value;
    if (firstKey) chatResponseCache.delete(firstKey);
  }
  chatResponseCache.set(cacheKey, { ...data, createdAt: Date.now() });
};

// ─── Cache persistente en DB (sobrevive reinicios, TTL largo) ───────────────
const getDbCachedResponse = async (cacheHash) => {
  try {
    const { rows } = await pool.query(
      `SELECT cache_respuesta, cache_articulos_ids, cache_modelo, cache_complejidad
       FROM soporte_cache_respuestas
       WHERE cache_hash = $1
         AND cache_created_at + (cache_ttl_seconds || ' seconds')::INTERVAL > NOW()`,
      [cacheHash]
    );
    if (!rows[0]) return null;
    return {
      respuestaCompleta: rows[0].cache_respuesta,
      articulosUsados: rows[0].cache_articulos_ids || [],
      modelo: rows[0].cache_modelo,
      complejidad: rows[0].cache_complejidad,
    };
  } catch (err) {
    console.error("Error leyendo cache DB:", err.message);
    return null;
  }
};

const setDbCachedResponse = async (cacheHash, data) => {
  try {
    const ttl = data.complejidad === "simple" ? 86400 : 14400; // 24h simple, 4h normal
    await pool.query(
      `INSERT INTO soporte_cache_respuestas (cache_hash, cache_respuesta, cache_articulos_ids, cache_complejidad, cache_modelo, cache_ttl_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (cache_hash) DO UPDATE SET
         cache_respuesta = EXCLUDED.cache_respuesta,
         cache_articulos_ids = EXCLUDED.cache_articulos_ids,
         cache_created_at = CURRENT_TIMESTAMP`,
      [cacheHash, data.respuestaCompleta, data.articulosUsados || [], data.complejidad, data.modelo, ttl]
    );
  } catch (err) {
    console.error("Error guardando cache DB:", err.message);
  }
};

const limpiarCacheExpirado = async () => {
  try {
    await pool.query(
      `DELETE FROM soporte_cache_respuestas
       WHERE cache_created_at + (cache_ttl_seconds || ' seconds')::INTERVAL < NOW()`
    );
  } catch (_err) { /* ignorar */ }
};

// Limpiar cache expirado cada hora
setInterval(limpiarCacheExpirado, 3600000);

/**
 * Clasifica la complejidad de una consulta en 3 niveles para optimizar tokens.
 * - "simple": FAQ, preguntas cortas sin tecnicismos → modelo lite, sin tools, prompt ligero
 * - "normal": consultas moderadas → modelo flash, tools KB
 * - "compleja": diagnóstico técnico, SQL, análisis → modelo flash/pro, tools completos
 * @returns {'simple' | 'normal' | 'compleja'}
 */
const clasificarConsulta = ({ rolUsuario, pregunta, historial }) => {
  const texto = String(pregunta || "").trim();
  const len = texto.length;
  const histLen = Array.isArray(historial) ? historial.length : 0;

  const technicalRegex = /(sql|query|tabla|columna|join|where|postgres|endpoint|diagn[oó]stic|script|base de datos|db|token|stack|error|falla|bug|crash|log)/i;
  const strategicRegex = /(arquitectura|migraci[oó]n|roadmap|tradeoff|comparar|auditor[ií]a|plan integral)/i;

  // ── SIMPLE: FAQ, preguntas cortas, sin tecnicismos, sin historial largo ──
  if (len < 120 && histLen <= 1 && !technicalRegex.test(texto)) return "simple";
  if (len < 80 && histLen === 0) return "simple";

  // ── COMPLEJA: técnica, larga, estratégica ──
  if (len > 420 || histLen > 10) return "compleja";
  if ((rolUsuario === "soporte_tecnico" || rolUsuario === "admin") && strategicRegex.test(texto) && len > 180) return "compleja";
  if (rolUsuario === "soporte" && (len > 240 || (technicalRegex.test(texto) && len > 140))) return "compleja";
  if (technicalRegex.test(texto) && len > 200) return "compleja";

  // ── NORMAL: todo lo demás ──
  return "normal";
};

const calcularConsumoMensualCostos = async (usuarioEmail) => {
  const { rows: [row] } = await pool.query(
    `SELECT
       COALESCE(SUM(chat_tokens_usados), 0)::bigint AS tokens_global,
       COALESCE(SUM(chat_tokens_usados) FILTER (WHERE chat_usuario = $1), 0)::bigint AS tokens_usuario
     FROM soporte_chat_historial
     WHERE date_trunc('month', chat_created_at) = date_trunc('month', NOW())`,
    [usuarioEmail]
  );

  const global = calcularCostoDesdeTokens(row?.tokens_global || 0);
  const usuario = calcularCostoDesdeTokens(row?.tokens_usuario || 0);

  return {
    tokensGlobal: parseInt(row?.tokens_global, 10) || 0,
    tokensUsuario: parseInt(row?.tokens_usuario, 10) || 0,
    costoGlobalUsd: global.costoTotalUsd,
    costoUsuarioUsd: usuario.costoTotalUsd,
  };
};

const checkPresupuestoIa = async (usuarioEmail) => {
  const config = await getIaConfig();
  const limiteUsuarioRow = await getIaUserLimit(usuarioEmail);
  const consumo = await calcularConsumoMensualCostos(usuarioEmail);
  const estimatedNextCost = estimarCostoConsulta();

  const limiteGlobal = config?.cfg_limite_global_usd != null ? parseFloat(config.cfg_limite_global_usd) : null;
  const limiteUsuario = (limiteUsuarioRow?.lim_activo && limiteUsuarioRow?.lim_limite_usd != null)
    ? parseFloat(limiteUsuarioRow.lim_limite_usd)
    : (config?.cfg_limite_usuario_default_usd != null ? parseFloat(config.cfg_limite_usuario_default_usd) : null);
  const bloquear = config?.cfg_bloquear_al_superar !== false;

  const resultado = {
    allowed: true,
    reason: null,
    bloquear,
    limiteGlobalUsd: limiteGlobal,
    limiteUsuarioUsd: limiteUsuario,
    costoGlobalUsd: consumo.costoGlobalUsd,
    costoUsuarioUsd: consumo.costoUsuarioUsd,
    estimatedNextCostUsd: estimatedNextCost,
  };

  if (!bloquear) return resultado;

  if (limiteGlobal != null && (consumo.costoGlobalUsd + estimatedNextCost) > limiteGlobal) {
    resultado.allowed = false;
    resultado.reason = "global";
    return resultado;
  }

  if (limiteUsuario != null && (consumo.costoUsuarioUsd + estimatedNextCost) > limiteUsuario) {
    resultado.allowed = false;
    resultado.reason = "usuario";
    return resultado;
  }

  return resultado;
};

const MENSAJE_PREFERENCIA_TECNICA = "Antes de empezar: ¿quieres que te responda primero con enfoque **técnico** o **no técnico**?\n\nResponde solo: `tecnica` o `no tecnica` y luego te doy la solución en ese formato.";

const esPromptPreferenciaTecnica = (texto = "") =>
  /enfoque\s+\*?\*?t[eé]cnico\*?\*?\s+o\s+\*?\*?no\s+t[eé]cnico\*?\*?/i.test(String(texto));

const normalizarPreferenciaSalida = (texto = "") => {
  const t = String(texto || "").toLowerCase();
  if (/(^|\b)(no tecnica|no técnico|usuario|simple|pasos|funcional)(\b|$)/i.test(t)) return "no_tecnica";
  if (/(^|\b)(tecnica|técnica|sql|query|diagnostico tecnico|técnico)(\b|$)/i.test(t)) return "tecnica";
  return null;
};

const inferirPreferenciaDesdeHistorial = (historial = []) => {
  if (!Array.isArray(historial) || historial.length === 0) return null;

  let idxPrompt = -1;
  for (let i = historial.length - 1; i >= 0; i--) {
    const msg = historial[i];
    if (msg?.role === "assistant" && esPromptPreferenciaTecnica(msg?.content)) {
      idxPrompt = i;
      break;
    }
  }

  const slice = idxPrompt >= 0 ? historial.slice(idxPrompt + 1) : historial;
  for (let i = slice.length - 1; i >= 0; i--) {
    const msg = slice[i];
    if (msg?.role !== "user") continue;
    const pref = normalizarPreferenciaSalida(msg?.content || "");
    if (pref) return pref;
  }
  return null;
};

const getHistorialLimitsByRole = (rolUsuario) => {
  if (rolUsuario === "admin") {
    return { maxMessages: HISTORY_MESSAGES_ADMIN, maxCharsPerMessage: HISTORY_CHARS_ADMIN };
  }
  if (rolUsuario === "soporte_tecnico") {
    return { maxMessages: HISTORY_MESSAGES_TECNICO, maxCharsPerMessage: HISTORY_CHARS_TECNICO };
  }
  return { maxMessages: HISTORY_MESSAGES_SOPORTE, maxCharsPerMessage: HISTORY_CHARS_SOPORTE };
};

const recortarTexto = (text, maxChars) => {
  const raw = typeof text === "string" ? text : JSON.stringify(text);
  if (!raw) return "";
  return raw.length > maxChars ? `${raw.slice(0, maxChars)}…` : raw;
};

const construirResumenDropped = (dropped) => {
  if (!dropped || dropped.length === 0) return "";
  const topics = dropped
    .filter((m) => m.role === "user")
    .map((m) => String(m.content || "").trim().substring(0, 80))
    .filter(Boolean);
  if (topics.length === 0) return "";
  return `[Contexto previo: el usuario preguntó sobre: ${topics.join("; ")}]\n\n`;
};

const construirContentsDesdeHistorial = ({ historial, pregunta, rolUsuario }) => {
  const { maxMessages, maxCharsPerMessage } = getHistorialLimitsByRole(rolUsuario);
  const contents = [];
  const msgs = Array.isArray(historial) ? historial : [];
  const kept = msgs.slice(-Math.max(1, maxMessages));
  const dropped = msgs.slice(0, Math.max(0, msgs.length - Math.max(1, maxMessages)));

  for (const msg of kept) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: recortarTexto(msg.content, maxCharsPerMessage) }],
    });
  }

  const resumenPrevio = construirResumenDropped(dropped);
  const preguntaFinal = resumenPrevio + String(pregunta || "").trim();
  contents.push({ role: "user", parts: [{ text: recortarTexto(preguntaFinal, maxCharsPerMessage * 2) }] });
  return contents;
};

const getOutputLimitByRole = (rolUsuario) => {
  if (rolUsuario === "admin") return MAX_OUTPUT_TOKENS_ADMIN;
  if (rolUsuario === "soporte_tecnico") return MAX_OUTPUT_TOKENS_TECNICO;
  return MAX_OUTPUT_TOKENS_SOPORTE;
};

const getIaRuntimeCached = async () => {
  const now = Date.now();
  if (iaRuntimeCache.data && (now - iaRuntimeCache.ts) < IA_PROVIDER_RUNTIME_TTL_MS) {
    return iaRuntimeCache.data;
  }

  const runtime = await getIaRuntimeConfig();
  iaRuntimeCache = {
    ts: now,
    data: runtime,
  };
  return runtime;
};

const resolveIaRuntime = async () => {
  const runtime = await getIaRuntimeCached();
  const provider = (runtime?.provider || "gemini").toLowerCase() === "deepseek" ? "deepseek" : "gemini";

  const geminiApiKey = runtime?.geminiApiKey || process.env.GEMINI_API_KEY || null;
  const deepseekApiKey = runtime?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || null;

  let providerFinal = provider;
  if (provider === "deepseek" && !deepseekApiKey && geminiApiKey) {
    providerFinal = "gemini";
  } else if (provider === "gemini" && !geminiApiKey && deepseekApiKey) {
    providerFinal = "deepseek";
  }

  return {
    providerSolicitado: provider,
    providerFinal,
    geminiApiKey,
    deepseekApiKey,
  };
};

const construirMensajesDeepseek = ({ systemPrompt, historial, pregunta, rolUsuario }) => {
  const { maxMessages, maxCharsPerMessage } = getHistorialLimitsByRole(rolUsuario);
  const mensajes = [{ role: "system", content: recortarTexto(systemPrompt, 4000) }];
  const msgs = Array.isArray(historial) ? historial : [];
  const kept = msgs.slice(-Math.max(1, maxMessages));
  const dropped = msgs.slice(0, Math.max(0, msgs.length - Math.max(1, maxMessages)));

  for (const msg of kept) {
    const role = msg.role === "assistant" ? "assistant" : "user";
    mensajes.push({
      role,
      content: recortarTexto(msg.content, maxCharsPerMessage),
    });
  }

  const resumenPrevio = construirResumenDropped(dropped);
  const preguntaFinal = resumenPrevio + String(pregunta || "").trim();
  mensajes.push({
    role: "user",
    content: recortarTexto(preguntaFinal, maxCharsPerMessage * 2),
  });

  return mensajes;
};

const convertirToolsADeepseek = (tools = []) =>
  (tools || []).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

const parseDeepseekToolArgs = (argsRaw) => {
  if (!argsRaw) return {};
  if (typeof argsRaw === "object") return argsRaw;
  if (typeof argsRaw !== "string") return {};
  try {
    const parsed = JSON.parse(argsRaw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (_e) {
    return {};
  }
};

const llamarDeepseekCompletion = async ({
  apiKey,
  model,
  messages,
  outputLimit,
  tools = null,
  toolChoice = null,
}) => {
  if (!apiKey) {
    throw new Error("DeepSeek no tiene API key configurada.");
  }

  const payload = {
    model: model || MODEL_DEEPSEEK,
    messages,
    temperature: 0.2,
    max_tokens: Math.max(80, Math.min(outputLimit, 700)),
    stream: false,
  };
  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
    if (toolChoice) payload.tool_choice = toolChoice;
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || data?.message || `DeepSeek HTTP ${response.status}`;
    throw new Error(msg);
  }

  return {
    message: data?.choices?.[0]?.message || null,
    text: String(data?.choices?.[0]?.message?.content || "").trim(),
    finishReason: data?.choices?.[0]?.finish_reason || null,
    tokens: parseInt(data?.usage?.total_tokens, 10) || 0,
    promptTokens: parseInt(data?.usage?.prompt_tokens, 10) || 0,
    completionTokens: parseInt(data?.usage?.completion_tokens, 10) || 0,
    model: data?.model || model || MODEL_DEEPSEEK,
  };
};

const detectarRespuestaDeterministicaSoporte = (pregunta) => {
  const intent = inferirIntencionSoporte(pregunta);
  if (!intent) return null;

  if (intent.key === "charlas_no_visible") {
    return [
      "Si no te aparece **Charlas** en la app, normalmente es un tema de permisos/asignación.",
      "",
      "Revisión rápida en panel:",
      "1. `Panel -> Configuración -> Menú`: verifica que el módulo **Charlas** esté activo para el tipo de usuario.",
      "2. `Panel -> Usuarios -> Editar usuario`: valida que el usuario tenga el tipo/perfil correcto.",
      "3. Si aplica, vuelve a iniciar sesión en la app para refrescar permisos.",
      "",
      "Si quieres, te guío con una validación técnica paso a paso (DB/permisos).",
    ].join("\n");
  }

  if (intent.key === "modulo_sin_acceso") {
    return [
      "Parece un problema de permisos del módulo.",
      "",
      "Revisa en este orden:",
      "1. `Panel -> Configuración -> Menú`: módulo activo para el tipo de usuario.",
      "2. `Panel -> Usuarios -> Editar`: tipo de usuario correcto y asignaciones vigentes.",
      "3. Cerrar sesión y volver a ingresar.",
      "",
      "Si sigue igual, pásame el módulo exacto y te doy el checklist puntual.",
    ].join("\n");
  }

  return null;
};

const mapArticuloCard = (a) => ({
  id: a.art_id,
  titulo: a.art_titulo,
  slug: a.art_slug,
  resumen: a.art_resumen || "",
  tipo: a.art_tipo,
  categoria: a.cat_nombre,
});

const construirRespuestaKBBullets = (pregunta, articulos) => {
  const intro = `Encontré esto en la base de conocimiento para tu consulta: **"${pregunta.trim()}"**`;
  const bullets = articulos
    .slice(0, KB_FAST_PATH_MAX_RESULTS)
    .map((a, i) => `${i + 1}. **${a.art_titulo}**${a.art_resumen ? `: ${a.art_resumen}` : ""}`)
    .join("\n");

  return `${intro}\n\n${bullets}\n\nAbre una tarjeta para ver el detalle. Si no resuelve tu caso, dime y lo analizamos con diagnóstico IA.`;
};

const construirRespuestaKBDirecta = (articulo) => {
  let contenido = articulo.art_contenido || "";
  if (contenido.length > 1500) {
    const corte = contenido.lastIndexOf("\n###", 1500);
    contenido = corte > 500 ? contenido.substring(0, corte) : contenido.substring(0, 1500) + "...";
  }
  return contenido + "\n\n---\nSi necesitas más detalle o esto no resuelve tu caso, dime y lo analizamos con diagnóstico IA.";
};

const buscarRespuestaDirectaKB = async (pregunta, rolUsuario = "soporte") => {
  const q = String(pregunta || "").trim();
  if (!KB_FAST_PATH_ENABLED || q.length < 2) {
    return { hit: false };
  }

  const intent = rolUsuario === "soporte" ? inferirIntencionSoporte(q) : null;

  // ── Lookup directo por slug si el intent lo tiene ──
  if (intent?.slug) {
    try {
      const articuloDirecto = await obtenerArticuloPorSlug(intent.slug);
      if (articuloDirecto) {
        return {
          hit: true,
          strategy: "slug_directo",
          articleCards: [mapArticuloCard(articuloDirecto)],
          articulosIds: [articuloDirecto.art_id],
          respuesta: construirRespuestaKBDirecta(articuloDirecto),
        };
      }
    } catch (err) {
      console.error("Error lookup slug directo:", err.message);
    }
  }

  let articulos = [];
  let strategy = "none";

  if (intent?.tags?.length) {
    articulos = await buscarArticulosPorTags(intent.tags, { limit: KB_FAST_PATH_MAX_RESULTS });
    strategy = "tags_intent";
  }

  if (!articulos.length) {
    const consultaFts = intent?.kbQuery || q;
    articulos = await buscarArticulos(consultaFts, { limit: KB_FAST_PATH_MAX_RESULTS });
    strategy = intent?.kbQuery ? "fts_intent" : "fts";
    if (articulos.length > 0) {
      articulos = articulos.filter((a) => (parseFloat(a.relevancia) || 0) >= KB_FAST_PATH_MIN_RELEVANCE);
    }
  }
  if (!articulos.length) {
    articulos = await buscarArticulosLike(q, { limit: KB_FAST_PATH_MAX_RESULTS });
    strategy = "like";
  }

  if (!articulos.length) {
    return { hit: false };
  }

  // Si el artículo top tiene alta relevancia, devolver contenido directo
  const topRelevancia = parseFloat(articulos[0].relevancia) || 0;
  const articleCards = articulos.map(mapArticuloCard);
  const respuesta = topRelevancia > 0.2
    ? construirRespuestaKBDirecta(articulos[0])
    : construirRespuestaKBBullets(q, articulos);

  return {
    hit: true,
    strategy,
    articleCards,
    articulosIds: articleCards.map((a) => a.id),
    respuesta,
  };
};

const toIntInRange = (value, fallback, min, max) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

const getHistorialSesiones = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = toIntInRange(req.query.limit, 30, 1, 100);
    const offset = toIntInRange(req.query.offset, 0, 0, 5000);
    const isAdmin = req.usuario?.rol === "admin";
    const usuarioFiltro = isAdmin
      ? (req.query.usuario ? String(req.query.usuario).trim().toLowerCase() : null)
      : (req.usuario?.email || "anonimo");

    const resultado = await obtenerSesionesChatUsuario({
      usuario: usuarioFiltro,
      query: q,
      limit,
      offset,
      includeAll: isAdmin && !usuarioFiltro,
    });

    res.json({
      ok: true,
      total: resultado.total,
      sesiones: resultado.sesiones,
      query: q,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error obteniendo sesiones de historial:", error);
    res.status(500).json({ ok: false, msg: "Error obteniendo historial de chats" });
  }
};

const getHistorialSesionDetalle = async (req, res) => {
  try {
    const sessionId = (req.params.sessionId || "").trim();
    if (!sessionId) {
      return res.status(400).json({ ok: false, msg: "sessionId es requerido" });
    }

    const limit = toIntInRange(req.query.limit, 300, 1, 500);
    const isAdmin = req.usuario?.rol === "admin";
    const usuarioFiltro = isAdmin
      ? (req.query.usuario ? String(req.query.usuario).trim().toLowerCase() : null)
      : (req.usuario?.email || "anonimo");

    const mensajes = await obtenerMensajesChatSesion({
      usuario: usuarioFiltro,
      sessionId,
      limit,
      includeAll: isAdmin && !usuarioFiltro,
    });

    res.json({ ok: true, sessionId, total: mensajes.length, mensajes });
  } catch (error) {
    console.error("Error obteniendo detalle de sesión:", error);
    res.status(500).json({ ok: false, msg: "Error obteniendo mensajes de la sesión" });
  }
};

const buscarHistorialChats = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(400).json({ ok: false, msg: "La búsqueda debe tener al menos 2 caracteres" });
    }

    const limit = toIntInRange(req.query.limit, 50, 1, 100);
    const isAdmin = req.usuario?.rol === "admin";
    const usuarioFiltro = isAdmin
      ? (req.query.usuario ? String(req.query.usuario).trim().toLowerCase() : null)
      : (req.usuario?.email || "anonimo");

    const resultados = await buscarEnHistorialChatsUsuario({
      usuario: usuarioFiltro,
      query: q,
      limit,
      includeAll: isAdmin && !usuarioFiltro,
    });

    res.json({ ok: true, query: q, total: resultados.length, resultados });
  } catch (error) {
    console.error("Error buscando en historial:", error);
    res.status(500).json({ ok: false, msg: "Error buscando en historial de chats" });
  }
};

// ─── Endpoint principal: chat con streaming SSE ──────────────────────────────
const chatConAgente = async (req, res) => {
  const { pregunta, historial = [], sessionId, contexto_modulo } = req.body;

  if (!pregunta || pregunta.trim().length < 2) {
    return res.status(400).json({ ok: false, msg: "La pregunta es requerida" });
  }

  const rolUsuario = req.usuario?.rol || "soporte";
  const usuarioEmail = req.usuario?.email || "anonimo";
  const rateKey = `${usuarioEmail}:${rolUsuario}`;
  const rateCheck = checkRateLimit(rateKey);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      ok: false,
      msg: `Has alcanzado el límite de consultas por minuto. Intenta nuevamente en ${rateCheck.retryAfterSec}s.`,
      retryAfterSec: rateCheck.retryAfterSec,
    });
  }

  if (rolUsuario === "soporte_tecnico" && historial.length === 0) {
    if (sessionId) sessionPreferenceMap.delete(sessionId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.write(`event: texto\ndata: ${JSON.stringify({ chunk: MENSAJE_PREFERENCIA_TECNICA })}\n\n`);
    res.write(`event: fin\ndata: ${JSON.stringify({
      articulosUsados: [],
      tokensUsados: 0,
      cacheHit: false,
      preferenciaSolicitada: true,
      mensajeAsistente: {
        role: "assistant",
        content: MENSAJE_PREFERENCIA_TECNICA,
      },
    })}\n\n`);
    res.end();

    guardarChatHistorial({
      sessionId: sessionId || "anon-" + Date.now(),
      usuario: usuarioEmail,
      pregunta: pregunta.trim(),
      respuesta: MENSAJE_PREFERENCIA_TECNICA,
      articulosUsados: [],
      tokensUsados: 0,
    }).catch(console.error);
    return;
  }

  // Router determinístico funcional (sin IA) SOLO para soporte no técnico.
  if (rolUsuario === "soporte") {
    const respuestaDeterministica = detectarRespuestaDeterministicaSoporte(pregunta);
    if (respuestaDeterministica) {
      console.log(`[FASTPATH] deterministic | ${usuarioEmail} | role=${rolUsuario}`);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");

      res.write(`event: texto\ndata: ${JSON.stringify({ chunk: respuestaDeterministica })}\n\n`);
      res.write(`event: fin\ndata: ${JSON.stringify({
        articulosUsados: [],
        tokensUsados: 0,
        cacheHit: false,
        source: "deterministic_soporte",
        modelo: null,
        mensajeAsistente: {
          role: "assistant",
          content: respuestaDeterministica,
        },
      })}\n\n`);
      res.end();

      guardarChatHistorial({
        sessionId: sessionId || "anon-" + Date.now(),
        usuario: usuarioEmail,
        pregunta: pregunta.trim(),
        respuesta: respuestaDeterministica,
        articulosUsados: [],
        tokensUsados: 0,
      }).catch(console.error);
      return;
    }
  }

  const cacheKey = makeCacheKey({ rolUsuario, contexto_modulo, pregunta, historial });
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.write(`event: texto\ndata: ${JSON.stringify({ chunk: cached.respuestaCompleta })}\n\n`);
    res.write(`event: fin\ndata: ${JSON.stringify({
      articulosUsados: cached.articulosUsados || [],
      tokensUsados: 0,
      cacheHit: true,
      modelo: cached.modelo || MODEL_FLASH,
      mensajeAsistente: {
        role: "assistant",
        content: cached.respuestaCompleta,
      },
    })}\n\n`);
    res.end();

    guardarChatHistorial({
      sessionId: sessionId || "anon-" + Date.now(),
      usuario: usuarioEmail,
      pregunta: pregunta.trim(),
      respuesta: cached.respuestaCompleta,
      articulosUsados: cached.articulosUsados || [],
      tokensUsados: 0,
    }).catch(console.error);

    return;
  }

  // Cache nivel 2: DB persistente (sobrevive reinicios, TTL largo)
  const dbCached = await getDbCachedResponse(cacheKey);
  if (dbCached) {
    // Re-poblar cache en memoria
    setCachedResponse(cacheKey, dbCached);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.write(`event: texto\ndata: ${JSON.stringify({ chunk: dbCached.respuestaCompleta })}\n\n`);
    res.write(`event: fin\ndata: ${JSON.stringify({
      articulosUsados: dbCached.articulosUsados || [],
      tokensUsados: 0,
      cacheHit: true,
      source: "db_cache",
      modelo: dbCached.modelo || MODEL_FLASH,
      mensajeAsistente: {
        role: "assistant",
        content: dbCached.respuestaCompleta,
      },
    })}\n\n`);
    res.end();

    guardarChatHistorial({
      sessionId: sessionId || "anon-" + Date.now(),
      usuario: usuarioEmail,
      pregunta: pregunta.trim(),
      respuesta: dbCached.respuestaCompleta,
      articulosUsados: dbCached.articulosUsados || [],
      tokensUsados: 0,
    }).catch(console.error);

    return;
  }

  try {
    const budgetCheck = await checkPresupuestoIa(usuarioEmail);
    if (!budgetCheck.allowed) {
      const tipo = budgetCheck.reason === "global" ? "global mensual" : "por usuario mensual";
      return res.status(429).json({
        ok: false,
        msg: `Se alcanzó el límite de costo ${tipo} de IA. Contacta a un administrador.`,
        budget: budgetCheck,
      });
    }
  } catch (error) {
    console.error("Error validando presupuesto IA:", error);
  }

  // Fast-path: si la consulta está en KB, responder sin invocar IA
  try {
    const kbDirect = await buscarRespuestaDirectaKB(pregunta, rolUsuario);
    if (kbDirect.hit) {
      console.log(`[FASTPATH] kb_${kbDirect.strategy} | ${usuarioEmail} | role=${rolUsuario}`);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");

      res.write(`event: texto\ndata: ${JSON.stringify({ chunk: kbDirect.respuesta })}\n\n`);
      res.write(`event: articulos_encontrados\ndata: ${JSON.stringify({ articulos: kbDirect.articleCards })}\n\n`);
      res.write(`event: fin\ndata: ${JSON.stringify({
        articulosUsados: kbDirect.articulosIds,
        tokensUsados: 0,
        cacheHit: false,
        source: `kb_${kbDirect.strategy}`,
        modelo: null,
        mensajeAsistente: {
          role: "assistant",
          content: kbDirect.respuesta,
        },
      })}\n\n`);
      res.end();

      guardarChatHistorial({
        sessionId: sessionId || "anon-" + Date.now(),
        usuario: usuarioEmail,
        pregunta: pregunta.trim(),
        respuesta: kbDirect.respuesta,
        articulosUsados: kbDirect.articulosIds,
        tokensUsados: 0,
      }).catch(console.error);

      return;
    }
  } catch (error) {
    console.error("Error fast-path KB:", error.message);
  }

  const outputLimit = getOutputLimitByRole(rolUsuario);
  const complejidad = clasificarConsulta({ rolUsuario, pregunta, historial });
  let systemPrompt = getSystemPrompt(rolUsuario, complejidad);
  const preferenciaInferida = rolUsuario === "soporte_tecnico"
    ? (inferirPreferenciaDesdeHistorial(historial) || normalizarPreferenciaSalida(pregunta))
    : null;
  if (rolUsuario === "soporte_tecnico" && sessionId && preferenciaInferida) {
    sessionPreferenceMap.set(sessionId, preferenciaInferida);
  }
  const preferenciaSalida = rolUsuario === "soporte_tecnico"
    ? ((sessionId ? sessionPreferenceMap.get(sessionId) : null) || preferenciaInferida)
    : null;

  // ── Inyección de contexto CONDICIONAL por complejidad ──
  // Simple: sin contexto extra (ahorra ~1200 tokens)
  // Normal: solo módulo y preferencia
  // Compleja: módulo + preferencia + memorias + casos previos
  let articulosPreInyectados = [];
  if (complejidad !== "simple") {
    if (contexto_modulo && CONTEXTOS_MODULO[contexto_modulo]) {
      systemPrompt += `\n\n---\n\n## CONTEXTO ACTUAL DEL MÓDULO\n\n${CONTEXTOS_MODULO[contexto_modulo]}`;
    }
    if (preferenciaSalida === "no_tecnica") {
      systemPrompt += "\n\n## PREFERENCIA DE RESPUESTA DEL USUARIO\n\nEl usuario pidió enfoque NO TÉCNICO primero. Prioriza explicación funcional en pasos claros, evita SQL y detalles internos salvo que luego lo pidan.";
    } else if (preferenciaSalida === "tecnica") {
      systemPrompt += "\n\n## PREFERENCIA DE RESPUESTA DEL USUARIO\n\nEl usuario pidió enfoque TÉCNICO primero. Prioriza causa raíz técnica, diagnóstico y acciones técnicas concretas.";
    }

    // Pre-inyectar artículos KB para queries normales (elimina 1 round-trip de tool)
    if (complejidad === "normal") {
      try {
        const kbPreResults = await buscarArticulos(pregunta.trim(), { limit: 3 });
        if (kbPreResults.length > 0) {
          const kbRelevantes = kbPreResults.filter((a) => (parseFloat(a.relevancia) || 0) > 0.05).slice(0, 2);
          if (kbRelevantes.length > 0) {
            const kbTexto = kbRelevantes
              .map((a) => `### ${a.art_titulo}\n${(a.art_contenido || "").substring(0, 600)}`)
              .join("\n\n");
            systemPrompt += `\n\n## ARTÍCULOS RELEVANTES DE LA BASE DE CONOCIMIENTO\nUsa esta información para responder. Si es suficiente, NO uses herramientas adicionales.\n\n${kbTexto}`;
            articulosPreInyectados = kbRelevantes.map((a) => a.art_id);
          }
        }
      } catch (err) {
        console.error("Error pre-buscando KB:", err.message);
      }
    }

    // Memorias y casos previos: solo para consultas complejas
    if (complejidad === "compleja") {
      try {
        const memoriasRelevantes = await obtenerMemoriasTop({ modulo: contexto_modulo, limite: 3 });
        if (memoriasRelevantes.length > 0) {
          const memTexto = memoriasRelevantes.map((m) =>
            `- [${m.mem_categoria}] ${m.mem_titulo}: ${m.mem_contenido.substring(0, 150)}`
          ).join("\n");
          systemPrompt += `\n\n## MEMORIAS PREVIAS\n${memTexto}`;
        }
      } catch (err) {
        console.error("Error cargando memorias:", err.message);
      }

      try {
        const casosPrevios = await buscarChatsResueltos({
          query: pregunta.trim(),
          limit: 2,
          sessionIdExcluir: sessionId,
        });
        if (casosPrevios.length > 0) {
          const casosTexto = casosPrevios
            .map((c) => `- Caso: ${String(c.chat_pregunta || "").substring(0, 120)}\n  Solución previa: ${String(c.chat_respuesta || "").substring(0, 220)}`)
            .join("\n");
          systemPrompt += `\n\n## CASOS RESUELTOS PREVIOS\n${casosTexto}`;
        }
      } catch (err) {
        console.error("Error cargando casos previos:", err.message);
      }
    }
  }

  let runtimeIa;
  try {
    runtimeIa = await resolveIaRuntime();
  } catch (error) {
    console.error("Error obteniendo runtime IA:", error);
    return res.status(500).json({ ok: false, msg: "No se pudo cargar la configuración del proveedor IA" });
  }

  if (!runtimeIa?.geminiApiKey && !runtimeIa?.deepseekApiKey) {
    return res.status(500).json({
      ok: false,
      msg: "No hay API keys configuradas para el agente IA. Configúralas en Radiografía IA.",
    });
  }

  // ── Routing de modelo por complejidad (Lite → Flash → Pro) ──
  const modeloGeminiSeleccionado = IA_FORCE_FLASH
    ? MODEL_FLASH
    : (complejidad === "simple"
      ? MODEL_LITE
      : (complejidad === "compleja" && rolUsuario !== "soporte"
        ? MODEL_PRO
        : MODEL_FLASH));
  const providerIA = runtimeIa.providerFinal;
  const modeloSeleccionado = providerIA === "deepseek"
    ? MODEL_DEEPSEEK
    : modeloGeminiSeleccionado;

  // ── Tools condicionales por complejidad + rol ──
  // Simple: sin tools (ahorra ~900 tokens)
  // Normal: solo tools de KB (sin SQL/memorias)
  // Compleja: tools completos según rol
  const toolsProhibidasSoporte = ["obtener_queries_sql", "obtener_estructura_tabla", "ejecutar_query", "buscar_memorias", "guardar_memoria"];
  const toolsNormales = ["buscar_articulos", "obtener_articulo", "buscar_por_categoria", "buscar_diagnostico", "buscar_error_exacto", "buscar_historial_resuelto"];
  let toolsDisponibles;
  if (complejidad === "simple") {
    toolsDisponibles = [];
  } else if (complejidad === "normal") {
    const toolsFiltradas = rolUsuario === "soporte"
      ? TOOLS.filter((t) => !toolsProhibidasSoporte.includes(t.name))
      : TOOLS;
    toolsDisponibles = toolsFiltradas.filter((t) => toolsNormales.includes(t.name));
  } else {
    toolsDisponibles = rolUsuario === "soporte"
      ? TOOLS.filter((t) => !toolsProhibidasSoporte.includes(t.name))
      : TOOLS;
  }

  // Configurar headers SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const enviarEvento = (tipo, data) => {
    res.write(`event: ${tipo}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const articulosUsados = [...articulosPreInyectados];
    let respuestaCompleta = "";
    let tokensUsados = 0;
    let tokensInput = 0;
    let tokensOutput = 0;
    const startedAt = Date.now();
    let huboToolCalls = false;
    let ultimaToolRespuesta = null;

    if (providerIA === "deepseek") {
      const messagesDs = construirMensajesDeepseek({ systemPrompt, historial, pregunta, rolUsuario });
      const toolsDs = toolsDisponibles.length > 0 ? convertirToolsADeepseek(toolsDisponibles) : null;
      const toolsPermitidas = new Set(toolsDisponibles.map((t) => t.name));
      let modeloRealDeepseek = modeloSeleccionado;

      let iteraciones = 0;
      while (iteraciones < MAX_ITERACIONES_AGENTE && (Date.now() - startedAt) < MAX_AGENT_TIME_MS) {
        iteraciones++;
        const completion = await llamarDeepseekCompletion({
          apiKey: runtimeIa.deepseekApiKey,
          model: modeloSeleccionado,
          messages: messagesDs,
          outputLimit,
          tools: toolsDs,
          toolChoice: "auto",
        });
        modeloRealDeepseek = completion.model || modeloRealDeepseek;
        tokensUsados += completion.tokens || 0;
        tokensInput += completion.promptTokens || 0;
        tokensOutput += completion.completionTokens || 0;

        const assistantMessage = completion.message || {};
        const textParcial = String(assistantMessage.content || "");
        const toolCallsRaw = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : [];
        const toolCalls = toolCallsRaw.map((tc, idx) => ({
          id: tc?.id || `call_${iteraciones}_${idx}_${Date.now()}`,
          name: tc?.function?.name,
          argumentsRaw: typeof tc?.function?.arguments === "string"
            ? tc.function.arguments
            : JSON.stringify(tc?.function?.arguments || {}),
        }));

        const assistantMsgToStore = {
          role: "assistant",
          content: textParcial,
        };
        if (toolCalls.length > 0) {
          assistantMsgToStore.tool_calls = toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: tc.argumentsRaw,
            },
          }));
        }
        messagesDs.push(assistantMsgToStore);

        if (toolCalls.length === 0) {
          if (textParcial.trim()) {
            respuestaCompleta += textParcial.trim();
            enviarEvento("texto", { chunk: textParcial.trim() });
          }
          break;
        }

        huboToolCalls = true;
        for (let i = 0; i < toolCalls.length; i++) {
          const tc = toolCalls[i] || {};
          const name = tc.name;
          const callId = tc.id;
          const args = parseDeepseekToolArgs(tc.argumentsRaw);

          enviarEvento("tool_start", { tool: name || "desconocida" });
          enviarEvento("tool_ejecutando", { tool: name || "desconocida", input: args });

          let resultado;
          if (!name || !toolsPermitidas.has(name)) {
            resultado = { error: `Tool no permitida o desconocida: ${name || "null"}` };
          } else {
            const resultadoRaw = await ejecutarTool(name, args);
            resultado = truncarResultado(resultadoRaw);
          }

          ultimaToolRespuesta = { tool: name || "desconocida", resultado };

          if (resultado.articulos) {
            resultado.articulos.forEach((a) => {
              if (!articulosUsados.includes(a.id)) articulosUsados.push(a.id);
            });
            enviarEvento("articulos_encontrados", { articulos: resultado.articulos });
          }

          messagesDs.push({
            role: "tool",
            tool_call_id: callId,
            name: name || "tool_desconocida",
            content: recortarTexto(JSON.stringify(resultado), MAX_TOOL_RESULT_CHARS),
          });
        }
      }

      const respuestaBreve = (respuestaCompleta || "").trim().length < MIN_FINAL_RESPONSE_CHARS;
      if (huboToolCalls && respuestaBreve) {
        try {
          const textoUltimaTool = ultimaToolRespuesta
            ? JSON.stringify(ultimaToolRespuesta).slice(0, 1800)
            : "Sin resultados de tools disponibles.";

          const finalCompletion = await llamarDeepseekCompletion({
            apiKey: runtimeIa.deepseekApiKey,
            model: modeloSeleccionado,
            messages: [
              ...messagesDs,
              {
                role: "user",
                content: `Genera SOLO la respuesta final para el usuario, clara y completa, sin usar tools.
Si faltan datos, dilo explícitamente.
Último resultado técnico: ${textoUltimaTool}`,
              },
            ],
            outputLimit: Math.min(outputLimit, 220),
            tools: null,
            toolChoice: null,
          });

          tokensUsados += finalCompletion.tokens || 0;
          tokensInput += finalCompletion.promptTokens || 0;
          tokensOutput += finalCompletion.completionTokens || 0;
          if (finalCompletion.text) {
            respuestaCompleta = finalCompletion.text.trim();
            enviarEvento("texto", { chunk: respuestaCompleta });
          }
        } catch (errFinalDs) {
          console.error("Error generando síntesis final DeepSeek:", errFinalDs.message);
        }
      }

      if (!respuestaCompleta) {
        if ((Date.now() - startedAt) >= MAX_AGENT_TIME_MS) {
          respuestaCompleta = "La consulta alcanzó el tiempo máximo de respuesta. Te dejo el mejor avance disponible hasta ahora.";
        } else {
          respuestaCompleta = "He investigado todo lo posible. Con la información que tengo, te doy mi análisis hasta este punto.";
        }
        enviarEvento("texto", { chunk: respuestaCompleta });
      }

      console.log(`[AGENTE] ${usuarioEmail} | provider: deepseek | modelo: ${modeloRealDeepseek} | complejidad: ${complejidad} | tokens: ${tokensUsados} (in:${tokensInput} out:${tokensOutput}) | costo: $${costoReal.costoTotalUsd.toFixed(6)}`);

      guardarChatHistorial({
        sessionId: sessionId || "anon-" + Date.now(),
        usuario: usuarioEmail,
        pregunta: pregunta.trim(),
        respuesta: respuestaCompleta,
        articulosUsados,
        tokensUsados,
        tokensInput,
        tokensOutput,
        costoUsd: costoReal.costoTotalUsd,
        modelo: modeloRealDeepseek || modeloSeleccionado,
        complejidad,
      }).catch(console.error);

      setCachedResponse(cacheKey, {
        respuestaCompleta,
        articulosUsados,
        modelo: modeloRealDeepseek || modeloSeleccionado,
        complejidad,
      });

      // Guardar en cache DB para queries no-complejas
      if (complejidad !== "compleja") {
        setDbCachedResponse(cacheKey, {
          respuestaCompleta,
          articulosUsados,
          modelo: modeloRealDeepseek || modeloSeleccionado,
          complejidad,
        }).catch(console.error);
      }

      const costoReal = calcularCostoReal(tokensInput, tokensOutput, modeloRealDeepseek || modeloSeleccionado);
      enviarEvento("fin", {
        articulosUsados,
        tokensUsados,
        tokensInput,
        tokensOutput,
        costoUsd: costoReal.costoTotalUsd,
        cacheHit: false,
        modelo: modeloRealDeepseek || modeloSeleccionado,
        complejidad,
        provider: "deepseek",
        mensajeAsistente: {
          role: "assistant",
          content: respuestaCompleta,
        },
      });
      res.end();
      return;
    }

    const genAI = new GoogleGenerativeAI(runtimeIa.geminiApiKey);

    // Config base del modelo Gemini (sin model, se inyecta en streamConFallback)
    const modelBaseConfig = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: convertirToolsAGemini(toolsDisponibles),
      generationConfig: {
        maxOutputTokens: outputLimit,
      },
    };

    // Modelo activo (puede cambiar si hay fallback)
    let modeloActivo = modeloSeleccionado;

    // Construir historial en formato Gemini
    const contents = construirContentsDesdeHistorial({ historial, pregunta, rolUsuario });

    // Loop agéntico: Gemini puede usar múltiples tools antes de responder
    let iteraciones = 0;
    while (iteraciones < MAX_ITERACIONES_AGENTE && (Date.now() - startedAt) < MAX_AGENT_TIME_MS) {
      iteraciones++;
      const streamResult = await streamConFallback(
        genAI, modeloActivo, modelBaseConfig, { contents },
        (nuevoModelo) => {
          console.log(`[FALLBACK] ${modeloActivo} → ${nuevoModelo} por sobrecarga`);
          enviarEvento("info", { msg: `Modelo ${modeloActivo} no disponible, usando ${nuevoModelo}` });
          modeloActivo = nuevoModelo;
        }
      );
      const result = streamResult.result;
      modeloActivo = streamResult.modeloUsado;

      let textoParcial = "";
      const functionCalls = [];

      for await (const chunk of result.stream) {
        const candidate = chunk.candidates?.[0];
        if (!candidate?.content?.parts) continue;

        for (const part of candidate.content.parts) {
          if (part.text) {
            textoParcial += part.text;
          }
          if (part.functionCall) {
            functionCalls.push(part.functionCall);
            enviarEvento("tool_start", { tool: part.functionCall.name });
          }
        }
      }

      // Obtener metadata de tokens (acumular por cada iteración)
      const usageMetadata = (await result.response)?.usageMetadata;
      if (usageMetadata) {
        tokensInput += usageMetadata.promptTokenCount || 0;
        tokensOutput += usageMetadata.candidatesTokenCount || 0;
        tokensUsados += (usageMetadata.candidatesTokenCount || 0) + (usageMetadata.promptTokenCount || 0);
      }

      // Agregar respuesta del modelo al historial
      const modelParts = [];
      if (textoParcial) modelParts.push({ text: textoParcial });
      for (const fc of functionCalls) {
        modelParts.push({ functionCall: { name: fc.name, args: fc.args } });
      }
      if (modelParts.length > 0) {
        contents.push({ role: "model", parts: modelParts });
      }

      // Si no hay function calls, esta es la respuesta final del modelo
      if (functionCalls.length === 0) {
        if (textoParcial) {
          respuestaCompleta += textoParcial;
          enviarEvento("texto", { chunk: textoParcial });
        }
        break;
      }

      // Ejecutar las tools y enviar resultados
      huboToolCalls = true;
      const responseParts = [];
      for (const fc of functionCalls) {
        enviarEvento("tool_ejecutando", { tool: fc.name, input: fc.args });
        const resultadoRaw = await ejecutarTool(fc.name, fc.args);
        const resultado = truncarResultado(resultadoRaw);
        ultimaToolRespuesta = { tool: fc.name, resultado };

        // Trackear artículos usados
        if (resultado.articulos) {
          resultado.articulos.forEach((a) => {
            if (!articulosUsados.includes(a.id)) articulosUsados.push(a.id);
          });
          enviarEvento("articulos_encontrados", { articulos: resultado.articulos });
        }

        responseParts.push({
          functionResponse: {
            name: fc.name,
            response: resultado,
          },
        });
      }

      contents.push({ role: "user", parts: responseParts });
    }

    const respuestaBreve = (respuestaCompleta || "").trim().length < MIN_FINAL_RESPONSE_CHARS;
    if (huboToolCalls && respuestaBreve) {
      try {
        const modelFinal = genAI.getGenerativeModel({
          model: modeloActivo,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: Math.min(outputLimit, 220),
          },
        });

        const textoUltimaTool = ultimaToolRespuesta
          ? JSON.stringify(ultimaToolRespuesta).slice(0, 1800)
          : "Sin resultados de tools disponibles.";

        const finalRes = await modelFinal.generateContent({
          contents: [
            ...contents,
            {
              role: "user",
              parts: [{
                text: `Genera SOLO la respuesta final para el usuario, clara y completa, sin usar tools.
Si faltan datos, dilo explícitamente.
Último resultado técnico: ${textoUltimaTool}`,
              }],
            },
          ],
        });

        const finalText = (finalRes.response?.text?.() || "").trim();
        const finalUsage = finalRes.response?.usageMetadata;
        if (finalUsage) {
          tokensInput += finalUsage.promptTokenCount || 0;
          tokensOutput += finalUsage.candidatesTokenCount || 0;
          tokensUsados += (finalUsage.candidatesTokenCount || 0) + (finalUsage.promptTokenCount || 0);
        }
        if (finalText) {
          respuestaCompleta = finalText;
          enviarEvento("texto", { chunk: finalText });
        }
      } catch (errFinal) {
        console.error("Error generando síntesis final:", errFinal.message);
      }
    }

    // Si agotó iteraciones sin respuesta final, avisar
    if (iteraciones >= MAX_ITERACIONES_AGENTE && !respuestaCompleta) {
      const msgLimite = "He investigado todo lo posible. Con la información que tengo, te doy mi análisis hasta este punto.";
      respuestaCompleta += msgLimite;
      enviarEvento("texto", { chunk: msgLimite });
    }
    if ((Date.now() - startedAt) >= MAX_AGENT_TIME_MS && !respuestaCompleta) {
      const msgTiempo = "La consulta alcanzó el tiempo máximo de respuesta. Te dejo el mejor avance disponible hasta ahora.";
      respuestaCompleta += msgTiempo;
      enviarEvento("texto", { chunk: msgTiempo });
    }

    const costoRealGemini = calcularCostoReal(tokensInput, tokensOutput, modeloActivo);
    console.log(`[AGENTE] ${usuarioEmail} | provider: gemini | modelo: ${modeloActivo}${modeloActivo !== modeloSeleccionado ? ` (fallback de ${modeloSeleccionado})` : ""} | complejidad: ${complejidad} | iteraciones: ${iteraciones} | tokens: ${tokensUsados} (in:${tokensInput} out:${tokensOutput}) | costo: $${costoRealGemini.costoTotalUsd.toFixed(6)}`);

    // Guardar historial en DB
    guardarChatHistorial({
      sessionId: sessionId || "anon-" + Date.now(),
      usuario: usuarioEmail,
      pregunta: pregunta.trim(),
      respuesta: respuestaCompleta,
      articulosUsados,
      tokensUsados,
      tokensInput,
      tokensOutput,
      costoUsd: costoRealGemini.costoTotalUsd,
      modelo: modeloActivo,
      complejidad,
    }).catch(console.error);

    setCachedResponse(cacheKey, {
      respuestaCompleta,
      articulosUsados,
      modelo: modeloActivo,
      complejidad,
    });

    // Guardar en cache DB para queries no-complejas
    if (complejidad !== "compleja") {
      setDbCachedResponse(cacheKey, {
        respuestaCompleta,
        articulosUsados,
        modelo: modeloActivo,
        complejidad,
      }).catch(console.error);
    }

    // Enviar evento de fin
    enviarEvento("fin", {
      articulosUsados,
      tokensUsados,
      tokensInput,
      tokensOutput,
      costoUsd: costoRealGemini.costoTotalUsd,
      cacheHit: false,
      modelo: modeloActivo,
      complejidad,
      provider: "gemini",
      mensajeAsistente: {
        role: "assistant",
        content: respuestaCompleta,
      },
    });

    res.end();
  } catch (error) {
    console.error("Error en agente:", error);
    enviarEvento("error", { msg: "Error interno del agente. Por favor intenta de nuevo." });
    res.end();
  }
};

// Endpoint de prueba sin streaming
const chatSimple = async (req, res) => {
  const { pregunta } = req.body;
  if (!pregunta) {
    return res.status(400).json({ ok: false, msg: "Pregunta requerida" });
  }

  const rolUsuario = req.usuario?.rol || "soporte";
  const usuarioEmail = req.usuario?.email || "anonimo";
  const rateCheck = checkRateLimit(`${usuarioEmail}:${rolUsuario}:simple`);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      ok: false,
      msg: `Has alcanzado el límite de consultas por minuto. Intenta nuevamente en ${rateCheck.retryAfterSec}s.`,
      retryAfterSec: rateCheck.retryAfterSec,
    });
  }

  try {
    const budgetCheck = await checkPresupuestoIa(usuarioEmail);
    if (!budgetCheck.allowed) {
      const tipo = budgetCheck.reason === "global" ? "global mensual" : "por usuario mensual";
      return res.status(429).json({
        ok: false,
        msg: `Se alcanzó el límite de costo ${tipo} de IA. Contacta a un administrador.`,
        budget: budgetCheck,
      });
    }
  } catch (error) {
    console.error("Error validando presupuesto IA (simple):", error);
  }

  const outputLimit = getOutputLimitByRole(rolUsuario);

  try {
    const runtimeIa = await resolveIaRuntime();
    if (!runtimeIa?.geminiApiKey && !runtimeIa?.deepseekApiKey) {
      return res.status(500).json({
        ok: false,
        msg: "No hay API keys configuradas para el agente IA.",
      });
    }

    const complejidadSimple = clasificarConsulta({ rolUsuario, pregunta, historial: [] });
    const modeloGeminiSeleccionado = IA_FORCE_FLASH
      ? MODEL_FLASH
      : (complejidadSimple === "simple"
        ? MODEL_LITE
        : (complejidadSimple === "compleja" && rolUsuario !== "soporte"
          ? MODEL_PRO
          : MODEL_FLASH));
    const providerIA = runtimeIa.providerFinal;
    const modeloSeleccionado = providerIA === "deepseek" ? MODEL_DEEPSEEK : modeloGeminiSeleccionado;

    if (providerIA === "deepseek") {
      const deepseek = await llamarDeepseekCompletion({
        apiKey: runtimeIa.deepseekApiKey,
        model: modeloSeleccionado,
        messages: construirMensajesDeepseek({
          systemPrompt: getSystemPrompt(rolUsuario, complejidadSimple),
          historial: [],
          pregunta,
          rolUsuario,
        }),
        outputLimit,
        tools: null,
        toolChoice: null,
      });

      return res.json({
        ok: true,
        provider: "deepseek",
        modelo: deepseek.model || modeloSeleccionado,
        complejidad: complejidadSimple,
        respuesta: deepseek.text || "",
        tokens: { totalTokens: deepseek.tokens, inputTokens: deepseek.promptTokens, outputTokens: deepseek.completionTokens },
      });
    }

    const genAI = new GoogleGenerativeAI(runtimeIa.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: modeloSeleccionado,
      systemInstruction: { parts: [{ text: getSystemPrompt(rolUsuario, complejidadSimple) }] },
      generationConfig: {
        maxOutputTokens: outputLimit,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: pregunta }] }],
    });

    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata || {};

    res.json({
      ok: true,
      provider: "gemini",
      modelo: modeloSeleccionado,
      complejidad: complejidadSimple,
      respuesta: text,
      tokens: usage,
      costoUsd: calcularCostoReal(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0, modeloSeleccionado).costoTotalUsd,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, msg: "Error al consultar el agente" });
  }
};

module.exports = {
  chatConAgente,
  chatSimple,
  getHistorialSesiones,
  getHistorialSesionDetalle,
  buscarHistorialChats,
};
