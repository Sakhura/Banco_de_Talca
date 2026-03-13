// mod 8 - registro, login u gebneracion de jwt

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Genere un JWT con el ID de usuario
 * @param {string} Id - El ID del usuario para el cual se generará el token
 */

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN || "24h", // El token expirará en 24 horas
  });
};

/**
 * POST /api/auth/registro
 */
const resgistro = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, rut } = req.body;
    if (!nombre || !apellido || !email || !password || !rut) {
      return res.status(400).json({
        status: "error",
        message: "Todos los campos son obligatorios",
        data: null,
      });
    }

    const nuevoUsuario = await User.create({
      nombre,
      apellido,
      email,
      password,
      rut,
    });

    const token = generateToken(nuevoUsuario._id);

    res.status(201).json({
      status: "ok",
      message: "Usuario registrado exitosamente",
      data: {
        usuario: nuevoUsuario,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Ruta pública: autentica un usuario y devuelve un JWT.
 * El cliente deberá incluir este token en el header de rutas protegidas.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email y contraseña son requeridos.",
        data: null,
      });
    }

    const usuario = await User.findOne({ email, activo: true });

    if (!usuario) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas.",
        data: null,
      });
    }

    // Comparamos la contraseña ingresada con el hash guardado
    const passwordCorrecta = await usuario.compararPassword(password);

    if (!passwordCorrecta) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas.",
        data: null,
      });
    }

    const token = generarToken(usuario._id);

    res.status(200).json({
      status: "ok",
      message: "Bienvenido a Talk A Bank.",
      data: {
        usuario,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
