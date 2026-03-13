// manejo de errores globales err, req, res, next
const errorHandler = (err, req, res, next) => {
    console.error("Error", err.message);

    //error de validación de mongoose
    if (err.name === 'ValidationError') {
        const mensajes = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            status: 'error',
            message: mensajes.join(', '),
            data: null
        });
    }

    //error clave duplicada de mongoose
    if (err.code === 11000) {
        const campo = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            status: 'error',
            message: `El ${campo} ya está en uso`,
            data: null
        });
    }

    // error id inválido de mongoose
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'ID inválido',
            data: null
        });
    }


    //error interno del servidor
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Error interno del servidor',
        data: null
    });
};  
   
module.exports = errorHandler;