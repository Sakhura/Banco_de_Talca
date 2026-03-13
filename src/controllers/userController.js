// ==========================================
// IMPORTACIONES
// ==========================================

// Importamos el servicio de usuarios que contiene toda la lógica de negocio
// El controlador delega las consultas a MongoDB al servicio — nunca habla
// directamente con la base de datos
const userService = require('../services/userService');


// ==========================================
// CONTROLADOR 1: listar
// ==========================================
/**
 * GET /api/usuarios
 * Obtiene la lista de usuarios (solo para administradores)
 * Soporta filtros: ?nombre=Juanito&email=juan@
 */
const listar = async (req, res, next) => {
    try {
        // req.query contiene los parámetros opcionales de la URL después del "?"
        // Ejemplo: GET /api/usuarios?nombre=Juan&email=juan@gmail.com
        // → req.query = { nombre: 'Juan', email: 'juan@gmail.com' }
        // Si no se envían filtros, ambas variables serán undefined
        // y el servicio devolverá todos los usuarios
        const { nombre, email } = req.query;

        // Pasamos los filtros al servicio — si son undefined los ignora
        // y construye una consulta sin restricciones
        const usuarios = await userService.listarUsuarios({ nombre, email });

        // Incluimos en el mensaje la cantidad de usuarios encontrados
        // para dar retroalimentación útil al administrador
        res.status(200).json({
            status : "ok",
            message: `Usuarios obtenidos correctamente ${usuarios.length}`,
            data: usuarios
        });
    } catch (error) {
        next(error);
    }
};


// ==========================================
// CONTROLADOR 2: obtenerUno
// ==========================================
/**
 * GET /api/usuarios/:id
 * Ruta protegida: Obtiene un usuario por su ID
 */
// ⚠️ El comentario JSDoc dice GET /api/usuarios/:id igual que actualizar —
//    debería especificar que este es solo de lectura para distinguirlos
const obtenerUno = async (req, res, next) => {
    try {
        // req.params.id → el ID dinámico que viene en la URL
        // Ejemplo: GET /api/usuarios/64abc123def456
        //          → req.params.id = "64abc123def456"
        // Si el ID tiene formato inválido para MongoDB, el errorHandler
        // capturará el CastError automáticamente
        const usuario = await userService.obtenerporId(req.params.id);

        // Envolvemos usuario en un objeto { usuario } para mantener
        // consistencia con el resto de respuestas del proyecto
        res.status(200).json({
            status : "ok",
            message: `Usuario obtenido correctamente`,
            data: { usuario }
        });
    } catch (error) {
        next(error);
    }
};


// ==========================================
// CONTROLADOR 3: actualizar
// ==========================================
/**
 * PUT /api/usuarios/:id
 * Ruta protegida: actualiza un usuario por su ID
 */
// ⚠️ El comentario JSDoc original dice GET — debería decir PUT
const actualizar = async (req, res, next) => {
    try {
        // ── VERIFICACIÓN DE PERMISOS MANUAL ──────────────────────────
        // Esta lógica de autorización podría estar en un middleware propio,
        // pero aquí se hace directamente en el controlador
        // Condición: el usuario puede actualizar SI cumple AL MENOS UNO de:
        //   1. req.usuario.id === req.params.id → está actualizando SU PROPIO perfil
        //   2. req.usuario.rol === 'admin'      → es administrador y puede editar a cualquiera
        // El IF se activa cuando NO se cumple NINGUNA de las dos condiciones
        if (
            req.usuario.id !== req.params.id &&  // No es su propio perfil
            req.usuario.rol !== 'admin'          // Y tampoco es admin
        ) {
            return res.status(403).json({
                // 403 Forbidden → el usuario está autenticado pero NO tiene permiso
                // A diferencia del 401 que es "no autenticado"
                status: "error",
                message: "No tienes permisos para actualizar este usuario",
                // ⚠️ Falta el campo data: null para mantener consistencia
                //    con el formato del resto de respuestas de error
            });
        }

        // req.body → los campos a actualizar enviados por el cliente en JSON
        // El servicio decide qué campos están permitidos actualizar
        // (normalmente excluye password, rol y _id por seguridad)
        const usuarioActualizado = await userService.actualizarUsuario(
            req.params.id, // ID del usuario a actualizar
            req.body       // Nuevos datos
        );

        res.status(200).json({
            status: "ok",
            message: "Usuario actualizado correctamente",
            data: { usuarioActualizado }
        });
    } catch (error) {
        next(error);
    }
};


// ==========================================
// CONTROLADOR 4: eliminar (VERSIÓN COMENTADA — borrado físico)
// ==========================================
// Esta versión fue REEMPLAZADA por la de abajo.
// Se deja comentada como referencia histórica del código anterior.
// Implementaba un DELETE real que borraba el documento de MongoDB.
// Fue descartada porque borrar datos permanentemente es peligroso:
//   - Se pierde el historial de transacciones del usuario
//   - No se puede recuperar si fue un error
//   - Las referencias desde otras colecciones quedan rotas (cuentas, transferencias)
/**
const eliminar = async (req, res, next) => {
    try {
        // Verificación manual: solo admins pueden eliminar usuarios
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "No tienes permisos para eliminar usuarios"
            });
        }

        // userService.eliminarUsuario hacía un .deleteOne() o .findByIdAndDelete()
        // → BORRADO FÍSICO: el documento desaparece permanentemente de MongoDB
        const usuarioEliminado = await userService.eliminarUsuario(req.params.id);
        res.status(200).json({
            status: "ok",
            message: "Usuario eliminado correctamente",
            data: { usuarioEliminado }
        });
    } catch (error) {
        next(error);
    }
};
*/


// ==========================================
// CONTROLADOR 4: eliminar (VERSIÓN ACTIVA — soft delete)
// ==========================================
/**
 * DELETE /api/usuarios/:id
 * Ruta protegida (admin): Desactiva un usuario en lugar de borrarlo
 */
// SOFT DELETE → en lugar de eliminar el documento, se cambia activo: false
// El usuario deja de poder iniciar sesión (findOne({ activo: true }) no lo encontrará)
// pero sus datos e historial quedan intactos en la base de datos
// ⚠️ A diferencia de la versión comentada, esta NO verifica si el solicitante
//    es admin — esa responsabilidad debería estar en el middleware soloAdmin
//    aplicado en las rutas, o agregarse aquí como en la versión anterior
const eliminar = async (req, res, next) => {
    try {
        // userService.desactivar hace un findByIdAndUpdate({ activo: false })
        // en vez de un findByIdAndDelete()
        const resultado = await userService.desactivar(req.params.id);

        res.status(200).json({
            status: "ok",
            message: "Usuario desactivado correctamente",
            data: { resultado }
        });
    } catch (error) {
        next(error);
    }
};


// ==========================================
// EXPORTACIONES
// ==========================================
module.exports = {
    listar,
    obtenerUno,
    actualizar,
    eliminar
}


// ── BORRADO FÍSICO (versión comentada) ──────────────────
// MongoDB antes:  { _id: "64abc", nombre: "Juan", activo: true  }
//Después:        (documento eliminado permanentemente) ❌
//→ Sus cuentas bancarias quedan huérfanas
//→ Su historial de transferencias se pierde
//→ No hay forma de recuperarlo

//── SOFT DELETE (versión activa) ─────────────────────────
//MongoDB antes:  { _id: "64abc", nombre: "Juan", activo: true  }
//Después:        { _id: "64abc", nombre: "Juan", activo: false }
//→ No puede iniciar sesión ✅
//→ Sus datos e historial se conservan ✅
//  → Se puede reactivar si fue un error ✅ 
