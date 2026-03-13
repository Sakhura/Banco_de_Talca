const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const protegerRuta = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Acceso no autorizado: token no proporcionado',
            data : null,
         });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await User.findById(decoded.id);

        if (!usuario || !usuario.activo) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Acceso no autorizado: usuario no encontrado o inactivo',
            data : null,
         });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error',
            message: 'Acceso no autorizado: token inválido',
        data : null,
     });
    }
};

const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ 
            status: 'error',
            message: 'Acceso denegado: solo administradores pueden acceder a esta ruta',
        data : null,
     });
    }
    next();
};

module.exports = {
    protegerRuta,
    soloAdmin,
};