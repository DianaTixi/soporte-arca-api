/**
 * Seed de errores mapeados para TODOS los módulos del sistema ARCA
 * Alimenta la tabla soporte_errores con los mensajes exactos de error de cada controller
 * Ejecutar: node database/seed_errores.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const errores = [
  // ═══════════════════════════════════════════════════════════
  // MÓDULO: FORMULARIOS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "formulario",
    mensaje: "Los campos tipo, nombre y activo son obligatorios",
    endpoint: "POST /api/formulario",
    httpCode: 400,
    causa: "El body del POST no incluye los campos tipo, nombre o activo",
    solucionTecnica: "Verificar que el body contenga: { tipo: 1|2, nombre: 'string', activo: true|false, detalleSegmento|preguntas: [...] }",
    solucionUsuario: "Asegúrate de completar el nombre del formulario, seleccionar el tipo (1 o 2) y el estado activo antes de guardar.",
    navegacion: "Panel → Formularios → Nuevo formulario",
    queryDiagnostico: null,
    tags: ["formulario", "crear", "validación"],
  },
  {
    modulo: "formulario",
    mensaje: "Los campos detalleSegmento son obligatorios con tipo 1",
    endpoint: "POST /api/formulario",
    httpCode: 400,
    causa: "Se envió un formulario tipo 1 sin el array detalleSegmento o está vacío",
    solucionTecnica: "El body debe incluir detalleSegmento: [{ nombre: 'Segmento 1', preguntas: [...] }]",
    solucionUsuario: "Un formulario de Tipo 1 necesita al menos un segmento con preguntas. Haz clic en 'Agregar segmento', ponle nombre y agrega al menos una pregunta.",
    navegacion: "Panel → Formularios → Nuevo formulario → Tipo 1",
    queryDiagnostico: null,
    tags: ["formulario", "tipo 1", "segmento"],
  },
  {
    modulo: "formulario",
    mensaje: "Los campos preguntas son obligatorios con tipo 2",
    endpoint: "POST /api/formulario",
    httpCode: 400,
    causa: "Se envió un formulario tipo 2 sin el array preguntas o está vacío",
    solucionTecnica: "El body debe incluir preguntas: [{ pregunta: 'texto', tipo: 1|2|3, ... }]",
    solucionUsuario: "Un formulario de Tipo 2 necesita al menos una pregunta. Haz clic en 'Agregar pregunta' y complétala.",
    navegacion: "Panel → Formularios → Nuevo formulario → Tipo 2",
    queryDiagnostico: null,
    tags: ["formulario", "tipo 2", "pregunta"],
  },
  {
    modulo: "formulario",
    mensaje: "Ya existe un formulario con ese nombre",
    endpoint: "POST /api/formulario",
    httpCode: 400,
    causa: "El nombre del formulario ya existe en la BD (comparación UPPER+TRIM case-insensitive)",
    solucionTecnica: "SELECT frm_id, frm_nombre, frm_activo FROM formulario WHERE UPPER(TRIM(frm_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya hay un formulario con ese nombre exacto en el sistema. Busca en la lista de formularios (incluyendo inactivos). Si está inactivo, puedes activarlo en lugar de crear uno nuevo.",
    navegacion: "Panel → Formularios → Buscar → incluir inactivos",
    queryDiagnostico: "SELECT frm_id, frm_nombre, frm_activo FROM formulario WHERE UPPER(TRIM(frm_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["formulario", "duplicado", "nombre"],
  },
  {
    modulo: "formulario",
    mensaje: "No existe una formulario con ese id",
    endpoint: "PUT /api/formulario/:id",
    httpCode: 400,
    causa: "El frm_id enviado no existe en la tabla formulario",
    solucionTecnica: "SELECT frm_id, frm_nombre FROM formulario WHERE frm_id = [ID];",
    solucionUsuario: "El formulario que intentas editar ya no existe o fue eliminado. Regresa a la lista de formularios y búscalo por nombre.",
    navegacion: "Panel → Formularios → Buscar",
    queryDiagnostico: "SELECT frm_id, frm_nombre, frm_activo FROM formulario WHERE frm_id = [ID];",
    tags: ["formulario", "editar", "no existe"],
  },
  {
    modulo: "formulario",
    mensaje: "El formulario fue actualizado, pero no se pudo desactivar porque tiene actividades activas asociadas.",
    endpoint: "PUT /api/formulario/:id",
    httpCode: 200,
    causa: "El formulario tiene actividades de seguridad activas vinculadas (acs_activo=true). Los otros campos SÍ se actualizaron, solo la desactivación falló.",
    solucionTecnica: "SELECT acs_id, acs_nombre FROM actividad_seguridad WHERE frm_id = [ID] AND acs_activo = true;",
    solucionUsuario: "El formulario se guardó con los cambios, pero no se pudo desactivar porque hay actividades activas que lo usan. Ve a Panel → Actividades, busca las que usan este formulario y desactívalas primero.",
    navegacion: "Panel → Actividades → buscar por formulario → desactivar",
    queryDiagnostico: "SELECT acs_id, acs_nombre, acs_activo FROM actividad_seguridad WHERE frm_id = [ID] AND acs_activo = true;",
    tags: ["formulario", "desactivar", "actividad"],
  },
  {
    modulo: "formulario",
    mensaje: "Debe ingresar los segmentos",
    endpoint: "POST /api/formulario",
    httpCode: 400,
    causa: "El array detalleSegmento viene vacío (length === 0)",
    solucionTecnica: "Verificar que detalleSegmento tenga al menos un elemento",
    solucionUsuario: "Agrega al menos un segmento con preguntas al formulario antes de guardar.",
    navegacion: "Panel → Formularios → Nuevo → Agregar segmento",
    queryDiagnostico: null,
    tags: ["formulario", "segmento", "vacío"],
  },
  {
    modulo: "formulario",
    mensaje: "Debe ingresar preguntas",
    endpoint: "POST /api/formulario",
    httpCode: 400,
    causa: "El array preguntas viene vacío (length === 0)",
    solucionTecnica: "Verificar que el array preguntas tenga al menos un elemento",
    solucionUsuario: "Agrega al menos una pregunta al formulario antes de guardar.",
    navegacion: "Panel → Formularios → Nuevo → Agregar pregunta",
    queryDiagnostico: null,
    tags: ["formulario", "pregunta", "vacío"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: USUARIOS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "usuario",
    mensaje: "El email ya está registrado",
    endpoint: "POST /api/usuario",
    httpCode: 400,
    causa: "Ya existe un registro en la tabla usuario con ese usu_email (UNIQUE constraint)",
    solucionTecnica: "SELECT usu_id, usu_email, usu_activo FROM usuario WHERE LOWER(usu_email) = LOWER('[EMAIL]');",
    solucionUsuario: "Ese correo electrónico ya está registrado en el sistema. Busca al usuario por email en Panel → Usuarios. Si está inactivo, puedes reactivarlo.",
    navegacion: "Panel → Usuarios → Buscar por email",
    queryDiagnostico: "SELECT usu_id, usu_email, usu_nombre, usu_activo FROM usuario WHERE LOWER(usu_email) = LOWER('[EMAIL]');",
    tags: ["usuario", "email", "duplicado"],
  },
  {
    modulo: "usuario",
    mensaje: "El usuario no existe o está inactivo",
    endpoint: "POST /api/auth/login",
    httpCode: 401,
    causa: "El email no existe en la tabla usuario o usu_activo = false",
    solucionTecnica: "SELECT usu_id, usu_email, usu_activo FROM usuario WHERE LOWER(usu_email) = LOWER('[EMAIL]');",
    solucionUsuario: "El correo no está registrado o la cuenta está desactivada. Verifica que el correo sea el correcto. Si la cuenta está inactiva, actívala desde Panel → Usuarios → Buscar → Editar → Estado = Activo.",
    navegacion: "Panel → Usuarios → Buscar por email → Editar → Estado",
    queryDiagnostico: "SELECT usu_id, usu_email, usu_nombre, usu_activo FROM usuario WHERE LOWER(usu_email) = LOWER('[EMAIL]');",
    tags: ["usuario", "login", "inactivo"],
  },
  {
    modulo: "usuario",
    mensaje: "El nombre es obligatorio",
    endpoint: "POST /api/usuario",
    httpCode: 400,
    causa: "El campo nombre viene vacío o no fue enviado",
    solucionTecnica: "Verificar que el body contenga { nombre: 'string' }",
    solucionUsuario: "Escribe el nombre completo del usuario antes de guardar.",
    navegacion: "Panel → Usuarios → Nuevo → campo Nombre",
    queryDiagnostico: null,
    tags: ["usuario", "crear", "validación"],
  },
  {
    modulo: "usuario",
    mensaje: "El email es obligatorio",
    endpoint: "POST /api/usuario",
    httpCode: 400,
    causa: "El campo email viene vacío o no fue enviado",
    solucionTecnica: "Verificar que el body contenga { email: 'string' }",
    solucionUsuario: "Escribe el correo electrónico del usuario antes de guardar.",
    navegacion: "Panel → Usuarios → Nuevo → campo Email",
    queryDiagnostico: null,
    tags: ["usuario", "crear", "validación"],
  },
  {
    modulo: "usuario",
    mensaje: "El tipo de usuario es obligatorio",
    endpoint: "POST /api/usuario",
    httpCode: 400,
    causa: "El campo tipo viene vacío o no fue enviado",
    solucionTecnica: "Verificar que el body contenga { tipo: 'seguridad'|'salud'|'comercial'|... }",
    solucionUsuario: "Selecciona el tipo de usuario (Seguridad, Salud o Comercial) antes de guardar.",
    navegacion: "Panel → Usuarios → Nuevo → campo Tipo",
    queryDiagnostico: null,
    tags: ["usuario", "crear", "tipo"],
  },
  {
    modulo: "usuario",
    mensaje: "Token no válido",
    endpoint: "Cualquier endpoint protegido",
    httpCode: 401,
    causa: "Token JWT expirado, malformado o firmado con secreto diferente. Variable: SECRET_JWT_SEDD (doble D). Header: x-token.",
    solucionTecnica: "Verificar variable de entorno SECRET_JWT_SEDD. El header debe ser exactamente 'x-token', no 'Authorization'. Decodificar el token en jwt.io para ver si está expirado.",
    solucionUsuario: "Tu sesión expiró. Cierra la sesión completamente y vuelve a iniciar sesión. Si usas la app, cierra la app y ábrela de nuevo.",
    navegacion: null,
    queryDiagnostico: null,
    tags: ["auth", "JWT", "token", "sesión"],
  },
  {
    modulo: "usuario",
    mensaje: "Contraseña incorrecta",
    endpoint: "POST /api/auth/login",
    httpCode: 401,
    causa: "La contraseña ingresada no coincide con el hash bcrypt almacenado",
    solucionTecnica: "No se puede ver la contraseña (bcrypt). Restablecer desde el panel o BD directamente con bcryptjs.hashSync('nueva', 10).",
    solucionUsuario: "La contraseña ingresada no es correcta. Verifica que no tengas Bloq Mayús activado. Si olvidaste la contraseña, pide a tu administrador que la restablezca desde el panel.",
    navegacion: "Panel → Usuarios → Buscar → Editar → Cambiar contraseña",
    queryDiagnostico: null,
    tags: ["usuario", "login", "contraseña"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: CHARLAS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "charla",
    mensaje: "Ya existe una charla con ese nombre",
    endpoint: "POST /api/charla",
    httpCode: 400,
    causa: "El nombre de la charla ya existe (comparación TRIM+UPPER)",
    solucionTecnica: "SELECT cha_id, cha_nombre, cha_activo FROM charla WHERE UPPER(TRIM(cha_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya existe una charla con ese nombre. Busca en la lista de charlas (incluyendo inactivas). Si está inactiva, puedes reactivarla o usar un nombre diferente.",
    navegacion: "Panel → Charlas → Buscar",
    queryDiagnostico: "SELECT cha_id, cha_nombre, cha_activo FROM charla WHERE UPPER(TRIM(cha_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["charla", "duplicado", "nombre"],
  },
  {
    modulo: "charla",
    mensaje: "El nombre de la charla es obligatorio",
    endpoint: "POST /api/charla",
    httpCode: 400,
    causa: "El campo nombre viene vacío",
    solucionTecnica: "Verificar que el body contenga { nombre: 'string' }",
    solucionUsuario: "Escribe el nombre de la charla antes de guardar.",
    navegacion: "Panel → Charlas → Nueva → campo Nombre",
    queryDiagnostico: null,
    tags: ["charla", "crear", "validación"],
  },
  {
    modulo: "charla",
    mensaje: "Debe seleccionar la empresa",
    endpoint: "POST /api/charla",
    httpCode: 400,
    causa: "No se seleccionó la empresa al crear o asignar la charla",
    solucionTecnica: "Verificar que el body contenga { emp_id: number }",
    solucionUsuario: "Selecciona la empresa antes de crear o asignar la charla.",
    navegacion: "Panel → Charlas → Nueva → campo Empresa",
    queryDiagnostico: null,
    tags: ["charla", "empresa"],
  },
  {
    modulo: "charla",
    mensaje: "Las fechas son obligatorias",
    endpoint: "POST /api/charla",
    httpCode: 400,
    causa: "No se enviaron fecha_inicio o fecha_fin",
    solucionTecnica: "Verificar que el body contenga { fecha_inicio: 'date', fecha_fin: 'date' }",
    solucionUsuario: "Debes seleccionar la fecha de inicio y la fecha de fin de la charla.",
    navegacion: "Panel → Charlas → Nueva → campos Fecha inicio y Fecha fin",
    queryDiagnostico: null,
    tags: ["charla", "fecha", "validación"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: TAREAS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "tarea",
    mensaje: "La descripción de la tarea es obligatoria",
    endpoint: "POST /api/tarea",
    httpCode: 400,
    causa: "El campo descripcion viene vacío",
    solucionTecnica: "Verificar que el body contenga { descripcion: 'string' }",
    solucionUsuario: "Escribe una descripción para la tarea antes de guardar.",
    navegacion: "Panel → Tareas → Nueva → campo Descripción",
    queryDiagnostico: null,
    tags: ["tarea", "crear", "validación"],
  },
  {
    modulo: "tarea",
    mensaje: "La fecha no tiene formato válido",
    endpoint: "POST /api/tarea",
    httpCode: 400,
    causa: "La fecha enviada no tiene formato DD/MM/YYYY o es inválida",
    solucionTecnica: "El campo fecha debe ser string con formato DD/MM/YYYY. Se parsea con moment('fecha', 'DD/MM/YYYY').",
    solucionUsuario: "La fecha ingresada no es válida. Usa el formato día/mes/año (ejemplo: 15/03/2025). Usa el selector de fecha del calendario si está disponible.",
    navegacion: "Panel → Tareas → Nueva → campo Fecha",
    queryDiagnostico: null,
    tags: ["tarea", "fecha", "formato"],
  },
  {
    modulo: "tarea",
    mensaje: "La actividad es obligatoria",
    endpoint: "POST /api/tarea",
    httpCode: 400,
    causa: "No se seleccionó una actividad de seguridad (acs_id)",
    solucionTecnica: "Verificar que el body contenga { acs_id: number }",
    solucionUsuario: "Selecciona una actividad de seguridad antes de crear la tarea.",
    navegacion: "Panel → Tareas → Nueva → campo Actividad",
    queryDiagnostico: null,
    tags: ["tarea", "actividad", "validación"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: INCIDENCIAS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "incidencia",
    mensaje: "Debe completar todos los campos requeridos",
    endpoint: "POST /api/incidencia",
    httpCode: 400,
    causa: "Faltan campos obligatorios: observación, empresa, localidad u otros",
    solucionTecnica: "Campos requeridos: usu_id, emp_id, loc_id, observacion. Verificar body.",
    solucionUsuario: "Completa todos los campos marcados con (*) antes de guardar la incidencia: observación, localidad y empresa.",
    navegacion: "App → Nueva incidencia / Panel → Incidencias → Nueva",
    queryDiagnostico: null,
    tags: ["incidencia", "crear", "validación"],
  },
  {
    modulo: "incidencia",
    mensaje: "La incidencia no existe",
    endpoint: "PUT /api/incidencia/:id",
    httpCode: 404,
    causa: "El inc_id no existe en la tabla incidencia",
    solucionTecnica: "SELECT inc_id FROM incidencia WHERE inc_id = [ID];",
    solucionUsuario: "La incidencia que intentas editar ya no existe. Regresa a la lista de incidencias y búscala nuevamente.",
    navegacion: "Panel → Incidencias → Buscar",
    queryDiagnostico: "SELECT inc_id, inc_numero, inc_fecha, usu_id FROM incidencia WHERE inc_id = [ID];",
    tags: ["incidencia", "editar", "no existe"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: ESTRUCTURA ORGANIZACIONAL
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "empresa",
    mensaje: "Ya existe una empresa con ese nombre",
    endpoint: "POST /api/empresa",
    httpCode: 400,
    causa: "El nombre de la empresa ya existe en la tabla empresa",
    solucionTecnica: "SELECT emp_id, emp_nombre, emp_activo FROM empresa WHERE UPPER(TRIM(emp_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya existe una empresa con ese nombre. Verifica en la lista de empresas si ya está registrada.",
    navegacion: "Panel → Configuración → Empresas",
    queryDiagnostico: "SELECT emp_id, emp_nombre, emp_activo FROM empresa WHERE UPPER(TRIM(emp_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["empresa", "duplicado"],
  },
  {
    modulo: "region",
    mensaje: "Ya existe una región con ese nombre",
    endpoint: "POST /api/region",
    httpCode: 400,
    causa: "El nombre de la región ya existe para esa empresa",
    solucionTecnica: "SELECT reg_id, reg_nombre, reg_activo FROM region WHERE emp_id = [EMP_ID] AND UPPER(TRIM(reg_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya existe una región con ese nombre en esta empresa. Busca en la lista de regiones incluyendo las inactivas.",
    navegacion: "Panel → Configuración → Regiones",
    queryDiagnostico: "SELECT reg_id, reg_nombre, reg_activo FROM region WHERE emp_id = [EMP_ID] AND UPPER(TRIM(reg_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["región", "duplicado"],
  },
  {
    modulo: "localidad",
    mensaje: "Ya existe una localidad con ese nombre",
    endpoint: "POST /api/localidad",
    httpCode: 400,
    causa: "El nombre de la localidad ya existe para esa región",
    solucionTecnica: "SELECT loc_id, loc_nombre, loc_activo FROM localidad WHERE reg_id = [REG_ID] AND UPPER(TRIM(loc_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya existe una localidad con ese nombre en esta región. Busca en la lista incluyendo las inactivas.",
    navegacion: "Panel → Configuración → Localidades",
    queryDiagnostico: "SELECT loc_id, loc_nombre, loc_activo FROM localidad WHERE reg_id = [REG_ID] AND UPPER(TRIM(loc_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["localidad", "duplicado"],
  },
  {
    modulo: "area",
    mensaje: "Ya existe un área con ese nombre",
    endpoint: "POST /api/area",
    httpCode: 400,
    causa: "El nombre del área ya existe para esa empresa",
    solucionTecnica: "SELECT are_id, are_nombre, are_activo FROM area WHERE emp_id = [EMP_ID] AND UPPER(TRIM(are_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya existe un área con ese nombre en esta empresa. Verifica si ya está registrada.",
    navegacion: "Panel → Configuración → Áreas",
    queryDiagnostico: "SELECT are_id, are_nombre, are_activo FROM area WHERE emp_id = [EMP_ID] AND UPPER(TRIM(are_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["área", "duplicado"],
  },
  {
    modulo: "cargo",
    mensaje: "Ya existe un cargo con ese nombre",
    endpoint: "POST /api/cargo",
    httpCode: 400,
    causa: "El nombre del cargo ya existe para esa empresa",
    solucionTecnica: "SELECT car_id, car_nombre, car_activo FROM cargo WHERE emp_id = [EMP_ID] AND UPPER(TRIM(car_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    solucionUsuario: "Ya existe un cargo con ese nombre en esta empresa.",
    navegacion: "Panel → Configuración → Cargos",
    queryDiagnostico: "SELECT car_id, car_nombre, car_activo FROM cargo WHERE emp_id = [EMP_ID] AND UPPER(TRIM(car_nombre)) = UPPER(TRIM('[NOMBRE]'));",
    tags: ["cargo", "duplicado"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: METAS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "meta",
    mensaje: "La meta tiene actividades asociadas activas",
    endpoint: "DELETE /api/meta/:id",
    httpCode: 400,
    causa: "No se puede eliminar la meta porque tiene actividades vinculadas en meta_actividad",
    solucionTecnica: "SELECT ma.acs_id, a.acs_nombre FROM meta_actividad ma JOIN actividad_seguridad a ON a.acs_id = ma.acs_id WHERE ma.met_id = [ID];",
    solucionUsuario: "No se puede eliminar la meta porque tiene actividades vinculadas. Primero desvincula las actividades de la meta.",
    navegacion: "Panel → Metas → Editar → Desvincular actividades",
    queryDiagnostico: "SELECT ma.acs_id, a.acs_nombre FROM meta_actividad ma JOIN actividad_seguridad a ON a.acs_id = ma.acs_id WHERE ma.met_id = [ID];",
    tags: ["meta", "eliminar", "actividad"],
  },
  {
    modulo: "meta",
    mensaje: "El nombre de la meta es obligatorio",
    endpoint: "POST /api/meta",
    httpCode: 400,
    causa: "El campo nombre viene vacío",
    solucionTecnica: "Verificar que el body contenga { nombre: 'string' }",
    solucionUsuario: "Escribe el nombre de la meta antes de guardar.",
    navegacion: "Panel → Metas → Nueva → campo Nombre",
    queryDiagnostico: null,
    tags: ["meta", "crear", "validación"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: RECOMPENSAS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "recompensa",
    mensaje: "Puntos insuficientes",
    endpoint: "POST /api/recompensa/canjear",
    httpCode: 400,
    causa: "El usuario no tiene suficientes puntos en su kardex para canjear la recompensa",
    solucionTecnica: "SELECT SUM(kar_puntos) AS saldo FROM kardex WHERE usu_id = [ID_USUARIO]; vs recompensa.rec_puntos",
    solucionUsuario: "No tienes suficientes puntos para esta recompensa. Revisa tu saldo de puntos en tu perfil o en Rankings.",
    navegacion: "Panel → Recompensas",
    queryDiagnostico: "SELECT SUM(kar_puntos) AS saldo FROM kardex WHERE usu_id = [ID_USUARIO];",
    tags: ["recompensa", "puntos", "canjear"],
  },
  {
    modulo: "recompensa",
    mensaje: "El usuario ya canjeó esta recompensa",
    endpoint: "POST /api/recompensa/canjear",
    httpCode: 400,
    causa: "Ya existe un registro de canje para esta combinación usuario+recompensa",
    solucionTecnica: "Verificar en kardex si ya hay un movimiento de canje para esa recompensa",
    solucionUsuario: "Ya canjeaste esta recompensa anteriormente. Contacta a tu administrador si crees que es un error.",
    navegacion: "Panel → Recompensas",
    queryDiagnostico: null,
    tags: ["recompensa", "duplicado", "canjear"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: REPORTES
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "reporte",
    mensaje: "Debe seleccionar el año y mes",
    endpoint: "GET /api/reporte/*",
    httpCode: 400,
    causa: "Los parámetros anio y mes no fueron enviados en el query string",
    solucionTecnica: "El endpoint requiere ?anio=2025&mes=1 como query params",
    solucionUsuario: "Selecciona el año y el mes en los filtros del reporte antes de generar.",
    navegacion: "Panel → Reportes → Filtros → Año y Mes",
    queryDiagnostico: null,
    tags: ["reporte", "filtro", "fecha"],
  },
  {
    modulo: "reporte",
    mensaje: "No se encontraron datos para el período seleccionado",
    endpoint: "GET /api/reporte/*",
    httpCode: 200,
    causa: "No hay registros para los filtros seleccionados (período, empresa, localidad)",
    solucionTecnica: "Verificar que existan datos con queries directos a la tabla correspondiente filtrados por fecha",
    solucionUsuario: "No hay datos para el período que seleccionaste. Verifica que las fechas sean correctas y que haya actividad registrada en ese período.",
    navegacion: "Panel → Reportes → cambiar filtros",
    queryDiagnostico: null,
    tags: ["reporte", "vacío", "datos"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: ACTIVIDAD DE SEGURIDAD
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "actividad_seguridad",
    mensaje: "La actividad tiene tareas activas",
    endpoint: "DELETE /api/actividad_seguridad/:id",
    httpCode: 400,
    causa: "No se puede eliminar/desactivar porque hay tareas activas vinculadas",
    solucionTecnica: "SELECT tar_id, tar_descripcion FROM tarea WHERE acs_id = [ID] AND tar_activo = true;",
    solucionUsuario: "No se puede desactivar la actividad porque tiene tareas activas. Desactiva primero las tareas vinculadas desde Panel → Tareas.",
    navegacion: "Panel → Tareas → buscar por actividad → desactivar",
    queryDiagnostico: "SELECT tar_id, tar_descripcion, tar_activo FROM tarea WHERE acs_id = [ID] AND tar_activo = true;",
    tags: ["actividad", "tarea", "eliminar"],
  },
  {
    modulo: "actividad_seguridad",
    mensaje: "El nombre de la actividad es obligatorio",
    endpoint: "POST /api/actividad_seguridad",
    httpCode: 400,
    causa: "El campo nombre viene vacío",
    solucionTecnica: "Verificar que el body contenga { nombre: 'string' }",
    solucionUsuario: "Escribe el nombre de la actividad antes de guardar.",
    navegacion: "Panel → Actividades → Nueva → campo Nombre",
    queryDiagnostico: null,
    tags: ["actividad", "crear", "validación"],
  },

  // ═══════════════════════════════════════════════════════════
  // MÓDULO: INSPECCIONES
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "inspeccion",
    mensaje: "El formulario de inspección no existe",
    endpoint: "POST /api/inspeccion",
    httpCode: 400,
    causa: "El frm_id referenciado no existe o está inactivo",
    solucionTecnica: "SELECT frm_id, frm_nombre, frm_activo FROM formulario WHERE frm_id = [ID];",
    solucionUsuario: "El formulario asociado a esta inspección ya no existe o fue desactivado. Contacta al administrador para que revise el formulario.",
    navegacion: "Panel → Formularios → verificar estado",
    queryDiagnostico: "SELECT frm_id, frm_nombre, frm_activo FROM formulario WHERE frm_id = [ID];",
    tags: ["inspección", "formulario", "no existe"],
  },

  // ═══════════════════════════════════════════════════════════
  // GENÉRICO - TODOS LOS MÓDULOS
  // ═══════════════════════════════════════════════════════════
  {
    modulo: "general",
    mensaje: "Por favor hable con el admin.",
    endpoint: "Cualquier endpoint (catch genérico)",
    httpCode: 500,
    causa: "Error no controlado en el servidor. Puede ser: conexión a BD perdida, error de constraint, null pointer, timeout, etc.",
    solucionTecnica: "Revisar logs del servidor Node.js (console.error en el catch). Verificar: 1) Conexión PostgreSQL activa, 2) Variables de entorno correctas, 3) El body del request tiene el formato esperado. Buscar en logs la hora exacta del error.",
    solucionUsuario: "Ocurrió un error inesperado en el sistema. Intenta de nuevo en unos minutos. Si el problema persiste, reporta al equipo técnico: 1) Qué estabas haciendo, 2) La hora exacta, 3) Captura de pantalla si es posible.",
    navegacion: null,
    queryDiagnostico: null,
    tags: ["error 500", "genérico", "servidor"],
  },
];

async function ejecutarSeedErrores() {
  console.log("🔴 Iniciando seed de errores mapeados...");
  let creados = 0;
  let errores_count = 0;

  for (const error of errores) {
    try {
      await pool.query(
        `INSERT INTO soporte_errores
          (err_modulo, err_mensaje, err_endpoint, err_http_code, err_causa,
           err_solucion_tecnica, err_solucion_usuario, err_navegacion,
           err_query_diagnostico, err_articulo_id, err_tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT DO NOTHING`,
        [
          error.modulo,
          error.mensaje,
          error.endpoint,
          error.httpCode || 400,
          error.causa,
          error.solucionTecnica,
          error.solucionUsuario,
          error.navegacion,
          error.queryDiagnostico,
          error.articuloId || null,
          error.tags || [],
        ]
      );
      creados++;
      console.log(`  ✅ [${error.modulo}] ${error.mensaje}`);
    } catch (err) {
      errores_count++;
      console.error(`  ❌ Error en [${error.modulo}] "${error.mensaje}":`, err.message);
    }
  }

  console.log(`\n📊 Resultado: ${creados} errores mapeados, ${errores_count} errores de inserción`);
  await pool.end();
}

ejecutarSeedErrores().catch((err) => {
  console.error("Error fatal en seed de errores:", err);
  process.exit(1);
});
