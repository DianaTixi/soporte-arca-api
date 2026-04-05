/**
 * Seed inicial de artículos para la base de conocimiento ARCA Soporte
 * Ejecutar: node database/seed.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const pool = require("./db");

const articulos = [
  // ─── APP MÓVIL - GENERAL ───────────────────────────────────────
  {
    titulo: "¿Cómo iniciar sesión en la app ARCA?",
    slug: "como-iniciar-sesion-app",
    resumen: "Pasos para iniciar sesión correctamente en la aplicación móvil ARCA",
    contenido: `## Iniciar sesión en la app ARCA

### Pasos:
1. Abre la aplicación ARCA en tu celular
2. Ingresa tu **correo electrónico** (el mismo con el que te registraron)
3. Ingresa tu **contraseña** (te la proporcionó tu líder o administrador)
4. Toca el botón **"Iniciar sesión"**

### ¿Olvidaste tu contraseña?
- Toca el enlace **"¿Olvidaste tu contraseña?"** en la pantalla de login
- Ingresa tu correo electrónico
- Recibirás un correo con instrucciones para restablecer tu contraseña

### Problemas frecuentes:
- **"Credenciales inválidas"**: Verifica que el correo y contraseña sean correctos. Las mayúsculas y minúsculas importan en la contraseña.
- **"Usuario inactivo"**: Contacta a tu administrador para que active tu cuenta en el panel.
- **"Versión desactualizada"**: Actualiza la app desde la Play Store o App Store.

### ¿Dónde está mi usuario?
Tu correo de usuario te lo debe proporcionar tu líder directo o el administrador del sistema.`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 2,
    tags: ["login", "acceso", "contraseña", "app"],
  },
  {
    titulo: "Actualizar la aplicación ARCA",
    slug: "actualizar-app-arca",
    resumen: "Cómo actualizar la app ARCA a la versión más reciente",
    contenido: `## Cómo actualizar la app ARCA

### En Android (Play Store):
1. Abre la **Play Store** en tu celular
2. Toca el ícono de tu perfil (arriba a la derecha)
3. Selecciona **"Gestionar apps y dispositivos"**
4. Busca **"ARCA"** en la lista de actualizaciones pendientes
5. Toca **"Actualizar"**

### En iOS (App Store):
1. Abre el **App Store**
2. Toca tu foto de perfil (arriba a la derecha)
3. Desplázate hasta **"Próximas actualizaciones automáticas"**
4. Busca **ARCA** y toca **"Actualizar"**

### ¿Cuándo debo actualizar?
- Cuando la app te muestre un aviso de "versión desactualizada" al iniciar sesión
- Cuando tu líder o administrador te indique que hay una nueva versión
- Si experimentas errores o la app se cierra inesperadamente

> **Nota:** Si después de actualizar sigues con problemas, cierra sesión completamente y vuelve a iniciar sesión.`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 2,
    tags: ["actualización", "play store", "app store", "versión"],
  },

  // ─── APP - INCIDENCIAS ──────────────────────────────────────────
  {
    titulo: "Cómo registrar una incidencia en la app",
    slug: "registrar-incidencia-app",
    resumen: "Guía paso a paso para reportar una incidencia desde la app móvil",
    contenido: `## Registrar una incidencia desde la app

### ¿Qué es una incidencia?
Una incidencia es cualquier evento o situación que represente un riesgo para la seguridad, salud o integridad de las personas o instalaciones.

### Pasos para registrar:
1. En el menú principal de la app, toca **"+"** o **"Nueva incidencia"**
2. Completa los campos requeridos:
   - **Tipo de incidencia**: Selecciona la categoría correspondiente
   - **Descripción**: Describe brevemente lo ocurrido
   - **Fecha y hora**: Se llena automáticamente, puedes modificarla
   - **Localización**: Indica el área donde ocurrió
3. **Agregar fotografía** (recomendado):
   - Toca **"Agregar foto"**
   - Puedes tomar una foto nueva o seleccionar de la galería
   - Agrega hasta 5 fotos por incidencia
4. Revisa la información y toca **"Guardar"** o **"Registrar"**

### Después de registrar:
- Recibirás una confirmación en pantalla
- Se enviará una notificación al responsable del área
- La incidencia quedará en estado "Activa" hasta ser gestionada

### Problemas al registrar:
- **"Error al subir foto"**: Verifica que tengas conexión a internet y permisos de cámara activados
- **"No se puede guardar"**: Asegúrate de completar todos los campos obligatorios (marcados con *)`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 4,
    tags: ["incidencia", "registrar", "foto", "app", "reporte"],
  },

  // ─── APP - CHARLAS ──────────────────────────────────────────────
  {
    titulo: "Cómo ver y responder una charla en la app",
    slug: "ver-responder-charla-app",
    resumen: "Guía para visualizar y completar charlas de capacitación asignadas",
    contenido: `## Ver y responder charlas desde la app

### ¿Qué es una charla?
Las charlas son capacitaciones o comunicados que tu empresa asigna para que los revises. Pueden incluir videos, textos y preguntas de evaluación.

### Pasos para ver tus charlas:
1. En el menú de la app, toca **"Charlas"** o busca el ícono correspondiente
2. Verás la lista de charlas **pendientes** (sin responder)
3. Toca la charla que deseas revisar
4. Lee o mira el contenido de la charla
5. Responde las preguntas al final (si las tiene)
6. Toca **"Finalizar"** o **"Enviar respuesta"**

### ¿Por qué no veo la charla que me dijeron?
- La charla puede no estar asignada a tu usuario. Contacta a tu líder.
- Verifica que tengas conexión a internet
- Cierra sesión y vuelve a iniciar para sincronizar

### ¿Ya respondí pero no me aparece como completada?
- Verifica que hayas tocado **"Finalizar"** al terminar
- Con conexión, los datos se sincronizan automáticamente
- Si el problema persiste, notifica a tu administrador con la fecha en que la respondiste

### Mis charlas vencidas:
Las charlas tienen fecha límite. Si vence el plazo, comunícate con tu líder para que pueda gestionar una extensión desde el panel.`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 6,
    tags: ["charla", "capacitación", "responder", "video", "app"],
  },

  // ─── PANEL - USUARIOS ──────────────────────────────────────────
  {
    titulo: "Cómo crear un nuevo usuario en el panel",
    slug: "crear-usuario-panel",
    resumen: "Pasos para crear y configurar un nuevo usuario desde el panel administrativo",
    contenido: `## Crear un nuevo usuario en el panel ARCA

### Acceso requerido:
Debes tener rol de **Administrador** o **Líder** con permisos de gestión de usuarios.

### Pasos:
1. En el panel web, ve a **"Usuarios"** en el menú lateral
2. Selecciona el tipo: **Seguridad**, **Salud** o **Comercial**
3. Haz clic en **"Nuevo usuario"** o el botón **"+"**
4. Completa el formulario:
   - **Nombre completo**: Nombre y apellido del usuario
   - **Correo electrónico**: Email corporativo (será el usuario de login)
   - **Contraseña temporal**: Se puede enviar por correo automáticamente
   - **Cargo**: Selecciona de la lista disponible
   - **Área**: El área organizacional a la que pertenece
   - **Localidad**: La localidad asignada
   - **Región**: Se llena automáticamente según la localidad
5. Haz clic en **"Guardar"** o **"Crear usuario"**

### Asignar usuario a localidad:
Si necesitas asignar el usuario a una localidad específica:
1. Busca el usuario en la lista
2. Haz clic en **"Editar"** o en el nombre del usuario
3. En la pestaña **"Asignaciones"**, selecciona la localidad
4. Guarda los cambios

### Creación masiva (bulk):
Para crear múltiples usuarios a la vez:
1. Ve a **"Usuarios"** → **"Carga masiva"** o **"Importar"**
2. Descarga la plantilla Excel
3. Completa la plantilla con los datos de los usuarios
4. Sube el archivo y confirma la importación

### Problemas frecuentes:
- **"Email ya registrado"**: El correo ya existe en el sistema. Busca el usuario para verificar si está inactivo.
- **"Campos requeridos"**: Verifica que todos los campos marcados con * estén completos`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuario", "crear", "panel", "administrador", "nuevo"],
  },

  {
    titulo: "Cómo restablecer la contraseña de un usuario",
    slug: "restablecer-contrasena-usuario",
    resumen: "Procedimiento para resetear o cambiar la contraseña de un usuario desde el panel",
    contenido: `## Restablecer contraseña de un usuario

### Desde el panel administrativo:

#### Opción 1 - Restablecer contraseña directamente:
1. Ve a **"Usuarios"** → busca el usuario por nombre o correo
2. Haz clic en el usuario o en el ícono de **"Editar"**
3. Busca la opción **"Cambiar contraseña"** o **"Restablecer contraseña"**
4. Ingresa la nueva contraseña temporal
5. Guarda los cambios
6. Comunica la nueva contraseña al usuario por un canal seguro

#### Opción 2 - Enviar correo de restablecimiento:
1. En la lista de usuarios, encuentra el usuario afectado
2. Haz clic en las opciones (⋮) o en el ícono de **"Enviar correo"**
3. Selecciona **"Enviar link de recuperación"**
4. El usuario recibirá un correo con un enlace para crear su nueva contraseña

### Requisitos de contraseña:
- Mínimo 8 caracteres
- Debe incluir letras y números
- Se distinguen mayúsculas y minúsculas

### El usuario dice que no le llegó el correo:
1. Verifica que el correo del usuario esté correcto en el sistema
2. Pídele que revise la carpeta de **Spam** o **Correo no deseado**
3. Si el correo del sistema está fallando, restablece la contraseña directamente desde el panel`,
    tipo: "faq",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["contraseña", "reset", "password", "usuario", "panel"],
  },

  // ─── PANEL - CHARLAS ───────────────────────────────────────────
  {
    titulo: "Cómo crear y asignar una charla desde el panel",
    slug: "crear-asignar-charla-panel",
    resumen: "Guía completa para crear charlas de capacitación y asignarlas a grupos de usuarios",
    contenido: `## Crear y asignar charlas desde el panel

### Crear una nueva charla:
1. Ve al menú **"Charlas"** en el panel
2. Haz clic en **"Nueva charla"** o **"+"**
3. Completa la información:
   - **Título**: Nombre descriptivo de la charla
   - **Descripción**: Resumen del contenido
   - **Tipo**: Seguridad, Salud o Comercial
   - **Fecha de inicio y fin**: Período en que estará activa
   - **Contenido**: Puedes agregar texto, enlace de video o preguntas
4. Agrega **preguntas de evaluación** (opcional):
   - Haz clic en **"Agregar pregunta"**
   - Escribe la pregunta y las opciones de respuesta
   - Marca la respuesta correcta
5. Haz clic en **"Guardar"** o **"Crear"**

### Asignar la charla a usuarios:
1. Encuentra la charla en la lista
2. Haz clic en **"Asignar"** o en el ícono correspondiente
3. Selecciona los destinatarios:
   - Por **región** o **localidad** (asigna a todos los usuarios de esa área)
   - Por **área** o **cargo** específico
   - O selecciona usuarios **individualmente**
4. Confirma la asignación

### Ver quién completó la charla:
1. Abre la charla desde la lista
2. Ve a la pestaña **"Respuestas"** o **"Asistentes"**
3. Verás la lista de usuarios asignados con su estado:
   - ✅ **Completada**: El usuario respondió
   - ⏳ **Pendiente**: Aún no ha respondido
   - ❌ **Sin acceso**: Problemas de asignación

### Reportes de charlas:
Para ver reportes de cumplimiento:
- Panel → **"Reportes"** → **"Reporte de Charlas"**
- Filtra por fecha, región, localidad o tipo de charla
- Descarga en formato Excel`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 10,
    tags: ["charla", "crear", "asignar", "capacitación", "panel"],
  },

  // ─── PANEL - REPORTES ──────────────────────────────────────────
  {
    titulo: "Tipos de reportes disponibles en el panel",
    slug: "tipos-reportes-panel",
    resumen: "Descripción de todos los reportes disponibles en el panel administrativo ARCA",
    contenido: `## Reportes disponibles en ARCA

### Acceso a reportes:
Panel web → **"Reportes"** (menú lateral)

### Tipos de reportes:

#### 📊 Reporte LV (Lecciones de Vida)
- **Qué muestra**: Incidencias críticas documentadas como aprendizajes
- **Filtros**: Fecha, región, tipo de incidencia
- **Formatos**: Vista en panel, descarga Excel/PDF

#### 📋 Reporte OPE (Operacional)
- **Qué muestra**: Métricas operacionales y de seguridad por área
- **Filtros**: Fecha, región, localidad
- **Uso**: Reuniones de gestión y seguimiento operativo

#### 📈 Reporte P5M - Seguridad
- **Qué muestra**: Indicadores de las 5M (Mano de obra, Máquina, Material, Método, Medio)
- **Filtros**: Mes, región, área
- **Uso**: Análisis mensual de causas raíz

#### 💼 Reporte P5M - Comercial
- Similar al P5M de Seguridad pero para el área comercial

#### ⭐ Reporte Ratings - Seguridad
- **Qué muestra**: Calificaciones de inspecciones y actividades
- **Filtros**: Período, localidad, evaluador

#### ⭐ Reporte Ratings - Comercial
- Similar al de Seguridad para el área comercial

#### 🎓 Reporte de Charlas
- **Qué muestra**: Cumplimiento de charlas por usuario y área
- **Filtros**: Fecha, región, tipo de charla, estado (completada/pendiente)
- **Uso**: Seguimiento de capacitaciones obligatorias

#### 📅 Reporte de Actividades
- **Qué muestra**: Actividades registradas por usuario y período
- **Filtros**: Fecha, usuario, área, tipo de actividad

### Cómo generar un reporte:
1. Ve a **"Reportes"** en el menú
2. Selecciona el tipo de reporte
3. Configura los **filtros** (fechas, región, etc.)
4. Haz clic en **"Generar"** o **"Buscar"**
5. Para descargar: haz clic en el ícono de Excel o PDF`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["reportes", "LV", "OPE", "P5M", "ratings", "charlas", "Excel", "panel"],
  },

  // ─── DIAGNÓSTICOS ──────────────────────────────────────────────
  {
    titulo: "Diagnóstico: Usuario no recibe notificaciones push",
    slug: "diagnostico-notificaciones-push",
    resumen: "Árbol de diagnóstico para resolver problemas de notificaciones push en la app ARCA",
    contenido: `## Diagnóstico: Notificaciones push no llegan

### Paso 1 - Verificar configuración del celular
**¿Las notificaciones están habilitadas en el celular?**

- **Android**: Configuración → Apps → ARCA → Notificaciones → Verificar que estén activadas
- **iOS**: Configuración → ARCA → Notificaciones → Permitir notificaciones = ON

Si estaban desactivadas: actívalas y pide al usuario que abra la app. El problema debería resolverse.

---

### Paso 2 - Verificar estado del token Firebase
El token de notificaciones se renueva cuando el usuario inicia sesión.

**Solución**: Pide al usuario que:
1. Cierre sesión en la app (Perfil → Cerrar sesión)
2. Vuelva a iniciar sesión
3. Espere 2-3 minutos y prueba enviando una notificación de prueba

---

### Paso 3 - Verificar conexión a internet
Las notificaciones requieren conexión a internet para llegar.

- Pide al usuario que verifique WiFi o datos móviles
- Desactiva y activa el modo avión brevemente
- Las notificaciones pendientes pueden llegar con retraso cuando se restaura la conexión

---

### Paso 4 - Verificar "No molestar" / "Enfoque"
- **Android**: Verificar que el modo "No molestar" no esté activo
- **iOS**: Verificar que el "Modo Enfoque" no bloquee las notificaciones de ARCA

---

### Paso 5 - Verificar desde el panel si el usuario recibió notificaciones
1. Panel → Notificaciones → buscar por usuario y fecha
2. Si aparece como "enviada" pero el usuario no la recibió, el problema es del dispositivo
3. Si no aparece en el sistema, el problema es de configuración del servidor

---

### Paso 6 - Escalamiento técnico
Si ningún paso anterior resuelve el problema:
- Registra el modelo del celular y versión de Android/iOS
- Registra la versión de la app ARCA instalada
- Escala al equipo técnico con esta información`,
    tipo: "diagnostico",
    audiencia: "tecnico",
    categoriaId: 15,
    tags: ["notificaciones", "push", "firebase", "diagnóstico", "no llega"],
  },
  {
    titulo: "Diagnóstico: Usuario no puede iniciar sesión",
    slug: "diagnostico-login-fallido",
    resumen: "Pasos para resolver problemas de inicio de sesión en la app y panel ARCA",
    contenido: `## Diagnóstico: Login fallido

### Paso 1 - Verificar que el usuario exista
1. Panel → Usuarios → Buscar por correo exacto
2. **¿El usuario aparece en el sistema?**
   - **NO**: El usuario no ha sido creado. Crearlo siguiendo la guía de creación de usuarios.
   - **SÍ**: Continúa al paso 2.

---

### Paso 2 - Verificar que el usuario esté activo
En el resultado de la búsqueda, verifica el campo **"Estado"** o **"Activo"**:
- **Inactivo**: Activa al usuario → Editar → cambiar estado a Activo → Guardar
- **Activo**: Continúa al paso 3.

---

### Paso 3 - Verificar el tipo de usuario
Asegúrate de que el usuario esté intentando iniciar sesión en la plataforma correcta:
- **Usuarios de Seguridad/Salud**: login normal
- **Usuarios Comerciales**: pueden tener un endpoint diferente
- En la app, verificar que seleccione el tipo correcto en el login si aplica

---

### Paso 4 - Problema de contraseña
1. Pide al usuario que verifique el Bloq Mayús
2. La contraseña distingue mayúsculas/minúsculas
3. Si olvidó la contraseña: **Restablecer contraseña** desde el panel
   - Panel → Usuarios → Buscar usuario → Editar → Cambiar contraseña

---

### Paso 5 - Versión desactualizada de la app
Si el error dice "Versión desactualizada" o "Actualiza la app":
1. Ir a Play Store o App Store
2. Actualizar la app ARCA
3. Intentar iniciar sesión nuevamente

---

### Paso 6 - Problema de servidor o red
- Verificar que el servidor esté activo (endpoint /api/auth/login devuelve respuesta)
- Verificar conectividad del usuario a internet
- Si el servidor está caído, escalar al equipo técnico`,
    tipo: "diagnostico",
    audiencia: "tecnico",
    categoriaId: 1,
    tags: ["login", "sesión", "diagnóstico", "acceso", "contraseña", "error"],
  },

  // ─── PANEL - FORMULARIOS (NO TÉCNICO) ─────────────────────────
  {
    titulo: "Errores al crear un formulario en el panel",
    slug: "errores-crear-formulario-panel",
    resumen: "Qué hacer cuando aparece un error al intentar crear un formulario desde el panel administrativo",
    contenido: `## Errores al crear un formulario

### ¿Dónde se crean los formularios?
Panel → menú lateral → **Formularios** (o Configuración → Formularios) → botón **"Nuevo formulario"**

---

### Error: "Los campos tipo, nombre y activo son obligatorios"
**¿Qué pasó?** No se completaron todos los campos requeridos.

**Solución:**
1. Verifica que hayas escrito el **nombre** del formulario
2. Selecciona el **tipo** (Tipo 1 con segmentos, o Tipo 2 sin segmentos)
3. Asegúrate de que el campo **activo** esté marcado (SÍ o NO)
4. Intenta guardar de nuevo

---

### Error: "Los campos detalleSegmento son obligatorios con tipo 1"
**¿Qué pasó?** Creaste un formulario de Tipo 1 pero no le agregaste segmentos.

**Solución:**
1. En el formulario de tipo 1, debes agregar **al menos un segmento** con sus preguntas
2. Haz clic en **"Agregar segmento"** y complétalo
3. Dentro del segmento, agrega **al menos una pregunta**
4. Intenta guardar de nuevo

---

### Error: "Los campos preguntas son obligatorios con tipo 2"
**¿Qué pasó?** Creaste un formulario de Tipo 2 pero sin preguntas.

**Solución:**
1. Un formulario de Tipo 2 necesita **al menos una pregunta directa**
2. Haz clic en **"Agregar pregunta"** y complétala
3. Intenta guardar de nuevo

---

### Error: "Ya existe un formulario con ese nombre"
**¿Qué pasó?** El nombre que escribiste ya está en uso (el sistema no distingue entre mayúsculas y minúsculas).

**Solución:**
1. Ve a la lista de formularios y **busca el nombre exacto** que quisiste usar
2. Activa el filtro para ver también los formularios **inactivos**
3. Si el formulario ya existe pero está inactivo, puedes activarlo en lugar de crear uno nuevo
4. Si necesitas uno diferente, usa un nombre distinto

---

### Error genérico (pantalla roja o "Hable con el admin")
**¿Qué pasó?** Error inesperado en el sistema.

**Qué reportar al equipo técnico:**
- Nombre exacto del formulario que intentabas crear
- Tipo seleccionado (1 o 2)
- Captura de pantalla del error
- Hora aproximada en que ocurrió`,
    tipo: "diagnostico",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["formulario", "error", "crear", "panel", "segmento", "pregunta"],
  },
  {
    titulo: "Errores al modificar o desactivar un formulario",
    slug: "errores-modificar-formulario-panel",
    resumen: "Qué hacer cuando hay errores al editar o intentar desactivar un formulario existente",
    contenido: `## Errores al modificar un formulario

### Acceso:
Panel → **Formularios** → clic en el formulario → **"Editar"**

---

### Error: "No existe un formulario con ese id"
**¿Qué pasó?** El formulario fue eliminado o el enlace está desactualizado.

**Solución:**
1. Regresa a la lista principal de formularios (Panel → Formularios)
2. Busca el formulario por nombre
3. Abre el formulario directamente desde la lista

---

### Mensaje: "El formulario fue actualizado, pero no se pudo desactivar porque tiene actividades activas asociadas"
**¿Qué pasó?** Intentaste desactivar el formulario, pero hay actividades de seguridad activas que lo están usando.

> ⚠️ **Importante:** El formulario SÍ se guardaron los otros cambios (nombre, etc.). Solo no se pudo desactivar.

**Cómo resolverlo:**
1. Ve a **Panel → Actividades** en el menú lateral
2. Busca las actividades que usan este formulario
3. Desactívalas una por una (Editar → Estado = Inactivo → Guardar)
4. Una vez que no haya actividades activas usando el formulario, vuelve a **Formularios** e intenta desactivarlo nuevamente

**¿No sabes qué actividades lo usan?** Reporta al equipo técnico el nombre del formulario para que verifiquen en el sistema.

---

### No puedo guardar los cambios en las preguntas
**Posibles causas:**
- Dejaste una pregunta sin texto
- Hay opciones de respuesta vacías en una pregunta de opción múltiple
- La calificación de una opción no es un número válido

**Solución:** Revisa todas las preguntas y asegúrate de que estén completamente llenas antes de guardar.`,
    tipo: "diagnostico",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["formulario", "error", "editar", "desactivar", "actividad", "panel"],
  },
  {
    titulo: "Cómo crear un formulario: Tipo 1 vs Tipo 2",
    slug: "guia-tipos-formulario",
    resumen: "Explicación de los dos tipos de formularios en ARCA y cuándo usar cada uno",
    contenido: `## Tipos de formularios en ARCA

### ¿Qué es un formulario en ARCA?
Un formulario define la **estructura de preguntas** que el usuario responde al completar una actividad o tarea de seguridad. No es un formulario de Google — es una plantilla que se asocia a actividades.

---

### Tipo 1 — Con segmentos
- Las preguntas se **agrupan en secciones** llamadas "segmentos"
- Ejemplo: Segmento 1: "Condiciones del área", Segmento 2: "Equipos de protección"
- **Cuándo usarlo**: Cuando las preguntas se pueden organizar por temas o áreas de evaluación
- **Requiere**: Al menos un segmento con al menos una pregunta

### Tipo 2 — Directo
- Las preguntas van **sin agrupar** (directo, sin secciones)
- **Cuándo usarlo**: Formularios cortos o cuando todas las preguntas son del mismo tema
- **Requiere**: Al menos una pregunta

---

### Tipos de pregunta disponibles:
| Tipo | Descripción |
|------|-------------|
| Texto libre | El usuario escribe su respuesta |
| Opción múltiple simple | El usuario elige una opción |
| Opción múltiple con puntuación | Cada opción tiene un puntaje |
| Selección con imagen | Las opciones tienen imagen |
| Calificación con ratio | Se califica por numerador/denominador |

---

### Pasos para crear un formulario Tipo 1:
1. Panel → Formularios → **"Nuevo formulario"**
2. Escribe el nombre (en mayúsculas automáticamente)
3. Selecciona **Tipo 1**
4. Haz clic en **"Agregar segmento"** y ponle nombre
5. Dentro del segmento, agrega las preguntas
6. Repite para más segmentos si necesitas
7. **Guardar**

### Pasos para crear un formulario Tipo 2:
1. Panel → Formularios → **"Nuevo formulario"**
2. Escribe el nombre
3. Selecciona **Tipo 2**
4. Haz clic en **"Agregar pregunta"** directamente
5. Agrega todas las preguntas necesarias
6. **Guardar**`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["formulario", "tipo 1", "tipo 2", "segmento", "pregunta", "crear", "panel"],
  },

  // ─── TÉCNICO - SQL DIAGNÓSTICOS ────────────────────────────────
  {
    titulo: "[Técnico] Diagnóstico SQL: Módulo Formularios",
    slug: "sql-diagnostico-formularios",
    resumen: "Queries SQL SELECT para diagnosticar problemas con formularios, segmentos y preguntas en PostgreSQL",
    contenido: `## Diagnóstico SQL: Módulo Formularios

> ⚠️ Solo ejecutar SELECT. Nunca modificar datos directamente en producción.

### Tablas del módulo:
- \`formulario\`: frm_id, frm_tipo, frm_nombre, frm_activo
- \`formulario_segmento\`: fsg_id, frm_id, fsg_nombre, fsg_orden, fsg_activo
- \`formulario_pregunta\`: frp_id, frm_id, fsg_id, frp_tipo, frp_pregunta, frp_orden, frp_activo
- \`formulario_pregunta_detalle\`: fpd_id, frp_id, fpd_nombre, fpd_calificacion, fpd_orden

---

### Verificar si un formulario existe (incluyendo inactivos)
\`\`\`sql
SELECT frm_id, frm_nombre, frm_tipo, frm_activo
FROM formulario
WHERE UPPER(TRIM(frm_nombre)) = UPPER(TRIM('NOMBRE_AQUI'));
\`\`\`

### Buscar formularios por nombre parcial
\`\`\`sql
SELECT frm_id, frm_nombre, frm_tipo, frm_activo
FROM formulario
WHERE frm_nombre ILIKE '%NOMBRE_PARCIAL%'
ORDER BY frm_activo DESC, frm_nombre;
\`\`\`

### Ver todos los formularios activos con su tipo
\`\`\`sql
SELECT frm_id, frm_nombre, frm_tipo,
  CASE frm_tipo WHEN 1 THEN 'Con segmentos' WHEN 2 THEN 'Directo' END AS tipo_desc
FROM formulario
WHERE frm_activo = true
ORDER BY frm_nombre;
\`\`\`

### Ver segmentos de un formulario (tipo 1)
\`\`\`sql
SELECT fsg_id, fsg_nombre, fsg_orden, fsg_activo,
  COUNT(fp.frp_id) AS total_preguntas
FROM formulario_segmento fs
LEFT JOIN formulario_pregunta fp ON fp.fsg_id = fs.fsg_id
WHERE fs.frm_id = ID_FORMULARIO
GROUP BY fsg_id, fsg_nombre, fsg_orden, fsg_activo
ORDER BY fsg_orden;
\`\`\`

### Ver preguntas de un formulario con su tipo
\`\`\`sql
SELECT frp_id, frp_pregunta, frp_tipo,
  CASE frp_tipo
    WHEN 1 THEN 'Texto libre'
    WHEN 2 THEN 'Opción múltiple simple'
    WHEN 3 THEN 'Opción múltiple con puntuación'
    WHEN 9 THEN 'Opción múltiple especial'
    WHEN 10 THEN 'Selección con imagen'
    WHEN 11 THEN 'Selección puntuación avanzada'
    WHEN 12 THEN 'Calificación ratio'
    WHEN 13 THEN 'Ratio especial'
  END AS tipo_desc,
  frp_orden, frp_activo
FROM formulario_pregunta
WHERE frm_id = ID_FORMULARIO
ORDER BY frp_orden;
\`\`\`

### Ver qué actividades usan un formulario (para diagnóstico de "no se puede desactivar")
\`\`\`sql
SELECT acs_id, acs_nombre, acs_activo
FROM actividad_seguridad
WHERE frm_id = ID_FORMULARIO
ORDER BY acs_activo DESC, acs_nombre;
\`\`\`

### Ver actividades ACTIVAS que bloquean la desactivación del formulario
\`\`\`sql
SELECT acs_id, acs_nombre
FROM actividad_seguridad
WHERE frm_id = ID_FORMULARIO AND acs_activo = true;
\`\`\`

### Contar respuestas de tarea para un formulario (¿hay datos respondidos?)
\`\`\`sql
SELECT COUNT(*) AS total_respuestas
FROM tarea_formulario_respuesta tfr
JOIN formulario_pregunta frp ON frp.frp_id = tfr.frp_id
WHERE frp.frm_id = ID_FORMULARIO;
\`\`\``,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["SQL", "formulario", "diagnóstico", "técnico", "query", "PostgreSQL", "BD"],
  },
  {
    titulo: "[Técnico] Diagnóstico SQL: Módulo Usuarios",
    slug: "sql-diagnostico-usuarios",
    resumen: "Queries SQL SELECT para diagnosticar problemas de usuarios, login, asignaciones y permisos",
    contenido: `## Diagnóstico SQL: Módulo Usuarios

> ⚠️ Solo ejecutar SELECT. Las contraseñas están hasheadas con bcrypt — no son legibles.

### Tablas principales:
- \`usuario\`: usu_id, usu_email, usu_nombre, usu_password (bcrypt), usu_tipo, usu_activo, usu_fecha_ingreso
- \`usuario_localidad\`: usl_id, usu_id, loc_id, are_id, emp_id, usl_activo

---

### Buscar usuario por email (diagnóstico de login)
\`\`\`sql
SELECT usu_id, usu_email, usu_nombre, usu_tipo, usu_activo, usu_fecha_ingreso
FROM usuario
WHERE LOWER(usu_email) = LOWER('email@empresa.com');
\`\`\`

### Verificar si un usuario está activo
\`\`\`sql
SELECT usu_id, usu_nombre, usu_email, usu_activo,
  CASE usu_activo WHEN true THEN '✅ Activo' ELSE '❌ Inactivo' END AS estado
FROM usuario
WHERE usu_id = ID_USUARIO;
\`\`\`

### Ver asignaciones de localidad de un usuario
\`\`\`sql
SELECT ul.usl_id, ul.usl_activo,
  e.emp_nombre, r.reg_nombre, l.loc_nombre, a.are_nombre
FROM usuario_localidad ul
JOIN empresa e ON e.emp_id = ul.emp_id
JOIN localidad l ON l.loc_id = ul.loc_id
JOIN region r ON r.reg_id = l.reg_id
LEFT JOIN area a ON a.are_id = ul.are_id
WHERE ul.usu_id = ID_USUARIO
ORDER BY ul.usl_activo DESC;
\`\`\`

### Ver todos los usuarios de una empresa
\`\`\`sql
SELECT u.usu_id, u.usu_nombre, u.usu_email, u.usu_tipo, u.usu_activo
FROM usuario u
JOIN usuario_localidad ul ON ul.usu_id = u.usu_id
WHERE ul.emp_id = ID_EMPRESA AND ul.usl_activo = true
ORDER BY u.usu_nombre;
\`\`\`

### Ver usuarios por tipo
\`\`\`sql
-- Tipos: 'seguridad', 'salud', 'comercial', 'lider', etc.
SELECT usu_id, usu_nombre, usu_email, usu_activo
FROM usuario
WHERE usu_tipo = 'seguridad'
ORDER BY usu_nombre;
\`\`\`

### Verificar token JWT: Variable de entorno del secreto
\`\`\`
La variable se llama SECRET_JWT_SEDD (con doble D al final)
El header debe ser exactamente: x-token
No usar: Authorization, Bearer
\`\`\`

### Usuarios sin asignación de localidad (posible causa de errores en app)
\`\`\`sql
SELECT u.usu_id, u.usu_nombre, u.usu_email, u.usu_tipo
FROM usuario u
WHERE u.usu_activo = true
  AND NOT EXISTS (
    SELECT 1 FROM usuario_localidad ul
    WHERE ul.usu_id = u.usu_id AND ul.usl_activo = true
  )
ORDER BY u.usu_nombre;
\`\`\``,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["SQL", "usuario", "login", "diagnóstico", "técnico", "query", "JWT"],
  },
  {
    titulo: "[Técnico] Diagnóstico SQL: Módulo Charlas y Tareas",
    slug: "sql-diagnostico-charlas-tareas",
    resumen: "Queries SQL para diagnosticar problemas con charlas no asignadas, sin responder, y tareas con formularios",
    contenido: `## Diagnóstico SQL: Charlas y Tareas

> ⚠️ Solo ejecutar SELECT.

---

## CHARLAS

### Tablas:
- \`charla\`: cha_id, cha_nombre, cha_activo, cha_fecha_inicio, cha_fecha_fin, tipo_charla_id
- \`charla_usuario\`: chu_id, cha_id, usu_id, chu_fecha_respuesta (NULL si no respondió), chu_activo

### Verificar si existe una charla (incluyendo inactivas)
\`\`\`sql
SELECT cha_id, cha_nombre, cha_activo, cha_fecha_inicio, cha_fecha_fin
FROM charla
WHERE UPPER(TRIM(cha_nombre)) = UPPER(TRIM('NOMBRE_CHARLA'));
\`\`\`

### Ver charlas asignadas a un usuario y si las respondió
\`\`\`sql
SELECT c.cha_nombre, c.cha_fecha_inicio, c.cha_fecha_fin,
  chu.chu_activo,
  CASE WHEN chu.chu_fecha_respuesta IS NOT NULL
    THEN '✅ Respondida el ' || chu.chu_fecha_respuesta::date
    ELSE '⏳ Pendiente'
  END AS estado
FROM charla_usuario chu
JOIN charla c ON c.cha_id = chu.cha_id
WHERE chu.usu_id = ID_USUARIO
ORDER BY c.cha_fecha_inicio DESC;
\`\`\`

### Ver quién no ha respondido una charla específica
\`\`\`sql
SELECT u.usu_nombre, u.usu_email, chu.chu_activo
FROM charla_usuario chu
JOIN usuario u ON u.usu_id = chu.usu_id
WHERE chu.cha_id = ID_CHARLA
  AND chu.chu_fecha_respuesta IS NULL
  AND chu.chu_activo = true
ORDER BY u.usu_nombre;
\`\`\`

### Porcentaje de cumplimiento de una charla
\`\`\`sql
SELECT
  COUNT(*) AS total_asignados,
  COUNT(chu_fecha_respuesta) AS respondieron,
  ROUND(COUNT(chu_fecha_respuesta) * 100.0 / COUNT(*), 1) AS porcentaje
FROM charla_usuario
WHERE cha_id = ID_CHARLA AND chu_activo = true;
\`\`\`

---

## TAREAS

### Tablas:
- \`tarea\`: tar_id, usu_id_creo, acs_id, tar_descripcion, tar_tipo (0=normal, 3=cron)
- \`tarea_asignacion\`: tas_id, tar_id, usu_id, emp_id, tas_activo
- \`tarea_formulario_respuesta\`: tar_id, frp_id, respuesta

### Ver tareas asignadas a un usuario con su actividad
\`\`\`sql
SELECT t.tar_id, t.tar_descripcion, t.tar_fecha,
  a.acs_nombre AS actividad, t.tar_tipo,
  ta.tas_activo
FROM tarea_asignacion ta
JOIN tarea t ON t.tar_id = ta.tar_id
JOIN actividad_seguridad a ON a.acs_id = t.acs_id
WHERE ta.usu_id = ID_USUARIO
ORDER BY t.tar_fecha DESC
LIMIT 20;
\`\`\`

### Ver respuestas del formulario de una tarea
\`\`\`sql
SELECT fp.frp_pregunta, tfr.respuesta
FROM tarea_formulario_respuesta tfr
JOIN formulario_pregunta fp ON fp.frp_id = tfr.frp_id
WHERE tfr.tar_id = ID_TAREA
ORDER BY fp.frp_orden;
\`\`\``,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["SQL", "charla", "tarea", "diagnóstico", "técnico", "query", "respuesta"],
  },
  {
    titulo: "[Técnico] Diagnóstico SQL: Incidencias y Estructura Org",
    slug: "sql-diagnostico-incidencias-estructura",
    resumen: "Queries SQL para diagnosticar incidencias, numeración y estructura organizacional (empresa, región, localidad, área)",
    contenido: `## Diagnóstico SQL: Incidencias y Estructura Organizacional

> ⚠️ Solo ejecutar SELECT.

---

## INCIDENCIAS

### Tablas:
- \`incidencia\`: inc_id, usu_id, loc_id, are_id, emp_id, inc_fecha, inc_numero, inc_estado, inc_est_estado, inc_reincidencia, usu_id_jefe
- \`incidencia_imagenes\`: referenciada por inc_id

### Ver incidencias de un usuario (últimas 20)
\`\`\`sql
SELECT inc_id, inc_numero, inc_fecha, inc_estado, inc_est_estado,
  inc_desc_observacion, inc_reincidencia
FROM incidencia
WHERE usu_id = ID_USUARIO
ORDER BY inc_fecha DESC
LIMIT 20;
\`\`\`

### Ver incidencias por localidad en un rango de fechas
\`\`\`sql
SELECT i.inc_id, i.inc_numero, i.inc_fecha, i.inc_estado,
  u.usu_nombre AS usuario, a.are_nombre AS area
FROM incidencia i
JOIN usuario u ON u.usu_id = i.usu_id
LEFT JOIN area a ON a.are_id = i.are_id
WHERE i.loc_id = ID_LOCALIDAD
  AND i.inc_fecha BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'
ORDER BY i.inc_fecha DESC;
\`\`\`

### Verificar numeración de incidencias de un usuario (gaps)
\`\`\`sql
SELECT inc_id, inc_numero, inc_fecha
FROM incidencia
WHERE usu_id = ID_USUARIO
ORDER BY inc_numero;
-- Si hay gaps en inc_numero, usar la función fix_numbers(usu_id) para renumerar
\`\`\`

### Incidencias en estado activo (sin cerrar)
\`\`\`sql
SELECT inc_id, inc_numero, u.usu_nombre, inc_fecha, inc_estado
FROM incidencia i
JOIN usuario u ON u.usu_id = i.usu_id
WHERE i.emp_id = ID_EMPRESA
  AND i.inc_estado NOT IN ('cerrada', 'resuelta')
ORDER BY i.inc_fecha ASC;
\`\`\`

---

## ESTRUCTURA ORGANIZACIONAL

### Ver empresas
\`\`\`sql
SELECT emp_id, emp_nombre, emp_activo FROM empresa ORDER BY emp_nombre;
\`\`\`

### Ver regiones de una empresa
\`\`\`sql
SELECT reg_id, reg_nombre, reg_activo FROM region WHERE emp_id = ID_EMPRESA ORDER BY reg_nombre;
\`\`\`

### Ver localidades de una región
\`\`\`sql
SELECT loc_id, loc_nombre, loc_activo FROM localidad WHERE reg_id = ID_REGION ORDER BY loc_nombre;
\`\`\`

### Ver áreas disponibles
\`\`\`sql
SELECT are_id, are_nombre, are_activo FROM area WHERE emp_id = ID_EMPRESA ORDER BY are_nombre;
\`\`\`

### Ver estructura completa (empresa → región → localidad)
\`\`\`sql
SELECT e.emp_nombre, r.reg_nombre, l.loc_nombre, l.loc_activo
FROM localidad l
JOIN region r ON r.reg_id = l.reg_id
JOIN empresa e ON e.emp_id = r.emp_id
WHERE e.emp_id = ID_EMPRESA
ORDER BY r.reg_nombre, l.loc_nombre;
\`\`\``,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["SQL", "incidencia", "estructura", "empresa", "región", "localidad", "diagnóstico", "técnico"],
  },

  // ─── APP - INSPECCIONES ──────────────────────────────────────
  {
    titulo: "Cómo registrar una inspección en la app",
    slug: "registrar-inspeccion-app",
    resumen: "Guía paso a paso para completar una inspección desde la app móvil ARCA",
    contenido: `## Registrar una inspección desde la app

### ¿Qué es una inspección?
Una inspección es una evaluación formal de condiciones de seguridad en un área o instalación, usando un formulario predefinido con preguntas específicas.

### Pasos para registrar:
1. En el menú de la app, toca **"Inspecciones"** o **"Nueva inspección"**
2. Selecciona el **tipo de inspección** o el **formulario** a usar
3. Responde cada pregunta del formulario:
   - Texto libre: escribe tu observación
   - Opción múltiple: selecciona la opción que aplique
   - Con imagen: toma foto y selecciona la opción
4. Agrega **fotografías de evidencia** si es requerido
5. Revisa tus respuestas y toca **"Guardar"** o **"Enviar"**

### Después de registrar:
- La inspección queda registrada con una calificación automática
- Se notifica al responsable del área
- Aparecerá en los reportes de ratings

### Problemas frecuentes:
- **"No hay formularios disponibles"**: No se han configurado formularios de inspección para tu área. Contacta a tu administrador.
- **"No se pudo guardar"**: Verifica conexión a internet y que todas las preguntas obligatorias estén respondidas.`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 5,
    tags: ["inspección", "app", "registrar", "formulario"],
  },

  // ─── PANEL - INSPECCIONES ──────────────────────────────────
  {
    titulo: "Gestión de inspecciones desde el panel",
    slug: "gestion-inspecciones-panel",
    resumen: "Cómo ver, filtrar y gestionar inspecciones registradas desde el panel administrativo",
    contenido: `## Gestión de inspecciones desde el panel

### Acceso:
Panel → menú izquierdo → **Inspecciones**

### Ver inspecciones:
1. Usa los **filtros** para buscar: por fecha, usuario, localidad o tipo
2. Haz clic en una inspección para ver el **detalle completo**
3. Verás las respuestas del usuario, calificación y fotos de evidencia

### Exportar inspecciones:
1. Aplica los filtros deseados
2. Haz clic en el ícono de **descarga** o **Excel**
3. Se generará un archivo con las inspecciones filtradas

### Reportes de inspecciones:
- Panel → Reportes → **Ratings** para ver calificaciones promedio
- Filtra por localidad, período o evaluador
- Compara el desempeño entre localidades o áreas`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 9,
    tags: ["inspección", "panel", "gestionar", "reportes", "ratings"],
  },

  // ─── PANEL - ACTIVIDADES ──────────────────────────────────
  {
    titulo: "Cómo crear y gestionar actividades de seguridad",
    slug: "crear-actividad-seguridad",
    resumen: "Guía para crear actividades de seguridad y vincularlas a formularios desde el panel",
    contenido: `## Actividades de seguridad

### ¿Qué es una actividad de seguridad?
Una actividad de seguridad es una plantilla que define qué formulario se usará para evaluar tareas. Las actividades se vinculan a formularios y las tareas se crean a partir de ellas.

### Relación: Formulario → Actividad → Tarea
- El **formulario** define las preguntas
- La **actividad** vincula el formulario a un contexto (empresa, localidad)
- La **tarea** es la asignación concreta a usuarios con fecha

### Crear una actividad:
1. Panel → **Actividades** → **"Nueva actividad"**
2. Escribe el **nombre** de la actividad
3. Selecciona el **formulario** que se usará
4. Configura la empresa y localidad donde aplica
5. Guarda

### Desactivar una actividad:
1. Busca la actividad en la lista
2. Editar → cambiar estado a **Inactivo**
3. Si tiene tareas activas, primero desactívalas desde Panel → Tareas

### Problemas frecuentes:
- **"La actividad tiene tareas activas"**: Desactiva las tareas primero
- **No aparece el formulario**: Verifica que el formulario esté activo`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 3,
    tags: ["actividad", "seguridad", "formulario", "tarea", "crear"],
  },

  // ─── PANEL - TAREAS ───────────────────────────────────────
  {
    titulo: "Cómo crear y asignar tareas desde el panel",
    slug: "crear-asignar-tareas-panel",
    resumen: "Guía completa para crear tareas y asignarlas a usuarios desde el panel administrativo",
    contenido: `## Crear y asignar tareas

### Acceso:
Panel → menú izquierdo → **Tareas** → **"Nueva tarea"**

### Pasos:
1. Escribe la **descripción** de la tarea
2. Selecciona la **actividad de seguridad** vinculada
3. Selecciona la **fecha** (formato día/mes/año)
4. Configura el **tipo**: Normal (0) o Recurrente/Cron (3)
5. Selecciona los usuarios o localidades a asignar
6. Guarda

### Tareas recurrentes (tipo Cron):
- Se crean automáticamente según la configuración
- Útiles para tareas periódicas (diarias, semanales, mensuales)
- Se configuran desde la creación de la tarea

### Ver respuestas:
1. Busca la tarea en la lista
2. Haz clic en la tarea para ver el detalle
3. Verás las respuestas de cada usuario asignado

### Problemas frecuentes:
- **"La fecha no tiene formato válido"**: Usa formato día/mes/año (ej: 15/03/2025)
- **"La actividad es obligatoria"**: Selecciona una actividad antes de guardar
- **El usuario no ve la tarea**: Verifica que esté asignado (tarea_asignacion con tas_activo=true)`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 11,
    tags: ["tarea", "crear", "asignar", "panel", "recurrente"],
  },

  // ─── ESTRUCTURA ORGANIZACIONAL ────────────────────────────
  {
    titulo: "Cómo gestionar la estructura organizacional",
    slug: "gestion-estructura-organizacional",
    resumen: "Guía para administrar empresas, regiones, localidades, áreas y cargos en ARCA",
    contenido: `## Estructura organizacional en ARCA

### Jerarquía:
**Empresa** → **Región** → **Localidad** → **Área**
Los **Cargos** se definen por empresa y se asignan a usuarios.

### Acceso:
Panel → **Configuración** → seleccionar: Empresas, Regiones, Localidades, Áreas o Cargos

---

### Crear una región:
1. Panel → Configuración → **Regiones** → **"Nueva región"**
2. Selecciona la **empresa**
3. Escribe el **nombre** de la región
4. Guarda

### Crear una localidad:
1. Panel → Configuración → **Localidades** → **"Nueva localidad"**
2. Selecciona la **empresa** y la **región**
3. Escribe el **nombre** de la localidad
4. Guarda

### Crear un área:
1. Panel → Configuración → **Áreas** → **"Nueva área"**
2. Selecciona la **empresa**
3. Escribe el **nombre** del área
4. Guarda

### Crear un cargo:
1. Panel → Configuración → **Cargos** → **"Nuevo cargo"**
2. Selecciona la **empresa**
3. Escribe el **nombre** del cargo
4. Guarda

---

### Problemas frecuentes:
- **"Ya existe una región/localidad/área con ese nombre"**: Los nombres son únicos por nivel. Busca incluyendo inactivos.
- **No puedo eliminar**: Si tiene usuarios o actividades vinculadas, primero desactívalas.
- **¿Dónde cambio la empresa de un usuario?**: Panel → Usuarios → buscar → Editar → pestaña Asignaciones.`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["estructura", "empresa", "región", "localidad", "área", "cargo", "configuración"],
  },

  // ─── RANKINGS Y RECOMPENSAS ───────────────────────────────
  {
    titulo: "Sistema de rankings y recompensas en ARCA",
    slug: "rankings-recompensas-arca",
    resumen: "Cómo funcionan los rankings de puntos y el sistema de canje de recompensas",
    contenido: `## Rankings y Recompensas

### ¿Cómo funciona el ranking?
- Los usuarios acumulan **puntos** al completar actividades, tareas e inspecciones
- El **ranking** ordena a los usuarios por puntos acumulados
- Se puede ver por período: mensual o anual

### Ver el ranking:
- Panel → **Rankings** para ver la tabla de posiciones
- Filtra por empresa, localidad o período

### Recompensas:
- Panel → **Recompensas** para administrar el catálogo de premios
- Cada recompensa tiene un costo en **puntos** y un **stock** disponible
- Los usuarios canjean recompensas desde la app

### Kardex de puntos:
- El **kardex** registra todos los movimientos de puntos de cada usuario
- Incluye: puntos ganados, puntos canjeados, saldo actual

### Problemas frecuentes:
- **"Puntos insuficientes"**: El usuario no tiene suficientes puntos. Verifica su saldo en el kardex.
- **"Ya canjeó esta recompensa"**: Algunos premios solo se pueden canjear una vez.
- **El usuario no aparece en el ranking**: Verifica que tenga actividades completadas en el período seleccionado.`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 14,
    tags: ["ranking", "recompensa", "puntos", "kardex", "canjear"],
  },

  // ─── TÉCNICO - SQL DIAGNÓSTICOS ADICIONALES ────────────────
  {
    titulo: "[Técnico] Diagnóstico SQL: Inspecciones, Reportes y Rankings",
    slug: "sql-diagnostico-inspecciones-reportes-rankings",
    resumen: "Queries SQL para diagnosticar problemas con inspecciones, reportes vacíos y rankings de usuarios",
    contenido: `## Diagnóstico SQL: Inspecciones, Reportes y Rankings

> ⚠️ Solo ejecutar SELECT.

---

## INSPECCIONES

### Tablas:
- \`inspeccion\`: ins_id, usu_id, loc_id, ins_fecha, ins_calificacion, ins_tipo
- \`inspeccion_respuesta\`: ins_id, frp_id, inr_respuesta

### Ver inspecciones de un usuario
\`\`\`sql
SELECT ins_id, ins_fecha, ins_calificacion, ins_tipo, ins_activo
FROM inspeccion
WHERE usu_id = ID_USUARIO
ORDER BY ins_fecha DESC
LIMIT 20;
\`\`\`

### Ver detalle de respuestas de una inspección
\`\`\`sql
SELECT fp.frp_pregunta, ir.inr_respuesta, fp.frp_tipo
FROM inspeccion_respuesta ir
JOIN formulario_pregunta fp ON fp.frp_id = ir.frp_id
WHERE ir.ins_id = ID_INSPECCION
ORDER BY fp.frp_orden;
\`\`\`

---

## REPORTES (diagnóstico de datos vacíos)

### Verificar si hay datos para un reporte de incidencias
\`\`\`sql
SELECT COUNT(*) AS total
FROM incidencia
WHERE emp_id = ID_EMPRESA
  AND EXTRACT(YEAR FROM inc_fecha) = 2025
  AND EXTRACT(MONTH FROM inc_fecha) = 3;
\`\`\`

### Verificar datos de ratings/inspecciones
\`\`\`sql
SELECT COUNT(*) AS total, AVG(ins_calificacion) AS promedio
FROM inspeccion
WHERE loc_id = ID_LOCALIDAD
  AND ins_fecha BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD';
\`\`\`

---

## RANKINGS

### Ver ranking de un usuario
\`\`\`sql
SELECT r.ran_posicion, r.ran_puntos, r.ran_periodo
FROM ranking r
WHERE r.usu_id = ID_USUARIO
ORDER BY r.ran_periodo DESC;
\`\`\`

### Ver saldo de puntos (kardex)
\`\`\`sql
SELECT SUM(kar_puntos) AS saldo_total,
  COUNT(*) AS total_movimientos
FROM kardex
WHERE usu_id = ID_USUARIO;
\`\`\`

### Detalle del kardex
\`\`\`sql
SELECT kar_id, kar_puntos, kar_descripcion, kar_fecha, kar_tipo
FROM kardex
WHERE usu_id = ID_USUARIO
ORDER BY kar_fecha DESC
LIMIT 20;
\`\`\``,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["SQL", "inspección", "reporte", "ranking", "kardex", "diagnóstico", "técnico"],
  },
  {
    titulo: "[Técnico] Diagnóstico SQL: Metas, Actividades y Menús",
    slug: "sql-diagnostico-metas-actividades-menus",
    resumen: "Queries SQL para diagnosticar metas, actividades de seguridad y permisos de menú",
    contenido: `## Diagnóstico SQL: Metas, Actividades y Menús

> ⚠️ Solo ejecutar SELECT.

---

## METAS

### Tablas:
- \`meta\`: met_id, met_nombre, met_valor_objetivo, met_fecha_inicio, met_fecha_fin, met_activo, emp_id
- \`meta_actividad\`: met_id, acs_id

### Ver metas activas de una empresa
\`\`\`sql
SELECT met_id, met_nombre, met_valor_objetivo, met_fecha_inicio, met_fecha_fin
FROM meta
WHERE emp_id = ID_EMPRESA AND met_activo = true
ORDER BY met_fecha_inicio DESC;
\`\`\`

### Ver actividades vinculadas a una meta
\`\`\`sql
SELECT ma.acs_id, a.acs_nombre, a.acs_activo
FROM meta_actividad ma
JOIN actividad_seguridad a ON a.acs_id = ma.acs_id
WHERE ma.met_id = ID_META;
\`\`\`

---

## ACTIVIDADES DE SEGURIDAD

### Tablas:
- \`actividad_seguridad\`: acs_id, acs_nombre, acs_activo, frm_id, emp_id, loc_id

### Ver actividades con su formulario
\`\`\`sql
SELECT a.acs_id, a.acs_nombre, a.acs_activo, f.frm_nombre, f.frm_tipo
FROM actividad_seguridad a
LEFT JOIN formulario f ON f.frm_id = a.frm_id
WHERE a.emp_id = ID_EMPRESA
ORDER BY a.acs_activo DESC, a.acs_nombre;
\`\`\`

### Ver tareas de una actividad
\`\`\`sql
SELECT t.tar_id, t.tar_descripcion, t.tar_fecha, t.tar_activo
FROM tarea t
WHERE t.acs_id = ID_ACTIVIDAD
ORDER BY t.tar_fecha DESC
LIMIT 20;
\`\`\`

---

## MENÚS Y PERMISOS

### Tablas:
- \`menu\`: men_id, men_nombre, men_ruta, men_orden, men_activo
- \`menu_tipo_usuario\`: men_id, tip_id

### Ver menús asignados a un tipo de usuario
\`\`\`sql
SELECT m.men_id, m.men_nombre, m.men_ruta, m.men_activo
FROM menu m
JOIN menu_tipo_usuario mtu ON mtu.men_id = m.men_id
WHERE mtu.tip_id = TIPO_USUARIO_ID AND m.men_activo = true
ORDER BY m.men_orden;
\`\`\`

### Ver qué tipos de usuario tienen acceso a un módulo
\`\`\`sql
SELECT m.men_nombre, tu.tip_nombre
FROM menu_tipo_usuario mtu
JOIN menu m ON m.men_id = mtu.men_id
JOIN tipo_usuario tu ON tu.tip_id = mtu.tip_id
WHERE m.men_ruta LIKE '%RUTA_MODULO%';
\`\`\``,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["SQL", "meta", "actividad", "menú", "permiso", "diagnóstico", "técnico"],
  },

  // ─── TÉCNICO ───────────────────────────────────────────────────
  {
    titulo: "Arquitectura técnica del sistema ARCA",
    slug: "arquitectura-tecnica-arca",
    resumen: "Descripción técnica de los componentes del sistema ARCA para el equipo de soporte técnico",
    contenido: `## Arquitectura técnica del sistema ARCA

### Componentes:

#### 1. api_arca (Backend principal)
- **Tecnología**: Node.js + Express.js
- **Base de datos**: PostgreSQL
- **Puerto local**: 4400
- **Autenticación**: JWT (header: x-token)
- **Procesamiento de archivos**: Multer + Sharp
- **Notificaciones**: Firebase Admin SDK + Nodemailer
- **Estructura**: routes/ → controllers/ → database/repositories/

#### 2. api_imagenes_arca (Microservicio de medios)
- **Tecnología**: Node.js + Express.js
- **Función**: Upload y servicio de imágenes y videos
- **Endpoints principales**:
  - POST /api/imagenes → subir imágenes
  - GET /api/ver → servir imágenes
  - POST /api/video → subir videos
  - GET /api/ver/video → servir videos
- **Almacenamiento**: Sistema de archivos local (uploads/)

#### 3. arca_panel (Dashboard web)
- **Tecnología**: React 18 + Vite
- **UI**: Material-UI v5
- **Estado**: Redux Toolkit + Jotai
- **HTTP**: Axios + React Query
- **Grillas**: AG-Grid + Material-React-Table
- **Gráficas**: Highcharts + DevExtreme
- **Rutas**: React Router v6 (200+ rutas)
- **Puerto de desarrollo**: 5173 (Vite default)

#### 4. app_arca (App móvil)
- **Tecnología**: Flutter 3.1.26+
- **Estado**: Meedu
- **HTTP**: Dio
- **Almacenamiento local**: SQLite (offline) + FlutterSecureStorage (tokens)
- **Notificaciones**: Firebase Messaging + Local Notifications
- **Arquitectura**: Clean Architecture (domain/data/ui)

### Variables de entorno críticas (api_arca):
\`\`\`
PORT=4400
DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
SECRET_JWT_SEDD (secreto JWT)
URL_API_IMAGEN (URL del microservicio de imágenes)
Firebase credentials
Email/SMTP credentials
\`\`\`

### Flujo de autenticación:
1. POST /api/auth/login → devuelve JWT
2. App guarda token en FlutterSecureStorage
3. Panel guarda token en localStorage
4. Todas las peticiones incluyen header: x-token: [JWT]
5. Middleware validarJWT verifica en cada request protegido`,
    tipo: "tecnico",
    audiencia: "tecnico",
    categoriaId: 16,
    tags: ["arquitectura", "técnico", "API", "stack", "backend", "flutter", "react"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTÍCULOS NUEVOS — APP MÓVIL (15 artículos)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    titulo: "Cómo ver y completar tareas en la app",
    slug: "ver-completar-tareas-app",
    resumen: "Guía completa del módulo de tareas en la app: lista, detalle, tipos, dependencias y flujos.",
    contenido: `## Tareas en la app ARCA — Guía completa

### Acceso al módulo
Menú principal → **Tareas** (ícono de lista con check). Requiere que tu usuario tenga el permiso de **tareas** activado (flag tareas ≠ -1). El badge rojo en el ícono muestra cuántas tareas tienes pendientes.

### Pantalla de lista de tareas (TaskListPage)
Al entrar ves tarjetas (cards) de tus tareas asignadas. Cada tarjeta muestra:
- **Nombre de la tarea** (tar_nombre)
- **Descripción** breve (tar_descripcion)
- **Fecha inicio** y **fecha fin** (plazo de cumplimiento)
- **Imagen** de la actividad asociada (si tiene)
- **Estado**: color indica si está pendiente, cumplida o vencida

### Íconos de acción en la parte superior:
- **Reloj/Alerta**: accede a tareas vencidas (TaskExpireListPage)
- **Calendario**: accede al calendario de tareas (CalendarListTaskPage)

### Ver detalle de una tarea (DetailTaskPage)
Toca una tarjeta para ver el detalle completo:
- **Nombre completo** de la tarea
- **Descripción** extendida
- **Actividad de seguridad** vinculada (nombre y tipo)
- **Fechas**: inicio y fin (formato dd/mm/yyyy)
- **PDF adjunto**: si la tarea tiene documento PDF, botón para descargarlo
- **Imagen de referencia**: foto o imagen asociada a la actividad
- **Observaciones** del creador de la tarea
- Botón **"Registrar"** para cumplir la tarea (solo si está activa y dentro del plazo)

### Tipos de tareas:
- **Normal (tipo 0)**: tarea puntual con fecha inicio y fin definidos
- **Cron/Recurrente (tipo 3)**: se genera automáticamente según programación periódica configurada en el panel

### Dependencias del módulo:
- Las tareas provienen de **Actividades de Seguridad** (actividad_seguridad)
- Cada actividad tiene un **formulario** asociado (las preguntas que debes responder al registrar)
- La asignación se hace por **empresa + localidad + área + usuario** desde el panel admin
- Si no ves tareas: tu administrador debe verificar la asignación (tarea_asignacion)
- El formulario vinculado determina las preguntas del paso 1 del registro

### Errores comunes:
- **Sin tareas visibles**: No tienes asignaciones en el periodo actual. Verifica con tu supervisor.
- **"No se puede registrar"**: La tarea venció (pasó la fecha fin). Contacta a tu supervisor para reprogramar.
- **Tarea sin formulario**: La actividad vinculada no tiene formulario configurado. Escalar al admin.
- **Badge no se actualiza**: Cierra y reabre la app para refrescar contadores.

### Tips:
- Revisa tus tareas diariamente; el badge del menú indica cuántas hay pendientes
- Las tareas vencidas se mueven a la sección de **Vencidas** (ícono de reloj)
- Las tareas recurrentes (cron) generan nuevas asignaciones automáticamente cada periodo
- Puedes registrar tareas en modo offline (se sincroniza al tener internet)`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 3,
    tags: ["tareas", "app", "completar", "registrar", "cumplimiento", "asignación", "detalle", "formulario", "actividad"],
  },
  {
    titulo: "Cómo ver tareas vencidas y calendario en la app",
    slug: "tareas-vencidas-calendario-app",
    resumen: "Guía completa de tareas vencidas y calendario con navegación año→mes→día en la app.",
    contenido: `## Tareas vencidas y calendario — Guía completa

### Tareas vencidas (TaskExpireListPage)
Acceso: Menú → Tareas → ícono de **reloj/alerta** (esquina superior derecha de la lista de tareas).

La lista muestra todas las tareas cuya fecha fin (tar_fec_fin) ya pasó y no fueron registradas:
- Cada tarjeta muestra: nombre, descripción, fecha de vencimiento
- **Color rojo** o indicador visual de vencimiento
- Toca una tarea vencida para ver su detalle completo

**¿Se puede registrar una tarea vencida?**
- Depende de la configuración del sistema. Si lo permite, verás el botón "Registrar"
- Si no lo permite, la tarea queda como no cumplida y afecta tu ranking/puntos
- Tu supervisor puede reprogramar la tarea desde el panel (Panel → Tareas → Editar)

### Calendario de tareas (CalendarListTaskPage)
Acceso: Menú → Tareas → ícono de **calendario** (esquina superior de la lista de tareas).

El calendario tiene **3 niveles de navegación**:

#### Nivel 1 — Selector de año:
- Flechas izquierda/derecha para cambiar el año
- Muestra el año actual centrado

#### Nivel 2 — Selector de mes:
- Barra horizontal con los **12 meses** (Ene, Feb, Mar...)
- Toca un mes para seleccionarlo
- El mes actual aparece resaltado

#### Nivel 3 — Selector de día:
- Fila horizontal de **tarjetas de días** con scroll horizontal (deslizar izquierda/derecha)
- Cada tarjeta muestra: **número del día** y **nombre del día** (Lun, Mar, Mié...)
- Los días con tareas tienen un **punto indicador de color**
- El día actual aparece **resaltado** con color diferente
- Toca un día para seleccionarlo

#### Lista de tareas del día:
- Debajo de los selectores aparece la **lista de tareas** del día seleccionado
- Cada tarjeta muestra: nombre de la tarea, fecha inicio/fin, descripción
- Toca una tarea para ver detalle y registrar cumplimiento

### ¿Qué hacer con tareas vencidas?
1. Si puedes completarla: entra al detalle → Registrar → completar formulario → evidencia → firma
2. Si está bloqueada: contacta a tu supervisor para reprogramación desde Panel → Tareas
3. Las tareas **cron** (recurrentes) generan nuevas asignaciones automáticamente, las vencidas quedan como histórico

### Errores comunes:
- **Calendario vacío**: no tienes tareas asignadas en ese mes/año. Cambia el periodo.
- **Tarea no aparece en el día correcto**: verifica las fechas inicio/fin en el detalle de la tarea.
- **No puedo registrar tarea vencida**: la configuración no permite registro fuera de plazo. Contacta al supervisor.

### Tips:
- Usa el calendario para planificar tu semana de trabajo
- Revisa al inicio de cada día qué tareas tienes asignadas
- Las tareas con fecha próxima a vencer aparecen primero en la lista del día
- El calendario carga tareas del servidor, necesitas conexión para ver datos actualizados`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 3,
    tags: ["tareas", "vencidas", "calendario", "app", "fecha", "cron", "día", "mes", "año", "expiradas"],
  },
  {
    titulo: "Cómo registrar el cumplimiento de una tarea",
    slug: "registrar-cumplimiento-tarea-app",
    resumen: "Proceso completo de registro de tarea: 3 pasos (formulario → evidencia → firma digital).",
    contenido: `## Registrar cumplimiento de tarea — Paso a paso completo

### Requisitos previos:
- La tarea debe estar **activa** (dentro del rango fecha inicio a fecha fin)
- La tarea debe tener un **formulario asociado** (a través de su actividad de seguridad)
- Debes tener conexión a internet (o estar en modo offline con datos previamente descargados)

### Acceso:
Tareas → selecciona una tarea → pantalla de detalle → toca **"Registrar"**

### Proceso de registro (3 pasos con stepper visual):

#### Paso 1 — Respuestas del formulario
- Se muestran las **preguntas del formulario** vinculado a la actividad de seguridad de la tarea
- Cada pregunta puede ser de estos tipos:
  - **Sí/No**: selector de dos opciones
  - **Texto libre**: campo para escribir respuesta
  - **Selección única**: lista de opciones, elige una
  - **Selección múltiple**: lista de opciones, puedes elegir varias
- **Todas las preguntas son obligatorias** — no puedes avanzar al paso 2 sin responder todas
- Toca **"Siguiente"** al completar todas las preguntas

#### Paso 2 — Evidencia y observaciones
- **Fotos de evidencia**: toca el botón de cámara para agregar fotos
  - Al tocar aparece un menú con: **"Cámara"** (tomar foto) o **"Galería"** (elegir existente)
  - Las fotos se **comprimen automáticamente** (calidad 25%) para reducir tamaño de envío
  - Puedes agregar **múltiples fotos** como evidencia del cumplimiento
- **Observaciones**: campo de texto libre multilínea (5 líneas visibles) para comentarios adicionales
  - Opcional pero recomendado para documentar el contexto del cumplimiento
- Toca **"Siguiente"** para continuar al paso 3

#### Paso 3 — Firma digital
- Se muestra un **pad de firma** (SignaturePad) donde debes firmar con el dedo en la pantalla
- La firma es tu confirmación personal de que realizaste la tarea
- Botones disponibles:
  - **"Limpiar"**: borra la firma para rehacerla
  - **"Guardar"**: confirma y envía todo el registro
- Al tocar **"Guardar"**, se envía el registro completo al servidor

### Datos que se registran automáticamente:
- ID del usuario que registra
- Fecha y hora exacta del registro
- Empresa, localidad y área del usuario
- Respuestas del formulario (tarea_formulario_respuesta)
- Fotos de evidencia (vinculadas al registro)
- Firma digital
- Estado de la tarea se actualiza a "Cumplida"

### Modo offline:
- Puedes registrar tareas **sin internet** — el registro se guarda en SQLite local
- Las fotos se almacenan temporalmente en el dispositivo
- Cuando tengas conexión, la app sincroniza automáticamente los registros pendientes
- Un indicador visual muestra registros pendientes de sincronización

### Errores comunes:
- **"Debe responder todas las preguntas"**: hay preguntas sin contestar en el paso 1. Revisa cada una.
- **"Tarea vencida"**: la fecha fin ya pasó, no se permite registrar. Contacta al supervisor.
- **"Error al subir foto"**: sin conexión a internet o permisos de cámara denegados en el celular.
- **"Formulario no disponible"**: la actividad de seguridad no tiene formulario vinculado — escalar al admin.
- **"Debe firmar"**: el pad de firma está vacío. Firma con el dedo antes de guardar.
- **"Error de sincronización"**: si estás offline, el registro se guarda localmente. Se sincronizará al tener internet.

### Tips:
- Las fotos son tu mejor evidencia — agrega al menos una siempre que sea posible
- La firma digital es obligatoria y queda vinculada a tu usuario y fecha
- Tu supervisor puede ver tus registros desde Panel → Tareas → Respuestas
- Si hay error en el registro, puedes intentar de nuevo (la tarea sigue pendiente hasta que el registro sea exitoso)`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 3,
    tags: ["tareas", "registrar", "cumplimiento", "formulario", "evidencia", "firma", "stepper", "app", "offline"],
  },
  {
    titulo: "Cómo ver tu ranking y puntos en la app",
    slug: "ranking-puntos-app",
    resumen: "Guía completa de rankings: filtros, tabs, cálculo de puntos, premios y posiciones en la app.",
    contenido: `## Rankings y puntos en la app — Guía completa

### Acceso al módulo
Menú principal → **Rankings** (ícono de trofeo/estrella). Disponible para **todos los usuarios** sin restricción de permisos.

### Pantalla de Rankings (RankingPage)
La pantalla tiene **2 tabs** principales:

#### Tab 1: Rankings (lista de posiciones)
Muestra la tabla de posiciones de todos los usuarios según puntos acumulados.

**Filtros disponibles** (barra superior con dropdowns):
- **Módulo**: filtra por tipo de actividad (Incidencias, Inspecciones, Charlas, Tareas, General)
- **Mes**: selecciona el mes del periodo (1-12)
- **Año**: selecciona el año del periodo
- **Empresa**: filtra por empresa específica
- **Localidad**: filtra por localidad (se actualiza dinámicamente según empresa seleccionada)

**Cada fila del ranking muestra:**
- **Posición** (#1, #2, #3...)
- **Nombre del usuario** completo
- **Puntos** acumulados en ese periodo y módulo
- **Cargo/Nivel** del usuario
- Los primeros 3 lugares se destacan con colores especiales (oro, plata, bronce)

#### Tab 2: Premios (recompensas)
Muestra las recompensas/premios disponibles para canjear con puntos:
- Nombre del premio
- Puntos requeridos para canje
- Imagen del premio (si tiene)
- Disponibilidad

### ¿Cómo se ganan puntos?
Cada módulo otorga puntos al completar actividades:
- **Incidencias**: puntos por cada incidencia reportada y aprobada
- **Charlas/Capacitaciones**: puntos por responder charlas (requiere nota mínima **70%** en el quiz)
- **Tareas**: puntos por completar tareas dentro del plazo establecido
- **Inspecciones**: puntos por realizar inspecciones completas
- La cantidad de puntos por actividad la configura el administrador desde el panel

### Rankings por periodo:
- Los puntos se acumulan por **mes/año**
- Al cambiar los filtros de periodo, ves el ranking histórico de cualquier mes pasado
- El ranking "General" combina puntos de todos los módulos

### Acceso rápido desde Rankings:
- Botón **"Ver Top"** (estrella): abre el Top 10 con podio visual
- Botón **"Kardex"** (reloj/historial): abre el historial detallado de tus puntos

### Dependencias:
- Los puntos se registran automáticamente al completar actividades en cada módulo
- El **kardex** permite verificar cada movimiento individual de puntos
- El administrador puede hacer ajustes manuales de puntos desde Panel → Ranking → Kardex

### Errores comunes:
- **"Sin ranking"**: no hay registros de puntos en el periodo seleccionado. Cambia mes/año o módulo.
- **"Puntos no aparecen"**: verifica que completaste la actividad correctamente. Las charlas requieren nota ≥70%.
- **No aparece mi nombre**: verifica los filtros de empresa/localidad. Si son incorrectos, tu nombre no se listará.
- **Puntos diferentes al esperado**: los puntos pueden variar por módulo. Revisa el kardex para detalle.

### Tips:
- Revisa tu ranking semanalmente para conocer tu posición
- El Top 10 diario se muestra como popup automático al abrir la app
- Los puntos pueden canjearse por premios si el módulo de recompensas está configurado
- Usa los filtros de módulo para ver en cuál tienes más/menos puntos`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 6,
    tags: ["ranking", "puntos", "app", "posición", "rendimiento", "comparativa", "filtros", "premios", "módulo"],
  },
  {
    titulo: "Cómo ver el Top 10 de rendimiento",
    slug: "top-rendimiento-app",
    resumen: "Top 10 diario con podio visual: posiciones 1-3 destacadas, dialog automático y acceso manual.",
    contenido: `## Top 10 de rendimiento — Guía completa

### ¿Qué es el Top 10?
Es un **podio visual diario** que muestra los 10 usuarios con mejor rendimiento en puntos. Se presenta como un popup/dialog motivacional.

### Cómo aparece:
1. **Automáticamente**: al abrir la app por primera vez en el día, aparece un dialog con el Top 10 (solo se muestra **una vez al día**)
2. **Manualmente**: Menú → Rankings → botón **"Ver Top"** (ícono de estrella en la esquina superior)

### Diseño del podio (TopPage):

#### Podio principal (posiciones 1-3):
- **1er lugar** (centro, tarjeta más grande): avatar/foto, nombre completo, puntos — color **dorado**
- **2do lugar** (izquierda): avatar/foto, nombre, puntos — color **plateado**
- **3er lugar** (derecha): avatar/foto, nombre, puntos — color **bronce**
- Los 3 primeros se muestran con diseño tipo olimpiada con alturas diferentes (1er lugar más alto)

#### Posiciones 4-6:
- Se muestran en una fila con **colores especiales** diferenciados
- Cada uno muestra: número de posición, nombre del usuario, puntos acumulados

#### Posiciones 7-10:
- Lista regular en formato de filas simples
- Cada fila: posición (#7, #8, #9, #10), nombre del usuario, puntos

### Criterios del Top:
- Se basa en los **puntos acumulados del periodo activo** (mes/año actual)
- Incluye puntos de **todos los módulos** combinados (incidencias + charlas + tareas + inspecciones)
- Se actualiza diariamente con datos del servidor
- Si hay menos de 10 usuarios con puntos, se muestran solo los que tengan

### Dialog diario automático:
- Se controla con la fecha de última visualización guardada localmente
- Solo aparece **una vez al día** al abrir el menú principal
- Tiene botón **"Cerrar"** para descartarlo
- Si cierras el dialog, puedes volver a ver el Top desde Rankings → Ver Top

### Errores comunes:
- **Top vacío o con pocos usuarios**: no hay suficientes usuarios con puntos en el periodo actual.
- **Mi nombre no aparece en el Top**: necesitas estar entre los 10 primeros en puntos. Completa más actividades.
- **Dialog no aparece al abrir la app**: ya lo viste hoy, solo aparece una vez al día.

### Tips:
- Estar en el Top 10 puede desbloquear **recompensas especiales** en empresas con sistema de premios
- El Top se comparte entre todos los usuarios de la misma empresa
- Completa actividades diariamente para subir posiciones
- El Top se reinicia según el periodo configurado (generalmente mensual)`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 6,
    tags: ["top", "rendimiento", "podio", "ranking", "app", "mejores", "diario", "dialog", "posiciones"],
  },
  {
    titulo: "Cómo ver el kardex de puntos en la app",
    slug: "kardex-puntos-app",
    resumen: "Kardex completo: historial de movimientos de puntos, tipos, balance y relación con módulos.",
    contenido: `## Kardex de puntos — Historial completo

### ¿Qué es el Kardex?
El kardex es el **registro detallado de todos los movimientos de puntos** de tu cuenta. Cada punto ganado, canjeado o ajustado queda documentado con fecha, módulo y motivo.

### Acceso:
Menú → **Rankings** → toca **"Kardex"** (ícono de historial/reloj en la esquina superior de la pantalla de Rankings)

### Pantalla de Kardex (KardexRankingPage):

#### Información mostrada por cada movimiento:
- **Fecha**: cuándo se registró el movimiento (formato dd/mm/yyyy)
- **Módulo**: qué actividad generó los puntos (ej: Incidencias, Charlas, Tareas, Inspecciones)
- **Puntos**: cantidad de puntos (positivo = ganados, negativo = canjeados/restados)
- **Tipo de movimiento**:
  - **Ganancia**: puntos obtenidos por completar una actividad
  - **Canje**: puntos usados para obtener una recompensa/premio
  - **Ajuste**: corrección manual realizada por el administrador
- **Descripción**: detalle del motivo (ej: "Incidencia #52 registrada", "Charla X completada")

#### Filtros disponibles:
- **Periodo** (mes/año): ver movimientos de un periodo específico
- **Módulo**: filtrar solo movimientos de un tipo de actividad

### Balance de puntos:
- En la parte superior se muestra tu **balance actual** (total de puntos disponibles)
- Balance = suma de ganancias − suma de canjes/ajustes negativos
- El balance es lo que puedes canjear por recompensas

### Relación con otros módulos:
Cada actividad completada genera automáticamente una entrada en el kardex:
- **Incidencia registrada** → entrada de puntos por incidencia
- **Charla respondida** (nota ≥70%) → entrada de puntos por charla
- **Tarea completada** dentro del plazo → entrada de puntos por tarea
- **Inspección realizada** → entrada de puntos por inspección
- **Canje de recompensa** → entrada negativa descontando puntos

### Errores comunes:
- **"Kardex vacío"**: no has completado actividades que generen puntos en el periodo seleccionado. Cambia los filtros.
- **"Puntos no aparecen"**: puede haber un retraso de minutos después de completar la actividad. Espera y refresca.
- **"Faltan puntos de una actividad"**: verifica el periodo y módulo en los filtros. Si realmente faltan, reporta al administrador.
- **"Puntos negativos inesperados"**: un administrador hizo un ajuste manual o canjeaste una recompensa.

### Tips:
- Revisa tu kardex si crees que te faltan puntos de alguna actividad
- Los canjes de recompensas quedan registrados como movimiento negativo con descripción del premio
- El administrador puede hacer ajustes manuales desde Panel → Kardex (aparecen como tipo "Ajuste")
- Usa el kardex como comprobante si hay discrepancia con tu posición en el ranking`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 6,
    tags: ["kardex", "puntos", "historial", "movimientos", "app", "ranking", "balance", "canje", "ajuste"],
  },
  {
    titulo: "Cómo gestionar notificaciones en la app",
    slug: "notificaciones-app",
    resumen: "Guía completa de notificaciones: tipos (charla/incidencia/inspección/tarea/comercial), Firebase push, diagnóstico.",
    contenido: `## Notificaciones en la app — Guía completa

### Acceso:
Menú principal → **Notificaciones** (ícono de campana). El **badge rojo** sobre el ícono muestra el número de notificaciones no leídas.

### Pantalla de Notificaciones (NotificationPage):

#### Lista de notificaciones:
- Se muestran en orden **cronológico** (más recientes arriba)
- **No leídas** (estado 0): fondo resaltado con indicador visual
- **Leídas** (estado 1): fondo normal
- Al tocar una notificación: se marca como leída y te **redirige al módulo correspondiente**

### Tipos de notificación (códigos internos):

| Código | Tipo | Acción al tocar | Ejemplo de mensaje |
|--------|------|------------------|--------------------|
| **1** | Charla asignada | Abre la charla para responder | "Nueva charla: Seguridad en alturas" |
| **3** | Incidencia | Abre el detalle de la incidencia | "Tu incidencia #42 fue aprobada" |
| **4** | Inspección | Abre el módulo de inspecciones | "Nueva inspección asignada" |
| **5** | Tarea asignada | Abre el detalle de la tarea | "Tarea: Revisión extintores" |
| **8** | Charla comercial | Abre la charla comercial | "Nueva charla comercial disponible" |

### Información de cada notificación:
- **Título**: nombre descriptivo del evento
- **Mensaje**: detalle de la notificación
- **Fecha/hora** de recepción
- **Ícono/Tipo**: indicador visual según categoría (colores o íconos diferentes)

### Sistema push — Firebase Cloud Messaging (FCM):
- Las notificaciones se envían mediante **Firebase Cloud Messaging**
- Al **iniciar sesión**, tu dispositivo registra un **token Firebase** (usu_firebase_token) en el servidor
- Las notificaciones llegan aunque la app esté en **segundo plano** o con la pantalla bloqueada
- Al **cerrar sesión**, el token se desvincula → dejas de recibir notificaciones
- Al **reinstalar** la app o **cambiar de dispositivo**: inicia sesión para registrar nuevo token

### Diagnóstico: No recibo notificaciones

#### Paso 1 — Verificar permisos del celular:
**Android:**
- Configuración → Apps → ARCA → Notificaciones → **Activar todas las categorías**
- En Android 13+: se requiere permiso explícito de notificaciones al instalar

**iOS:**
- Configuración → ARCA → Notificaciones → **Permitir notificaciones** + Banners + Sonidos + Badges

#### Paso 2 — Verificar modo "No molestar":
- Si está activo, las notificaciones no se muestran visualmente
- Desactiva "No molestar" y "Modo enfoque" temporalmente para probar

#### Paso 3 — Renovar token Firebase:
- **Cierra sesión** en la app → **Vuelve a iniciar sesión**
- Esto fuerza el registro de un nuevo token Firebase en el servidor
- Es la solución más efectiva para problemas de push

#### Paso 4 — Verificar conexión:
- Las notificaciones push requieren conexión permanente a internet
- Sin internet, las notificaciones pueden llegar con retraso o perderse

#### Paso 5 — Verificar versión de la app:
- Versiones muy antiguas pueden tener problemas con Firebase
- Actualiza desde Play Store / App Store a la última versión

### Errores comunes:
- **"Sin notificaciones"**: no has recibido ninguna aún, o todas fueron leídas.
- **"Notificación no abre el módulo"**: el registro referenciado puede haber sido eliminado o modificado. Ignora la notificación.
- **Notificaciones duplicadas**: reinicia la app. Si persiste, cierra sesión y reinicia.
- **Badge no se actualiza**: cierra y reabre la app para refrescar el contador.
- **Solo recibo algunos tipos**: el servidor solo envía push para los módulos que tienes activos.

### Tips:
- Al iniciar sesión, la app registra automáticamente tu token Firebase
- Las notificaciones quedan almacenadas en lista para consultarlas después
- El badge se actualiza en tiempo real cuando llegan nuevas notificaciones
- Si cambias de celular, inicia sesión en el nuevo para transferir las notificaciones push`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 2,
    tags: ["notificaciones", "push", "app", "campana", "firebase", "alertas", "tipos", "token", "diagnóstico"],
  },
  {
    titulo: "Cómo editar tu perfil y cambiar contraseña en la app",
    slug: "perfil-cambiar-contrasena-app",
    resumen: "Guía completa: perfil, login, cambio de contraseña con validación exacta, cierre de sesión y flags.",
    contenido: `## Perfil, login y contraseña — Guía completa

### Pantalla de Login (LoginPage):
Campos requeridos:
- **Cédula/Documento** (campo numérico) — es tu identificador único
- **Contraseña** — campo oculto con opción de mostrar

Botón **"Ingresar"** → proceso de autenticación:
1. Valida cédula + contraseña contra el servidor (API)
2. Si es correcto, genera un **token JWT** que se almacena en el celular
3. Registra tu **token Firebase** para notificaciones push
4. Descarga datos iniciales: empresas, localidades, áreas, formularios, catálogos
5. Hace **verificación de versión**: si la app es muy antigua, aparece dialog obligatorio de actualización
6. Redirige al menú principal

#### Flag ingresarContrasena:
- Si el servidor devuelve **ingresarContrasena = true**, significa que DEBES cambiar tu contraseña antes de continuar
- La pantalla de cambio de contraseña aparece **obligatoriamente** (no puedes omitirla)
- Sucede cuando: es tu primer inicio de sesión, o el administrador forzó cambio de contraseña

### Pantalla de Perfil (ProfilePage):
Acceso: Menú principal → ícono de **persona** (perfil)

#### Datos visibles:
- **Nombre completo** (nombre + apellido)
- **Cédula/Documento** — identificador principal
- **Email** registrado
- **Cargo** asignado
- **Nivel** de cargo
- **Empresa** a la que perteneces
- **Localidad** asignada
- **Área** de trabajo
- **Tipo de usuario**: Seguridad / Salud / Comercial
- **Versión de la app** instalada

> **Importante**: NO puedes editar estos datos desde la app. Los datos personales los modifica el administrador desde Panel → Usuarios → Editar.

### Cambiar contraseña:
1. Ve a tu **Perfil**
2. Toca **"Cambiar contraseña"**
3. Ingresa tu **contraseña actual**
4. Ingresa la **nueva contraseña**
5. **Confirma** la nueva contraseña (repetir exactamente igual)
6. Toca **"Guardar"**

#### Requisitos exactos de la nueva contraseña:
- **Mínimo 6 caracteres** de longitud
- Al menos **1 letra mayúscula** (A-Z)
- Al menos **1 número** (0-9)
- Caracteres permitidos: letras minúsculas (a-z), mayúsculas (A-Z), números (0-9) y especiales: ! @ # $ & * ~ .
- La validación exacta es: debe contener al menos una mayúscula Y al menos un número, con mínimo 6 caracteres

#### Errores al cambiar contraseña:
- **"Contraseña actual incorrecta"**: la contraseña que ingresaste no coincide con la registrada en el servidor
- **"La contraseña no cumple los requisitos"**: falta mayúscula, falta número, o tiene menos de 6 caracteres
- **"Las contraseñas no coinciden"**: la nueva contraseña y la confirmación son diferentes
- **"Error de conexión"**: necesitas internet para cambiar contraseña (se valida en el servidor)

### Cerrar sesión:
1. Ve a tu **Perfil**
2. Toca **"Cerrar sesión"** (botón al final de la pantalla)
3. Confirma la acción en el dialog
4. Se ejecutan estas acciones:
   - Se elimina el **token JWT** local
   - Se limpia el **token Firebase** del servidor (dejas de recibir notificaciones push)
   - Se borra la **base de datos SQLite** local (todos los datos descargados)
   - Vuelves a la pantalla de login

> **⚠️ Advertencia**: Al cerrar sesión se borran todos los datos locales, incluyendo registros offline sin sincronizar. Asegúrate de haber sincronizado antes.

### Errores comunes de login:
- **"Usuario o contraseña incorrectos"**: verifica cédula y contraseña. Mayúsculas importan.
- **"Usuario inactivo"**: tu cuenta fue desactivada por el administrador. Contacta al admin.
- **"Debe actualizar la app"**: versión instalada muy antigua. Actualiza desde Play Store / App Store.
- **"Error de conexión"**: sin internet no puedes iniciar sesión (el primer login siempre requiere internet).
- **"Token no válido" (401)**: tu sesión expiró. Cierra sesión completamente y vuelve a entrar.

### Tips:
- Tu cédula/documento es tu nombre de usuario — no se puede cambiar
- Si olvidaste tu contraseña: el administrador puede restablecerla desde Panel → Usuarios → Editar
- Al cerrar sesión se borran TODOS los datos locales — volverás a descargarlos al iniciar sesión
- El token JWT expira periódicamente; si ves "Token no válido", cierra sesión y vuelve a entrar
- Después de cambiar contraseña exitosamente, la app te mantiene en sesión (no necesitas reloguear)`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 2,
    tags: ["perfil", "contraseña", "cambiar", "cerrar sesión", "app", "usuario", "login", "cédula", "JWT", "Firebase"],
  },
  {
    titulo: "Cómo funciona el modo offline de la app",
    slug: "modo-offline-app",
    resumen: "Funcionamiento offline completo: SQLite, qué funciona sin internet, sincronización por módulo, proceso de 10 pasos.",
    contenido: `## Modo offline de la app — Funcionamiento completo

### ¿Cómo funciona?
La app ARCA usa una base de datos **SQLite local** que almacena información en tu celular. Esto permite trabajar sin conexión y sincronizar cuando recuperes conectividad.

### Datos que se guardan localmente al iniciar sesión:
Al hacer login, la app descarga y almacena en SQLite:
- **Catálogos**: empresas, regiones, localidades, áreas, cargos, tipos de persona
- **Configuración**: tipos de observación, opciones, potenciales, causas, requisitos
- **Tareas**: asignaciones pendientes, formularios y preguntas asociadas
- **Incidencias**: registros propios para consulta
- **Charlas**: listado de charlas asignadas (sin los videos)
- **Inspecciones**: formularios de inspección y preguntas

### ¿Qué puedo hacer SIN internet?

| Módulo | Ver datos | Crear nuevos | Notas |
|--------|-----------|--------------|-------|
| **Incidencias** | ✅ Ver las descargadas | ✅ Crear y guardar local | Fotos se guardan en dispositivo, se suben después |
| **Tareas** | ✅ Ver asignadas | ✅ Registrar cumplimiento | Formulario, fotos y firma se guardan offline |
| **Inspecciones** | ✅ Ver listado | ✅ Realizar inspección | Se guarda en SQLite completa |
| **Charlas** | ✅ Ver listado | ❌ No responder quiz | Videos requieren streaming; quiz requiere conexión |
| **Rankings** | ❌ Solo datos en caché | ❌ N/A | Datos vienen del servidor |
| **Notificaciones** | ❌ Solo caché previo | ❌ N/A | Push requiere internet |

### ¿Qué NO puedo hacer sin internet?
- **Iniciar sesión** por primera vez (autenticación requiere servidor)
- **Ver charlas con video** (streaming requiere internet)
- **Responder quiz de charlas** (envío requiere conexión)
- **Recibir notificaciones push** (Firebase necesita conexión)
- **Ver datos actualizados** que otros usuarios crearon después de tu último sync
- **Actualizar catálogos** (nuevas empresas, áreas, opciones, etc.)

### Sincronización — Proceso detallado:

#### Sincronización de incidencias (proceso de 10 pasos):
1. Detecta conexión a internet disponible
2. Lee incidencias pendientes de sync en SQLite (flag de sincronización pendiente)
3. **Sube las imágenes** primero al microservicio de imágenes (api_imagenes_arca)
4. Obtiene las URLs de las imágenes subidas exitosamente
5. Envía los datos de la incidencia al API principal (POST)
6. Recibe confirmación con el ID del servidor asignado
7. Actualiza el registro local con el ID del servidor
8. Marca la incidencia como **sincronizada** en SQLite
9. Descarga **nuevas incidencias** del servidor (creadas por otros o actualizadas)
10. Actualiza la lista local con los datos frescos del servidor

#### Sincronización de tareas:
- Al abrir Tareas: descarga asignaciones actualizadas del servidor
- Al registrar cumplimiento: envía inmediatamente si hay internet; si no, guarda en SQLite

#### Sincronización de inspecciones:
- Al abrir: descarga formularios y listado actualizado
- Al completar: envía al servidor o guarda en SQLite si no hay conexión

### Triggers de sincronización (cuándo se sincroniza):
1. **Al iniciar sesión**: descarga completa de TODOS los datos (catálogos + registros)
2. **Pull-to-refresh**: al deslizar hacia abajo en cualquier lista de un módulo
3. **Al abrir un módulo**: sincronización incremental (solo lo nuevo)
4. **Cambio de conectividad**: cuando el celular pasa de sin-internet a con-internet

### Indicadores visuales:
- **Ícono de sync pendiente**: aparece cuando hay registros creados offline sin sincronizar
- **Badge en menú**: puede mostrar contadores de registros pendientes
- Los registros creados offline pueden tener un color/indicador diferente en la lista

### Problemas de sincronización:

**"Datos no sincronizan":**
1. Verifica conexión a internet (abre un navegador para confirmar)
2. Cierra la app completamente → reabre
3. Haz pull-to-refresh en la pantalla del módulo afectado
4. Si persiste: cierra sesión → inicia sesión (fuerza descarga completa)

**"Registro duplicado después de sincronizar":**
- Puede ocurrir si la red se cortó durante la sincronización
- Contacta al administrador para que elimine el duplicado desde el panel

**"Fotos no se subieron":**
- Las fotos se suben al microservicio de imágenes separado
- Si ese servicio está caído, las fotos quedan pendientes
- Al recuperar servicio, la app reintenta la subida automáticamente

**"Datos desactualizados":**
- Haz pull-to-refresh o cierra sesión y reentra para forzar descarga completa
- Los catálogos (empresas, áreas, etc.) solo se actualizan al iniciar sesión

### Tips:
- Abre la app con internet al menos **una vez al día** para mantener datos frescos
- Los catálogos se actualizan SOLO al iniciar sesión — si agregaron áreas o empresas nuevas, cierra sesión y reentra
- Si vas a trabajar en zona sin cobertura, abre todos los módulos antes (para pre-descargar datos)
- Las fotos offline ocupan espacio en el celular — mantén al menos 200 MB libres
- Al cerrar sesión se borra la base SQLite — si tienes datos sin sincronizar, los perderás`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 2,
    tags: ["offline", "sin internet", "SQLite", "sincronización", "app", "datos locales", "sync", "fotos", "incidencias"],
  },
  {
    titulo: "Problemas con fotos: permisos de cámara y galería",
    slug: "problemas-fotos-app",
    resumen: "Diagnóstico completo de fotos: permisos, compresión al 25%, límites por módulo, cámara vs galería, offline.",
    contenido: `## Diagnóstico: Problemas con fotos en la app — Guía completa

### Contexto: dónde se usan fotos en la app
La app usa fotos en **3 módulos** principales:

| Módulo | Dónde | Requisito | Límite |
|--------|-------|-----------|--------|
| **Incidencias** | Paso 3 (descripción) | Mínimo 1 foto obligatoria | Máximo 5 fotos |
| **Incidencias** | Paso 4 (solución) | Obligatoria SI hay texto de solución | Máximo 5 fotos |
| **Tareas** | Paso 2 (evidencia) | Opcional/recomendado | Múltiples fotos |
| **Inspecciones** | Al responder "No" | Obligatoria junto con comentario | 1 foto por pregunta |

### Cómo funciona la captura de fotos:
1. Al tocar el botón de **cámara/foto**, aparece un menú inferior (bottom sheet) con 2 opciones:
   - **"Cámara"**: abre la cámara del celular para tomar foto en el momento
   - **"Galería"**: abre la galería para seleccionar una foto existente
2. La foto seleccionada se **comprime automáticamente** a **calidad 25%** (imageQuality: 25) para reducir tamaño
3. La foto comprimida se guarda como archivo temporal en el dispositivo (~50-200 KB por foto)
4. Al guardar el registro, las fotos se suben al microservicio de imágenes (api_imagenes_arca)
5. Si estás **offline**, las fotos se almacenan localmente y se suben al sincronizar

### Paso 1 — Verificar permisos de cámara y almacenamiento

**Android:**
- Configuración → Apps → ARCA → Permisos:
  - **Cámara**: debe estar en "Permitir"
  - **Almacenamiento/Archivos y multimedia**: debe estar en "Permitir"
- En **Android 13+**: el permiso se llama "Fotos y videos" (no "Almacenamiento")
- Después de activar: **cierra completamente** la app y reabre

**iOS:**
- Configuración → ARCA:
  - **Cámara**: Activado
  - **Fotos**: debe ser **"Acceso completo"** (NO "Fotos seleccionadas" ni "Ninguno")
- En **iOS 14+**: si seleccionaste "Fotos seleccionadas", la app no puede acceder a toda la galería — cambia a "Acceso completo"

### Paso 2 — Verificar espacio en el dispositivo
- Cada foto comprimida ocupa ~50-200 KB
- Se necesita espacio libre para:
  - Guardar la foto temporal antes de procesarla
  - Almacenar para upload posterior si estás offline
- Recomendación: mantener al menos **200 MB libres** en el celular
- Verificar: Configuración → Almacenamiento

### Paso 3 — Error "No se puede subir la foto"
Posibles causas:
- **Sin internet**: la foto se guarda localmente y se sube cuando haya conexión (modo offline)
- **Microservicio de imágenes caído**: problema del servidor, no del celular. Espera e intenta después.
- **Foto corrupta**: la compresión falló. Elimina la foto y toma una nueva.
- **Timeout de red**: conexión muy lenta. Intenta en una mejor red (WiFi).

### Paso 4 — La foto se ve en negro o borrosa
- **Negro**: lente obstruido, permisos de cámara parciales, o cámara no disponible
- **Borrosa**: lente sucio, movimiento al tomar la foto
- La compresión al 25% reduce calidad pero NO debería verse borrosa
- Solución: limpia el lente, toma la foto con buena iluminación y celular estable

### Paso 5 — No aparece la opción de galería
- Falta el permiso de **almacenamiento/fotos** en el celular
- En dispositivos antiguos: reiniciar el celular después de conceder permisos
- En iOS: verificar que sea "Acceso completo" en la configuración de Fotos

### Paso 6 — Límite de fotos alcanzado
- En **Incidencias Paso 3**: máximo 5 fotos. Al llegar al límite, el botón se desactiva.
- En **Incidencias Paso 4 (solución)**: si escribes texto de solución, DEBES agregar al menos 1 foto. Si no hay texto, no se requieren fotos.
- Solución: elimina una foto existente para agregar otra, o continúa con las que tienes.

### Paso 7 — Fotos no se suben en modo offline
- Las fotos se almacenan temporalmente en el dispositivo
- Al tener conexión, la app las sube automáticamente al microservicio de imágenes
- Si el sync falla: el registro queda marcado como "pendiente de sincronización"
- Haz pull-to-refresh con internet activo para forzar la subida

### Escalamiento técnico:
Si ningún paso resuelve el problema, reportar al equipo técnico:
- **Modelo del celular** y **versión de SO** (ej: Samsung Galaxy A32, Android 13)
- **Versión de la app** ARCA instalada
- **Módulo** donde falla (Incidencias / Tareas / Inspecciones)
- **Mensaje de error exacto** (si aparece alguno)
- ¿Funciona la cámara en **otras apps** del celular? (para descartar hardware)
- ¿El problema es con **cámara**, con **galería**, o con **ambas**?`,
    tipo: "diagnostico",
    audiencia: "ambos",
    categoriaId: 4,
    tags: ["fotos", "cámara", "permisos", "galería", "error", "subir imagen", "app", "compresión", "offline", "límite"],
  },
  {
    titulo: "La app se cierra o muestra pantalla blanca",
    slug: "app-cierra-pantalla-blanca",
    resumen: "Diagnóstico completo de crashes: versión, caché, memoria, pantalla específica, rutas de la app y escalamiento.",
    contenido: `## Diagnóstico: App se cierra o pantalla blanca — Guía completa

### Causas comunes:
La app ARCA (desarrollada en Flutter) puede cerrarse por: versión desactualizada, memoria insuficiente, datos corruptos en SQLite local, problemas de compatibilidad con el dispositivo, o errores en pantallas específicas.

### Paso 1 — Forzar cierre y reabrir
1. Cierra la app **completamente** (no solo minimizar):
   - **Android**: botón de recientes → desliza ARCA hacia arriba o toca "Cerrar todo"
   - **iOS**: desliza desde abajo al centro → desliza la tarjeta de ARCA hacia arriba
2. Espera 5 segundos
3. Abre de nuevo la app

### Paso 2 — Verificar versión de la app
La app verifica la versión al iniciar sesión. Si tu versión es muy antigua:
- El servidor devuelve un flag indicando que debes actualizar
- Puede aparecer un **dialog obligatorio** que te impide continuar sin actualizar

**Para actualizar:**
1. Ve a **Play Store** (Android) o **App Store** (iOS)
2. Busca **"ARCA"**
3. Si hay actualización disponible, toca **"Actualizar"**
4. Espera la instalación completa → abre la app

**Si la app no está en la tienda** (instalación manual/APK):
- Contacta al administrador para obtener la versión más reciente
- En Android: Configuración → Seguridad → Fuentes desconocidas debe estar permitido

### Paso 3 — Limpiar caché de la app
**Android:**
1. Configuración → Apps → ARCA → Almacenamiento
2. Toca **"Borrar caché"** (⚠️ NO tocar "Borrar datos" — eso eliminaría tu sesión y datos locales)
3. Reabre la app

**iOS:**
- iOS no permite borrar caché individual de una app
- Opción: desinstalar y reinstalar (perderás datos locales sin sincronizar)

### Paso 4 — Verificar memoria RAM y almacenamiento
- **Cierra otras apps** que consuman memoria (juegos, redes sociales, navegadores)
- **Reinicia el celular** completamente (apagar → esperar 10 seg → encender)
- Verifica que haya al menos **500 MB libres** de almacenamiento: Configuración → Almacenamiento

### Paso 5 — Identificar la pantalla del crash
Si la app se cierra **siempre en la misma pantalla**, identifica cuál:

| Pantalla del crash | Posible causa | Solución |
|-------|----------|----------|
| **Al iniciar sesión (Login)** | Problema de autenticación o versión antigua | Actualizar app, verificar internet |
| **Al abrir menú principal** | Datos de usuario incompletos en el servidor | Escalar al admin para verificar datos |
| **Al abrir incidencias/tareas** | Dato corrupto en SQLite local | Borrar caché o reinstalar |
| **Al tomar fotos** | Permisos de cámara o memoria llena | Verificar permisos, liberar espacio |
| **Al cargar charla con video** | Reproductor de video incompatible | Actualizar app, probar otra charla |
| **Al abrir inspecciones** | Formulario sin preguntas configuradas | Escalar al admin |

### Paso 6 — Reinstalar la app
Si nada funciona:
1. **Sincroniza** datos pendientes antes (abre la app con internet si puedes)
2. **Desinstala** ARCA
3. **Reinicia** el celular
4. **Descarga e instala** desde la tienda oficial
5. **Inicia sesión** (se re-descarga toda la información)

> ⚠️ Al reinstalar pierdes: datos offline sin sincronizar y fotos pendientes de subir. Intenta sincronizar antes.

### Pantallas principales de la app (referencia):
La app tiene **34 rutas/pantallas** principales. Las más frecuentes donde ocurren problemas:
- **/login** — Inicio de sesión
- **/menu** — Menú principal con módulos
- **/incidencias** — Lista de incidencias
- **/nuevaIncidencia** — Crear incidencia (4 pasos)
- **/tareas** — Lista de tareas
- **/registrarTarea** — Registrar cumplimiento (3 pasos)
- **/charlas** — Lista de charlas
- **/nuevaCharla** — Ver charla y responder quiz
- **/inspecciones** — Lista de inspecciones
- **/nuevaInspeccion** — Realizar inspección (3 pasos)
- **/rankings** — Rankings y puntos
- **/notificaciones** — Centro de notificaciones
- **/perfil** — Perfil de usuario

### Escalamiento técnico:
Reportar al equipo técnico con esta información:
- **Modelo de celular** y **versión de SO** (ej: Samsung A32, Android 13)
- **Versión de la app ARCA** (visible en el login o perfil)
- **Pantalla exacta** donde se cierra (si es consistente)
- ¿Ocurre con internet o sin internet?
- ¿Cuándo empezó? ¿Después de una actualización?
- ¿Otros usuarios del mismo celular tienen el problema?`,
    tipo: "diagnostico",
    audiencia: "ambos",
    categoriaId: 2,
    tags: ["app", "cierra", "pantalla blanca", "crash", "reiniciar", "caché", "versión", "Flutter", "rutas", "pantallas"],
  },
  {
    titulo: "Charla no reproduce video en la app",
    slug: "charla-no-reproduce-video",
    resumen: "Diagnóstico completo de video: 4 tipos de video (Vimeo/YouTube/Network/Local), reproductores, redes bloqueadas.",
    contenido: `## Diagnóstico: Video de charla no reproduce — Guía completa

### Tipos de video en charlas:
La app soporta **4 tipos de video** según la configuración de la charla:

| Tipo | Valor | Fuente | Reproductor | Requisitos |
|------|-------|--------|-------------|------------|
| **Vimeo** | 1 | Embed de Vimeo | WebView embebido | Internet + Vimeo no bloqueado |
| **YouTube** | 2 | Embed de YouTube | youtube_player_flutter | Internet + YouTube no bloqueado |
| **Network/Red** | 3 | Video en servidor propio | video_player nativo | Internet + acceso al servidor |
| **Local/Subido** | 4 | Video subido al sistema | video_player nativo | Internet para descarga |

> Si la charla **no tiene campo de video** (tipo_video vacío/null), mostrará solo texto y/o imágenes sin reproductor.

### Paso 1 — Verificar conexión a internet
- **Todos los tipos de video** requieren internet (no hay descarga offline de videos)
- Prueba:
  1. Abre un **navegador** en el celular
  2. Ve a google.com o youtube.com
  3. Si no carga, el problema es de conexión, no de la app

### Paso 2 — Identificar el tipo de video y probar según corresponda

**Video Vimeo (tipo 1):**
- Usa un WebView con embed de Vimeo
- Si la **red WiFi corporativa bloquea Vimeo**, no reproducirá
- Prueba con **datos móviles** para confirmar

**Video YouTube (tipo 2):**
- Usa el reproductor de YouTube embebido
- Si la **red corporativa bloquea YouTube**, no reproducirá
- Prueba con **datos móviles**
- Algunas redes bloquean YouTube por política empresarial

**Video Network/Red (tipo 3):**
- Video almacenado en un servidor propio de la empresa
- Si el **servidor está caído o inaccesible**, no reproducirá
- Puede ser problema temporal del servidor — intenta más tarde

**Video Local/Subido (tipo 4):**
- Video subido al sistema (microservicio de imágenes)
- Usa el reproductor de video nativo (video_player)
- Si el microservicio de imágenes está caído, no se descargará
- Suelen ser videos más pequeños que cargan más rápido

### Paso 3 — Esperar carga del video
- Videos grandes pueden tardar en hacer buffering
- Espera al menos **20-30 segundos** en conexiones lentas
- Verifica si aparece un indicador de carga (spinner/loading)
- Videos tipo Network/Local tienden a ser más rápidos que Vimeo/YouTube

### Paso 4 — Forzar recarga del reproductor
1. Sal de la charla (botón **"Atrás"**)
2. Vuelve a entrar a la misma charla
3. El reproductor se reinicializa completamente

### Paso 5 — Reiniciar la app
1. Cierra completamente la app (no solo minimizar)
2. Reabre y ve directo a la charla
3. Esto limpia el estado del reproductor de video en memoria

### Paso 6 — Probar con otra red
- Si usas **WiFi corporativo**: prueba con **datos móviles**
- Si usas **datos móviles**: prueba con **WiFi**
- Muchas redes corporativas bloquean servicios de streaming (Vimeo, YouTube)
- Si funciona con datos pero no con WiFi → la red WiFi bloquea el servicio de video

### Paso 7 — Verificar si es problema de la charla específica
Si **ningún usuario** puede ver el video de esa charla:
- El archivo de video puede estar **corrupto** o en formato no soportado
- El **URL del video** puede estar roto o expirado (especialmente enlaces de Vimeo/YouTube)
- Escalar al administrador para que verifique la charla desde Panel → Charlas → Editar

### Flujo completo de una charla con video:
1. Entras a la charla → se muestra información de la charla
2. Se carga el **reproductor de video** según el tipo configurado
3. **Debes ver el video** antes de poder acceder al quiz
4. Después del video, aparecen las **preguntas del quiz**
5. Respondes las preguntas y se calcula tu **nota** (mínimo 70% para aprobar)
6. Si apruebas → charla completada ✅

### Errores comunes:
- **Pantalla negra sin reproducir**: URL del video roto, tipo de video incompatible, o servicio bloqueado por la red.
- **"Error al cargar video"**: servidor de video inaccesible. Intenta más tarde o cambia de red.
- **Video se congela a medio camino**: conexión inestable. Espera o cambia a una red más estable.
- **Video reproduce pero sin sonido**: verifica que el celular NO está en modo silencio/vibración. Sube el volumen de multimedia.
- **Quiz no aparece después del video**: si el video no terminó de cargar completamente, el quiz puede no habilitarse. Vuelve a ver el video completo.

### Tips:
- Responde charlas en una **conexión WiFi estable** para evitar interrupciones de video
- Si el video es largo, asegúrate de tener **batería suficiente**
- No cierres la app mientras se reproduce el video — perderás el progreso
- Si la red corporativa bloquea servicios de video, coordina con TI para abrir acceso o usa datos móviles`,
    tipo: "diagnostico",
    audiencia: "ambos",
    categoriaId: 6,
    tags: ["charla", "video", "no reproduce", "streaming", "app", "error", "Vimeo", "YouTube", "Network", "reproductor"],
  },
  {
    titulo: "Los datos no sincronizan entre app y panel",
    slug: "datos-no-sincronizan",
    resumen: "Diagnóstico completo de sincronización: proceso por módulo, triggers, escenarios específicos y soluciones.",
    contenido: `## Diagnóstico: Datos no sincronizan — Guía completa

### ¿Cómo funciona la sincronización?
La app trabaja con base de datos local **SQLite** y sincroniza con el servidor cuando hay conexión. Cada módulo tiene su propio mecanismo de sync.

### Sincronización por módulo:

#### Incidencias (proceso de 10 pasos):
- **App → Servidor**: incidencias creadas offline se sincronizan:
  1. Detecta conexión disponible
  2. Lee incidencias pendientes en SQLite
  3. Sube fotos al microservicio de imágenes
  4. Obtiene URLs de fotos subidas
  5. Envía datos al API principal
  6. Recibe ID del servidor
  7. Actualiza registro local
  8. Marca como sincronizada
  9. Descarga incidencias nuevas del servidor
  10. Actualiza lista local
- **Servidor → App**: al abrir la lista, descarga incidencias recientes

#### Tareas:
- **Servidor → App**: al abrir Tareas, descarga asignaciones actualizadas
- **App → Servidor**: al registrar cumplimiento, envía inmediatamente con internet; si no hay, guarda en SQLite

#### Charlas:
- **Servidor → App**: al abrir Charlas, descarga listado actualizado
- **App → Servidor**: respuestas del quiz se envían directamente (requiere internet para ver video)

#### Inspecciones:
- **Servidor → App**: al abrir, descarga formularios y listado
- **App → Servidor**: inspecciones completadas se sincronizan al tener internet

### Triggers de sincronización (cuándo se sincroniza):
1. **Al iniciar sesión**: descarga completa de TODOS los datos
2. **Pull-to-refresh**: deslizar hacia abajo en cualquier lista
3. **Al abrir un módulo**: sincronización incremental
4. **Cambio de conectividad**: offline → online

### Diagnóstico paso a paso:

#### Paso 1 — Verificar internet
- Abre un **navegador** y carga google.com
- Si no carga → problema de conexión, resuelve eso primero
- Verifica WiFi y/o datos móviles activos

#### Paso 2 — Forzar sincronización
1. Ve al módulo afectado (Incidencias, Tareas, etc.)
2. Haz **pull-to-refresh** (deslizar hacia abajo desde el inicio de la lista)
3. Espera a que termine la carga (indicador de progreso)

#### Paso 3 — Cerrar sesión y reentrar
1. Perfil → **"Cerrar sesión"**
2. Inicia sesión de nuevo
3. Fuerza una **descarga completa** de todos los datos
> ⚠️ Los registros offline sin sincronizar se pierden al cerrar sesión. Intenta pasos 1-2 primero.

#### Paso 4 — Verificar filtros en el panel
Si creaste algo en la app pero no aparece en el panel:
1. Refresca la página del panel (F5)
2. Verifica **filtros** de fecha, empresa, localidad, usuario
3. Filtros incorrectos es la **causa #1** de "no aparece el registro"

#### Paso 5 — Tiempo de espera
- Puede haber **retraso de 1-5 minutos** entre crear en app y ver en panel
- Espera y refresca el panel

### Escenarios específicos:

**"Creé una incidencia pero no aparece en el panel":**
1. ¿Tenías internet al crearla? Si no → está en SQLite pendiente de sync
2. Abre lista de incidencias en la app → busca indicador de "pendiente de sync"
3. Haz pull-to-refresh con internet activo
4. Panel → Incidencias → busca por fecha de hoy y tu usuario

**"Se asignó una tarea pero no la veo en la app":**
1. Haz pull-to-refresh en la lista de tareas
2. Verifica que la asignación en el panel incluye tu empresa + localidad + área
3. Cierra sesión y reentra para forzar descarga completa

**"Respondí una charla pero el reporte muestra pendiente":**
1. Las charlas necesitan internet para responder (video = online)
2. Si hubo error de red durante el envío, la respuesta pudo no guardarse
3. Intenta responder la charla de nuevo

**"Inspección no aparece en el panel":**
1. Verifica que la inspección se completó (los 3 pasos) y se guardó
2. Haz pull-to-refresh con internet
3. En el panel verifica filtros de fecha y localidad

### Errores comunes:
- **"Error de sincronización"**: servidor temporalmente no disponible. Intenta en 5 minutos.
- **"Conflicto de datos"**: registro modificado en servidor y app. El servidor tiene prioridad.
- **"Token expirado" (401)**: tu sesión expiró. Cierra sesión e inicia de nuevo.
- **"Timeout"**: conexión muy lenta para completar la sincronización. Prueba en mejor red.

### Tips:
- Sincroniza datos al **inicio y final** de cada jornada
- Si vas a zona sin cobertura, abre todos los módulos antes (pre-descargar)
- Los datos más recientes siempre están en el servidor — la app muestra su copia local
- Los catálogos (empresas, áreas) SOLO se actualizan al iniciar sesión — si agregaron nuevos, cierra sesión y reentra`,
    tipo: "diagnostico",
    audiencia: "ambos",
    categoriaId: 2,
    tags: ["sincronización", "datos", "offline", "app", "panel", "no aparece", "sync", "pull-to-refresh", "SQLite"],
  },
  {
    titulo: "Cómo ver y gestionar charlas comerciales en la app",
    slug: "charlas-comerciales-app",
    resumen: "Guía completa charlas comerciales: diferencia con seguridad, quiz (4 tipos, 70% mínimo), video, ratings, reportes.",
    contenido: `## Charlas comerciales en la app — Guía completa

### ¿Qué son las charlas comerciales?
Son capacitaciones de la **Escuela Comercial**, completamente separadas de las charlas de seguridad. Tienen su propia sección en la app, su propio flujo de reportes y están diseñadas para el equipo de ventas/comercial.

### Requisito de acceso:
- Tu usuario debe tener el permiso **comercial activo** (flag comercial ≠ -1)
- Si no ves charlas comerciales: pide al administrador que verifique tu configuración en Panel → Usuarios → Editar → sección de permisos

### Diferencia entre charlas de seguridad y comerciales:

| Aspecto | Charlas Seguridad | Charlas Comerciales |
|---------|-------------------|---------------------|
| **Acceso** | Flag charlas ≠ -1 | Flag comercial ≠ -1 |
| **Menú app** | "Charlas" | "Charlas Comerciales" / "Escuela Comercial" |
| **Ruta app** | /chat (ChatListPage) | /chatComercial (ChatListComercialPage) |
| **Reportes panel** | ReporteCharlasPage | ReporteCharlasComercialPage |
| **Jefe reporta** | isJefe (seguridad) | isJefeComercial |
| **Contenido** | Seguridad y prevención | Ventas y habilidades comerciales |
| **Quiz** | Mismo mecanismo (4 tipos) | Mismo mecanismo (4 tipos) |

### Ver charlas comerciales:
1. Menú principal → toca **"Charlas Comerciales"** o **"Escuela Comercial"**
2. La lista se organiza en secciones:
   - **Sección "Charlas"**: charlas comerciales normales
   - **Sección "Capacitaciones"**: capacitaciones comerciales (flag cha_capacitacion = true)
3. **Filtro de mes**: selector superior para ver charlas de un mes específico
4. Cada charla muestra: nombre, estado (respondida ✅ / pendiente), fecha

### Responder una charla comercial:
1. Toca la charla para abrirla
2. **Ver contenido**: puede incluir video (Vimeo/YouTube/Network/Local), texto e imágenes
3. **Si tiene video**: DEBES verlo completo antes de poder responder el quiz
4. **Responder el quiz**: aparecen las preguntas configuradas por el administrador

### Sistema de Quiz (idéntico a charlas de seguridad):

#### 4 tipos de preguntas:
| Tipo | Nombre | Cómo responder |
|------|--------|----------------|
| **1** | Sí / No | Toca "Sí" o "No" |
| **2** | Texto libre | Escribe tu respuesta en el campo |
| **3** | Selección única | Elige UNA opción de la lista |
| **4** | Selección múltiple | Elige VARIAS opciones (se guardan con separador ";;") |

#### Calificación y aprobación:
- Se comparan tus respuestas con las **respuestas correctas** configuradas
- **Nota mínima para aprobar: 70%** (7 de 10 correctas = aprueba)
- Si apruebas: la charla se marca como completada ✅
- Si NO apruebas: puedes **reintentar** respondiendo de nuevo

#### Detalles del quiz:
- Las **preguntas se muestran en orden aleatorio** (randomizado)
- Las **opciones de respuesta también se randomizan** (evita memorizar posición)
- Tipo 4 (múltiple): debes seleccionar TODAS las opciones correctas para que cuente como acierto
- **No hay límite de intentos** — puedes reintentar hasta aprobar

### Tipos de charla según configuración:
| Flag | Valor | Significado |
|------|-------|-------------|
| **cha_rating** | true | Charla que cuenta para el rating/calificación del usuario |
| **cha_capacitacion** | true | Es capacitación (se muestra en sección separada) |
| **cha_rating** | false | Charla informativa, no afecta rating |

### Reportes de charlas comerciales:
- Los **jefes comerciales** (isJefeComercial = true) pueden ver reportes de cumplimiento
- El reporte muestra: qué usuarios respondieron, calificación obtenida, fecha de respuesta
- Acceso desde: Panel → Reportes → Charlas Comerciales

### Errores comunes:
- **"No veo charlas comerciales"**: tu usuario no tiene el permiso comercial activo. Pide al admin que lo active.
- **"Charla no aparece"**: verifica el filtro de mes. La charla puede estar en otro periodo.
- **"Video no reproduce"**: ver artículo "Charla no reproduce video" para diagnóstico por tipo de video.
- **"Quiz no se envía"**: necesitas internet para enviar respuestas. Las charlas con video no funcionan offline.
- **"Nota insuficiente"**: respondiste menos del 70% correctamente. Revisa el contenido y reintenta.
- **"Ya respondí pero sigue pendiente"**: hubo error de red al enviar. Intenta responder de nuevo.

### Tips:
- Un usuario puede tener charlas de seguridad Y comerciales si tiene ambos permisos activos
- Las charlas comerciales tienen su propio ciclo de asignación (independiente de seguridad)
- Los puntos por charlas comerciales también suman al ranking general
- El jefe comercial puede autorizar charlas en lote desde el panel
- Revisa regularmente las charlas pendientes — tienen fecha de vencimiento`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 6,
    tags: ["charlas", "comercial", "escuela comercial", "app", "capacitación", "quiz", "video", "rating", "70%"],
  },
  {
    titulo: "Navegación general de la app: menú y módulos disponibles",
    slug: "navegacion-general-app",
    resumen: "Guía PRO de navegación: login, menú con 8 módulos, badges, permisos por flag, Top 10 diario, rutas completas.",
    contenido: `## Navegación general de la app ARCA — Guía completa

### Pantalla de Login (LoginPage):
- Campos: **Cédula** (numérico) + **Contraseña**
- Botón **"Ingresar"**
- Versión de la app visible en la esquina inferior
- Al autenticarse: descarga datos, registra token Firebase, verifica versión de la app
- Si la versión es antigua: dialog obligatorio de actualización

### Menú principal (MainMenuPage):
Al iniciar sesión exitosamente, llegas al menú principal con módulos según tus permisos.

#### Módulos del menú (hasta 8 según permisos):

| # | Módulo | Permiso requerido | Badge muestra |
|---|--------|-------------------|---------------|
| 1 | **Incidencias** | Flag incidencias ≠ -1 | Incidencias pendientes |
| 2 | **Inspecciones** | Flag inspecciones ≠ -1 | Inspecciones pendientes |
| 3 | **Charlas** | Flag charlas ≠ -1 | Charlas sin responder |
| 4 | **Tareas** | Flag tareas ≠ -1 | Tareas pendientes |
| 5 | **Charlas Comerciales** | Flag comercial ≠ -1 | Charlas comerciales pendientes |
| 6 | **Rankings** | Todos los usuarios | — |
| 7 | **Notificaciones** | Todos los usuarios | Notificaciones no leídas |
| 8 | **Perfil** | Todos los usuarios | — |

#### Eventos automáticos al abrir el menú:
1. **Top 10 diario**: aparece dialog automático con el podio del día (solo una vez al día)
2. **Dialog de puntos**: puede aparecer popup mostrando tus puntos recientes
3. **Verificación de versión**: si la app es antigua, aviso de actualización
4. **Badges se actualizan**: contadores se cargan desde el servidor

### Flags de permisos del usuario:
Tu usuario tiene múltiples flags que controlan qué módulos ves:

| Flag | Controla |
|------|----------|
| **usu_seguridad** | Es usuario de seguridad (acceso a módulos de seguridad) |
| **usu_salud** | Es usuario de salud |
| **incidencias** | Acceso al módulo de incidencias |
| **inspecciones** | Acceso al módulo de inspecciones |
| **charlas** | Acceso a charlas de seguridad |
| **tareas** | Acceso al módulo de tareas |
| **comercial** | Acceso a charlas comerciales / escuela comercial |
| **isJefe** | Es jefe de seguridad (puede ver reportes de su equipo) |
| **isJefeComercial** | Es jefe comercial (puede ver reportes comerciales) |

- Flag con valor **-1** = **desactivado** (no ve el módulo)
- Cualquier otro valor = **activado** (ve el módulo)
- Los flags se configuran desde Panel → Usuarios → Editar usuario

### Flujo resumido por módulo:

#### Incidencias:
- Lista con filtros: mes, estado (Resuelto/No resuelto)
- Botón **"+"** para crear nueva incidencia
- **4 pasos**: empresa/localidad/área → tipo observación/opción/potencial → descripción+fotos (mín 1, máx 5) → solución (opcional)
- Condiciones: 1=Pendiente, 2=Aprobado, 3=Rechazado, 4=Revisión

#### Inspecciones:
- Lista de inspecciones realizadas y pendientes
- **3 pasos**: selección (empresa/localidad/área) → preguntas (Sí/No por cada una) → resumen
- Si respondes **"No"**: DEBES agregar comentario Y foto obligatoria para esa pregunta

#### Charlas (Seguridad y Comerciales):
- 3 secciones: **Ratings**, **Charlas normales**, **Capacitaciones**
- Filtro por mes
- Cada charla: video (4 tipos: Vimeo/YouTube/Network/Local) → quiz (4 tipos de preguntas) → nota mínima 70%
- Preguntas y opciones se **randomizan** para evitar memorización

#### Tareas:
- Lista de tarjetas con tareas asignadas
- Accesos: detalle, registro (**3 pasos**: formulario → evidencia+observaciones → firma digital), vencidas, calendario
- Calendario: año → mes → día (scroll horizontal) → lista de tareas del día

#### Rankings:
- 2 tabs: Rankings (posiciones con 5 filtros) y Premios
- Acceso a: Top 10 (podio visual), Kardex (historial detallado de puntos)

### ¿No veo un módulo?
Si no ves un módulo que deberías tener:
1. Tu administrador debe verificar tus **flags de permisos** en Panel → Usuarios → Editar
2. Después de cambiar permisos: **cierra sesión** en la app y **vuelve a iniciar sesión** (los permisos se cargan al login)
3. Si el módulo tampoco aparece para tu tipo de usuario en el panel: verificar **menu_tipo_usuario** en configuración

### Rutas principales de la app (referencia técnica):

| Ruta | Pantalla | Módulo |
|------|----------|--------|
| /login | LoginPage | Autenticación |
| /menu | MainMenuPage | Menú principal |
| /incidencias | IncidenceListPage | Incidencias |
| /nuevaIncidencia | NewIncidencePage | Incidencias (4 pasos) |
| /inspecciones | InspectionListPage | Inspecciones |
| /nuevaInspeccion | NewInspectionPage | Inspecciones (3 pasos) |
| /charlas | ChatListPage | Charlas Seguridad |
| /nuevaCharla | NewChatPage | Ver charla + Quiz |
| /chatComercial | ChatListComercialPage | Charlas Comerciales |
| /tareas | TaskListPage | Tareas |
| /detalleTarea | DetailTaskPage | Detalle de tarea |
| /registrarTarea | RegisterTaskPage | Registro (3 pasos) |
| /tareasVencidas | TaskExpireListPage | Tareas vencidas |
| /calendario | CalendarListTaskPage | Calendario de tareas |
| /rankings | RankingPage | Rankings y puntos |
| /kardex | KardexRankingPage | Historial de puntos |
| /top | TopPage | Top 10 podio |
| /notificaciones | NotificationPage | Notificaciones |
| /perfil | ProfilePage | Perfil de usuario |

### Tips:
- El menú se adapta automáticamente según tus permisos — si cambian, cierra sesión y reentra
- Los badges (contadores rojos) se actualizan al abrir la app y al hacer pull-to-refresh
- El Top 10 aparece una vez al día como dialog motivacional al abrir el menú
- Si cambias de localidad/cargo/empresa, tus datos disponibles pueden cambiar
- La app funciona offline para la mayoría de módulos (excepto charlas con video y rankings)`,
    tipo: "guia",
    audiencia: "ambos",
    categoriaId: 2,
    tags: ["navegación", "menú", "módulos", "app", "permisos", "roles", "acceso", "flags", "rutas", "pantallas", "login"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARTÍCULOS NUEVOS — PANEL ADMIN lote 1 (artículos 16-25)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    titulo: "Gestión de incidencias desde el panel",
    slug: "gestion-incidencias-panel",
    resumen: "Cómo ver, filtrar, gestionar y exportar incidencias desde el panel administrativo.",
    contenido: `## Gestión de incidencias desde el panel

### Acceder:
Panel → **Incidencias** (ruta: /incidencias)

### Funcionalidades:
- **Ver lista** de todas las incidencias registradas por los usuarios
- **Filtrar** por: rango de fecha, área, localidad, empresa, estado, condición, ID de usuario
- **Crear** nueva incidencia desde el panel
- **Ver detalle** de cada incidencia (fotos, observaciones, acciones)
- **Exportar a Excel** toda la lista filtrada

### Columnas de la tabla:
- **#**: Número de incidencia (auto-incremental por usuario)
- **Usuario**: Quien reportó
- **Empresa/Localidad/Área**: Ubicación
- **Descripción**: Detalle de la observación
- **Tipo**: Acto o condición insegura
- **Estado**: Resuelto / No resuelto
- **Condición**: Pendiente, Aprobado, Rechazado, Revisión
- **Fecha**: Fecha de registro

### Filtros disponibles:
1. **Fecha desde / hasta**: Rango de fechas
2. **Empresa**: Dropdown con empresas
3. **Localidad**: Se filtra según empresa seleccionada
4. **Área**: Se filtra según localidad
5. **Estado**: Resuelto / No resuelto
6. **Condición**: Pendiente / Aprobado / Rechazado / Revisión

### Tips:
- Usa los filtros para encontrar incidencias específicas antes de exportar
- La exportación Excel respeta los filtros aplicados`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["incidencias", "panel", "filtrar", "exportar", "gestión", "lista"],
  },
  {
    titulo: "Cómo cambiar el estado y condición de una incidencia",
    slug: "estado-condicion-incidencia-panel",
    resumen: "Guía para cambiar el estado (resuelto/no resuelto) y condición de una incidencia.",
    contenido: `## Cambiar estado y condición de incidencia

### Estados disponibles:
- **No resuelto**: La incidencia está abierta, pendiente de solución
- **Resuelto**: La incidencia fue atendida y solucionada

### Condiciones disponibles:
- **Pendiente**: Recién registrada, sin revisión
- **Aprobado**: Revisada y aprobada por el supervisor
- **Rechazado**: No procede o información incorrecta
- **Revisión**: Requiere revisión adicional o fecha de corte

### Cómo cambiar:
1. Panel → **Incidencias** → Busca la incidencia
2. Haz clic en la incidencia o en el botón **"Editar condición"**
3. Se abre la pantalla de **EditCondition**
4. Selecciona el nuevo **estado** y/o **condición**
5. Agrega observaciones si es necesario
6. Haz clic en **"Guardar"**

### Reglas de negocio:
- Solo usuarios con permisos de panel pueden cambiar estados
- El cambio queda registrado con fecha y usuario que lo realizó
- Una incidencia puede pasar de Pendiente → Aprobado → Resuelto`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["incidencias", "estado", "condición", "aprobar", "rechazar", "panel"],
  },
  {
    titulo: "Cómo crear y editar usuarios de salud",
    slug: "crear-editar-usuarios-salud",
    resumen: "Guía para crear y editar usuarios del departamento de salud en el panel ARCA.",
    contenido: `## Usuarios de salud

### Acceder:
Panel → **Usuarios** → **Salud** (ruta: /usuariossalud)

### Crear usuario de salud:
1. Haz clic en **"Nuevo usuario"** o **"+"**
2. Completa los campos:
   - **Nombre completo**
   - **Email** (único en el sistema)
   - **Cédula/ID**
   - **Contraseña** (mínimo 8 caracteres)
   - **Empresa**: Selecciona la empresa
   - **Localidad**: Se filtra por empresa
   - **Área**: Se filtra por localidad
   - **Cargo**: Selecciona el cargo del catálogo
3. Configura **permisos/flags** del usuario (qué módulos puede ver)
4. Haz clic en **"Guardar"**

### Editar usuario:
1. En la lista de usuarios, haz clic en el ícono de **"Editar"**
2. Modifica los campos necesarios
3. Guarda los cambios

### Diferencia con usuarios de seguridad:
- Los usuarios de salud tienen el flag **usu_salud** activado
- Pueden tener acceso a módulos específicos de salud ocupacional
- Se gestionan desde una página separada (/usuariossalud)

### Errores comunes:
- **"Email ya registrado"**: Otro usuario ya tiene ese email
- **"Campos obligatorios"**: Nombre, email, cédula y contraseña son requeridos`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuarios", "salud", "crear", "editar", "panel", "permisos"],
  },
  {
    titulo: "Cómo crear y editar usuarios comerciales",
    slug: "crear-editar-usuarios-comerciales",
    resumen: "Guía para crear y editar usuarios del departamento comercial en el panel ARCA.",
    contenido: `## Usuarios comerciales

### Acceder:
Panel → **Usuarios** → **Comercial** (ruta: /usuario_comercial)

### Crear usuario comercial:
1. Haz clic en **"Nuevo usuario"**
2. Completa los campos obligatorios:
   - Nombre, Email, Cédula, Contraseña
   - Empresa, Localidad, Área, Cargo
3. Activa el flag **comercial** (valor distinto de -1) para que vea módulos comerciales
4. Si es jefe comercial, activa **isJefeComercial** para acceso a reportes
5. Haz clic en **"Guardar"**

### Flags especiales comerciales:
- **comercial**: Valor numérico. -1 = sin acceso comercial, otro valor = acceso activo
- **isJefeComercial**: true/false. Si es true, ve reportes de charlas comerciales

### ¿Qué ve un usuario comercial?
- Charlas de la escuela comercial
- Reportes comerciales (si es jefe)
- Rating comercial
- Al iniciar sesión en el panel, se redirige automáticamente a charlas comerciales

### Tips:
- Un usuario puede ser de seguridad Y comercial si tiene ambos flags activos
- Los jefes comerciales ven el cumplimiento de charlas de su equipo`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuarios", "comercial", "crear", "editar", "jefe", "panel"],
  },
  {
    titulo: "Carga masiva de usuarios por Excel",
    slug: "carga-masiva-usuarios-excel",
    resumen: "Cómo importar múltiples usuarios a la vez usando un archivo Excel.",
    contenido: `## Carga masiva de usuarios por Excel

### Acceder:
Panel → **Usuarios** → Sección correspondiente → **"Carga masiva"** o **"Importar Excel"**

### Pasos:
1. Haz clic en el botón de **"Carga masiva"** (ícono de Excel/upload)
2. Descarga la **plantilla Excel** si está disponible
3. Completa la plantilla con los datos de los usuarios:
   - Nombre, Email, Cédula, Contraseña
   - Empresa, Localidad, Área (deben existir previamente en el sistema)
   - Cargo
4. Sube el archivo Excel completado
5. El sistema procesará cada fila y creará los usuarios
6. Verás un resumen: cuántos se crearon, cuántos fallaron y por qué

### Requisitos del Excel:
- Formato .xlsx
- Las columnas deben coincidir con la plantilla
- Emails deben ser únicos (no pueden repetirse en el sistema)
- Empresas, localidades y áreas deben existir previamente

### Errores comunes:
- **"Email duplicado"**: Ya existe un usuario con ese email
- **"Localidad no encontrada"**: El nombre de la localidad no coincide exactamente
- **"Formato inválido"**: El archivo no es .xlsx o las columnas no coinciden

### Tips:
- Primero crea la estructura organizacional (empresas, localidades, áreas)
- Usa la plantilla oficial para evitar errores de formato
- Revisa el resumen de importación para corregir errores`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuarios", "carga masiva", "Excel", "importar", "bulk", "panel"],
  },
  {
    titulo: "Cómo cambiar jefe de un usuario o grupo de usuarios",
    slug: "cambiar-jefe-usuarios",
    resumen: "Guía para cambiar el jefe/supervisor de usuarios desde el panel ARCA.",
    contenido: `## Cambiar jefe de usuarios

### ¿Qué es el jefe?
En ARCA, cada usuario tiene un campo **usu_reporta** que indica a quién reporta (su jefe directo). Esto afecta:
- Reportes LV (Liderazgo Visible)
- Jerarquía de supervisión
- Notificaciones de incidencias

### Cambiar jefe individual:
1. Panel → **Usuarios** → Busca el usuario
2. Haz clic en **"Editar"**
3. Busca el campo **"Reporta a"** o **"Jefe"**
4. Selecciona el nuevo jefe del dropdown
5. **"Guardar"**

### Cambiar jefe en grupo (bulk):
1. Panel → **Usuarios** → Selecciona la sección de usuarios
2. Busca la opción **"Cambiar jefes"** o **"Cambio masivo de jefe"**
3. Selecciona los usuarios afectados
4. Selecciona el nuevo jefe
5. Confirma el cambio

### Impacto:
- Los reportes LV se recalculan según la nueva jerarquía
- Las notificaciones de incidencias irán al nuevo jefe
- Los reportes históricos no se afectan (usan la jerarquía del momento)

### Tips:
- Verifica que el nuevo jefe exista y esté activo en el sistema
- El cambio aplica inmediatamente para nuevos registros`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuarios", "jefe", "cambiar", "reporta", "jerarquía", "bulk", "panel"],
  },
  {
    titulo: "Cómo inactivar usuarios y ver bitácora",
    slug: "inactivar-usuarios-bitacora",
    resumen: "Guía para desactivar usuarios y consultar la bitácora de cambios.",
    contenido: `## Inactivar usuarios y bitácora

### Acceder:
Panel → **Usuarios** → **Inactivar** (ruta: /inactivar)

### Inactivar un usuario:
1. Ve a la sección de **Inactivar** o busca el usuario en la lista
2. Selecciona el usuario a desactivar
3. Confirma la inactivación
4. El usuario queda con **usu_activo = false** y no podrá iniciar sesión

### ¿Qué pasa al inactivar?
- El usuario **no puede iniciar sesión** en app ni panel
- Sus registros históricos (incidencias, tareas, etc.) se mantienen
- No aparece en listados de asignación (charlas, tareas)
- Se puede reactivar en cualquier momento

### Bitácora (Log de cambios):
1. En la página de usuarios, busca el botón **"Bitácora"**
2. Verás un historial de cambios realizados:
   - Quién hizo el cambio
   - Qué se cambió
   - Fecha y hora
   - Valor anterior y nuevo

### Tips:
- Inactivar es reversible, eliminar no
- Usa la bitácora para auditar cambios en usuarios
- Los usuarios inactivos no consumen licencias activas`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuarios", "inactivar", "desactivar", "bitácora", "log", "auditoría"],
  },
  {
    titulo: "Asignación de usuarios a localidades",
    slug: "asignar-usuario-localidad",
    resumen: "Cómo vincular usuarios a localidades específicas desde el panel.",
    contenido: `## Asignación usuario-localidad

### Acceder:
Panel → **Usuarios** → **Usuario-Localidad** (ruta: /usuario-localidad)

### ¿Qué es la asignación usuario-localidad?
La tabla **usuario_localidad** vincula un usuario con su empresa, localidad y área. Un usuario puede estar asignado a múltiples localidades.

### Asignar:
1. Ve a la sección **Usuario-Localidad**
2. Selecciona el **usuario**
3. Selecciona la **empresa**
4. Selecciona la **localidad**
5. Selecciona el **área**
6. Haz clic en **"Asignar"** o **"Guardar"**

### Campos clave:
- **usu_id**: ID del usuario
- **emp_id**: ID de la empresa
- **loc_id**: ID de la localidad
- **are_id**: ID del área

### ¿Por qué es importante?
- Determina qué datos ve el usuario (filtrado por localidad)
- Afecta las asignaciones de tareas y charlas
- Los reportes se filtran por localidad del usuario

### Tips:
- Un usuario sin localidad asignada no verá datos en la app
- Verifica que la localidad tenga áreas creadas antes de asignar`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 7,
    tags: ["usuarios", "localidad", "asignar", "empresa", "área", "panel"],
  },
  {
    titulo: "Cómo crear y gestionar formularios completo",
    slug: "crear-gestionar-formularios-completo",
    resumen: "Guía completa para crear, editar y gestionar formularios con segmentos y preguntas.",
    contenido: `## Formularios: guía completa

### Acceder:
Panel → **Formularios** (ruta: /formularios)

### Tipos de formulario:
- **Tipo 1**: Con segmentos. Las preguntas se agrupan en segmentos (secciones). Usado para inspecciones detalladas.
- **Tipo 2**: Directo con opciones múltiples. Las preguntas tienen opciones de respuesta predefinidas.

### Crear formulario:
1. Haz clic en **"Nuevo formulario"**
2. Ingresa:
   - **Nombre** (único en el sistema, case-insensitive)
   - **Tipo**: 1 o 2
   - **Estado**: Activo/Inactivo
3. **Guardar** el formulario base

### Agregar segmentos (Tipo 1):
1. Dentro del formulario, ve a **"Segmentos"**
2. Haz clic en **"Agregar segmento"**
3. Ingresa nombre del segmento
4. Guarda el segmento

### Agregar preguntas:
1. Dentro de un segmento (o directamente si es Tipo 2)
2. Haz clic en **"Agregar pregunta"**
3. Ingresa el texto de la pregunta
4. Para Tipo 2: agrega las opciones de respuesta (formulario_pregunta_detalle)
5. Ordena las preguntas según necesidad

### Errores comunes:
- **"Nombre duplicado"**: Ya existe un formulario con ese nombre (se compara con UPPER+TRIM)
- **"No se puede desactivar"**: El formulario tiene actividades de seguridad activas vinculadas
- **"Pregunta sin opciones"**: En Tipo 2, cada pregunta necesita al menos una opción

### Tips:
- No se puede eliminar un formulario con actividades activas
- Primero desactiva las actividades, luego modifica el formulario
- Los cambios en preguntas afectan futuras inspecciones, no las ya realizadas`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["formularios", "crear", "segmentos", "preguntas", "tipo", "panel"],
  },
  {
    titulo: "Segmentos y preguntas de formularios",
    slug: "segmentos-preguntas-formularios",
    resumen: "Detalle sobre cómo funcionan los segmentos y preguntas dentro de un formulario.",
    contenido: `## Segmentos y preguntas de formularios

### Estructura de un formulario:
\`\`\`
Formulario
├── Segmento 1 (solo Tipo 1)
│   ├── Pregunta 1.1
│   ├── Pregunta 1.2
│   └── Pregunta 1.3
├── Segmento 2
│   ├── Pregunta 2.1
│   └── Pregunta 2.2
└── Preguntas directas (Tipo 2)
    ├── Pregunta → Opción A, Opción B, Opción C
    └── Pregunta → Opción A, Opción B
\`\`\`

### Tablas involucradas:
- **formulario**: Datos generales (nombre, tipo, estado)
- **formulario_segmento**: Secciones del formulario (solo Tipo 1)
- **formulario_pregunta**: Cada pregunta del formulario
- **formulario_pregunta_detalle**: Opciones de respuesta (Tipo 2)

### Gestionar preguntas:
1. Abre el formulario desde Panel → Formularios
2. Dentro del formulario, verás los segmentos/preguntas existentes
3. Puedes **agregar**, **editar**, **eliminar** y **reordenar** preguntas
4. Cada pregunta puede tener un orden específico

### ¿Cómo se usan las preguntas?
- En **inspecciones**: El usuario responde cada pregunta en la app
- Las respuestas se guardan en **inspeccion_respuesta**
- La calificación se calcula según las respuestas

### Tips:
- Planifica la estructura del formulario antes de crearlo
- Las preguntas se muestran al usuario en el orden configurado`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 8,
    tags: ["formularios", "segmentos", "preguntas", "opciones", "estructura", "panel"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL ADMIN lote 2 (artículos 26-35)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    titulo: "Gestión de actividades de seguridad desde el panel",
    slug: "gestion-actividades-seguridad-panel",
    resumen: "Cómo crear, editar y gestionar actividades de seguridad vinculadas a formularios.",
    contenido: `## Actividades de seguridad

### Acceder:
Panel → **Actividades** (ruta: /actividades) o **Actividades de Seguridad** (/actividades-seguridad)

### ¿Qué es una actividad de seguridad?
Es una operación vinculada a un formulario que genera tareas. Relación: actividad_seguridad → formulario → tarea.

### Crear actividad:
1. Haz clic en **"Nueva actividad"**
2. Ingresa: nombre, descripción
3. **Vincula un formulario** existente (campo frm_id)
4. Opcionalmente adjunta un **PDF** con detalles
5. **"Guardar"**

### Gestionar:
- **Editar**: Cambia nombre, descripción o formulario vinculado
- **Eliminar**: Solo si NO tiene tareas activas vinculadas
- **Ver tareas**: Consulta las tareas generadas desde esta actividad

### Errores comunes:
- **"No se puede eliminar"**: Tiene tareas activas. Primero elimina o finaliza las tareas.
- **"Sin formulario"**: Debes vincular un formulario antes de crear tareas.

### Flujo completo:
1. Crear formulario con preguntas
2. Crear actividad vinculada al formulario
3. Crear tareas desde la actividad
4. Asignar tareas a usuarios
5. Usuarios completan en la app`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 11,
    tags: ["actividades", "seguridad", "formulario", "tareas", "panel", "crear"],
  },
  {
    titulo: "Dashboard de actividades: gráficos y comparativas",
    slug: "dashboard-actividades-panel",
    resumen: "Cómo usar el dashboard de actividades con gráficos, filtros y comparativas.",
    contenido: `## Dashboard de actividades

### Acceder:
Panel → **Dashboard Actividades** (ruta: /dashboard-actividades)

### ¿Qué muestra?
- **Gráficos** de cumplimiento de actividades por periodo
- **Comparativas** mensuales y anuales
- **Detalle** por actividad, empresa, localidad, área, usuario
- Visualizaciones con **Highcharts**

### Filtros disponibles:
- **País / Negocio**: Filtra por ubicación geográfica
- **Empresa**: Selecciona una o varias empresas
- **Área / Localidad**: Detalle por ubicación
- **Actividad**: Filtra por actividad específica
- **Usuario**: Filtra por usuario responsable
- **Rango de fechas**: Periodo a analizar

### Métricas principales:
- Total de actividades programadas vs completadas
- Porcentaje de cumplimiento
- Tendencia mensual
- Desglose por área/localidad

### Tips:
- Usa las comparativas para identificar áreas con bajo cumplimiento
- Exporta los datos para reportes ejecutivos
- Los gráficos se actualizan en tiempo real al cambiar filtros`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["dashboard", "actividades", "gráficos", "comparativas", "panel", "filtros"],
  },
  {
    titulo: "Reporte LV: qué es y cómo interpretarlo",
    slug: "reporte-lv-panel",
    resumen: "Explicación del reporte de Liderazgo Visible (LV) y cómo leerlo.",
    contenido: `## Reporte LV (Liderazgo Visible)

### ¿Qué es el reporte LV?
El reporte de Liderazgo Visible mide la participación y visibilidad de los líderes/supervisores en actividades de seguridad. Se basa en la jerarquía de reporteo (usu_reporta).

### Acceder:
Panel → **Reportes** → **LV** (rutas: /lv, /lv2, /lv-corte)

### Versiones del reporte:
- **LV**: Reporte estándar por periodo
- **LV2**: Vista alternativa con más detalle
- **LV Corte**: Reporte por fecha de corte configurada en parámetros

### Datos que muestra:
- **Semana de reporte** (tabla semana_reporte)
- **Líder/Supervisor** y su jerarquía
- **Actividades realizadas** en el periodo
- **Cumplimiento** vs esperado

### ¿Cómo se calcula?
1. Se toma la **semana_reporte** configurada
2. Se busca la jerarquía del líder (usuario.usu_reporta)
3. Se cuentan las actividades realizadas por el líder y su equipo
4. Se compara con la meta esperada

### Filtros:
- Periodo (fecha desde/hasta)
- Empresa
- Localidad
- Nivel de cargo

### Tips:
- El reporte LV depende de que la jerarquía de jefes esté correcta
- Si un líder no aparece, verifica que tenga usu_reporta configurado
- Las fechas de corte se configuran en Panel → Configuración → Parámetros`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["reporte", "LV", "liderazgo visible", "supervisores", "jerarquía", "panel"],
  },
  {
    titulo: "Reporte OPE: observaciones y potencial",
    slug: "reporte-ope-panel",
    resumen: "Explicación del reporte OPE (Observaciones Planeadas de Ejecución).",
    contenido: `## Reporte OPE (Observaciones)

### ¿Qué es el reporte OPE?
El reporte OPE mide las Observaciones Planeadas de Ejecución, clasificando las observaciones por tipo y potencial de riesgo.

### Acceder:
Panel → **Reportes** → **OPE** (rutas: /ope, /ope2, /ope-corte)

### Versiones:
- **OPE**: Reporte estándar
- **OPE2**: Vista alternativa con más detalle
- **OPE Corte**: Por fecha de corte del periodo

### Datos que muestra:
- **Tipo de observación** (tabla tipo_observacion): Clasificación del hallazgo
- **Potencial** (tabla potencial): Nivel de riesgo del hallazgo
- Cantidad de observaciones por periodo
- Distribución por tipo y potencial

### Filtros:
- Rango de fechas
- Empresa / Localidad / Área
- Tipo de observación
- Potencial

### ¿Cómo se interpreta?
- Alto número de observaciones de alto potencial = área de riesgo que requiere atención
- Tendencia creciente en observaciones = mayor cultura de seguridad (reportan más)
- Comparar periodos para ver evolución

### Tips:
- Los tipos de observación se configuran en Panel → Configuración → Tipo Observación
- Los niveles de potencial se configuran en Panel → Configuración → Potencial`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["reporte", "OPE", "observaciones", "potencial", "riesgo", "panel"],
  },
  {
    titulo: "Reporte P5M: los 5 pilares de excelencia",
    slug: "reporte-p5m-panel",
    resumen: "Explicación del reporte P5M y los 5 pilares de medición de seguridad.",
    contenido: `## Reporte P5M (5 Pilares)

### ¿Qué es el reporte P5M?
El P5M mide el desempeño en los 5 pilares de excelencia en seguridad. Se calcula usando las respuestas de charlas agrupadas por jefe y nivel de cargo.

### Acceder:
Panel → **Reportes** → **P5M** (rutas: /pm5, /pm52, /pm5-corte, /p5m-comercial)

### Versiones:
- **P5M**: Reporte estándar de seguridad
- **P5M2**: Vista alternativa
- **P5M Corte**: Por fecha de corte
- **P5M Comercial**: Versión para departamento comercial

### Datos que usa:
- **charla_respuesta.usu_id_jefe**: Jefe del usuario que respondió
- **cargo_nivel**: Nivel jerárquico del cargo
- Respuestas de charlas/capacitaciones en el periodo

### Métricas:
- Cumplimiento por pilar
- Comparativa entre áreas/localidades
- Tendencia mensual
- Desglose por nivel de cargo

### Tips:
- El P5M depende de que las charlas estén correctamente asignadas y respondidas
- Si un área no tiene datos, verifica que los usuarios tengan charlas asignadas
- Los campos desnormalizados en charla_respuesta (emp_id_jef, etc.) deben estar correctos`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["reporte", "P5M", "pilares", "excelencia", "charlas", "panel"],
  },
  {
    titulo: "Rating de seguridad: calificación y cortes",
    slug: "rating-seguridad-panel",
    resumen: "Cómo funciona el rating de seguridad, su cálculo y los periodos de corte.",
    contenido: `## Rating de seguridad

### Acceder:
Panel → **Reportes** → **Rating Seguridad** (rutas: /rating-seguridad, /rating-seguridad2, /rating-seguridad-corte)

### ¿Qué es el rating?
Es una calificación integral de desempeño en seguridad que combina múltiples indicadores. Se almacena precalculado en la tabla **reporte_rating**.

### Componentes del rating:
- Cumplimiento de **incidencias** reportadas
- Cumplimiento de **inspecciones** realizadas
- Cumplimiento de **charlas** respondidas
- Cumplimiento de **tareas** completadas
- Puntualidad y calidad de los registros

### Versiones:
- **Rating Seguridad**: Vista estándar por periodo
- **Rating Seguridad 2**: Vista alternativa con más detalle
- **Rating Corte**: Reporte por fecha de corte configurada

### Fechas de corte:
- Se configuran en Panel → **Configuración** → **Parámetros**
- **Día 1**: Primer corte del mes
- **Día 2**: Segundo corte del mes
- El rating se calcula entre cortes

### Tips:
- Si el rating no muestra datos, verifica que reporte_rating tenga registros para el periodo
- El rating se precalcula, no se genera en tiempo real
- Usa /rating-seguridad-corte para ver el rating exacto en la fecha de corte`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["rating", "seguridad", "calificación", "corte", "reporte", "panel"],
  },
  {
    titulo: "Rating comercial y reportes comerciales",
    slug: "rating-comercial-panel",
    resumen: "Cómo funciona el rating comercial y los reportes de la escuela comercial.",
    contenido: `## Rating y reportes comerciales

### Acceder:
Panel → **Reportes** → **Rating Comercial** (ruta: /rating-comercial)
Panel → **Reportes** → **Charlas Comerciales** (rutas: /reporte-charlas-comercial, /reporte-charlas-comercial2)

### Rating comercial:
- Similar al rating de seguridad pero para el departamento comercial
- Mide cumplimiento de charlas comerciales y actividades de la escuela comercial
- Solo visible para usuarios con rol de jefe comercial o administradores

### Reportes de charlas comerciales:
- **Reporte Charlas Comercial**: Cumplimiento de charlas de la escuela comercial
- **Reporte Charlas Comercial 2**: Vista alternativa con más detalle
- Muestra: quién respondió, quién no, calificaciones, fechas

### ¿Quién puede verlos?
- Administradores: Ven todo
- Jefes comerciales (isJefeComercial = true): Ven su equipo
- Usuarios comerciales regulares: No ven estos reportes

### Tips:
- Los reportes comerciales son independientes de los de seguridad
- Un usuario puede aparecer en ambos si tiene ambos roles activos`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["rating", "comercial", "reportes", "charlas", "escuela comercial", "panel"],
  },
  {
    titulo: "Reporte de charlas: seguimiento y autorización",
    slug: "reporte-charlas-seguimiento",
    resumen: "Cómo ver el cumplimiento de charlas y gestionar autorizaciones.",
    contenido: `## Reporte de charlas

### Acceder:
Panel → **Reportes** → **Charlas** (rutas: /reporte-charlas, /reporte-charlas2, /charlas_autorizacion, /charlas_respuesta)

### Tipos de reportes de charlas:
1. **Reporte Charlas**: Vista general de cumplimiento
2. **Reporte Charlas 2**: Vista alternativa con más detalle
3. **Charlas Autorización**: Charlas pendientes de autorización/aprobación
4. **Charlas Respuesta**: Detalle de respuestas de los usuarios

### ¿Qué muestra?
- Lista de charlas asignadas
- Usuarios que respondieron vs pendientes
- Calificaciones del quiz
- Fecha de respuesta
- Estado de autorización

### Filtros:
- Rango de fechas
- Empresa / Localidad
- Charla específica
- Usuario

### Tips:
- Usa el reporte de autorización para aprobar charlas pendientes
- El reporte de respuestas muestra las respuestas detalladas del quiz
- Exporta a Excel para reportes ejecutivos`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 10,
    tags: ["charlas", "reporte", "seguimiento", "autorización", "respuestas", "panel"],
  },
  {
    titulo: "Cómo crear y asignar charlas comerciales",
    slug: "crear-asignar-charlas-comerciales",
    resumen: "Guía para crear charlas de la escuela comercial y asignarlas a usuarios.",
    contenido: `## Charlas comerciales (crear y asignar)

### Acceder:
Panel → **Charlas** → **Comercial** (ruta: /charla_comercial)

### Crear charla comercial:
1. Haz clic en **"Nueva charla comercial"**
2. Ingresa:
   - **Nombre** de la charla (único)
   - **Contenido**: Texto, imágenes o URL de video
   - **Preguntas**: Quiz de evaluación (agregar preguntas con opciones)
   - **Fecha límite**: Hasta cuándo pueden responder
3. **"Guardar"**

### Asignar charla comercial:
1. Selecciona la charla creada
2. Haz clic en **"Asignar"**
3. Filtra usuarios por:
   - **Empresa**
   - **Localidad**
   - **Área**
   - **Cargo**
4. Selecciona los usuarios o grupos
5. **"Confirmar asignación"**

### Diferencias con charlas de seguridad:
- Se gestionan en una página separada (/charla_comercial)
- Solo visibles para usuarios con flag comercial activo
- Los reportes se ven en /reporte-charlas-comercial
- El jefe comercial ve el cumplimiento de su equipo

### Tips:
- Asegúrate de que los usuarios destino tengan el flag comercial activo
- Las charlas comerciales aparecen automáticamente en la app de usuarios comerciales`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 10,
    tags: ["charlas", "comercial", "crear", "asignar", "escuela comercial", "panel"],
  },
  {
    titulo: "Gestión de recompensas y premios",
    slug: "gestion-recompensas-premios",
    resumen: "Cómo gestionar el sistema de recompensas y premios para los rankings.",
    contenido: `## Recompensas y premios

### Acceder:
Panel → **Recompensas** (rutas: /recompensas, /recompensas_seguridad)

### ¿Qué son las recompensas?
Son premios que los usuarios pueden canjear con sus puntos acumulados en el sistema de rankings.

### Gestionar recompensas:
1. Panel → **Recompensas**
2. Ver las recompensas disponibles con ranking cards
3. Crear nueva recompensa: nombre, descripción, puntos requeridos
4. Editar o desactivar recompensas existentes

### Recompensas de seguridad:
- Ruta: /recompensas_seguridad
- Muestra recompensas filtradas por módulos de seguridad
- Incluye ratings específicos por módulo

### Canje de puntos:
1. El usuario acumula puntos por actividades completadas
2. Desde el panel (kardex), se puede registrar un canje
3. Se descuentan los puntos del kardex del usuario
4. Se registra el movimiento como tipo "canje"

### Tips:
- Los puntos se acumulan automáticamente cuando el usuario completa actividades
- El canje se registra desde el panel, no desde la app
- Verifica que el usuario tenga puntos suficientes antes de canjear`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 14,
    tags: ["recompensas", "premios", "canje", "puntos", "panel", "rankings"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL ADMIN lote 3 (artículos 36-45)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    titulo: "Kardex de puntos: movimientos y canje",
    slug: "kardex-puntos-panel",
    resumen: "Cómo consultar y gestionar el kardex de puntos de usuarios desde el panel.",
    contenido: `## Kardex de puntos

### Acceder:
Panel → **Rankings** → **Kardex** (ruta: /ranking_kardex)

### ¿Qué es el kardex?
Es el libro contable de puntos de cada usuario. Registra cada movimiento: puntos ganados, canjeados, o ajustados.

### Funcionalidades:
1. **Buscar usuario**: Por nombre o email
2. **Ver movimientos**: Lista cronológica de todos los movimientos de puntos
3. **Filtrar por módulo**: Incidencias, Inspecciones, Charlas, Tareas
4. **Canjear puntos**: Registrar un canje de puntos por recompensa
5. **Ver premios**: Consultar recompensas disponibles
6. **Exportar a Excel**: Descargar el kardex completo

### Columnas del kardex:
- **Fecha**: Cuándo se realizó el movimiento
- **Tipo**: Ganancia, canje, ajuste
- **Puntos**: Cantidad sumada o restada
- **Módulo**: De qué módulo provienen los puntos
- **Descripción**: Detalle del movimiento

### Cómo canjear puntos:
1. Busca al usuario en el kardex
2. Haz clic en **"Canjear puntos"**
3. Selecciona la recompensa o ingresa la cantidad
4. Confirma el canje
5. Los puntos se restan automáticamente del saldo

### Tips:
- Los líderes del ranking aparecen destacados
- Cada módulo aporta puntos según la configuración del sistema`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 14,
    tags: ["kardex", "puntos", "canje", "movimientos", "panel", "rankings"],
  },
  {
    titulo: "Rankings por usuario y módulo",
    slug: "rankings-usuario-modulo-panel",
    resumen: "Cómo ver rankings filtrados por usuario y módulo desde el panel.",
    contenido: `## Rankings por usuario y módulo

### Acceder:
Panel → **Rankings** → **Ranking Usuario** (ruta: /ranking_usuario)

### Funcionalidades:
- Ver ranking de usuarios por **módulo específico**: Incidencias, Charlas, Tareas, Inspecciones
- Filtrar por **mes/año**
- Ver ranking de **managers/jefes**
- **Exportar a Excel**

### Cómo usar:
1. Selecciona el **módulo** a consultar
2. Selecciona el **periodo** (mes y año)
3. Se muestra la tabla con usuarios ordenados por puntos
4. Puedes alternar entre ranking de usuarios y ranking de managers

### Columnas:
- **Posición**: Lugar en el ranking
- **Usuario**: Nombre y email
- **Puntos**: Total del periodo
- **Módulo**: Módulo de donde provienen los puntos

### Tips:
- El ranking de managers agrupa puntos de todo el equipo del jefe
- Usa los íconos de visibilidad para mostrar/ocultar columnas`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 14,
    tags: ["rankings", "usuario", "módulo", "filtrar", "panel", "managers"],
  },
  {
    titulo: "Iniciativas y programas de tareas",
    slug: "iniciativas-programas-tareas",
    resumen: "Cómo gestionar iniciativas y programas de tareas desde el panel.",
    contenido: `## Iniciativas y programas de tareas

### Iniciativas:
Panel → **Iniciativas** (ruta: /iniciativas)

Gestión de proyectos o iniciativas especiales con CRUD completo:
- **Crear**: Nombre, descripción, fechas, responsable
- **Editar**: Modificar datos de la iniciativa
- **Eliminar**: Remover iniciativas completadas o canceladas
- **Listar**: Ver todas las iniciativas con filtros

### Programas de tareas:
Panel → **Programas Tarea** (ruta: /programas-tarea)

Gestión de programas que agrupan tareas:
- **Crear programa**: Agrupar tareas relacionadas bajo un programa
- **Asignar tareas**: Vincular tareas existentes al programa
- **Seguimiento**: Ver avance del programa

### Diferencia:
- **Iniciativa**: Proyecto general con objetivos
- **Programa de tareas**: Agrupación específica de tareas a ejecutar

### Tips:
- Usa iniciativas para proyectos estratégicos
- Usa programas de tareas para operaciones recurrentes`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 11,
    tags: ["iniciativas", "programas", "tareas", "proyectos", "panel"],
  },
  {
    titulo: "Gestión de países, regiones y subregiones",
    slug: "paises-regiones-subregiones",
    resumen: "Cómo administrar la estructura geográfica: países, regiones y subregiones.",
    contenido: `## Países, regiones y subregiones

### Jerarquía:
País → Región → Subregión → Localidad → Área

### Países:
Panel → **Configuración** → **Países** (ruta: /pais)
- Crear, editar, eliminar países
- Cada país tiene: nombre, código

### Regiones:
Panel → **Configuración** → **Regiones** (ruta: /regiones)
- Crear regiones dentro de un país
- Cada región pertenece a un país
- CRUD completo

### Regiones comerciales:
Panel → **Configuración** → **Regiones Comerciales** (ruta: /region-comercial)
- Regiones específicas para el departamento comercial
- Separadas de las regiones de seguridad

### Subregiones:
Panel → **Configuración** → **Subregiones** (ruta: /subregiones)
- Nivel intermedio entre región y localidad
- Opcional, no todas las estructuras lo usan

### Reglas:
- **No se puede eliminar** un país/región que tenga hijos (regiones/localidades)
- Los nombres son únicos dentro de su nivel
- Crear de arriba hacia abajo: primero país, luego región, luego subregión

### Tips:
- Planifica la estructura antes de crear
- Los cambios afectan los filtros disponibles en reportes`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["países", "regiones", "subregiones", "estructura", "jerarquía", "panel"],
  },
  {
    titulo: "Gestión de localidades, ciudades y áreas",
    slug: "localidades-ciudades-areas",
    resumen: "Cómo administrar localidades, ciudades y áreas de trabajo.",
    contenido: `## Localidades, ciudades y áreas

### Localidades:
Panel → **Configuración** → **Localidades** (ruta: /localidades)
- Cada localidad pertenece a una región o subregión
- CRUD completo: crear, editar, eliminar
- Las localidades son donde se asignan usuarios

### Ciudades:
Panel → **Configuración** → **Ciudades** (ruta: /ciudad)
- Catálogo de ciudades para referencia geográfica
- CRUD completo

### Áreas:
Panel → **Configuración** → **Áreas** (ruta: /area)
- Cada área pertenece a una localidad
- CRUD completo con posibilidad de subir imagen
- Las áreas son el nivel más bajo de la jerarquía

### Áreas México:
Panel → **Configuración** → **Áreas México** (ruta: /areas-mexico)
- Configuración específica para áreas en México

### Reglas:
- Una **localidad sin áreas** no puede tener usuarios asignados
- Las áreas determinan el filtrado más granular de datos
- **No se puede eliminar** una localidad o área con registros asociados

### Tips:
- Crea áreas para cada localidad antes de asignar usuarios
- Los filtros en reportes usan esta jerarquía`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["localidades", "ciudades", "áreas", "estructura", "panel", "configuración"],
  },
  {
    titulo: "Gestión de empresas, negocios y manufactura",
    slug: "empresas-negocios-manufactura",
    resumen: "Cómo administrar empresas, unidades de negocio y manufactura.",
    contenido: `## Empresas, negocios y manufactura

### Empresas:
Panel → **Configuración** → **Empresas** (ruta: /empresa)
- Entidad principal de la jerarquía organizacional
- Cada empresa tiene: nombre, código, datos de contacto
- CRUD completo
- Los usuarios se asignan a empresas vía usuario_localidad

### Negocios (Unidades de negocio):
Panel → **Configuración** → **Negocios** (ruta: /negocio)
- Agrupación de empresas por línea de negocio
- CRUD completo

### Manufactura:
Panel → **Configuración** → **Manufactura** (ruta: /manufactura)
- Unidades de manufactura/producción
- CRUD completo

### Relaciones:
- Un negocio puede tener varias empresas
- Una empresa pertenece a un negocio
- La manufactura es complementaria a la estructura principal

### Tips:
- Las empresas son clave para filtros en reportes
- Los usuarios ven datos filtrados por su empresa asignada`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["empresas", "negocios", "manufactura", "estructura", "panel"],
  },
  {
    titulo: "Gestión de cargos, niveles y tipos de persona",
    slug: "cargos-niveles-tipos-persona",
    resumen: "Cómo administrar cargos, niveles de cargo y tipos de persona.",
    contenido: `## Cargos, niveles y tipos de persona

### Cargos:
Panel → **Configuración** → **Cargos** (ruta: /cargo)
- Catálogo de posiciones/cargos en la organización
- Cada usuario tiene un cargo asignado
- CRUD completo

### Niveles de cargo:
Panel → **Configuración** → **Nivel de Cargo** (ruta: /cargonivel)
- Jerarquía de cargos (tabla cargo_nivel)
- Define el nivel jerárquico: Operativo, Supervisor, Gerente, Director, etc.
- Afecta los reportes P5M (agrupación por nivel de cargo)
- CRUD completo

### Tipos de persona:
Panel → **Configuración** → **Tipos de Persona** (ruta: /tipopersonas)
- Clasificación de personas: Empleado, Contratista, Visitante, etc.
- Afecta filtros en reportes y asignaciones
- CRUD completo

### Otros catálogos relacionados:
- **Potencial** (/potencial): Niveles de riesgo para observaciones OPE
- **Tipo Observación** (/tipo-observacion): Clasificación de observaciones
- **Requisitos** (/requisitos): Requisitos de cumplimiento
- **Causas** (/causa): Códigos de causa para incidencias

### Tips:
- Los niveles de cargo afectan cómo se agrupa el reporte P5M
- Configura los cargos antes de crear usuarios`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["cargos", "niveles", "tipos persona", "configuración", "panel", "jerarquía"],
  },
  {
    titulo: "Cómo exportar datos a Excel desde el panel",
    slug: "exportar-excel-panel",
    resumen: "Guía general para exportar tablas y reportes a formato Excel desde el panel.",
    contenido: `## Exportar a Excel desde el panel

### ¿Dónde se puede exportar?
La mayoría de las tablas del panel tienen un botón de exportación a Excel. Módulos con exportación:
- **Incidencias**: Exporta lista filtrada
- **Inspecciones**: Exporta inspecciones con detalle
- **Tareas**: Exporta asignaciones y respuestas
- **Usuarios**: Exporta lista de usuarios
- **Reportes**: Todos los reportes (LV, OPE, P5M, Ratings)
- **Rankings/Kardex**: Exporta rankings y movimientos

### Cómo exportar:
1. Navega a la sección que quieres exportar
2. **Aplica los filtros** deseados (fecha, empresa, localidad, etc.)
3. Busca el botón **"Exportar Excel"** (ícono de descarga o tabla)
4. Haz clic y espera la descarga
5. El archivo .xlsx se descargará con los datos filtrados

### Importante:
- La exportación **respeta los filtros** aplicados
- Si no aplicas filtros, se exporta todo (puede ser muy grande)
- El formato es .xlsx compatible con Microsoft Excel y Google Sheets
- Se usa la librería **ExcelJS** + **FileSaver** para la generación

### Tips:
- Aplica filtros antes de exportar para obtener datos específicos
- Los reportes exportados incluyen las mismas columnas que ves en pantalla
- Si la exportación falla, intenta con un rango de fechas más pequeño`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 12,
    tags: ["exportar", "Excel", "descargar", "panel", "datos", "reportes"],
  },
  {
    titulo: "Configuración de parámetros del sistema",
    slug: "configuracion-parametros-sistema",
    resumen: "Cómo configurar parámetros del sistema: fechas de corte, márgenes y porcentajes.",
    contenido: `## Parámetros del sistema

### Acceder:
Panel → **Configuración** → **Parámetros** (ruta: /parametro)

### Parámetros configurables:
- **Día 1 (primer corte)**: Día del mes para el primer corte de reportes
- **Día 2 (segundo corte)**: Día del mes para el segundo corte
- **Margen de error**: Porcentaje de tolerancia en mediciones
- **Porcentaje de aceptación**: Umbral para considerar cumplimiento aceptable
- **Distancia**: Parámetros de distancia para validaciones geográficas

### ¿Qué son las fechas de corte?
Las fechas de corte definen los periodos de evaluación:
- Del **Día 1** al **Día 2**: Primer periodo del mes
- Del **Día 2** al **Día 1** del siguiente mes: Segundo periodo
- Los reportes de corte (LV Corte, OPE Corte, Rating Corte) usan estas fechas

### Cómo configurar:
1. Ve a Panel → Configuración → Parámetros
2. Modifica los valores deseados
3. Guarda los cambios
4. Los nuevos valores aplican inmediatamente para reportes futuros

### Tips:
- Cambiar las fechas de corte no afecta reportes históricos ya calculados
- Coordina con el equipo antes de cambiar parámetros que afectan evaluaciones`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["parámetros", "configuración", "corte", "fechas", "margen", "panel"],
  },
  {
    titulo: "Gestión del menú del panel y permisos",
    slug: "gestion-menu-permisos-panel",
    resumen: "Cómo gestionar la estructura del menú del panel y los permisos por tipo de usuario.",
    contenido: `## Menú del panel y permisos

### Acceder:
Panel → **Configuración** → **Menú** (ruta: /menu)

### ¿Qué es la gestión de menú?
El menú del panel es dinámico y se configura desde la base de datos. Cada entrada define qué módulos/páginas son visibles.

### Funcionalidades:
- **Crear** nuevas entradas de menú
- **Editar** entradas existentes (nombre, ruta, ícono, orden)
- **Eliminar** entradas
- **Copiar menú**: Duplicar la estructura de menú de un tipo de usuario a otro

### Estructura del menú:
- Tabla **menu**: Define las entradas de menú (nombre, URL, ícono, orden, padre)
- Tabla **menu_tipo_usuario**: Vincula menú con tipos de usuario
- **prg_url_panel**: La ruta del panel para cada entrada

### Permisos por tipo de usuario:
- Cada tipo de usuario ve solo las entradas de menú asignadas
- Si un usuario **no ve un módulo**, verificar en menu_tipo_usuario
- Los permisos se gestionan a nivel de menú, no de usuario individual

### ¿Un usuario no ve un módulo que debería ver?
1. Verifica que la entrada de menú exista en la tabla **menu**
2. Verifica que el tipo de usuario tenga la entrada en **menu_tipo_usuario**
3. Verifica los flags del usuario (usu_seguridad, incidencias, charlas, etc.)

### Tips:
- Usa "Copiar menú" para replicar permisos entre tipos de usuario
- La estructura de menú es jerárquica (padre/hijo)
- Cambios en el menú aplican inmediatamente (no requiere reinicio)`,
    tipo: "guia",
    audiencia: "no_tecnico",
    categoriaId: 13,
    tags: ["menú", "permisos", "configuración", "panel", "acceso", "tipo usuario"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FAQs Y DIAGNÓSTICOS (artículos 46-60)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    titulo: "¿Qué roles y permisos existen en ARCA?",
    slug: "roles-permisos-arca",
    resumen: "Referencia completa de los roles de usuario y permisos disponibles en ARCA.",
    contenido: `## Roles y permisos en ARCA

### Tipos de usuario en la app:
| Tipo | Descripción | Módulos principales |
|------|-------------|---------------------|
| **Seguridad** | Personal de seguridad industrial | Incidencias, Inspecciones, Charlas, Tareas |
| **Salud** | Personal de salud ocupacional | Inspecciones, Charlas especializadas |
| **Comercial** | Equipo de ventas/comercial | Charlas comerciales, Rating comercial |
| **Líderes** | Supervisores y gerentes | Reportes, Dashboard, Gestión de equipo |

### Flags de permisos por usuario:
- **usu_seguridad**: Acceso a módulos de seguridad
- **usu_salud**: Acceso a módulos de salud
- **incidencias**: Puede crear/ver incidencias
- **charlas**: Puede ver/responder charlas
- **inspecciones**: Puede realizar inspecciones
- **tareas**: Puede ver/completar tareas
- **reporteCharlas**: Puede ver reportes de charlas (líderes)
- **comercial**: Acceso a escuela comercial (valor != -1)
- **isJefeComercial**: Acceso a reportes comerciales como jefe

### Roles en el panel de soporte:
- **admin**: Acceso total, puede ejecutar SQL, gestionar configuración
- **soporte_tecnico**: Acceso a DB read-only, diagnósticos técnicos
- **soporte**: Solo navegación funcional, sin acceso técnico

### ¿Cómo cambiar permisos?
Panel → Usuarios → Seleccionar usuario → Editar → Modificar flags → Guardar

### Tips:
- Un usuario puede tener múltiples flags activos (seguridad + comercial)
- Los permisos de menú se gestionan por separado en menu_tipo_usuario`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 1,
    tags: ["roles", "permisos", "flags", "seguridad", "salud", "comercial", "líderes"],
  },
  {
    titulo: "¿Cómo funciona la jerarquía organizacional?",
    slug: "jerarquia-organizacional-arca",
    resumen: "Explicación de la jerarquía organizacional: empresa, región, localidad, área, usuario.",
    contenido: `## Jerarquía organizacional de ARCA

### Estructura jerárquica:
\`\`\`
País
└── Región
    └── Subregión (opcional)
        └── Localidad
            └── Área
                └── Usuario
\`\`\`

### Relación paralela:
\`\`\`
Negocio → Empresa → Usuario (vía usuario_localidad)
\`\`\`

### ¿Cómo se vinculan los usuarios?
La tabla **usuario_localidad** conecta al usuario con la estructura:
- **usu_id**: ID del usuario
- **emp_id**: Empresa a la que pertenece
- **loc_id**: Localidad donde trabaja
- **are_id**: Área específica

### Jerarquía de reporteo:
El campo **usuario.usu_reporta** define a quién reporta cada usuario (su jefe directo). Esto crea una cadena jerárquica usada en:
- Reportes LV (Liderazgo Visible)
- Notificaciones de incidencias
- Asignaciones de tareas

### Impacto en el sistema:
- Los **filtros** de reportes usan esta jerarquía
- Las **asignaciones** de charlas y tareas pueden ser por empresa, localidad o área
- Los **rankings** se calculan dentro de cada grupo organizacional

### Tips:
- Crear la estructura de arriba hacia abajo: País → Región → Localidad → Área
- No se puede eliminar un nivel que tenga hijos
- Un usuario sin localidad asignada no verá datos en la app`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 13,
    tags: ["jerarquía", "organización", "empresa", "localidad", "área", "estructura"],
  },
  {
    titulo: "¿Cómo se calculan los rankings y puntos?",
    slug: "como-se-calculan-rankings-puntos",
    resumen: "Explicación de cómo se calculan los puntos y rankings en el sistema ARCA.",
    contenido: `## Cálculo de rankings y puntos

### ¿De dónde vienen los puntos?
Los puntos se acumulan automáticamente cuando un usuario completa actividades:

| Módulo | Acción que genera puntos |
|--------|--------------------------|
| **Incidencias** | Reportar una incidencia |
| **Inspecciones** | Completar una inspección |
| **Charlas** | Responder una charla/capacitación |
| **Tareas** | Completar una tarea asignada |

### ¿Cómo se calcula el ranking?
1. Se suman los puntos de cada usuario por periodo (mes/año)
2. Se ordenan de mayor a menor
3. La posición determina el ranking

### Tablas involucradas:
- **ranking**: Almacena posición y puntos por periodo
- **kardex**: Historial detallado de cada movimiento de puntos
- **recompensa**: Premios canjeables con puntos

### Periodos:
- Los rankings se calculan por **mes** y **año**
- Se puede consultar cualquier periodo pasado
- El Top 10 muestra los mejores del periodo actual

### Tips:
- Los puntos de tareas vencidas NO se cuentan
- La puntualidad puede afectar la cantidad de puntos
- Los puntos canjeados se restan del saldo pero no de la posición histórica`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 14,
    tags: ["rankings", "puntos", "cálculo", "módulos", "periodo", "acumulación"],
  },
  {
    titulo: "¿Qué pasa si un usuario no completa una charla a tiempo?",
    slug: "charla-no-completada-tiempo",
    resumen: "Qué ocurre cuando un usuario no responde una charla antes de la fecha límite.",
    contenido: `## Charla no completada a tiempo

### ¿Qué pasa?
- La charla queda en estado **pendiente/vencida** para el usuario
- **No se suman puntos** de esa charla
- Aparece como **incumplimiento** en los reportes de charlas
- El supervisor puede ver qué usuarios no completaron en el reporte

### ¿Puede completarla después?
- Depende de la configuración: algunas charlas se bloquean al vencer
- Si está bloqueada, el usuario verá que no puede responder
- El administrador puede extender la fecha desde el panel

### ¿Cómo evitarlo?
- Revisar las charlas pendientes diariamente en la app
- Las notificaciones push avisan de nuevas charlas asignadas
- Los supervisores pueden hacer seguimiento desde el reporte de charlas

### Desde el panel:
1. Panel → Reportes → Charlas
2. Filtra por charla y periodo
3. Verás qué usuarios completaron y cuáles no
4. Puedes reasignar o extender la charla si es necesario`,
    tipo: "faq",
    audiencia: "no_tecnico",
    categoriaId: 6,
    tags: ["charla", "vencida", "no completada", "tiempo", "incumplimiento"],
  },
  {
    titulo: "¿Qué tipos de tareas existen (normal vs cron)?",
    slug: "tipos-tareas-normal-cron",
    resumen: "Diferencia entre tareas normales (una vez) y tareas cron (recurrentes).",
    contenido: `## Tipos de tareas

### Tarea normal (tar_tipo = 0):
- Se crea una sola vez
- Se asigna a usuarios específicos
- Tiene fecha de inicio y fin
- Una vez completada, no se regenera

### Tarea cron/recurrente (tar_tipo = 3):
- Se crea con una **programación recurrente**
- Genera nuevas asignaciones automáticamente según la frecuencia
- Útil para tareas periódicas (inspecciones semanales, revisiones mensuales)
- Cada ciclo crea una nueva instancia de la tarea

### ¿Cómo se crean?
1. Panel → Tareas → Nueva tarea
2. Selecciona el **tipo**: Normal o Cron
3. Para cron: configura la frecuencia (diaria, semanal, mensual)
4. Asigna a usuarios
5. Guardar

### Desde la app:
- El usuario ve ambos tipos en su lista de tareas
- No hay diferencia visual para el usuario
- Las tareas cron generan nuevas entradas periódicamente

### Tips:
- Usa tareas normales para actividades puntuales
- Usa tareas cron para rutinas periódicas
- Las tareas cron pueden generar muchas asignaciones, planifica bien la frecuencia`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 3,
    tags: ["tareas", "tipo", "normal", "cron", "recurrente", "programación"],
  },
  {
    titulo: "¿Cómo funciona el sistema de notificaciones push?",
    slug: "como-funciona-notificaciones-push",
    resumen: "Explicación técnica-funcional del sistema de notificaciones push con Firebase.",
    contenido: `## Sistema de notificaciones push

### Tecnología:
ARCA usa **Firebase Cloud Messaging (FCM)** para enviar notificaciones push a los dispositivos móviles.

### Flujo:
1. El usuario inicia sesión en la app
2. La app registra un **token Firebase** del dispositivo
3. El token se guarda en la base de datos (campo **usu_firebase_token**)
4. Cuando ocurre un evento (nueva tarea, charla, etc.), el servidor envía un push vía Firebase
5. El dispositivo recibe y muestra la notificación

### ¿Cuándo se envían notificaciones?
- Nueva **tarea asignada**
- Nueva **charla disponible**
- Actualización de **incidencia**
- Avisos del **sistema**

### ¿Por qué no llegan las notificaciones?
1. **Token expirado**: Cierra sesión y vuelve a iniciar para renovar
2. **Permisos del celular**: Notificaciones desactivadas en configuración
3. **Modo "No molestar"**: Bloquea todas las notificaciones
4. **Sin internet**: Las push requieren conexión
5. **App cerrada forzosamente**: Algunos Android bloquean push si la app está cerrada

### Tips:
- El token se renueva cada vez que el usuario inicia sesión
- Si el problema persiste, verificar desde el servidor que el token existe en la BD`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 15,
    tags: ["notificaciones", "push", "Firebase", "FCM", "token", "dispositivo"],
  },
  {
    titulo: "¿Qué es un corte de reporte y cómo funciona?",
    slug: "corte-reporte-como-funciona",
    resumen: "Explicación de las fechas de corte y cómo afectan los reportes.",
    contenido: `## Cortes de reporte

### ¿Qué es un corte?
Un corte de reporte es una fecha específica en la que se "congelan" los datos para generar un reporte del periodo. Es como una foto del estado en ese momento.

### Fechas de corte:
Se configuran en Panel → Configuración → Parámetros:
- **Día 1**: Primer corte del mes (ej: día 15)
- **Día 2**: Segundo corte del mes (ej: día 30)

### Reportes con corte:
- **LV Corte** (/lv-corte): Liderazgo Visible al corte
- **OPE Corte** (/ope-corte): Observaciones al corte
- **P5M Corte** (/pm5-corte): 5 Pilares al corte
- **Rating Corte** (/rating-seguridad-corte): Rating al corte
- **Rating Corte General** (/reporte-rating-corte): Todos los ratings al corte

### ¿Cómo funciona?
1. Al llegar la fecha de corte, los datos del periodo se consolidan
2. El reporte de corte muestra los datos hasta esa fecha
3. El siguiente periodo comienza desde el corte
4. Los datos históricos quedan fijos, no se recalculan

### Tips:
- Los reportes de corte son útiles para evaluaciones formales
- Cambiar las fechas de corte NO afecta reportes ya calculados
- Coordina los cortes con ciclos de evaluación de la empresa`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 12,
    tags: ["corte", "reporte", "fechas", "periodo", "parámetros", "evaluación"],
  },
  {
    titulo: "Guía rápida: módulos disponibles según rol del usuario",
    slug: "modulos-disponibles-por-rol",
    resumen: "Referencia rápida de qué módulos puede ver cada tipo de usuario.",
    contenido: `## Módulos por rol

### App móvil:

| Módulo | Seguridad | Salud | Comercial | Líder |
|--------|-----------|-------|-----------|-------|
| Incidencias | Si (flag) | No | No | Si (flag) |
| Inspecciones | Si (flag) | Si (flag) | No | Si (flag) |
| Charlas Seguridad | Si (flag) | Si (flag) | No | Si (flag) |
| Charlas Comerciales | No | No | Si (comercial!=-1) | Opcional |
| Tareas | Si (flag) | No | No | Si (flag) |
| Rankings | Todos | Todos | Todos | Todos |
| Notificaciones | Todos | Todos | Todos | Todos |
| Perfil | Todos | Todos | Todos | Todos |

### Panel admin:
- El acceso al panel se controla por **menú** (tabla menu + menu_tipo_usuario)
- Cada tipo de usuario tiene un conjunto de menús visibles
- Administradores ven todo
- Usuarios regulares ven según su configuración de menú

### ¿Un usuario no ve un módulo?
1. Verificar los **flags** del usuario (usu_seguridad, incidencias, charlas, etc.)
2. Verificar la tabla **menu_tipo_usuario** para el tipo de usuario
3. Verificar que el menú exista en la tabla **menu** con la URL correcta

### Tips:
- Los flags se configuran al crear/editar el usuario
- Los menús se configuran en Panel → Configuración → Menú`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 1,
    tags: ["módulos", "roles", "acceso", "permisos", "flags", "referencia"],
  },
  {
    titulo: "¿Cómo funciona la autenticación JWT en ARCA?",
    slug: "autenticacion-jwt-arca",
    resumen: "Explicación del sistema de autenticación con JWT para app y panel.",
    contenido: `## Autenticación JWT

### ¿Qué es JWT?
JSON Web Token es el método de autenticación de ARCA. Cada usuario recibe un token al iniciar sesión que debe enviar en cada petición.

### Flujo:
1. El usuario envía credenciales (cédula/email + contraseña)
2. El servidor valida y genera un **JWT**
3. **App**: Guarda el token en FlutterSecureStorage
4. **Panel**: Guarda el token en localStorage
5. Cada petición incluye el header: **x-token: [JWT]**
6. El middleware **validarJWT** verifica el token en cada request protegido

### Errores comunes:
- **"Token no válido" (HTTP 401)**: El token expiró o es inválido → cerrar sesión y volver a iniciar
- **"No hay token en la petición"**: El header x-token no se envió → verificar la implementación
- **"Token expirado"**: El JWT tiene un tiempo de vida, al expirar se debe renovar

### ¿Cuánto dura el token?
- El tiempo de expiración se configura en la variable de entorno del servidor
- Típicamente entre 8 y 24 horas
- Al expirar, el usuario debe iniciar sesión nuevamente

### ¿Qué hacer si el token expira constantemente?
- Verificar la configuración de expiración en el servidor
- Verificar que el reloj del servidor esté sincronizado
- El usuario debe volver a iniciar sesión

### Tips:
- Nunca compartir tokens entre usuarios
- El secreto JWT se configura en la variable **SECRET_JWT_SEDD**`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 1,
    tags: ["JWT", "autenticación", "token", "login", "seguridad", "x-token"],
  },
  {
    titulo: "Diagnóstico: usuario no ve un módulo que debería ver",
    slug: "usuario-no-ve-modulo",
    resumen: "Árbol de diagnóstico cuando un usuario no puede ver un módulo en app o panel.",
    contenido: `## Diagnóstico: usuario no ve un módulo

### Paso 1 — Verificar flags del usuario
1. Panel → Usuarios → Buscar el usuario → Editar
2. Verificar que el flag del módulo esté activo:
   - incidencias = true para ver Incidencias
   - charlas = true para ver Charlas
   - inspecciones = true para ver Inspecciones
   - tareas = true para ver Tareas
   - comercial != -1 para ver módulo comercial
3. Si el flag estaba desactivado, actívalo y pide al usuario que cierre sesión y reingrese

### Paso 2 — Verificar menú (solo panel)
1. Panel → Configuración → Menú
2. Verificar que el tipo de usuario tenga la entrada de menú correspondiente
3. Tabla: menu_tipo_usuario debe vincular el menú con el tipo de usuario

### Paso 3 — Verificar usuario-localidad
1. Verificar que el usuario tenga asignada una **localidad y empresa**
2. Sin usuario_localidad, algunos módulos no muestran datos
3. Panel → Usuarios → Usuario-Localidad → Verificar asignación

### Paso 4 — Verificar versión de la app
1. Pedir al usuario que actualice la app a la última versión
2. Versiones antiguas pueden no tener módulos nuevos

### Paso 5 — Reiniciar sesión
1. Pedir al usuario que cierre sesión completamente
2. Vuelva a iniciar sesión
3. Los cambios de permisos requieren nuevo login para aplicar

### Escalamiento:
Si después de todos los pasos el módulo no aparece, escalar al equipo técnico con:
- Email del usuario, módulo que no ve, flags configurados`,
    tipo: "diagnostico",
    audiencia: "todos",
    categoriaId: 1,
    tags: ["módulo", "no ve", "permisos", "flags", "diagnóstico", "usuario"],
  },
  {
    titulo: "Diagnóstico: reporte no muestra datos",
    slug: "reporte-no-muestra-datos",
    resumen: "Árbol de diagnóstico cuando un reporte aparece vacío o sin datos.",
    contenido: `## Diagnóstico: reporte sin datos

### Paso 1 — Verificar filtros
1. Revisa todos los filtros aplicados (fecha, empresa, localidad, área)
2. Amplía el rango de fechas
3. Quita filtros uno por uno para identificar cuál causa el vacío
4. Un filtro demasiado específico puede excluir todos los registros

### Paso 2 — Verificar que existan datos en el periodo
1. ¿Hubo actividad en el periodo seleccionado?
2. ¿Los usuarios registraron incidencias/tareas/charlas en ese rango?
3. Prueba con un periodo donde sepas que hubo actividad

### Paso 3 — Verificar reporte_rating (para reportes de Rating)
- La tabla **reporte_rating** almacena datos precalculados
- Si no hay registros en reporte_rating para el periodo, el reporte estará vacío
- Los ratings se precalculan, no se generan en tiempo real

### Paso 4 — Verificar jerarquía (para reporte LV)
- El reporte LV depende de **usu_reporta** (cadena de jefes)
- Si los usuarios no tienen jefe configurado, no aparecen en LV

### Paso 5 — Verificar charla_respuesta (para P5M)
- El P5M usa campos desnormalizados de charla_respuesta
- Si usu_id_jefe o emp_id_jef están null, los datos no se agrupan correctamente

### Escalamiento:
Si los datos existen pero el reporte no los muestra, escalar al equipo técnico`,
    tipo: "diagnostico",
    audiencia: "todos",
    categoriaId: 12,
    tags: ["reporte", "sin datos", "vacío", "filtros", "diagnóstico", "rating"],
  },
  {
    titulo: "Diagnóstico: error al guardar incidencia",
    slug: "error-guardar-incidencia",
    resumen: "Diagnóstico cuando falla al guardar una incidencia desde la app.",
    contenido: `## Diagnóstico: error al guardar incidencia

### Paso 1 — Verificar campos obligatorios
- Todos los campos marcados con * son obligatorios
- Revisar: tipo de incidencia, descripción, localización
- Un campo vacío impedirá guardar

### Paso 2 — Verificar conexión a internet
- El guardado requiere conexión al servidor
- Si estás offline, el registro se guarda localmente y se sincroniza después
- Verifica WiFi o datos móviles

### Paso 3 — Error con fotos
- Si el error ocurre al subir fotos, puede ser:
  - Foto muy grande (intenta con menor resolución)
  - Sin permisos de cámara/galería
  - Error temporal del microservicio de imágenes
- Intenta guardar sin foto primero, luego agrega las fotos

### Paso 4 — Verificar espacio en dispositivo
- Si el almacenamiento del celular está lleno, pueden fallar operaciones de caché
- Libera espacio y reintenta

### Paso 5 — Verificar versión de la app
- Actualiza la app a la última versión
- Versiones antiguas pueden tener bugs corregidos

### Paso 6 — Reintentar
1. Cierra completamente la app
2. Reabre y ve directo a nueva incidencia
3. Completa los datos de nuevo e intenta guardar

### Escalamiento:
Si persiste, reportar: mensaje de error exacto, versión de app, modelo de celular`,
    tipo: "diagnostico",
    audiencia: "no_tecnico",
    categoriaId: 4,
    tags: ["incidencia", "error", "guardar", "app", "diagnóstico", "campos"],
  },
  {
    titulo: "Diagnóstico: tarea no aparece en calendario del usuario",
    slug: "tarea-no-aparece-calendario",
    resumen: "Diagnóstico cuando una tarea asignada no se muestra en el calendario de la app.",
    contenido: `## Diagnóstico: tarea no aparece en calendario

### Paso 1 — Verificar asignación
1. Panel → Tareas → Buscar la tarea
2. Verificar en **tarea_asignacion** que el usuario esté asignado
3. La asignación debe coincidir: usuario + empresa + localidad + área

### Paso 2 — Verificar fechas
- El calendario filtra tareas por mes/año
- Navega al mes correcto en la app
- Verifica que las fechas de la tarea caigan en el periodo seleccionado

### Paso 3 — Verificar estado de la tarea
- Solo las tareas **activas** aparecen
- Las tareas eliminadas o finalizadas no se muestran
- Verificar que la tarea padre esté activa

### Paso 4 — Sincronizar la app
1. En la app, haz pull-to-refresh en la lista de tareas
2. Si no aparece, cierra sesión y vuelve a iniciar
3. Los datos se descargan de nuevo al iniciar sesión

### Paso 5 — Verificar permisos
- El usuario debe tener el flag **tareas** activo
- Panel → Usuarios → Editar → Verificar flag tareas

### Escalamiento:
Reportar con: ID de la tarea, email del usuario, fecha esperada`,
    tipo: "diagnostico",
    audiencia: "todos",
    categoriaId: 3,
    tags: ["tarea", "calendario", "no aparece", "asignación", "diagnóstico", "app"],
  },
  {
    titulo: "Diagnóstico: charla asignada no aparece al usuario",
    slug: "charla-asignada-no-aparece",
    resumen: "Diagnóstico cuando una charla asignada no se muestra en la app del usuario.",
    contenido: `## Diagnóstico: charla no aparece al usuario

### Paso 1 — Verificar asignación en charla_usuario
1. Panel → Charlas → Buscar la charla
2. Verificar que el usuario esté en la lista de asignados
3. La tabla **charla_usuario** debe tener un registro con el usu_id del usuario

### Paso 2 — Verificar tipo de charla
- Charlas de seguridad: usuario necesita flag **charlas** activo
- Charlas comerciales: usuario necesita flag **comercial != -1**
- Verificar que el tipo de charla coincida con los permisos del usuario

### Paso 3 — Verificar fechas
- Algunas charlas tienen fecha de inicio y fin
- Si la fecha actual está fuera del rango, la charla puede no mostrarse
- Verificar fechas desde el panel

### Paso 4 — Verificar que no esté ya respondida
- Si el usuario ya respondió la charla, aparece en la sección de completadas
- No se muestra como pendiente

### Paso 5 — Sincronizar la app
1. Cierra sesión en la app
2. Vuelve a iniciar sesión
3. Las charlas asignadas se descargan al login

### Escalamiento:
Reportar: nombre de la charla, email del usuario, fecha de asignación`,
    tipo: "diagnostico",
    audiencia: "todos",
    categoriaId: 6,
    tags: ["charla", "no aparece", "asignación", "diagnóstico", "usuario", "permisos"],
  },
  {
    titulo: "Referencia completa de estados y condiciones de incidencias",
    slug: "referencia-estados-incidencias",
    resumen: "Tabla de referencia con todos los estados y condiciones posibles de una incidencia.",
    contenido: `## Estados y condiciones de incidencias

### Estados (inc_estado):
| Estado | Descripción |
|--------|-------------|
| **No resuelto** | La incidencia está abierta, no se ha solucionado |
| **Resuelto** | La incidencia fue atendida y solucionada |

### Condiciones (inc_est_estado):
| Condición | Descripción |
|-----------|-------------|
| **Pendiente** | Recién registrada, sin revisión del supervisor |
| **Aprobado** | Revisada y aprobada por el supervisor |
| **Rechazado** | No procede o la información es incorrecta |
| **Revisión** | Requiere revisión adicional o está en fecha de corte |

### Flujo típico:
1. Usuario registra incidencia en la app → Estado: **No resuelto**, Condición: **Pendiente**
2. Supervisor revisa → Cambia condición a **Aprobado** o **Rechazado**
3. Se toman acciones correctivas
4. Se registra la solución → Estado: **Resuelto**

### Campos importantes:
- **inc_numero**: Número auto-incremental por usuario
- **inc_estado**: Resuelto / No resuelto
- **inc_est_estado**: Pendiente / Aprobado / Rechazado / Revisión
- **Tipo**: Acto inseguro / Condición insegura / Vehicular

### Cómo cambiar desde el panel:
Panel → Incidencias → Seleccionar → Editar condición → Guardar

### Tips:
- Solo usuarios del panel pueden cambiar condiciones
- El cambio queda registrado con fecha y usuario
- La función fix_numbers(usu_id) puede renumerar incidencias si hay desorden`,
    tipo: "faq",
    audiencia: "todos",
    categoriaId: 4,
    tags: ["incidencias", "estados", "condiciones", "referencia", "pendiente", "aprobado"],
  },
];

async function ejecutarSeed() {
  console.log("🌱 Iniciando seed de artículos...");
  let creados = 0;
  let errores = 0;

  for (const articulo of articulos) {
    try {
      await pool.query(
        `INSERT INTO soporte_articulos
          (art_titulo, art_slug, art_resumen, art_contenido, art_tipo, art_audiencia, art_categoria_id, art_tags, art_autor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (art_slug) DO UPDATE SET
           art_titulo = EXCLUDED.art_titulo,
           art_resumen = EXCLUDED.art_resumen,
           art_contenido = EXCLUDED.art_contenido,
           art_tipo = EXCLUDED.art_tipo,
           art_audiencia = EXCLUDED.art_audiencia,
           art_categoria_id = EXCLUDED.art_categoria_id,
           art_tags = EXCLUDED.art_tags,
           art_updated_at = CURRENT_TIMESTAMP`,
        [
          articulo.titulo,
          articulo.slug,
          articulo.resumen,
          articulo.contenido,
          articulo.tipo,
          articulo.audiencia,
          articulo.categoriaId,
          articulo.tags,
          "Sistema",
        ]
      );
      creados++;
      console.log(`  ✅ ${articulo.titulo}`);
    } catch (error) {
      errores++;
      console.error(`  ❌ Error en "${articulo.titulo}":`, error.message);
    }
  }

  console.log(`\n📊 Resultado: ${creados} artículos creados, ${errores} errores`);

  // ─── SEED: Usuarios de ejemplo (uno por rol) ───────────────────────────────
  console.log("\n👥 Creando usuarios de ejemplo...");

  const usuarios = [
    { nombre: "Admin Soporte",    email: "admin@arca.com",    password: "admin123",    rol: "admin" },
    { nombre: "Soporte Técnico",  email: "tecnico@arca.com",  password: "tecnico123",  rol: "soporte_tecnico" },
    { nombre: "Soporte General",  email: "soporte@arca.com",  password: "soporte123",  rol: "soporte" },
  ];

  for (const u of usuarios) {
    try {
      const hash = bcrypt.hashSync(u.password, 10);
      await pool.query(
        `INSERT INTO soporte_usuarios (usu_nombre, usu_email, usu_password, usu_rol)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (usu_email) DO NOTHING`,
        [u.nombre, u.email, hash, u.rol]
      );
      console.log(`  ✅ ${u.nombre} (${u.rol}) - ${u.email}`);
    } catch (error) {
      console.error(`  ❌ Error creando usuario "${u.email}":`, error.message);
    }
  }

  await pool.end();
}

ejecutarSeed().catch((err) => {
  console.error("Error fatal en seed:", err);
  process.exit(1);
});
