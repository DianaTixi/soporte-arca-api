# ARCA Soporte - Sistema de Soporte Interno con Agente IA

Sistema de soporte interno para ARCA con agente de IA (Google Gemini / DeepSeek), base de conocimiento, mapeo de errores, y panel administrativo.

---

## Arquitectura

```
arca/
├── api_soporte/          ← Backend (Node.js + Express + PostgreSQL)
│   ├── controllers/      ← Lógica de negocio
│   ├── database/         ← DB pool, schema, seeds, migrations, repos
│   ├── helpers/          ← Prompts del agente, JWT
│   ├── middlewares/      ← Auth JWT, validación de roles
│   └── routes/           ← Endpoints REST + SSE
│
└── panel_soporte/        ← Frontend (React 18 + Vite + MUI 5)
    └── src/
        ├── api/          ← Axios client + helpers por módulo
        ├── components/   ← Chat, KB, common
        ├── hooks/        ← useAuth, useChat (SSE streaming)
        ├── layouts/      ← MainLayout (sidebar + appbar)
        ├── pages/        ← Todas las páginas (chat, KB, admin, radiografías)
        ├── router/       ← AppRouter, PrivateRoute, AdminRoute, TecnicoRoute
        ├── store/        ← Zustand (authStore)
        └── theme/        ← MUI theme ARCA (#e8244c)
```

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Base de datos | PostgreSQL (FTS en español) |
| IA | Google Gemini 2.5 (Lite/Flash/Pro) + DeepSeek (fallback configurable) |
| Frontend | React 18 + Vite 5 |
| UI | MUI 5 (Material UI) |
| Estado | Zustand |
| Auth | JWT (`x-token` header) |
| Streaming | SSE vía POST (fetch + ReadableStream) |

---

## Modelos de IA y Fallback

### Selección de modelo por complejidad

| Complejidad | Modelo Gemini | Descripción |
|---|---|---|
| `simple` | `gemini-2.5-flash-lite` | Preguntas FAQ, respuestas rápidas sin tools |
| `normal` | `gemini-2.5-flash` | Consultas generales con tools de KB |
| `compleja` | `gemini-2.5-pro` | Consultas técnicas con SQL + memorias (solo si rol != soporte) |

> Si `IA_FORCE_FLASH=true`, todas las consultas usan `gemini-2.5-flash` sin importar complejidad.

### Fallback automático (503/429)

Cuando un modelo retorna error 503 (sobrecarga) o 429 (rate limit), el sistema aplica fallback automático:

```
Intento 1: modelo original
Intento 2: retry mismo modelo (espera 1.5s)
Intento 3: escalar al modelo superior
```

Cadena de escalamiento:
```
flash-lite → flash → pro
```

El modelo real utilizado se registra en el historial y en los logs del servidor:
```
[FALLBACK] gemini-2.5-flash-lite → gemini-2.5-flash por sobrecarga
[AGENTE] user@email | modelo: gemini-2.5-flash (fallback de gemini-2.5-flash-lite) | ...
```

### Provider alternativo: DeepSeek

Si se configura DeepSeek como provider en "Radiografía IA", el sistema usa `deepseek-chat` en lugar de Gemini.

---

## Tablas de la Base de Datos (11 tablas)

| Tabla | Descripción |
|---|---|
| `soporte_categorias` | Categorías/módulos de artículos |
| `soporte_articulos` | Artículos de la base de conocimiento |
| `soporte_diagnostico_pasos` | Árbol de decisión para diagnósticos |
| `soporte_errores` | Mapeo de mensajes de error del sistema ARCA |
| `soporte_chat_historial` | Historial de conversaciones con el agente IA |
| `soporte_busquedas_log` | Log de búsquedas (analytics) |
| `soporte_usuarios` | Usuarios del sistema de soporte |
| `soporte_ia_config` | Configuración global de IA (provider, API keys, límites de costo) |
| `soporte_ia_limite_usuario` | Límites mensuales específicos por usuario |
| `soporte_cache_respuestas` | Cache de respuestas del agente en DB (TTL configurable) |
| `agente_memorias` | Memorias/aprendizajes persistentes del agente IA |

---

## Roles de Usuario

| Rol | Acceso |
|---|---|
| `soporte` | Chat con agente (respuestas funcionales), KB |
| `soporte_tecnico` | Todo de soporte + SQL blocks, herramientas técnicas, radiografías técnicas |
| `admin` | Todo + CRUD artículos/categorías/usuarios + Uso IA (stats) |

---

## Herramientas del Agente IA (function calling)

| Tool | Roles | Descripción |
|---|---|---|
| `buscar_articulos` | Todos | Busca en la base de conocimiento |
| `obtener_queries_sql` | tecnico, admin | Obtiene queries SQL de diagnóstico |
| `ejecutar_query` | tecnico, admin | Ejecuta SELECT read-only contra la DB |
| `buscar_errores` | Todos | Busca errores mapeados por mensaje |
| `buscar_memorias` | tecnico, admin | Busca en memorias aprendidas |
| `guardar_memoria` | tecnico, admin | Guarda un nuevo aprendizaje |

> Las tools se asignan según complejidad: simple (sin tools), normal (solo KB), compleja (todas según rol).

---

## Endpoints de la API

### Auth (`/api/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/login` | No | Login con email + password |
| GET | `/renew` | JWT | Renovar token |

### Artículos (`/api/articulos`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | JWT | Listar artículos |
| GET | `/buscar?q=...` | JWT | Buscar full-text |
| GET | `/slug/:slug` | JWT | Obtener por slug |
| GET | `/:id` | JWT | Obtener por ID |
| POST | `/` | JWT + Admin | Crear artículo |
| PUT | `/:id` | JWT + Admin | Actualizar artículo |
| POST | `/:id/votar` | JWT | Votar útil sí/no |

### Categorías (`/api/categorias`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | JWT | Listar categorías |
| POST | `/` | JWT + Admin | Crear categoría |
| PUT | `/:id` | JWT + Admin | Actualizar categoría |

### Agente IA (`/api/agente`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/chat` | JWT | Chat streaming con agente (SSE) |
| POST | `/chat/simple` | JWT | Chat sin streaming |
| GET | `/historial/sesiones?q=...` | JWT | Lista sesiones (admin ve todas, otros solo propias) |
| GET | `/historial/sesiones/:sessionId` | JWT | Obtiene mensajes de una sesión (admin puede ver cualquier usuario) |
| GET | `/historial/buscar?q=...` | JWT | Busca texto en historial (admin todo, otros solo propios) |

### Stats (`/api/stats`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/ia` | JWT + Admin | Estadísticas completas de uso IA |
| GET | `/ia/limites` | JWT + Admin | Configuración de límites IA + consumo mensual por usuario |
| PUT | `/ia/limites` | JWT + Admin | Actualiza límite global/default y política de bloqueo |
| PUT | `/ia/limites/usuario` | JWT + Admin | Crea/actualiza límite mensual específico de usuario |
| DELETE | `/ia/limites/usuario/:usuario` | JWT + Admin | Desactiva límite específico de usuario |

---

## Páginas del Frontend

| Ruta | Página | Acceso |
|---|---|---|
| `/login` | Login | Público |
| `/chat` | Agente IA (chat) | Todos |
| `/kb` | Base de Conocimiento | Todos |
| `/kb/:slug` | Detalle de artículo | Todos |
| `/radiografia-app` | Radiografía APP | Todos |
| `/radiografia-panel` | Radiografía Panel | Todos |
| `/radiografia-tecnica-app` | Radiografía Técnica APP | Técnico + Admin |
| `/radiografia-tecnica-panel` | Radiografía Técnica Panel | Técnico + Admin |
| `/admin/articulos` | CRUD Artículos | Admin |
| `/admin/categorias` | CRUD Categorías | Admin |
| `/admin/usuarios` | Gestión Usuarios | Admin |
| `/admin/uso-ia` | Dashboard Uso IA | Admin |

---

## Variables de Entorno

### Backend (`api_soporte/.env`)

```env
PORT=4500
SECRET_JWT_SEED=tu_secreto_jwt_aqui

# Base de datos PostgreSQL
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_NAME=arca_soporte
DB_PORT=5432

# Google Gemini API Key (se puede configurar también desde Radiografía IA en el panel)
GEMINI_API_KEY=tu_api_key_gemini

# Modelos Gemini (3 niveles: Lite para FAQ, Flash para normal, Pro para complejo)
GEMINI_MODEL_LITE=gemini-2.5-flash-lite
GEMINI_MODEL_FLASH=gemini-2.5-flash
GEMINI_MODEL_PRO=gemini-2.5-pro

# DeepSeek (provider alternativo, configurable desde panel)
# DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
# DEEPSEEK_MODEL=deepseek-chat

# Forzar Flash para TODAS las consultas (ignora routing por complejidad)
# IA_FORCE_FLASH=true

# Costos Gemini (USD por 1M tokens) - actualizar cuando cambien los precios
GEMINI_COSTO_INPUT=1.25
GEMINI_COSTO_OUTPUT=10.00
GEMINI_PCT_INPUT=0.40
GEMINI_PCT_OUTPUT=0.60

# Guardrails de uso IA
IA_RATE_LIMIT_WINDOW_MS=60000
IA_RATE_LIMIT_MAX_REQUESTS=6
IA_CACHE_TTL_MS=120000
IA_CACHE_MAX_ENTRIES=200
IA_MAX_AGENT_TIME_MS=45000
IA_MAX_ITERACIONES=4
IA_QUERY_TIMEOUT_MS=8000
IA_ESTIMATED_TOKENS_PER_CHAT=2500
IA_MAX_OUTPUT_TOKENS_SOPORTE=220
IA_MAX_OUTPUT_TOKENS_TECNICO=520
IA_MAX_OUTPUT_TOKENS_ADMIN=700
IA_HISTORY_MESSAGES_SOPORTE=2
IA_HISTORY_MESSAGES_TECNICO=5
IA_HISTORY_MESSAGES_ADMIN=5
IA_HISTORY_CHARS_SOPORTE=260
IA_HISTORY_CHARS_TECNICO=750
IA_HISTORY_CHARS_ADMIN=900

# Optimización: responder desde KB sin IA cuando hay match
IA_KB_FAST_PATH_ENABLED=true
IA_KB_FAST_PATH_MAX_RESULTS=4
IA_KB_FAST_PATH_MIN_RELEVANCE=0.08
```

### Frontend (`panel_soporte/.env`)

```env
VITE_API_URL=/api
```

> En producción, cambiar `VITE_API_URL` a la URL completa del backend si están en servidores separados (ej: `https://api-soporte.tudominio.com/api`).

---

## Guía de Despliegue a Producción

### Requisitos Previos

- Node.js >= 18
- PostgreSQL >= 13 (con `postgresql-contrib` para `unaccent`)
- API Key de Google Gemini (https://aistudio.google.com/app/apikey)

### Paso 1: Clonar y configurar

```bash
git clone <tu-repo> arca
cd arca
```

### Paso 2: Crear la base de datos

```bash
psql -U postgres
CREATE DATABASE arca_soporte;
\q
```

### Paso 3: Ejecutar el schema (OBLIGATORIO - hacer primero)

```bash
psql -U postgres -d arca_soporte -f api_soporte/database/schema.sql
```

Esto crea las 11 tablas + índices FTS + categorías iniciales. Incluye migraciones inline (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) para que sea seguro re-ejecutar sobre una DB existente.

**Tablas creadas por schema.sql:**
- `soporte_categorias`
- `soporte_articulos` (+ índices FTS)
- `soporte_diagnostico_pasos`
- `soporte_errores` (+ índice FTS)
- `soporte_chat_historial` (+ migraciones de columnas nuevas)
- `soporte_busquedas_log`
- `soporte_usuarios`
- `soporte_cache_respuestas` (+ índice de expiración)

### Paso 4: Configurar el backend

```bash
cd api_soporte
cp .env.example .env   # Editar con valores reales de producción
npm install --production
```

### Paso 5: Ejecutar migraciones (en este orden)

Las migraciones crean tablas e índices adicionales que **no** están en schema.sql. Todas usan `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`, son idempotentes.

```bash
# 1. Tabla agente_memorias + índices FTS + seed de memorias iniciales
node database/migrate_memorias.js

# 2. Índices para historial de chat (sesiones, búsqueda FTS)
node database/migrate_chat_historial_indices.js

# 3. Tablas de límites de costo IA (soporte_ia_config + soporte_ia_limite_usuario)
#    También agrega columnas de provider y API keys encriptadas
node database/migrate_ia_limits.js
```

### Paso 6: Ejecutar seeds (datos iniciales)

```bash
# Artículos de la base de conocimiento + usuarios iniciales (admin, técnico, soporte)
node database/seed.js

# Mapeo de errores del sistema ARCA (~50 errores mapeados)
node database/seed_errores.js
```

> Todos los seeds usan `ON CONFLICT DO NOTHING`, son seguros de ejecutar múltiples veces.

### Paso 7: Verificar que el backend arranca

```bash
npm start
# Debería mostrar: API Soporte corriendo en puerto 4500
```

Probar: `curl http://localhost:4500/` → `{"ok":true,"msg":"API Soporte ARCA corriendo"}`

### Paso 8: Compilar el frontend

```bash
cd ../panel_soporte

echo "VITE_API_URL=https://tu-api-soporte.com/api" > .env
npm install
npm run build
```

El build genera la carpeta `dist/` lista para servir.

### Paso 9: Servir el frontend

**Opción A — Mismo servidor (Express sirve el frontend):**

```bash
cp -r panel_soporte/dist/* api_soporte/public/
```

Acceder: `http://tu-servidor:4500`

**Opción B — Servidor separado (Nginx):**

```nginx
server {
    listen 80;
    server_name soporte.tudominio.com;
    root /ruta/a/panel_soporte/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4500/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 300s;  # Importante para SSE del agente
    }
}
```

### Paso 10: Proceso en background (PM2)

```bash
npm install -g pm2
cd api_soporte
pm2 start index.js --name "arca-soporte-api"
pm2 save
pm2 startup
```

---

## Orden completo de ejecución para producción (resumen)

```bash
# 1. DB
psql -U postgres -c "CREATE DATABASE arca_soporte;"
psql -U postgres -d arca_soporte -f api_soporte/database/schema.sql

# 2. Backend
cd api_soporte
cp .env.example .env  # editar con valores reales
npm install --production

# 3. Migraciones (orden importa)
node database/migrate_memorias.js
node database/migrate_chat_historial_indices.js
node database/migrate_ia_limits.js

# 4. Seeds
node database/seed.js
node database/seed_errores.js

# 5. Arrancar
npm start  # o pm2 start index.js --name "arca-soporte-api"

# 6. Frontend
cd ../panel_soporte
echo "VITE_API_URL=https://tu-api.com/api" > .env
npm install && npm run build
# Copiar dist/ al servidor web o al public/ del backend
```

---

## Usuarios Iniciales (seed.js)

| Email | Password | Rol |
|---|---|---|
| `admin@arca.com` | `admin123` | admin |
| `tecnico@arca.com` | `tecnico123` | soporte_tecnico |
| `soporte@arca.com` | `soporte123` | soporte |

> **IMPORTANTE:** Cambiar las contraseñas en producción desde el panel de admin o directamente en la DB.

---

## Checklist de Producción

### Base de datos
- [ ] Crear la base de datos PostgreSQL (`arca_soporte`)
- [ ] Ejecutar `schema.sql` (crea 8 tablas base + índices + migraciones inline)
- [ ] Ejecutar `migrate_memorias.js` (tabla `agente_memorias` + seeds)
- [ ] Ejecutar `migrate_chat_historial_indices.js` (índices de historial)
- [ ] Ejecutar `migrate_ia_limits.js` (tablas `soporte_ia_config` + `soporte_ia_limite_usuario`)
- [ ] Ejecutar `seed.js` (artículos KB + usuarios iniciales)
- [ ] Ejecutar `seed_errores.js` (mapeo de errores ~50)

### Backend
- [ ] Configurar `.env` con datos de producción
- [ ] Configurar API Key de Gemini (en `.env` o desde panel "Radiografía IA")
- [ ] Configurar costos de Gemini en `.env` (`GEMINI_COSTO_*`)
- [ ] `npm install --production`
- [ ] `npm start` y verificar que responde en el puerto
- [ ] Configurar PM2 o systemd para auto-restart

### Frontend
- [ ] Configurar `.env` del frontend con URL del API
- [ ] `npm run build`
- [ ] Servir `dist/` (Nginx, Express static, o CDN)
- [ ] Configurar proxy reverso con timeout largo (300s) para SSE

### Verificación
- [ ] Verificar login con usuario admin
- [ ] Cambiar contraseñas de usuarios iniciales
- [ ] Verificar que el chat con agente responde con streaming
- [ ] Verificar que la página "Uso IA" carga datos
- [ ] Verificar que el fallback de modelos funciona (revisar logs)

---

## Troubleshooting

### El agente no responde
- Verificar que `GEMINI_API_KEY` sea válida (o configurada desde Radiografía IA)
- Verificar que el backend tiene acceso a internet
- Revisar logs: `pm2 logs arca-soporte-api`
- Si ves `[FALLBACK]` en los logs, el modelo principal tiene alta demanda — el fallback debería resolverlo automáticamente

### Error 503 / modelo no disponible
- El sistema aplica fallback automático: `flash-lite → flash → pro`
- Si todos los modelos fallan, el error se propaga al usuario
- Verificar en Google AI Studio que tu API key tenga cuota disponible
- Temporalmente puedes forzar un modelo estable: `IA_FORCE_FLASH=true`

### Error de FTS (full-text search)
- Verificar que PostgreSQL tenga el diccionario `spanish`
- Ejecutar: `SELECT to_tsvector('spanish', 'prueba');` — si falla, instalar `postgresql-contrib`

### El frontend no conecta con la API
- Verificar que `VITE_API_URL` apunte al backend correcto
- Verificar que el proxy reverso (Nginx) tenga `proxy_read_timeout 300s` para SSE
- Verificar CORS: el backend ya tiene `app.use(cors())` habilitado

### Tokens/costos no aparecen en "Uso IA"
- Los tokens se guardan en `soporte_chat_historial` (columnas `chat_tokens_*`, `chat_costo_usd`)
- Si el campo es 0, revisar que el controller esté calculando tokens correctamente
- Los costos se calculan con las variables `GEMINI_COSTO_*` del `.env`

---

## Estructura de Archivos del Backend

```
api_soporte/
├── index.js                          ← Entry point, Express server
├── .env                              ← Variables de entorno
├── package.json
├── controllers/
│   ├── agente_controller.js          ← Agente IA (Gemini/DeepSeek + tools + SSE + fallback)
│   ├── articulo_controller.js        ← CRUD artículos KB
│   ├── auth_controller.js            ← Login + renovar JWT
│   ├── categoria_controller.js       ← CRUD categorías
│   └── stats_controller.js           ← Stats de uso IA
├── database/
│   ├── db.js                         ← Pool PostgreSQL
│   ├── schema.sql                    ← Schema completo (tablas base + migraciones inline)
│   ├── seed.js                       ← Seed artículos + usuarios
│   ├── seed_errores.js               ← Seed errores mapeados (~50)
│   ├── migrate_memorias.js           ← Tabla agente_memorias + seed memorias
│   ├── migrate_chat_historial_indices.js ← Índices de historial de chat
│   ├── migrate_ia_limits.js          ← Tablas de límites/config IA
│   └── repositories/
│       ├── articulo_repo.js          ← Queries artículos
│       ├── categoria_repo.js         ← Queries categorías
│       ├── diagnostico_repo.js       ← Queries diagnósticos
│       ├── error_repo.js             ← Queries errores mapeados
│       ├── ia_config_repo.js         ← Queries config IA + límites
│       ├── memoria_repo.js           ← Queries memorias agente
│       └── usuario_repo.js           ← Queries usuarios + chat historial
├── helpers/
│   ├── agente_prompt.js              ← System prompt del agente (dinámico por rol)
│   └── jwt.js                        ← Generar/validar JWT
├── middlewares/
│   ├── validar-jwt.js                ← Middleware auth JWT
│   └── validar-rol.js                ← Middleware validación de roles
└── routes/
    ├── agente_route.js               ← POST /api/agente/chat + historial
    ├── articulo_route.js             ← /api/articulos/*
    ├── auth_route.js                 ← /api/auth/*
    ├── categoria_route.js            ← /api/categorias/*
    └── stats_route.js                ← /api/stats/ia + /api/stats/ia/limites*
```

## Estructura de Archivos del Frontend

```
panel_soporte/
├── index.html
├── vite.config.js                    ← Proxy /api → localhost:4500
├── .env                              ← VITE_API_URL
├── package.json
└── src/
    ├── main.jsx                      ← Entry point React
    ├── App.jsx                       ← Root component
    ├── api/
    │   ├── axiosClient.js            ← Axios con interceptor x-token
    │   ├── authApi.js                ← Login, renovar
    │   ├── agenteApi.js              ← SSE streaming helper
    │   ├── articuloApi.js            ← CRUD artículos
    │   ├── categoriaApi.js           ← CRUD categorías
    │   └── statsApi.js               ← Stats uso IA
    ├── store/
    │   └── authStore.js              ← Zustand: usuario, token, login/logout
    ├── hooks/
    │   ├── useAuth.js                ← Hook de auth
    │   └── useChat.js                ← Hook SSE para chat con agente
    ├── theme/
    │   └── theme.js                  ← MUI theme ARCA (rojo #e8244c)
    ├── router/
    │   ├── AppRouter.jsx             ← Rutas principales
    │   ├── PrivateRoute.jsx          ← Protección por auth
    │   ├── AdminRoute.jsx            ← Protección por rol admin
    │   └── TecnicoRoute.jsx          ← Protección por rol técnico+admin
    ├── layouts/
    │   └── MainLayout.jsx            ← Sidebar + AppBar + Outlet
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── ChatPage.jsx              ← Chat con agente IA (streaming)
    │   ├── KnowledgeBasePage.jsx     ← Explorar artículos KB
    │   ├── ArticleDetailPage.jsx     ← Detalle de artículo
    │   ├── RadiografiaAppPage.jsx    ← Radiografía de la APP
    │   ├── RadiografiaPanelPage.jsx  ← Radiografía del Panel
    │   ├── RadiografiaTecnicaAppPage.jsx   ← Radiografía técnica APP (DB)
    │   ├── RadiografiaTecnicaPanelPage.jsx ← Radiografía técnica Panel (DB)
    │   ├── RadiografiaIAPage.jsx     ← Dashboard uso IA (admin)
    │   └── admin/
    │       ├── ArticulosAdmin.jsx    ← CRUD artículos
    │       ├── CategoriasAdmin.jsx   ← CRUD categorías
    │       └── UsuariosAdmin.jsx     ← Gestión usuarios
    └── components/
        ├── chat/
        │   ├── ChatInput.jsx         ← Input de pregunta
        │   ├── ChatMessage.jsx       ← Burbuja mensaje (markdown + SQL)
        │   ├── ChatToolIndicator.jsx ← "Buscando artículos..."
        │   ├── ArticleCards.jsx      ← Cards artículos encontrados
        │   └── SqlBlock.jsx          ← Bloque SQL con botón copiar
        ├── kb/
        │   ├── ArticleCard.jsx       ← Card artículo en grid
        │   └── SearchBar.jsx         ← Buscador KB
        └── common/
            └── LoadingOverlay.jsx
```
#   a p i - s o p o r t e - a r c a  
 