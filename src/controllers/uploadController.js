// ==========================================
// IMPORTACIONES
// ==========================================

// Modelo de usuario para actualizar el campo fotoPerfil en MongoDB
// No necesitamos importar Multer aquí — ya hizo su trabajo en el middleware
// antes de que esta función se ejecute
const User = require('../models/User');


// ==========================================
// CONTROLADOR: subirFotoPerfil
// ==========================================
/**
 * POST /api/upload/foto-perfil
 * Ruta protegida: recibe la imagen procesada por Multer
 * y actualiza la URL de la foto en el perfil del usuario autenticado
 */
// ⚠️ Typo en el comentario original: "foto-peril" debería ser "foto-perfil"
// Función asíncrona porque realiza una operación de escritura en MongoDB
const subirFotoPerfil = async (req, res, next) => {
    try {
        // Verificamos que Multer haya encontrado y procesado un archivo
        // req.file es un objeto que Multer adjunta al request cuando recibe un archivo válido
        // Si el cliente no envió ningún archivo, req.file será undefined
        // Si el archivo fue rechazado por fileFilter (tipo inválido), también será undefined
        if (!req.file) {
            return res.status(400).json({ 
                status: 'error',
                message: 'No ha adjuntado ninguna imagen',
                data: null,
            });
        }

        // Construimos la URL relativa donde quedó guardada la imagen en el servidor
        // req.file.filename → nombre único generado por Multer
        //                     Ejemplo: "usuario_64abc123_1710345600000.jpg"
        // La URL resultante permite al frontend acceder a la imagen via HTTP
        // Ejemplo: "/uploads/usuario_64abc123_1710345600000.jpg"
        // ⚠️ Para producción se recomienda usar una URL absoluta o un servicio como S3
        const urlFoto = `/uploads/${req.file.filename}`;

        // Actualizamos SOLO el campo fotoPerfil del usuario en MongoDB
        // findByIdAndUpdate(id, cambios) → busca por ID y aplica solo los campos indicados
        // No reemplaza el documento completo, solo modifica el campo fotoPerfil
        // ⚠️ BUG DETECTADO: se usa req.user._id pero en protegerRuta
        //    el usuario se guardó como req.usuario (con tilde)
        //    Debe cambiarse a req.usuario._id para que funcione correctamente
        await User.findByIdAndUpdate(req.user._id, { fotoPerfil: urlFoto });

        // 200 OK (implícito cuando no se especifica status en res.json())
        // Devolvemos los metadatos del archivo para que el frontend pueda usarlos
        // inmediatamente sin necesidad de hacer otra petición
        res.json({
            status: 'ok',
            message: 'Foto de perfil actualizada correctamente',
            data: {
               archivo: {
                    // Nombre final del archivo guardado en el servidor
                    nombre: req.file.filename,

                    // Tipo MIME real del archivo validado por Multer
                    // Ejemplo: "image/jpeg", "image/png", "image/webp"
                    tipo: req.file.mimetype,

                    // Convertimos el tamaño de bytes a KB para mayor legibilidad
                    // req.file.size → tamaño en bytes (ej: 153284)
                    // / 1024        → convierte a KB (ej: 149.69...)
                    // .toFixed(2)   → redondea a 2 decimales (ej: "149.69")
                    // Resultado final: "149.69 KB"
                    tamaño: `${(req.file.size / 1024).toFixed(2)} KB`,

                    // URL relativa para acceder a la imagen desde el frontend
                    url: urlFoto,
               },
            },
        });

    } catch (error) {
        // Delegamos cualquier error inesperado al errorHandler global
        next(error);
    }
}


// ==========================================
// EXPORTACIONES
// ==========================================
// Exportamos como objeto para mantener consistencia con los demás controladores
// y permitir agregar más funciones en el futuro (ej: eliminarFoto, obtenerFoto)
module.exports = { subirFotoPerfil }