// ============================================================
// RUTAS: Account (Cuentas Bancarias)
// Archivo: routes/accountRoutes.js
//
// ¿Qué es un archivo de rutas?
// Define los "endpoints" de la API, es decir, las URLs
// que el frontend puede llamar y qué función se ejecuta
// en cada caso.
//
// Estructura general de una ruta:
//   router.METODO("url", [middlewares], controlador)
// ============================================================

const express = require('express');

// Router: objeto de Express que agrupa rutas relacionadas.
// En lugar de definir todo en app.js, separamos las rutas
// por tema (cuentas, usuarios, etc.) y luego las unimos.
const router = express.Router();

// ============================================================
// IMPORTAR CONTROLADORES
//
// Los controladores contienen la LÓGICA de cada operación.
// Las rutas solo dicen "qué URL hace qué".
// Los controladores dicen "cómo se hace".
//
// Separar responsabilidades = código más limpio y mantenible.
// ============================================================
const {
    crear,          // Crear una nueva cuenta bancaria
    misCuentas,     // Ver las cuentas del usuario autenticado
    listarTodas,    // Ver TODAS las cuentas (solo admin)
    actualizarSaldo,// Modificar el saldo de una cuenta (solo admin)
    desactivar,     // Desactivar una cuenta (solo admin)
} = require('../controllers/accountController');

// ============================================================
// IMPORTAR MIDDLEWARES DE AUTENTICACIÓN
//
// Un middleware es una función que se ejecuta ENTRE que llega
// la petición y que se ejecuta el controlador final.
// Sirve como "portero" que verifica condiciones antes de dejar pasar.
//
// protegerRuta → verifica que el usuario esté autenticado (tiene JWT válido)
// soloAdmin    → verifica que el usuario tenga rol 'admin'
// ============================================================
const { protegerRuta, soloAdmin } = require('../middleware/authMiddleware');


// ============================================================
// MIDDLEWARE GLOBAL PARA ESTE ROUTER
//
// router.use(middleware) aplica ese middleware a TODAS
// las rutas definidas debajo en este archivo.
//
// Es decir: ninguna ruta de cuentas es accesible sin
// haber iniciado sesión primero. ¡El portero está en la puerta!
// ============================================================
router.use(protegerRuta);


// ============================================================
// DEFINICIÓN DE RUTAS
// ============================================================

// ⚠️ BUG DETECTADO: router.use() NO es el método correcto aquí.
// router.use() aplica un middleware a todas las rutas,
// no define una ruta POST específica.
//
// Para crear un recurso, el estándar REST usa POST.
// → CORREGIR: router.use("/", crear)  por  router.post("/", crear)
//
// POST /api/accounts
// Crea una nueva cuenta bancaria para el usuario autenticado.
// Cualquier usuario con sesión iniciada puede crear una cuenta.
router.post("/", crear); // ← CORRECCIÓN aplicada aquí

// GET /api/accounts/mis-cuentas
// Devuelve solo las cuentas que pertenecen al usuario autenticado.
// Cada usuario solo ve sus propias cuentas, no las de otros.
//
// ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de router.get("/")
// porque Express evalúa las rutas en orden de definición.
// Si "/" estuviera primero, "/mis-cuentas" nunca se alcanzaría.
router.get("/mis-cuentas", misCuentas);

// GET /api/accounts
// Lista TODAS las cuentas de todos los usuarios.
// Protegida con soloAdmin → solo los administradores pueden usarla.
//
// Flujo de middlewares:
//   protegerRuta (ya aplicado arriba) → soloAdmin → listarTodas
router.get("/", soloAdmin, listarTodas);

// PUT /api/accounts/:id/saldo
// Actualiza el saldo de la cuenta con ese :id específico.
// :id es un parámetro dinámico de la URL.
// Ejemplo: PUT /api/accounts/64f3a1.../saldo
//
// Solo admin puede modificar saldos directamente.
router.put("/:id/saldo", soloAdmin, actualizarSaldo);

// DELETE /api/accounts/:id
// "Elimina" (desactiva) la cuenta con ese :id.
// En realidad hace un borrado lógico: cambia activa → false,
// pero el documento sigue en la base de datos.
// Solo admin puede desactivar cuentas.
router.delete("/:id", soloAdmin, desactivar);


// Exportamos el router para registrarlo en app.js con:
//   app.use('/api/accounts', accountRoutes)
module.exports = router;
