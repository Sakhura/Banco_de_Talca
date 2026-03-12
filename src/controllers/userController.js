// controlador de usuario, rutas protegidas, etc.

const userService = require('../services/userService');

/**
 * GET /api/usuarios
 * Obtiene la lista de usuarios (solo para administradores)
 * soporte filtros: ?nombre=Juanito&email=juan@
 */

const listar= async (req, res, next) => {
    try {
        const { nombre, email } = req.query;
        const usuarios = await userService.listarUsuarios({ nombre, email });
        res.status(200).json({
            status : "ok",
            message: `Usuarios obtenidos correctamente ${usuarios.length}`,
            data: usuarios
        });
    } catch (error) {       
         next(error);   
    }
        };

/**
 * GET /api/usuarios/:id
 * Ruta protegida: Obtiene usuario por medio del ID
 */

const obtenerUno= async (req, res, next) => {
    try {
        const usuario = await userService.obtenerporId(req.params.id);
        res.status(200).json({
            status : "ok",
            message: `Usuario obtenido correctamente`,
            data: {usuario}
        });
    } catch (error) {       
        next(error);   
    }
        };

/**
 * GET /api/usuarios/:id
 * Ruta protegida:actualizar usuario por medio del ID
 */

const actualizar= async (req, res, next) => {
    try {
        //verificar que el usuario tenga permisos para actualizar
        if (
            req.usuario.id !== req.params.id &&
            req.usuario.rol !== 'admin'
        ) {
            return res.status(403).json({
                status: "error",
                message: "No tienes permisos para actualizar este usuario"
            });
        }

        const usuarioActualizado = await userService.actualizarUsuario(req.params.id, req.body);
        res.status(200).json({
            status: "ok",
            message: "Usuario actualizado correctamente",
            data: { usuarioActualizado }
        });
    } catch (error) {
        next(error);
    }
        };


        /**
 * DELETE /api/usuarios/:id
 * Ruta protegida (admin): DEsactivar usuario (soft delete)
 */

/**const eliminar= async (req, res, next) => {
    try {
        //verificar que el usuario tenga permisos para eliminar
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                status: "error",
                message: "No tienes permisos para eliminar usuarios"
            });
        }

        const usuarioEliminado = await userService.eliminarUsuario(req.params.id);
        res.status(200).json({
            status: "ok",
            message: "Usuario eliminado correctamente",
            data: { usuarioEliminado }
        });
    } catch (error) {
        next(error);
    }
        };*/

        const eliminar= async (req, res, next) => {
    try {
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

        module.exports = {
            listar,
            obtenerUno,
            actualizar,
            eliminar
        }