// ============================================================
// RUTAS: Autenticación
// Archivo: routes/authRoutes.js
//
// Este archivo maneja todo lo relacionado con la identidad
// del usuario: registrarse, iniciar sesión y ver su perfil.
//
// Son las rutas más importantes de cualquier API que tenga
// sistema de usuarios. Sin autenticación, cualquiera podría
// acceder a todo sin restricciones.
// ============================================================

const express = require('express');
const router = express.Router();

// ============================================================
// IMPORTAR CONTROLADORES
//
// registro → crea un nuevo usuario en la base de datos
// login    → verifica credenciales y entrega un token JWT
// perfil   → devuelve los datos del usuario autenticado
// ============================================================
const { registro, login, perfil } = require('../controllers/authController');

// ============================================================
// IMPORTAR MIDDLEWARE
//
// protegerRuta → verifica que el usuario tenga un JWT válido.
// Solo se aplica a las rutas que requieren sesión iniciada.
// A diferencia del archivo de cuentas, aquí NO usamos
// router.use() global porque registro y login son públicos:
// cualquiera puede acceder a ellos sin estar autenticado.
// ============================================================
const { protegerRuta } = require('../middleware/authMiddleware');


// ============================================================
// RUTAS PÚBLICAS
// No requieren autenticación → cualquier persona puede llamarlas
// ============================================================

// POST /api/auth/registro
// Recibe: { nombre, apellido, email, password, rut }
// Crea un nuevo usuario en la base de datos.
// Si el email o RUT ya existen, devuelve error.
router.post('/registro', registro);

// POST /api/auth/login
// Recibe: { email, password }
// Verifica las credenciales y, si son correctas,
// devuelve un TOKEN JWT que el cliente debe guardar
// y enviar en las siguientes peticiones.
//
// ¿Qué es un JWT (JSON Web Token)?
// Es una cadena de texto firmada que identifica al usuario.
// Ejemplo: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// El cliente lo guarda (localStorage o cookie) y lo envía
// en el header Authorization de cada petición protegida.
router.post('/login', login);


// ============================================================
// RUTAS PROTEGIDAS
// Requieren autenticación → el usuario debe haber hecho login
// ============================================================

// GET /api/auth/perfil
// Devuelve los datos del usuario actualmente autenticado.
//
// Flujo de middlewares:
//   1. protegerRuta → valida el JWT del header
//   2. perfil       → devuelve los datos del usuario
//
// Si el token no existe o es inválido, protegerRuta
// corta la petición y devuelve error 401 antes de
// llegar al controlador perfil.
router.get('/perfil', protegerRuta, perfil);


// Exportamos para registrar en app.js con:
//   app.use('/api/auth', authRoutes)
module.exports = router;
