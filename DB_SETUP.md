# ARCA Soporte - Guia de Base de Datos

Guia para configurar, migrar y seedear la base de datos del sistema de soporte.

---

## Resumen rapido

```bash
# Instalacion limpia (DB nueva)



```bash

# DB existente (actualizar)
CREAR api_soporte/database/schema.sql

cd api_soporte
node database/migrate_memorias.js
node database/migrate_chat_historial_indices.js
node database/migrate_ia_limits.js
node database/seed.js
node database/seed_errores.js
```

---

## 1. Schema (`schema.sql`)

**Archivo:** `database/schema.sql`
**Ejecutar:** `psql -U postgres -d arca_soporte -f database/schema.sql`

Crea TODAS las tablas del sistema. Es idempotente (usa `CREATE TABLE IF NOT EXISTS` y `ADD COLUMN IF NOT EXISTS`).

### Tablas que crea

| Tabla | Que contiene |
|---|---|
| `soporte_categorias` | Categorias de articulos (App, Panel, Tecnico, General) |
| `soporte_articulos` | Articulos de la base de conocimiento (KB) |
| `soporte_diagnostico_pasos` | Arbol de decision para diagnosticos |
| `soporte_errores` | Mapeo de mensajes de error del sistema ARCA |
| `soporte_chat_historial` | Historial de conversaciones con el agente IA |
| `soporte_busquedas_log` | Log de busquedas (analytics) |
| `soporte_usuarios` | Usuarios del sistema de soporte |
| `soporte_ia_config` | Config global de IA (provider, API keys, limites) |
| `soporte_ia_limite_usuario` | Limites mensuales de costo por usuario |
| `soporte_cache_respuestas` | Cache de respuestas del agente en DB |
| `agente_memorias` | Memorias/aprendizajes persistentes del agente |

### Que mas hace

- Crea extension `unaccent` (para busqueda sin tildes)
- Crea indices FTS (full-text search) en español para articulos, errores y memorias
- Inserta 16 categorias iniciales (`ON CONFLICT DO NOTHING`)
- Agrega columnas nuevas a tablas existentes si faltan (migraciones inline con `ADD COLUMN IF NOT EXISTS`)

### Es seguro re-ejecutar?

Si. Todo usa `IF NOT EXISTS` o `ON CONFLICT DO NOTHING`. No borra datos existentes.

---

## 2. Migraciones

Las migraciones son scripts Node.js que crean tablas/indices adicionales. Son necesarias por si la DB fue creada con una version anterior del schema.

**Todas son idempotentes** (seguro re-ejecutar).

### Orden de ejecucion

```bash
cd api_soporte

# 1. Tabla agente_memorias + indices + seed de memorias iniciales
node database/migrate_memorias.js

# 2. Indices de historial de chat (sesiones, busqueda FTS)
node database/migrate_chat_historial_indices.js

# 3. Tablas de limites de costo IA + columnas de provider/API keys
node database/migrate_ia_limits.js
```

### Detalle de cada migracion

#### `migrate_memorias.js`

**Que hace en la DB:**
- `CREATE TABLE IF NOT EXISTS agente_memorias` (con indices FTS, modulo, categoria, uso)
- Inserta ~8 memorias iniciales del agente (patrones conocidos del sistema ARCA)

**Comportamiento en re-ejecucion:**
- La tabla no se recrea si ya existe
- Las memorias se insertan solo si no existe una con el mismo titulo (`LOWER(TRIM(mem_titulo))`)

**Cuando es necesaria:**
- Instalacion nueva
- Si la tabla `agente_memorias` no existe (DB creada con schema antiguo)

---

#### `migrate_chat_historial_indices.js`

**Que hace en la DB:**
- `CREATE INDEX IF NOT EXISTS idx_chat_session` en `chat_session_id`
- `CREATE INDEX IF NOT EXISTS idx_chat_usuario_fecha` en `(chat_usuario, chat_created_at DESC)`
- `CREATE INDEX IF NOT EXISTS idx_chat_historial_fts` (FTS en pregunta + respuesta)

**Comportamiento en re-ejecucion:**
- Los indices no se recrean si ya existen

**Cuando es necesaria:**
- Instalacion nueva
- Si el historial de chat es lento en busquedas o listado de sesiones

---

#### `migrate_ia_limits.js`

**Que hace en la DB:**
- `CREATE TABLE IF NOT EXISTS soporte_ia_config` (config global: limites, provider, API keys)
- `CREATE TABLE IF NOT EXISTS soporte_ia_limite_usuario` (limites por usuario)
- `ALTER TABLE soporte_ia_config ADD COLUMN IF NOT EXISTS cfg_agente_provider`
- `ALTER TABLE soporte_ia_config ADD COLUMN IF NOT EXISTS cfg_gemini_api_key_enc`
- `ALTER TABLE soporte_ia_config ADD COLUMN IF NOT EXISTS cfg_deepseek_api_key_enc`
- `INSERT INTO soporte_ia_config (cfg_id) VALUES (1) ON CONFLICT DO NOTHING` (fila singleton)

**Comportamiento en re-ejecucion:**
- Las tablas no se recrean, las columnas se agregan solo si faltan

**Cuando es necesaria:**
- Instalacion nueva
- Si quieres configurar provider IA o limites de costo desde el panel

---

## 3. Seeds (datos iniciales)

Los seeds insertan datos de contenido. No tocan la estructura de tablas.

### `seed.js`

**Ejecutar:** `node database/seed.js`

**Que inserta:**
- ~100+ articulos de la base de conocimiento (guias, FAQ, diagnosticos)
- 3 usuarios iniciales:
  | Email | Password | Rol |
  |---|---|---|
  | `admin@arca.com` | `admin123` | admin |
  | `tecnico@arca.com` | `tecnico123` | soporte_tecnico |
  | `soporte@arca.com` | `soporte123` | soporte |

**Comportamiento en re-ejecucion:**
- Articulos: `ON CONFLICT (art_slug) DO UPDATE` — **actualiza** titulo, contenido, resumen, tags, tipo si el slug ya existe
- Usuarios: `ON CONFLICT (usu_email) DO NOTHING` — **no** sobreescribe usuarios existentes (no resetea passwords cambiados)

**IMPORTANTE para produccion:**
- Cambiar las contraseñas desde el panel o directamente en la DB despues de la primera ejecucion
- Si re-ejecutas, los articulos se actualizan pero los usuarios no se tocan

---

### `seed_errores.js`

**Ejecutar:** `node database/seed_errores.js`

**Que inserta:**
- ~50 mensajes de error mapeados del sistema ARCA
- Cada error incluye: modulo, mensaje exacto, endpoint, causa, solucion tecnica, solucion para usuario, navegacion en el panel, y query de diagnostico

**Comportamiento en re-ejecucion:**
- `ON CONFLICT DO NOTHING` — no duplica ni actualiza errores existentes
- Para actualizar un error existente, hay que borrarlo primero manualmente o editarlo desde la DB

---

## 4. Escenarios comunes

### Instalacion limpia (primera vez)

```bash
# 1. Crear DB
psql -U postgres -c "CREATE DATABASE arca_soporte;"

# 2. Schema (crea todas las tablas)
psql -U postgres -d arca_soporte -f database/schema.sql

# 3. Migraciones (indices extra + memorias + config IA)
node database/migrate_memorias.js
node database/migrate_chat_historial_indices.js
node database/migrate_ia_limits.js

# 4. Seeds (articulos + usuarios + errores)
node database/seed.js
node database/seed_errores.js
```

### Actualizar articulos de la KB

Si modificaste `seed.js` con articulos nuevos o actualizados:

```bash
node database/seed.js
```

Los articulos se actualizan por `art_slug` (upsert). Los usuarios no se tocan.

### Actualizar errores mapeados

Si agregaste nuevos errores en `seed_errores.js`:

```bash
node database/seed_errores.js
```

Solo inserta errores nuevos. Los existentes no se modifican.

### Agregar memorias al agente

Si agregaste nuevas memorias en `migrate_memorias.js`:

```bash
node database/migrate_memorias.js
```

Solo inserta memorias cuyo titulo no exista. Las existentes no se tocan.

### Actualizar schema (nueva version del codigo)

Si el schema.sql tiene cambios (nuevas tablas, columnas, indices):

```bash
psql -U postgres -d arca_soporte -f database/schema.sql
node database/migrate_memorias.js
node database/migrate_chat_historial_indices.js
node database/migrate_ia_limits.js
```

Todo es idempotente. No hay riesgo de perdida de datos.

### Resetear la DB completamente

```bash
psql -U postgres -c "DROP DATABASE arca_soporte;"
psql -U postgres -c "CREATE DATABASE arca_soporte;"
psql -U postgres -d arca_soporte -f database/schema.sql
node database/migrate_memorias.js
node database/migrate_chat_historial_indices.js
node database/migrate_ia_limits.js
node database/seed.js
node database/seed_errores.js
```

Esto borra TODO (historial de chat, memorias aprendidas, config IA, cache) y empieza de cero.

---

## 5. Verificacion

Despues de ejecutar todo, verificar que las tablas existen:

```sql
-- Conectar a la DB
psql -U postgres -d arca_soporte

-- Verificar tablas (deben ser 11)
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar categorias (deben ser 16)
SELECT count(*) FROM soporte_categorias;

-- Verificar articulos
SELECT count(*) FROM soporte_articulos;

-- Verificar errores mapeados
SELECT count(*) FROM soporte_errores;

-- Verificar memorias del agente
SELECT count(*) FROM agente_memorias;

-- Verificar usuarios
SELECT usu_email, usu_rol FROM soporte_usuarios;

-- Verificar config IA (debe tener 1 fila)
SELECT * FROM soporte_ia_config;

-- Verificar FTS funciona
SELECT to_tsvector('spanish', 'prueba de busqueda');
```

---

## 6. Estructura de archivos de DB

```
database/
├── db.js                             ← Pool de conexion PostgreSQL
├── schema.sql                        ← Schema completo (EJECUTAR PRIMERO)
├── migrate_memorias.js               ← Tabla agente_memorias + seed memorias
├── migrate_chat_historial_indices.js ← Indices de historial de chat
├── migrate_ia_limits.js              ← Tablas de config/limites IA
├── seed.js                           ← Seed articulos KB + usuarios
├── seed_errores.js                   ← Seed errores mapeados (~50)
└── repositories/                     ← Queries organizadas por entidad
    ├── articulo_repo.js
    ├── categoria_repo.js
    ├── diagnostico_repo.js
    ├── error_repo.js
    ├── ia_config_repo.js
    ├── memoria_repo.js
    └── usuario_repo.js
```

---

## 7. Notas importantes

- **schema.sql siempre va primero.** Las migraciones y seeds dependen de que las tablas base existan.
- **Las migraciones van antes de los seeds.** `seed.js` necesita `soporte_categorias` (creada por schema), y `migrate_memorias.js` necesita la tabla `agente_memorias`.
- **No hay orden entre seeds.** `seed.js` y `seed_errores.js` son independientes entre si.
- **La DB es la misma instancia que api_arca** (`arca_feb_2026` en desarrollo). En produccion puede ser una DB separada o la misma, segun conveniencia.
- **Los passwords se hashean con bcrypt** (salt rounds = 10). Si necesitas resetear un password manualmente:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('nuevoPassword123', 10))"
  # Copiar el hash y hacer UPDATE en la DB
  ```
- **La config IA es una tabla singleton** (`soporte_ia_config` siempre tiene 1 fila con `cfg_id = 1`). Se configura desde el panel en "Radiografia IA" o directamente en la DB.
