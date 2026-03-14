// ============================================================
// MODELO: User (Usuario)
// Archivo: models/User.js
//
// Este modelo representa a los usuarios del sistema bancario.
// Incluye funcionalidades especiales como:
//   - Encriptación automática de contraseñas (bcrypt)
//   - Método para verificar contraseñas al hacer login
//   - Método para ocultar la contraseña al enviar datos al frontend
// ============================================================

const mongoose = require('mongoose');

// bcryptjs: librería para encriptar contraseñas de forma segura.
// NUNCA se guardan contraseñas en texto plano en la BD.
// bcrypt convierte "mi123clave" en algo como "$2a$10$xK9p..."
const bcrypt = require('bcryptjs');

// ⚠️ ADVERTENCIA: Esta línea NO debería estar aquí.
// 'react' es una librería de frontend y no tiene nada que hacer
// en un modelo de backend. Probablemente fue un import accidental.
// → ELIMINAR esta línea.
// const { act } = require('react');  // ← BORRAR

// ============================================================
// SCHEMA: Define la estructura del documento "usuario"
// ============================================================
const userSchema = new mongoose.Schema({

    // trim: true → elimina espacios en blanco al inicio y al final
    // Ejemplo: "  Juan  " se guarda como "Juan"
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
    },

    apellido: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        trim: true,
    },

    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,       // No pueden existir dos usuarios con el mismo email
        lowercase: true,    // Convierte a minúsculas antes de guardar
                            // "JUAN@Gmail.com" → "juan@gmail.com"
        trim: true,
        // match: valida el formato con una expresión regular (regex)
        // /\S+@\S+\.\S+/ verifica que tenga la estructura "algo@algo.algo"
        // Si no cumple el patrón, lanza el mensaje de error personalizado
        match: [/\S+@\S+\.\S+/, 'El email no es válido'],
    },

    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        // minlength: valida que el texto tenga al menos N caracteres
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        // ⚠️ NOTA: la contraseña NUNCA se guarda tal como llega.
        // El hook pre('save') de más abajo la encripta antes de guardar.
    },

    // RUT chileno — único por persona
    rut: {
        type: String,
        required: [true, 'El RUT es obligatorio'],
        unique: true,
        trim: true,
    },

    // rol: define los permisos del usuario dentro del sistema
    // 'cliente' → usuario normal
    // 'admin'   → tiene acceso a funciones administrativas
    rol: {
        type: String,
        enum: ['cliente', 'admin'],
        default: 'cliente', // Todo usuario nuevo nace como cliente
    },

    // URL o path de la imagen de perfil.
    // null significa que aún no tiene foto asignada.
    fotoPerfil: {
        type: String,
        default: null,
    },

    // Permite desactivar un usuario sin eliminarlo de la BD
    // (conocido como "borrado lógico" o "soft delete")
    activo: {
        type: Boolean,
        default: true,
    },

}, {
    // Agrega automáticamente: createdAt y updatedAt
    timestamps: true,
});


// ============================================================
// MIDDLEWARE: pre('save') — Encriptar contraseña
//
// Se ejecuta ANTES de guardar cualquier documento User.
// Su único objetivo: encriptar la contraseña si fue modificada.
// ============================================================
userSchema.pre('save', async function (next) {

    // isModified('password') → devuelve true solo si el campo
    // 'password' fue cambiado en esta operación.
    //
    // ¿Por qué este chequeo? Porque pre('save') también se dispara
    // al actualizar OTROS campos (nombre, email, etc.).
    // Sin este if, encriptaríamos una contraseña ya encriptada
    // → resultado: el login dejaría de funcionar.
    if (!this.isModified('password')) return next();

    // genSalt(10): genera un "salt" con costo 10.
    // Un salt es dato aleatorio que se mezcla con la contraseña
    // antes de encriptarla, para que dos contraseñas iguales
    // produzcan hashes distintos.
    // El número 10 es el "costo computacional": más alto = más seguro
    // pero más lento. 10 es el valor estándar recomendado.
    const salt = await bcrypt.genSalt(10);

    // hash(): combina la contraseña + salt y genera el hash final
    // Ejemplo:
    //   password original → "miClave123"
    //   password guardada → "$2a$10$N9qo8uLOickgx2ZMRZo..."
    this.password = await bcrypt.hash(this.password, salt);

    next(); // Continuar con el guardado
});


// ============================================================
// MÉTODO DE INSTANCIA: compararPassword
//
// Los métodos de instancia se agregan a userSchema.methods
// y quedan disponibles en CADA documento User.
//
// Uso típico (en el controlador de login):
//   const usuario = await User.findOne({ email });
//   const esValida = await usuario.compararPassword("miClave123");
//   if (!esValida) → credenciales incorrectas
// ============================================================
userSchema.methods.compararPassword = async function (passwordIngresada) {
    // bcrypt.compare() encripta la contraseña ingresada con el mismo
    // salt que se usó originalmente y compara los resultados.
    // Retorna: true si coinciden, false si no.
    //
    // NUNCA compares las contraseñas así: passwordIngresada === this.password
    // porque this.password es un hash y NUNCA será igual al texto plano.
    return await bcrypt.compare(passwordIngresada, this.password);
};


// ============================================================
// MÉTODO: toJSON — Sanitizar datos antes de enviar al cliente
//
// toJSON() se llama automáticamente cuando Mongoose convierte
// un documento a JSON (por ejemplo, al hacer res.json(usuario)).
//
// ¿Por qué sobreescribirlo?
// Para ELIMINAR la contraseña del objeto antes de que salga
// hacia el frontend. Aunque esté encriptada, no debe exponerse.
// ============================================================
userSchema.methods.toJSON = function () {
    // toObject() convierte el documento Mongoose a un objeto JS plano
    const userObject = this.toObject();

    // Eliminamos el campo password del objeto
    // Esto NO borra la contraseña de la base de datos,
    // solo la quita del objeto que se va a serializar/enviar.
    delete userObject.password;

    return userObject;
};


// ============================================================
// CREAR EL MODELO Y EXPORTAR
//
// ⚠️ BUG DETECTADO: falta esta línea en el código original.
// Sin ella, "User" no existe y module.exports fallará con:
//   ReferenceError: User is not defined
// ============================================================
const User = mongoose.model('User', userSchema);

module.exports = User;