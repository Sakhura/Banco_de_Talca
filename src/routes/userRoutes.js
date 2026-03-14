// ============================================================
// RUTAS: Usuarios
// Archivo: routes/userRoutes.js
//
// Gestiona las operaciones sobre los usuarios ya registrados.
// Importante distinguir este archivo de authRoutes.js:
//
//   authRoutes.js  → "¿Quién eres?" (registro, login, perfil)
//   userRoutes.js  → "Administrar usuarios" (listar, editar, eliminar)
// ============================================================

const express = require('express');
const router = express.Router();

// ============================================================
// IMPORTAR CONTROLADORES
//
// listar     → devuelve todos los usuarios (solo admin)
// obtenerUno → devuelve un usuario por su :id
// actualizar → modifica datos de un usuario por su :id
// eliminar   → desactiva o elimina un usuario por su :id
// ============================================================
const { listar, obtenerUno, actualizar, eliminar } = require('../controllers/userController');

// protegerRuta → el usuario debe tener JWT válido
// soloAdmin    → además, debe tener rol 'admin'
const { protegerRuta, soloAdmin } = require('../middleware/authMiddleware');


// ============================================================
// MIDDLEWARE GLOBAL DEL ROUTER
//
// A diferencia de authRoutes.js (donde registro y login
// son públicos), TODAS las rutas de usuarios requieren
// autenticación, por eso aplicamos protegerRuta globalmente.
//
// Ningún visitante anónimo puede consultar, editar
// ni eliminar usuarios.
// ============================================================
router.use(protegerRuta);


// ============================================================
// DEFINICIÓN DE RUTAS
// ============================================================

// GET /api/users/
// Lista todos los usuarios del sistema.
// Requiere rol admin → un cliente normal no puede
// ver la lista completa de otros usuarios.
router.get('/', soloAdmin, listar);

// GET /api/users/:id
// Devuelve los datos de UN usuario específico.
// :id es el ObjectId de MongoDB del usuario.
// Ejemplo: GET /api/users/64f3a1b2c9e...
//
// ⚠️ CONSIDERACIÓN DE SEGURIDAD:
// Esta ruta NO tiene soloAdmin, lo que significa que
// cualquier usuario autenticado puede consultar
// los datos de OTRO usuario si conoce su id.
// En producción se debería validar en el controlador
// que el usuario solo pueda ver su propio perfil,
// a menos que sea admin.
router.get('/:id', obtenerUno);

// PUT /api/users/:id
// Actualiza los datos de un usuario (nombre, email, etc.)
// Mismo comentario de seguridad que la ruta anterior:
// el controlador debería verificar que:
//   - Un cliente solo pueda editar SU propio perfil
//   - Un admin pueda editar cualquier perfil
router.put('/:id', actualizar);

// DELETE /api/users/:id
// Elimina o desactiva al usuario con ese :id.
//
// ⚠️ CONSIDERACIÓN DE SEGURIDAD:
// Sin soloAdmin, cualquier usuario autenticado podría
// eliminar a otro usuario conociendo su id.
// Evaluar si esta ruta debería requerir rol admin.
router.delete('/:id', eliminar);


// Exportamos para registrar en app.js con:
//   app.use('/api/users', userRoutes)
module.exports = router;