-- ============================================================
-- ARCA SOPORTE - Schema de base de datos
-- Ejecutar en la misma instancia PostgreSQL o en una DB separada
-- ============================================================

-- Extensión para búsqueda full-text en español
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- CATEGORÍAS (módulos del sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_categorias (
  cat_id     SERIAL PRIMARY KEY,
  cat_nombre TEXT    NOT NULL,
  cat_descripcion TEXT,
  cat_icono  TEXT,
  cat_color  TEXT    DEFAULT '#1976d2',
  cat_tipo   TEXT    DEFAULT 'general', -- 'app', 'panel', 'tecnico', 'general'
  cat_orden  INTEGER DEFAULT 0,
  cat_activo BOOLEAN DEFAULT TRUE,
  cat_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ARTÍCULOS DE CONOCIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_articulos (
  art_id          SERIAL PRIMARY KEY,
  art_titulo      TEXT    NOT NULL,
  art_slug        TEXT    UNIQUE,
  art_resumen     TEXT,
  art_contenido   TEXT    NOT NULL,
  art_tipo        TEXT    NOT NULL DEFAULT 'faq', -- 'faq', 'guia', 'tecnico', 'diagnostico'
  art_audiencia   TEXT    DEFAULT 'todos',        -- 'tecnico', 'no_tecnico', 'todos'
  art_categoria_id INTEGER REFERENCES soporte_categorias(cat_id),
  art_tags        TEXT[]  DEFAULT '{}',
  art_vistas      INTEGER DEFAULT 0,
  art_util_si     INTEGER DEFAULT 0,
  art_util_no     INTEGER DEFAULT 0,
  art_activo      BOOLEAN DEFAULT TRUE,
  art_autor       TEXT    DEFAULT 'Sistema',
  art_created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  art_updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice full-text para búsqueda en español
CREATE INDEX IF NOT EXISTS idx_articulos_titulo ON soporte_articulos USING GIN (to_tsvector('spanish', art_titulo));
CREATE INDEX IF NOT EXISTS idx_articulos_contenido ON soporte_articulos USING GIN (to_tsvector('spanish', coalesce(art_resumen,'') || ' ' || art_contenido));

-- ============================================================
-- PASOS DE DIAGNÓSTICO (árbol de decisión)
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_diagnostico_pasos (
  paso_id         SERIAL PRIMARY KEY,
  paso_articulo_id INTEGER REFERENCES soporte_articulos(art_id) ON DELETE CASCADE,
  paso_orden      INTEGER NOT NULL DEFAULT 1,
  paso_pregunta   TEXT    NOT NULL,
  paso_si_id      INTEGER REFERENCES soporte_diagnostico_pasos(paso_id),
  paso_no_id      INTEGER REFERENCES soporte_diagnostico_pasos(paso_id),
  paso_es_solucion BOOLEAN DEFAULT FALSE,
  paso_solucion   TEXT,
  paso_link_articulo INTEGER REFERENCES soporte_articulos(art_id)
);

-- ============================================================
-- MAPEO DE ERRORES DEL SISTEMA (lookup por mensaje exacto)
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_errores (
  err_id          SERIAL PRIMARY KEY,
  err_modulo      TEXT    NOT NULL,        -- 'formulario', 'usuario', 'charla', etc.
  err_mensaje     TEXT    NOT NULL,        -- Mensaje exacto del backend: "Ya existe un formulario con ese nombre"
  err_endpoint    TEXT,                    -- POST /api/formulario, PUT /api/charla/:id, etc.
  err_http_code   INTEGER DEFAULT 400,    -- 400, 401, 404, 500
  err_causa       TEXT    NOT NULL,        -- Causa técnica del error
  err_solucion_tecnica  TEXT,             -- Solución para soporte técnico
  err_solucion_usuario  TEXT,             -- Solución para soporte no técnico (lenguaje simple)
  err_navegacion  TEXT,                   -- Ruta de navegación en panel: "Panel → Formularios → Editar"
  err_query_diagnostico TEXT,             -- Query SQL SELECT para diagnosticar
  err_articulo_id INTEGER REFERENCES soporte_articulos(art_id),
  err_tags        TEXT[]  DEFAULT '{}',
  err_activo      BOOLEAN DEFAULT TRUE,
  err_created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida por mensaje exacto (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_errores_mensaje ON soporte_errores USING GIN (to_tsvector('spanish', err_mensaje));
CREATE INDEX IF NOT EXISTS idx_errores_modulo ON soporte_errores(err_modulo);

-- ============================================================
-- HISTORIAL DEL CHAT CON AGENTE IA
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_chat_historial (
  chat_id         SERIAL PRIMARY KEY,
  chat_session_id TEXT    NOT NULL,
  chat_usuario    TEXT,
  chat_pregunta   TEXT    NOT NULL,
  chat_respuesta  TEXT,
  chat_articulos_usados INTEGER[] DEFAULT '{}',
  chat_tokens_usados    INTEGER DEFAULT 0,
  chat_tokens_input     INTEGER DEFAULT 0,
  chat_tokens_output    INTEGER DEFAULT 0,
  chat_costo_usd        NUMERIC(10,6) DEFAULT 0,
  chat_modelo           TEXT,
  chat_complejidad      TEXT,
  chat_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migración: agregar columnas nuevas si la tabla ya existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'soporte_chat_historial' AND column_name = 'chat_tokens_input') THEN
    ALTER TABLE soporte_chat_historial ADD COLUMN chat_tokens_input INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'soporte_chat_historial' AND column_name = 'chat_tokens_output') THEN
    ALTER TABLE soporte_chat_historial ADD COLUMN chat_tokens_output INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'soporte_chat_historial' AND column_name = 'chat_costo_usd') THEN
    ALTER TABLE soporte_chat_historial ADD COLUMN chat_costo_usd NUMERIC(10,6) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'soporte_chat_historial' AND column_name = 'chat_modelo') THEN
    ALTER TABLE soporte_chat_historial ADD COLUMN chat_modelo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'soporte_chat_historial' AND column_name = 'chat_complejidad') THEN
    ALTER TABLE soporte_chat_historial ADD COLUMN chat_complejidad TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_session ON soporte_chat_historial(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_usuario_fecha ON soporte_chat_historial(chat_usuario, chat_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_historial_fts
  ON soporte_chat_historial
  USING GIN(to_tsvector('spanish', COALESCE(chat_pregunta, '') || ' ' || COALESCE(chat_respuesta, '')));

-- ============================================================
-- LOG DE BÚSQUEDAS (analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_busquedas_log (
  log_id          SERIAL PRIMARY KEY,
  log_query       TEXT    NOT NULL,
  log_resultados  INTEGER DEFAULT 0,
  log_usuario     TEXT,
  log_created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- USUARIOS DEL SISTEMA DE SOPORTE
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_usuarios (
  usu_id       SERIAL PRIMARY KEY,
  usu_nombre   TEXT    NOT NULL,
  usu_email    TEXT    UNIQUE NOT NULL,
  usu_password TEXT    NOT NULL,
  usu_rol      TEXT    DEFAULT 'soporte', -- 'admin', 'soporte_tecnico', 'soporte'
  usu_activo   BOOLEAN DEFAULT TRUE,
  usu_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CONFIGURACIÓN DE LÍMITES DE COSTO IA
-- ============================================================
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

-- ============================================================
-- CACHE DE RESPUESTAS IA (persistente, sobrevive reinicios)
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_cache_respuestas (
  cache_hash          TEXT PRIMARY KEY,
  cache_respuesta     TEXT NOT NULL,
  cache_articulos_ids INTEGER[] DEFAULT '{}',
  cache_complejidad   TEXT DEFAULT 'simple',
  cache_modelo        TEXT,
  cache_created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cache_ttl_seconds   INTEGER DEFAULT 86400
);

CREATE INDEX IF NOT EXISTS idx_cache_created
  ON soporte_cache_respuestas (cache_created_at);

-- ============================================================
-- MEMORIAS DEL AGENTE IA (aprendizaje persistente)
-- ============================================================
CREATE TABLE IF NOT EXISTS agente_memorias (
  mem_id              SERIAL PRIMARY KEY,
  mem_categoria       VARCHAR(50) NOT NULL DEFAULT 'patron', -- 'patron', 'solucion', 'error_comun', 'diagnostico', 'tip'
  mem_titulo          VARCHAR(500) NOT NULL,
  mem_contenido       TEXT NOT NULL,
  mem_modulo          VARCHAR(100) DEFAULT 'general',
  mem_tags            TEXT[] DEFAULT '{}',
  mem_veces_usado     INTEGER DEFAULT 0,
  mem_activo          BOOLEAN DEFAULT true,
  mem_creado_por      VARCHAR(200) DEFAULT 'agente',
  mem_fecha_creacion  TIMESTAMP DEFAULT NOW(),
  mem_fecha_ultimo_uso TIMESTAMP
);

-- Índice full-text search para búsqueda rápida (título + contenido)
CREATE INDEX IF NOT EXISTS idx_memorias_fts
  ON agente_memorias
  USING GIN(to_tsvector('spanish', mem_titulo || ' ' || mem_contenido));

-- Índice por módulo para filtrado rápido
CREATE INDEX IF NOT EXISTS idx_memorias_modulo ON agente_memorias(mem_modulo) WHERE mem_activo = true;

-- Índice por categoría
CREATE INDEX IF NOT EXISTS idx_memorias_categoria ON agente_memorias(mem_categoria) WHERE mem_activo = true;

-- Índice por uso (para obtener las más usadas)
CREATE INDEX IF NOT EXISTS idx_memorias_uso ON agente_memorias(mem_veces_usado DESC, mem_fecha_ultimo_uso DESC NULLS LAST) WHERE mem_activo = true;

-- ============================================================
-- SEED: Categorías iniciales del sistema ARCA
-- ============================================================
INSERT INTO soporte_categorias (cat_nombre, cat_descripcion, cat_icono, cat_color, cat_tipo, cat_orden) VALUES
  ('Usuarios y Acceso',         'Gestión de usuarios, roles, login y contraseñas',             'PersonIcon',        '#1976d2', 'panel',   1),
  ('App Móvil - General',       'Guías generales de uso de la aplicación móvil ARCA',           'PhoneAndroidIcon',  '#388e3c', 'app',     2),
  ('App - Actividades y Tareas','Registro de actividades, calendario y respuestas en la app',   'AssignmentIcon',    '#f57c00', 'app',     3),
  ('App - Incidencias',         'Crear y gestionar incidencias desde la app',                   'WarningIcon',       '#d32f2f', 'app',     4),
  ('App - Inspecciones',        'Crear y registrar inspecciones desde la app',                  'SearchIcon',        '#7b1fa2', 'app',     5),
  ('App - Charlas',             'Ver y responder charlas/capacitaciones en la app',             'SchoolIcon',        '#0288d1', 'app',     6),
  ('Panel - Usuarios',          'Crear, editar y gestionar usuarios desde el panel web',        'ManageAccountsIcon','#1976d2', 'panel',   7),
  ('Panel - Incidencias',       'Gestión completa de incidencias desde el panel',               'WarningAmberIcon',  '#d32f2f', 'panel',   8),
  ('Panel - Inspecciones',      'Gestión de inspecciones desde el panel web',                   'FindInPageIcon',    '#7b1fa2', 'panel',   9),
  ('Panel - Charlas',           'Crear, asignar y reportar charlas desde el panel',             'CastForEducationIcon','#0288d1','panel', 10),
  ('Panel - Tareas',            'Crear y gestionar tareas y calendarios en el panel',           'TaskIcon',          '#f57c00', 'panel',  11),
  ('Panel - Reportes',          'Acceder a reportes LV, OPE, P5M, Ratings y más',              'BarChartIcon',      '#388e3c', 'panel',  12),
  ('Estructura Organizacional', 'Regiones, localidades, áreas, cargos y jerarquía',            'AccountTreeIcon',   '#5d4037', 'panel',  13),
  ('Rankings y Recompensas',    'Rankings, kardex, recompensas e iniciativas',                  'EmojiEventsIcon',   '#fbc02d', 'panel',  14),
  ('Notificaciones',            'Push notifications y emails del sistema',                      'NotificationsIcon', '#0097a7', 'tecnico',15),
  ('Diagnósticos Técnicos',     'Árboles de decisión para problemas comunes del sistema',       'BuildIcon',         '#616161', 'tecnico',16)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TICKETS DE SOPORTE (escalamiento entre roles)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS soporte_ticket_seq START 1;

CREATE TABLE IF NOT EXISTS soporte_tickets (
  tick_id            SERIAL PRIMARY KEY,
  tick_numero        VARCHAR(20) UNIQUE NOT NULL,
  tick_titulo        TEXT NOT NULL,
  tick_descripcion   TEXT,
  tick_estado        VARCHAR(30) DEFAULT 'abierto',
  tick_prioridad     VARCHAR(20) DEFAULT 'media',
  tick_modulo        VARCHAR(100),
  tick_creado_por    INTEGER REFERENCES soporte_usuarios(usu_id),
  tick_asignado_a    INTEGER REFERENCES soporte_usuarios(usu_id),
  tick_chat_session_id VARCHAR(100),
  tick_solucion      TEXT,
  tick_tags          TEXT[] DEFAULT '{}',
  tick_fecha_primera_respuesta TIMESTAMP,
  tick_fecha_resolucion        TIMESTAMP,
  tick_activo        BOOLEAN DEFAULT TRUE,
  tick_created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tick_updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_estado ON soporte_tickets(tick_estado, tick_activo);
CREATE INDEX IF NOT EXISTS idx_tickets_creado_por ON soporte_tickets(tick_creado_por);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado_a ON soporte_tickets(tick_asignado_a);
CREATE INDEX IF NOT EXISTS idx_tickets_modulo ON soporte_tickets(tick_modulo);

-- ============================================================
-- COMENTARIOS EN TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_ticket_comentarios (
  tcom_id         SERIAL PRIMARY KEY,
  tcom_ticket_id  INTEGER REFERENCES soporte_tickets(tick_id) ON DELETE CASCADE,
  tcom_autor_id   INTEGER REFERENCES soporte_usuarios(usu_id),
  tcom_contenido  TEXT NOT NULL,
  tcom_tipo       VARCHAR(30) DEFAULT 'respuesta',
  tcom_es_interno BOOLEAN DEFAULT FALSE,
  tcom_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_comentarios ON soporte_ticket_comentarios(tcom_ticket_id, tcom_created_at);

-- ============================================================
-- HISTORIAL DE ACCIONES EN TICKETS (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS soporte_ticket_historial (
  this_id         SERIAL PRIMARY KEY,
  this_ticket_id  INTEGER REFERENCES soporte_tickets(tick_id) ON DELETE CASCADE,
  this_usuario_id INTEGER REFERENCES soporte_usuarios(usu_id),
  this_accion     VARCHAR(50) NOT NULL,
  this_detalle    TEXT,
  this_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_historial ON soporte_ticket_historial(this_ticket_id, this_created_at);
