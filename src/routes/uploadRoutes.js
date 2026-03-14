// ============================================================
// RUTAS: Subida de Archivos (Upload)
// Archivo: routes/uploadRoutes.js
//
// Este archivo maneja la carga de imágenes al servidor.
// Específicamente: la foto de perfil del usuario.
//
// Tecnología usada: Multer
// Multer es un middleware de Express especializado en recibir
// archivos enviados desde un formulario (multipart/form-data).
// Sin Multer, Express no puede leer archivos, solo texto JSON.
// ============================================================

const express = require('express');
const router = express.Router();

// Controlador que procesa la imagen después de recibirla
const { subirFotoPerfil } = require('../controllers/uploadController');

// Middleware que verifica que el usuario tenga sesión activa
const { protegerRuta } = require('../middleware/authMiddleware');

// Instancia de Multer ya configurada (tamaño máximo, carpeta destino,
// tipos de archivo permitidos, etc.)
// Esa configuración vive en uploadMiddleware.js
const upload = require('../middleware/uploadMiddleware');


// ============================================================
// POST /api/upload/foto-perfil
//
// Ruta para subir o actualizar la foto de perfil del usuario.
//
// Esta ruta usa 3 middlewares encadenados que se ejecutan
// en orden estricto, uno tras otro:
//
//   1. protegerRuta
//   2. upload.single('foto')
//   3. subirFotoPerfil (controlador final)
//
// Si cualquiera de los primeros dos falla, los siguientes
// NO se ejecutan. Express corta la cadena y devuelve el error.
// ============================================================
router.post(
    '/foto-perfil',

    // MIDDLEWARE 1: protegerRuta
    // Verifica que exista un JWT válido en el header.
    // Un usuario sin sesión no debería poder subir archivos.
    // Si falla → error 401, la cadena se detiene aquí.
    protegerRuta,

    // MIDDLEWARE 2: upload.single('foto')
    // Multer intercepta la petición y busca un archivo
    // en el campo llamado 'foto' del formulario.
    //
    // ¿Qué significa 'foto'?
    // Es el name="" del input en el frontend:
    //   <input type="file" name="foto" />
    // o en Postman: Body → form-data → Key: "foto", Type: File
    //
    // .single() indica que solo se espera UN archivo.
    // Multer también permite: .array() para varios archivos
    // o .fields() para múltiples campos con archivos.
    //
    // Cuando Multer termina, agrega el archivo procesado
    // al objeto req.file, que el controlador usará después.
    // Si falla (tipo incorrecto, archivo muy grande) → error aquí.
    upload.single('foto'),

    // MIDDLEWARE 3 / CONTROLADOR FINAL: subirFotoPerfil
    // En este punto ya sabemos que:
    //   ✅ El usuario está autenticado (pasó protegerRuta)
    //   ✅ El archivo fue recibido y procesado (pasó Multer)
    //
    // El controlador se encarga de:
    //   - Leer req.file (el archivo subido)
    //   - Guardar la ruta/URL en el campo fotoPerfil del usuario
    //   - Responder con los datos actualizados
    subirFotoPerfil
);


// Exportamos para registrar en app.js con:
//   app.use('/api/upload', uploadRoutes)
module.exports = router;