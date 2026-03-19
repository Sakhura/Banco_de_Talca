// ============================================
// Talk A Bank - Controlador de Cuentas Bancarias
// Módulo 7 y 8: CRUD con relaciones y rutas protegidas
// ============================================
//
// 📚 ¿QUÉ ES UN CONTROLADOR?
// En el patrón MVC (Modelo - Vista - Controlador), el Controlador actúa como
// el intermediario entre las rutas HTTP y la lógica de negocio (servicios).
// Su responsabilidad es:
//   1. Recibir la solicitud (req) del cliente.
//   2. Validar los datos básicos de entrada.
//   3. Delegar el trabajo pesado al Servicio correspondiente.
//   4. Devolver una respuesta estructurada (res) al cliente.
//
// 📌 PATRÓN DE RESPUESTA USADO EN ESTE PROYECTO:
// Todas las respuestas siguen la misma estructura JSON para ser predecibles:
//   {
//     status:  "ok" | "error",   → indica si la operación fue exitosa
//     message: "...",            → mensaje legible para el frontend o el alumno
//     data:    { ... } | null    → payload útil, o null si no hay nada que devolver
//   }
// Esto se denomina una "API consistente" y es una buena práctica profesional.

const accountService = require("../services/accountService");
// 👆 Importamos el módulo de servicios de cuentas.
// El controlador NO accede directamente a la base de datos; delega esa
// responsabilidad al servicio. Esto se conoce como "separación de concerns"
// (separación de responsabilidades) y hace el código más mantenible y testeable.

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN: crear
// MÉTODO HTTP: POST
// RUTA: /api/cuentas
// ACCESO: Privado (requiere token JWT válido en el middleware anterior)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /api/cuentas
 * Ruta protegida: Crea una nueva cuenta bancaria para el usuario autenticado.
 *
 * 📖 CONCEPTO - Ruta protegida:
 * Una ruta protegida exige que el cliente envíe un token de autenticación
 * (normalmente JWT) en el header Authorization. El middleware de autenticación
 * verifica ese token ANTES de llegar aquí, y si es válido adjunta los datos
 * del usuario en `req.usuario`. Por eso podemos usar `req.usuario.id` con
 * total confianza dentro de este controlador.
 *
 * 📖 CONCEPTO - async/await:
 * Las operaciones de base de datos son asíncronas (tardan tiempo en resolverse).
 * Usamos `async` en la función y `await` antes de cada llamada al servicio
 * para "esperar" el resultado sin bloquear el servidor. Si algo falla,
 * el `try/catch` lo captura y lo envía al middleware de errores con `next(error)`.
 */
const crear = async (req, res, next) => {
  try {
    // 📥 Extraemos los datos que el cliente envió en el cuerpo (body) del request.
    // req.body contiene el JSON parseado gracias al middleware express.json().
    const { tipoCuenta, moneda } = req.body;

    // ✅ VALIDACIÓN de entrada: verificamos que el campo obligatorio esté presente.
    // Es importante validar en el controlador antes de llamar al servicio para
    // dar respuestas rápidas (400 Bad Request) sin gastar recursos de la base de datos.
    if (!tipoCuenta) {
      return res.status(400).json({
        status: "error",
        message: "El tipo de cuenta es obligatorio (caja_ahorro o cuenta_corriente).",
        data: null,
      });
      // 👆 `return` corta la ejecución aquí. Sin él, el código seguiría corriendo
      // después del if, lo cual causaría errores inesperados.
    }

    // La cuenta se asocia automáticamente al usuario del token
    // 👆 req.usuario.id fue inyectado por el middleware JWT.
    // De esta manera el usuario NO puede crear cuentas para otra persona;
    // la identidad viene del token, no del body. Esto es una práctica de seguridad clave.
    const cuenta = await accountService.crearCuenta({
      tipoCuenta,
      moneda,
      usuarioId: req.usuario.id,
    });

    // 📤 Respondemos con 201 Created, el código HTTP correcto para la creación de recursos.
    // (200 = OK para lecturas/actualizaciones, 201 = se creó algo nuevo)
    res.status(201).json({
      status: "ok",
      message: "Cuenta bancaria creada exitosamente en Talk A Bank.",
      data: { cuenta },
    });
  } catch (error) {
    // 🚨 Si ocurre cualquier error inesperado (ej: falla la DB), lo pasamos al
    // middleware global de manejo de errores con `next(error)`.
    // Centralizar el manejo de errores evita repetir lógica de error en cada función.
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN: misCuentas
// MÉTODO HTTP: GET
// RUTA: /api/cuentas/mis-cuentas
// ACCESO: Privado (el usuario autenticado solo ve SUS cuentas)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * GET /api/cuentas/mis-cuentas
 * Ruta protegida: Lista las cuentas del usuario autenticado.
 * Ejemplo de consulta con relación (populate).
 *
 * 📖 CONCEPTO - Populate (relaciones en bases de datos NoSQL):
 * En MongoDB con Mongoose, los documentos pueden referenciar a otros documentos
 * mediante su ID (similar a una clave foránea en SQL). "Populate" reemplaza ese
 * ID con los datos reales del documento referenciado, permitiendo obtener
 * información relacionada en una sola consulta. Ejemplo: en vez de devolver
 * solo el `usuarioId`, devuelve el objeto completo del usuario.
 */
const misCuentas = async (req, res, next) => {
  try {
    // Solo se pasa el id del usuario autenticado, garantizando que cada usuario
    // únicamente puede ver sus propias cuentas. Esto se llama "autorización basada
    // en identidad" y es fundamental para la seguridad de una API bancaria.
    const cuentas = await accountService.obtenerCuentasDeUsuario(req.usuario.id);

    // Usamos template literals para construir un mensaje dinámico con el total de cuentas.
    // Esto mejora la experiencia del consumidor de la API (frontend o Postman).
    res.status(200).json({
      status: "ok",
      message: `Tienes ${cuentas.length} cuenta(s) activa(s).`,
      data: { cuentas },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN: listarTodas
// MÉTODO HTTP: GET
// RUTA: /api/cuentas
// ACCESO: Privado - Solo ADMIN (requiere un middleware de rol además del JWT)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * GET /api/cuentas
 * Ruta protegida (admin): Lista todas las cuentas del banco con datos del titular.
 * Soporta filtros: ?tipoCuenta=caja_ahorro&moneda=USD
 *
 * 📖 CONCEPTO - Query Params (parámetros de consulta):
 * Los query params son opcionales y se agregan a la URL después de "?".
 * Ejemplo: GET /api/cuentas?tipoCuenta=caja_ahorro&moneda=USD
 * Express los expone automáticamente en `req.query` como un objeto:
 *   { tipoCuenta: "caja_ahorro", moneda: "USD" }
 * Si no se envían, su valor es `undefined`, y el servicio decide qué hacer
 * en ese caso (generalmente, no aplicar ese filtro).
 *
 * 📖 CONCEPTO - Roles y autorización:
 * No basta con estar autenticado; algunas rutas requieren permisos especiales.
 * Un middleware de roles (ej: `verificarAdmin`) se encadena en el router ANTES
 * de llegar aquí para asegurarse de que solo administradores puedan acceder.
 */
const listarTodas = async (req, res, next) => {
  try {
    // Desestructuramos los query params. Si no se envían, serán undefined.
    // El servicio se encargará de ignorar los filtros que sean undefined.
    const { tipoCuenta, moneda } = req.query;
    const cuentas = await accountService.obtenerTodas({ tipoCuenta, moneda });

    res.status(200).json({
      status: "ok",
      message: `Se encontraron ${cuentas.length} cuenta(s).`,
      data: { cuentas },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN: actualizarSaldo
// MÉTODO HTTP: PUT
// RUTA: /api/cuentas/:id/saldo
// ACCESO: Privado - Solo ADMIN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * PUT /api/cuentas/:id/saldo
 * Ruta protegida (admin): Actualiza el saldo de una cuenta.
 *
 * 📖 CONCEPTO - Route Params vs Body:
 * - req.params.id → viene de la URL dinámica (:id). Identifica QUÉ recurso modificar.
 * - req.body.saldo → viene del cuerpo JSON. Contiene el NUEVO VALOR a aplicar.
 * Separar "qué modificar" (URL) de "con qué datos" (body) es una convención REST.
 *
 * 📖 CONCEPTO - PUT vs PATCH:
 * - PUT reemplaza todo el recurso con los nuevos datos enviados.
 * - PATCH actualiza solo los campos especificados.
 * En este caso se usa PUT sobre un sub-recurso (/saldo), lo que equivale a
 * decir: "reemplaza el saldo de esta cuenta con este nuevo valor".
 */
const actualizarSaldo = async (req, res, next) => {
  try {
    const { saldo } = req.body;

    // ✅ VALIDACIÓN: verificamos dos condiciones con un solo if usando el operador ||
    // 1. `saldo === undefined` → el campo no fue enviado en el body.
    // 2. `saldo < 0`           → un saldo negativo no tiene sentido en este contexto.
    // Usamos === para la comparación con undefined (comparación estricta, sin coerción de tipos).
    if (saldo === undefined || saldo < 0) {
      return res.status(400).json({
        status: "error",
        message: "El saldo debe ser un número mayor o igual a 0.",
        data: null,
      });
    }

    // req.params.id contiene el valor dinámico de la URL. Ejemplo:
    // Si la URL es /api/cuentas/64abc123/saldo → req.params.id = "64abc123"
    const cuenta = await accountService.actualizarSaldo(req.params.id, saldo);

    res.status(200).json({
      status: "ok",
      message: "Saldo actualizado correctamente.",
      data: { cuenta },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN: desactivar
// MÉTODO HTTP: DELETE
// RUTA: /api/cuentas/:id
// ACCESO: Privado - Solo ADMIN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * DELETE /api/cuentas/:id
 * Ruta protegida (admin): Desactiva una cuenta bancaria.
 *
 * 📖 CONCEPTO - Soft Delete (borrado lógico) vs Hard Delete (borrado físico):
 * En sistemas bancarios reales NUNCA se eliminan registros de la base de datos
 * (hard delete), ya que se necesitan para auditorías, historial y cumplimiento legal.
 * En cambio, se usa "Soft Delete": se cambia un campo como `activa: false` o
 * `estado: "inactiva"` para ocultar el registro sin destruirlo.
 * El método se llama `desactivarCuenta` (no `eliminarCuenta`) por esta razón.
 * El mensaje de respuesta viene del propio servicio (`resultado.mensaje`),
 * lo que muestra que el servicio puede retornar información contextual además del dato.
 */
const desactivar = async (req, res, next) => {
  try {
    // El servicio realiza el soft delete y retorna un objeto con un mensaje descriptivo.
    // Delegar el mensaje al servicio permite reutilizar esta lógica desde otros lugares.
    const resultado = await accountService.desactivarCuenta(req.params.id);

    res.status(200).json({
      status: "ok",
      message: resultado.mensaje, // 👈 Mensaje generado en la capa de servicio
      data: null, // No hay dato que retornar tras una desactivación
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTACIÓN DEL MÓDULO
// ─────────────────────────────────────────────────────────────────────────────
// Exportamos cada función por separado usando un objeto.
// En el archivo de rutas (router) se importarán así:
//   const { crear, misCuentas, listarTodas } = require("./accountController");
// Este patrón se llama "exportación con nombre" y permite importar solo lo necesario.
module.exports = { crear, misCuentas, listarTodas, actualizarSaldo, desactivar };