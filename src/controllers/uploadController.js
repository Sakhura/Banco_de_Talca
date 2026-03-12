// mod 8 manejo de imagnes 

const User = require('../models/User');

/**
 * Post /api/upload/foto-peril
 * ruta protegida
 * multer procesa la imagen y la guarda en el servidor
 */

const  subirFotoPerfil = async (req, res, next) => {
    try {
        //si multer no encuentra el archivo, dara aviso al usuario
        if(!req.file) {
            return res.status(400).json({ 
                status: 'error',
                message: 'No ha adjuntado ninguna imagen',
                data: null,
            });
        }

        const urlFoto = `/uploads/${req.file.filename}`;

        await User.findByIdAndUpdate(req.user._id, { fotoPerfil: urlFoto });

        res.json({
            status: 'ok',
            message: 'Foto de perfil actualizada correctamente',
            data: {
               archivo: {
                    nombre: req.file.filename,
                    tipo: req.file.mimetype,
                    tamaño:`${(req.file.size / 1024).toFixed(2)} KB`,
                    url: urlFoto,
               },
            },
        });

    } catch (error) {
        next(error);
    }
}

module.exports = { subirFotoPerfil }