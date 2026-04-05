/**
 * Migración: Crea la tabla agente_memorias para el sistema de aprendizaje del agente IA
 * Ejecutar: node database/migrate_memorias.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const migrate = async () => {
  console.log("🧠 Creando tabla agente_memorias...\n");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS agente_memorias (
      mem_id SERIAL PRIMARY KEY,
      mem_categoria VARCHAR(50) NOT NULL DEFAULT 'patron',
      mem_titulo VARCHAR(500) NOT NULL,
      mem_contenido TEXT NOT NULL,
      mem_modulo VARCHAR(100) DEFAULT 'general',
      mem_tags TEXT[] DEFAULT '{}',
      mem_veces_usado INTEGER DEFAULT 0,
      mem_activo BOOLEAN DEFAULT true,
      mem_creado_por VARCHAR(200) DEFAULT 'agente',
      mem_fecha_creacion TIMESTAMP DEFAULT NOW(),
      mem_fecha_ultimo_uso TIMESTAMP
    );

    -- Índice full-text search para búsqueda rápida (solo título + contenido, sin tags para evitar IMMUTABLE issues)
    CREATE INDEX IF NOT EXISTS idx_memorias_fts
      ON agente_memorias
      USING GIN(to_tsvector('spanish', mem_titulo || ' ' || mem_contenido));

    -- Índice por módulo para filtrado rápido
    CREATE INDEX IF NOT EXISTS idx_memorias_modulo ON agente_memorias(mem_modulo) WHERE mem_activo = true;

    -- Índice por categoría
    CREATE INDEX IF NOT EXISTS idx_memorias_categoria ON agente_memorias(mem_categoria) WHERE mem_activo = true;

    -- Índice por uso (para obtener las más usadas)
    CREATE INDEX IF NOT EXISTS idx_memorias_uso ON agente_memorias(mem_veces_usado DESC, mem_fecha_ultimo_uso DESC NULLS LAST) WHERE mem_activo = true;
  `);

  console.log("✅ Tabla agente_memorias creada con índices FTS, módulo, categoría y uso.\n");

  // Seed con memorias iniciales basadas en patrones conocidos del sistema
  const memoriasIniciales = [
    {
      categoria: "patron",
      titulo: "Campos desnormalizados en incidencias",
      contenido: "La tabla incidencia tiene campos desnormalizados como emp_id, emp_nombre, loc_id, loc_nombre directamente en la fila, en vez de solo FK. Esto es por diseño para performance en reportes. Al investigar, los datos están en la misma fila sin necesidad de JOIN a empresa/localidad.",
      modulo: "incidencias",
      tags: ["incidencia", "desnormalizado", "empresa", "localidad"],
    },
    {
      categoria: "patron",
      titulo: "Campos desnormalizados en charla_respuesta",
      contenido: "La tabla charla_respuesta tiene campos desnormalizados: usu_id_jefe, emp_id_jef, emp_nombre_jef, loc_id_jef, loc_nombre_jef. Esto permite generar reportes P5M sin JOINs costosos. El 'jefe' se refiere al responsable jerárquico al momento de la respuesta.",
      modulo: "charlas",
      tags: ["charla", "respuesta", "desnormalizado", "p5m", "jefe"],
    },
    {
      categoria: "solucion",
      titulo: "Fix numeración de incidencias con gaps",
      contenido: "Cuando hay gaps en inc_numero de incidencias (ej: 1,2,5,6), se usa la función fix_numbers(usu_id) de PostgreSQL. Esto renumera las incidencias del usuario de forma consecutiva. Causa común: eliminación manual de registros o rollbacks.",
      modulo: "incidencias",
      tags: ["incidencia", "numeracion", "fix_numbers", "gaps"],
    },
    {
      categoria: "error_comun",
      titulo: "Error al desactivar formulario con actividades activas",
      contenido: "No se puede desactivar un formulario si tiene actividad_seguridad activas vinculadas. Solución: primero desactivar las actividades con UPDATE actividad_seguridad SET acs_activo = false WHERE frm_id = X, luego desactivar el formulario.",
      modulo: "formularios",
      tags: ["formulario", "actividad", "desactivar", "error"],
    },
    {
      categoria: "patron",
      titulo: "Tipos de tarea en el sistema",
      contenido: "tar_tipo: 0 = tarea normal (única vez), 3 = tarea cron (recurrente automática). Las tareas cron se generan automáticamente por un job. Si un usuario reporta tareas duplicadas, verificar si hay tareas cron activas para la misma actividad.",
      modulo: "tareas",
      tags: ["tarea", "tipo", "cron", "recurrente", "duplicada"],
    },
    {
      categoria: "patron",
      titulo: "Validación de nombres únicos con UPPER+TRIM",
      contenido: "Formularios, charlas y otros módulos validan unicidad con UPPER(TRIM(nombre)). Si un usuario reporta 'ya existe', puede ser que haya espacios extras o diferencias de mayúsculas. Query diagnóstico: SELECT * FROM tabla WHERE UPPER(TRIM(campo)) = UPPER(TRIM('valor')).",
      modulo: "general",
      tags: ["validacion", "unico", "upper", "trim", "duplicado"],
    },
    {
      categoria: "diagnostico",
      titulo: "Usuario no ve módulo en el panel",
      contenido: "Si un usuario no ve un módulo, verificar: 1) menu_tipo_usuario para su usu_tipo, 2) que el menú esté activo (men_activo=true), 3) que el usuario tenga el tipo correcto. Query: SELECT m.* FROM menu m JOIN menu_tipo_usuario mtu ON mtu.men_id = m.men_id WHERE mtu.tip_id = X AND m.men_activo = true.",
      modulo: "usuarios",
      tags: ["menu", "permiso", "modulo", "no_ve", "tipo_usuario"],
    },
    {
      categoria: "patron",
      titulo: "Relación actividad_seguridad → tarea → respuesta",
      contenido: "Cadena completa: formulario → actividad_seguridad (frm_id) → tarea (acs_id) → tarea_asignacion (tar_id, usu_id) → tarea_formulario_respuesta (tar_id, frp_id). Para verificar si alguien respondió: buscar en tarea_formulario_respuesta por tar_id + usu_id.",
      modulo: "tareas",
      tags: ["actividad", "tarea", "formulario", "respuesta", "cadena"],
    },
  ];

  for (const mem of memoriasIniciales) {
    const { rows } = await pool.query(
      `SELECT mem_id FROM agente_memorias WHERE LOWER(TRIM(mem_titulo)) = LOWER(TRIM($1))`,
      [mem.titulo]
    );
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO agente_memorias (mem_categoria, mem_titulo, mem_contenido, mem_modulo, mem_tags, mem_creado_por)
         VALUES ($1, $2, $3, $4, $5, 'seed')`,
        [mem.categoria, mem.titulo, mem.contenido, mem.modulo, mem.tags]
      );
      console.log(`  ✅ ${mem.titulo}`);
    } else {
      console.log(`  ⏭️  Ya existe: ${mem.titulo}`);
    }
  }

  console.log(`\n🎉 Migración completada. ${memoriasIniciales.length} memorias iniciales procesadas.`);
  pool.end();
};

migrate().catch((err) => {
  console.error("❌ Error en migración:", err);
  pool.end();
  process.exit(1);
});
