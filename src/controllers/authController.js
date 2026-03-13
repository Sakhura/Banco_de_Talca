// ==========================================
// IMPORTACIONES
// ==========================================

// Librería para crear y firmar tokens JWT
// El token generado aquí es el mismo que protegerRuta verifica en cada petición
const jwt = require("jsonwebtoken");

// Modelo de usuario para interactuar con la colección "users" en MongoDB
// Usamos require directo (no desestructurado) porque User es la exportación por defecto
const User = require("../models/User");

// Librería para encriptar contraseñas y compararlas de forma segura
// bcryptjs es la versión pura en JS de bcrypt (sin dependencias nativas del sistema)
const bcrypt = require("bcryptjs");


// ==========================================
// FUNCIÓN AUXILIAR: generateToken
// ==========================================
/**
 * Genera un JWT firmado con el ID del usuario
 * @param {string} id - El ID del usuario para el cual se generará el token
 */
// Esta función NO es un controlador ni un middleware — es una utilidad interna
// que reutilizan tanto registro como login para no repetir la misma lógica
const generateToken = (id) => {

  // jwt.sign() crea y firma el token con 3 parámetros:
  //   1. { id } → el PAYLOAD: datos que queremos guardar dentro del token
  //              Solo guardamos el id para minimizar el tamaño del token
  //              Este id es el que luego decoded.id recupera en protegerRuta
  //   2. process.env.JWT_SECRET → clave secreta para firmar
  //              Si alguien modifica el token sin conocer esta clave, la firma no coincide
  //   3. { expiresIn } → opciones: cuánto tiempo es válido el token
  return jwt.sign({ id }, process.env.JWT_SECRET, {

    // process.env.JWT_EXPIRE_IN → si está definida en .env, la usamos
    // || "24h"                  → si no está definida, el token expira en 24 horas
    // Formatos válidos: "1h", "7d", "30m", "1y"
    expiresIn: process.env.JWT_EXPIRE_IN || "24h",
  });
};


// ==========================================
// CONTROLADOR 1: registro
// ==========================================
/**
 * POST /api/auth/registro
 * Ruta pública: registra un nuevo usuario en el sistema
 */
// ⚠️ Typo detectado: "resgistro" debería ser "registro"
//    No afecta la funcionalidad pero sí la legibilidad y el export
const resgistro = async (req, res, next) => {
  try {
    // Extraemos todos los campos necesarios del cuerpo de la petición
    // El cliente debe enviar estos campos en formato JSON
    const { nombre, apellido, email, password, rut } = req.body;

    // Validación: verificamos que NINGÚN campo llegue vacío o undefined
    // El operador ! convierte a booleano: !undefined, !"", !null → todos son true
    if (!nombre || !apellido || !email || !password || !rut) {
      return res.status(400).json({
        status: "error",
        message: "Todos los campos son obligatorios",
        data: null,
      });
    }

    // User.create() hace dos cosas en una sola llamada:
    //   1. Crea una instancia del modelo con los datos
    //   2. La guarda en MongoDB (equivalente a new User({...}) + .save())
    // El Schema de Mongoose se encarga de hashear la contraseña antes de guardar
    // (normalmente mediante un hook "pre save" definido en el modelo)
    const nuevoUsuario = await User.create({
      nombre,
      apellido,
      email,
      password, // ← el modelo hashea esto automáticamente con bcrypt antes de guardar
      rut,
    });

    // Generamos el token usando el _id de MongoDB del usuario recién creado
    // _id es el identificador único que MongoDB asigna automáticamente a cada documento
    // Enviamos el token inmediatamente para que el usuario ya quede autenticado
    const token = generateToken(nuevoUsuario._id);

    // 201 Created → código correcto al crear un nuevo recurso
    res.status(201).json({
      status: "ok",
      message: "Usuario registrado exitosamente",
      data: {
        usuario: nuevoUsuario, // ⚠️ Considerar omitir el campo password en la respuesta
        token,                 // El cliente guardará este token para peticiones futuras
      },
    });
  } catch (error) {
    // Si el email o rut ya existen (campo unique en el Schema),
    // Mongoose lanzará error code 11000 que el errorHandler global ya sabe manejar
    next(error);
  }
};


// ==========================================
// CONTROLADOR 2: login
// ==========================================
/**
 * POST /api/auth/login
 * Ruta pública: autentica un usuario y devuelve un JWT.
 * El cliente deberá incluir este token en el header de rutas protegidas.
 */
const login = async (req, res, next) => {
  try {
    // Solo necesitamos email y password para autenticar
    const { email, password } = req.body;

    // Validación rápida antes de ir a la base de datos
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email y contraseña son requeridos.",
        data: null,
      });
    }

    // Buscamos el usuario por email Y que esté activo
    // Doble filtro intencional: un usuario desactivado no puede iniciar sesión
    // aunque tenga las credenciales correctas
    const usuario = await User.findOne({ email, activo: true });

    // Si no encontramos el usuario, respondemos con "Credenciales inválidas"
    // ⚠️ Nunca debemos decir "email no encontrado" — eso le confirma al atacante
    //    que el email existe en el sistema (enumeración de usuarios)
    //    Es más seguro el mensaje genérico que no revela cuál campo falló
    if (!usuario) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas.",
        data: null,
      });
    }

    // compararPassword() es un método personalizado definido en el modelo User
    // Internamente usa bcrypt.compare(passwordIngresada, hashGuardado)
    // bcrypt hashea la contraseña ingresada y compara con el hash guardado en BD
    // NUNCA desencriptamos el hash — bcrypt solo compara hashes, es unidireccional
    const passwordCorrecta = await usuario.compararPassword(password);

    // Mismo mensaje genérico que cuando no se encontró el usuario
    // Por la misma razón de seguridad: no revelar si fue el email o la contraseña
    if (!passwordCorrecta) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas.",
        data: null,
      });
    }

    // ✅ Si llegamos aquí: el usuario existe, está activo y la contraseña es correcta
    // ⚠️ BUG CRÍTICO DETECTADO: se llama "generarToken" (español) pero la función
    //    se definió arriba como "generateToken" (inglés) → esto causará un ReferenceError
    //    en tiempo de ejecución. Debe cambiarse a generateToken(usuario._id)
    const token = generarToken(usuario._id); // ← ⚠️ cambiar a generateToken

    // 200 OK → login exitoso, devolvemos usuario y token
    res.status(200).json({
      status: "ok",
      message: "Bienvenido a Talk A Bank.",
      data: {
        usuario, // ⚠️ Considerar usar .select('-password') al buscar para no exponer el hash
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// EXPORTACIONES
// ==========================================
// ⚠️ BUG DETECTADO: falta el module.exports en el archivo original
//    Sin esto, el archivo no exporta nada y las rutas no pueden importar los controladores
module.exports = { registro: resgistro, login };