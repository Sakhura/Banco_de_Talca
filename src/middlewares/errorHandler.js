// ==========================================
// MIDDLEWARE ESPECIAL DE EXPRESS: errorHandler
// ==========================================
// Este middleware se diferencia de los normales porque tiene 4 parámetros.
// Express lo reconoce como manejador de errores EXACTAMENTE por tener 4 parámetros:
//   err  → el objeto de error que fue lanzado o pasado a next(error)
//   req  → la petición HTTP original
//   res  → la respuesta que enviaremos al cliente
//   next → función para pasar al siguiente middleware (raramente usada aquí)
// ⚠️ Si le quitas un parámetro, Express NO lo tratará como manejador de errores
const errorHandler = (err, req, res, next) => {

    // Imprimimos el error en la consola del SERVIDOR (no lo ve el cliente)
    // Útil para debugging y registros internos de la aplicación
    console.error("Error", err.message);


    // ==========================================
    // CASO 1: Error de validación de Mongoose
    // ==========================================
    // Ocurre cuando los datos NO cumplen las reglas definidas en el Schema
    // Ejemplo: un campo "email" que llega vacío siendo requerido
    // Mongoose genera automáticamente err.name = 'ValidationError' en estos casos
    if (err.name === 'ValidationError') {

        // err.errors es un objeto donde cada clave es el campo que falló
        // Ejemplo: { email: { message: 'email requerido' }, nombre: { message: '...' } }
        // Object.values() nos da solo los valores (los objetos de error de cada campo)
        // .map(val => val.message) extrae solo el texto del mensaje de cada uno
        // Resultado: ['email requerido', 'nombre requerido']
        const mensajes = Object.values(err.errors).map(val => val.message);

        // Respondemos con 400 (Bad Request → el cliente envió datos incorrectos)
        // .join(', ') une todos los mensajes en un solo string: "email requerido, nombre requerido"
        return res.status(400).json({
            status: 'error',
            message: mensajes.join(', '),
            data: null
        });
    }


    // ==========================================
    // CASO 2: Error de clave duplicada de MongoDB
    // ==========================================
    // Ocurre cuando se intenta guardar un valor que ya existe en un campo "unique"
    // Ejemplo: registrar un email que ya está en la base de datos
    // MongoDB genera automáticamente err.code = 11000 en estos casos
    if (err.code === 11000) {

        // err.keyValue es un objeto con el campo y el valor duplicado
        // Ejemplo: { email: 'test@gmail.com' }
        // Object.keys() nos da las claves: ['email']
        // [0] toma la primera (y normalmente única) clave: 'email'
        const campo = Object.keys(err.keyValue)[0];

        // Respondemos con 400 informando qué campo está duplicado
        // Ejemplo de mensaje: "El email ya está en uso"
        return res.status(400).json({
            status: 'error',
            message: `El ${campo} ya está en uso`,
            data: null
        });
    }


    // ==========================================
    // CASO 3: Error de ID inválido de Mongoose (CastError)
    // ==========================================
    // Ocurre cuando se pasa un ID con formato incorrecto para MongoDB
    // MongoDB usa IDs con formato ObjectId (24 caracteres hexadecimales)
    // Ejemplo: buscar /usuarios/123 cuando debería ser /usuarios/64abc123def456...
    // Mongoose genera automáticamente err.name = 'CastError' en estos casos
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'ID inválido',
            data: null
        });
    }


    // ==========================================
    // CASO 4: Error genérico / Error interno del servidor
    // ==========================================
    // Si el error NO coincide con ningún caso anterior, llegamos aquí
    // Es el "catch-all" — atrapa cualquier error inesperado
    // err.statusCode → si el error tiene un código personalizado, lo usamos
    // || 500          → si no tiene código, usamos 500 (Internal Server Error)
    res.status(err.statusCode || 500).json({
        status: 'error',
        // err.message → mensaje del error si existe
        // || 'Error interno del servidor' → mensaje genérico como respaldo
        message: err.message || 'Error interno del servidor',
        data: null
    });
};


// ==========================================
// EXPORTACIÓN
// ==========================================
// Exportamos una sola función (no un objeto como en el middleware anterior)
// porque este archivo solo tiene una responsabilidad
module.exports = errorHandler;