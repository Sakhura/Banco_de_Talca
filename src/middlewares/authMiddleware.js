// ==========================================
// IMPORTACIONES
// ==========================================

// Librería para crear, firmar y verificar tokens JWT (JSON Web Tokens)
// JWT es un estándar para transmitir información de forma segura entre cliente y servidor
const jwt = require('jsonwebtoken');

// Importamos el modelo User desde la carpeta models
// Este modelo nos permite consultar usuarios en la base de datos (MongoDB + Mongoose)
const { User } = require('../models/User');


// ==========================================
// MIDDLEWARE 1: protegerRuta
// ==========================================
// Función asíncrona porque necesita consultar la base de datos (await)
// Recibe los 3 parámetros clásicos de Express:
//   req  → la petición que llega del cliente
//   res  → la respuesta que enviaremos al cliente
//   next → función que le dice a Express "todo bien, continúa al siguiente paso"
const protegerRuta = async (req, res, next) => {
    try {
        // Leemos el encabezado "Authorization" de la petición HTTP
        // Los clientes lo envían así: Authorization: Bearer eyJhbGci...
        const authHeader = req.headers.authorization;

        // Validación: el encabezado debe existir Y empezar con la palabra "Bearer "
        // Si falta o tiene otro formato, rechazamos con código 401 (No autorizado)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Acceso no autorizado: token no proporcionado',
                data: null,
            });
        }

        // Extraemos solo el token, descartando la palabra "Bearer "
        // Ejemplo: "Bearer abc123" → split(' ') → ["Bearer", "abc123"] → [1] = "abc123"
        const token = authHeader.split(' ')[1];

        // Verificamos que el token sea válido y no haya expirado
        // jwt.verify() lanza un ERROR automáticamente si el token es falso o expirado
        // process.env.JWT_SECRET es la clave secreta guardada en las variables de entorno (.env)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Con el id que venía dentro del token, buscamos el usuario real en la base de datos
        // decoded.id fue guardado cuando se CREÓ el token (en el login)
        const usuario = await User.findById(decoded.id);

        // Doble validación:
        //   1. ¿Existe el usuario en la base de datos?
        //   2. ¿Está activo? (no fue deshabilitado/eliminado lógicamente)
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Acceso no autorizado: usuario no encontrado o inactivo',
                data: null,
            });
        }

        // ✅ Si pasó todas las validaciones:
        // Adjuntamos el usuario al objeto req para que los controladores siguientes
        // puedan saber QUIÉN está haciendo la petición sin volver a consultar la BD
        req.usuario = usuario;

        // Le decimos a Express que todo está bien y que continúe con la ruta solicitada
        next();

    } catch (error) {
        // Si jwt.verify() falló (token falso, manipulado o expirado),
        // caemos aquí automáticamente y respondemos con 401
        return res.status(401).json({ 
            status: 'error',
            message: 'Acceso no autorizado: token inválido',
            data: null,
        });
    }
};


// ==========================================
// MIDDLEWARE 2: soloAdmin
// ==========================================
// Este middleware NO es async porque no necesita consultar la base de datos.
// Depende de que protegerRuta se haya ejecutado ANTES (ya tenemos req.usuario cargado)
const soloAdmin = (req, res, next) => {

    // Revisamos el campo "rol" del usuario que dejó protegerRuta en req.usuario
    // Si el rol NO es 'admin', bloqueamos con 403 (Forbidden — el usuario existe
    // pero no tiene PERMISO para este recurso)
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ 
            status: 'error',
            message: 'Acceso denegado: solo administradores pueden acceder a esta ruta',
            data: null,
        });
    }

    // ✅ Si el usuario sí es admin, dejamos pasar
    next();
};


// ==========================================
// EXPORTACIONES
// ==========================================
// Exportamos ambas funciones para poder usarlas en el archivo de rutas
module.exports = {
    protegerRuta,
    soloAdmin,
};