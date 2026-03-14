// ============================================================
// MODELO: Account (Cuenta Bancaria)
// Archivo: models/Account.js
//
// ¿Qué es un modelo en Mongoose?
// Es la "plantilla" que define cómo se verán los documentos
// guardados en la colección de MongoDB. Piénsalo como el
// molde de una galleta: todos los documentos tendrán
// la misma forma.
// ============================================================

// Importamos mongoose para poder usar sus herramientas
const mongoose = require('mongoose');

// ============================================================
// SCHEMA (Esquema)
// Define la ESTRUCTURA del documento: qué campos tiene,
// qué tipo de dato acepta cada uno y sus reglas de validación.
// Es como definir las columnas de una tabla en SQL.
// ============================================================
const accountSchema = new mongoose.Schema({

    // Campo: número de cuenta
    // - type: String  → solo acepta texto
    // - required: true → es obligatorio (no puede estar vacío)
    // - unique: true   → no pueden existir dos cuentas con el mismo número
    numeroCuenta: {
        type: String,
        required: true,
        unique: true,
    },

    // Campo: tipo de cuenta
    // - enum: ['Ahorros', 'Corriente'] → SOLO acepta esos dos valores.
    //   Si mandas otro valor (ej: "Plazo"), MongoDB lo rechaza.
    // - required con mensaje personalizado: cuando falta este campo,
    //   el error mostrará ese mensaje en lugar de uno genérico.
    tipoCuenta: {
        type: String,
        enum: ['Ahorros', 'Corriente'],
        required: [true, 'El tipo de cuenta es obligatorio'],
    },

    // Campo: saldo
    // - type: Number  → solo acepta números
    // - default: 0    → si no se envía este campo, se guarda con 0
    // - min: [0, '...'] → validación: no puede ser menor a 0.
    //   El segundo elemento del array es el mensaje de error.
    saldo: {
        type: Number,
        default: 0,
        min: [0, 'El saldo no puede ser negativo'],
    },

    // Campo: moneda
    // - Solo acepta 'USD' (dólares) o 'CLP' (pesos chilenos)
    // - Si no se especifica, se guarda 'CLP' por defecto
    moneda: {
        type: String,
        enum: ['USD', 'CLP'],
        default: 'CLP',
    },

    // Campo: activa
    // - Indica si la cuenta está habilitada o bloqueada
    // - Es un booleano: true (activa) / false (inactiva)
    // - Por defecto, toda cuenta nueva nace activa
    activa: {
        type: Boolean,
        default: true,
    },

    // Campo: usuario (RELACIÓN entre colecciones)
    // - type: mongoose.Schema.Types.ObjectId → guarda el _id de otro documento
    // - ref: 'User' → le dice a Mongoose que ese ObjectId pertenece
    //   al modelo 'User'. Esto permite usar .populate() después
    //   para traer los datos completos del usuario.
    //
    // Equivalente en SQL: sería una FOREIGN KEY (clave foránea)
    //   que apunta a la tabla Users.
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio'],
    },

}, {
    // Opción: timestamps
    // Al activarla, Mongoose agrega automáticamente dos campos:
    //   - createdAt: fecha/hora en que se creó el documento
    //   - updatedAt: fecha/hora de la última modificación
    // ¡No tienes que agregarlos tú manualmente!
    timestamps: true,
});

// ============================================================
// MIDDLEWARE / HOOK: pre('save')
//
// Un "hook" (gancho) es una función que se ejecuta
// AUTOMÁTICAMENTE antes o después de ciertos eventos.
//
// pre('save') → se ejecuta ANTES de que el documento
// se guarde en la base de datos.
//
// Uso aquí: si el numeroCuenta llega vacío, lo generamos
// automáticamente para no depender del frontend.
// ============================================================
accountSchema.pre('save', function(next) {

    // IMPORTANTE: usamos function() normal (NO arrow function =>)
    // porque necesitamos acceder a "this", que representa
    // el documento que se está guardando en ese momento.
    // Con arrow functions, "this" no funciona igual.

    if (!this.numeroCuenta) {
        // Generamos un número de cuenta automático:
        // "TALK-A" + los últimos 10 dígitos del timestamp actual
        //
        // Date.now() → milisegundos desde el 1 enero de 1970
        // .toString() → lo convierte a texto
        // .slice(-10) → toma solo los últimos 10 caracteres
        //
        // Ejemplo de resultado: "TALK-A1748392011"
        this.numeroCuenta = "TALK-A" + Date.now().toString().slice(-10);
    }

    // next() es OBLIGATORIO en los middlewares.
    // Le dice a Mongoose: "ya terminé, puedes continuar
    // con el proceso de guardado".
    // Si no llamas a next(), el guardado se queda colgado para siempre.
    next();
});

// ============================================================
// CREAR EL MODELO
//
// mongoose.model('Account', accountSchema) crea el modelo
// a partir del schema. Mongoose buscará (o creará) automáticamente
// una colección llamada "accounts" en MongoDB
// (convierte el nombre a minúsculas y plural).
// ============================================================
const Account = mongoose.model('Account', accountSchema);

// Exportamos el modelo para poder usarlo en otros archivos
// (controladores, rutas, etc.) con require('./models/Account')
module.exports = Account;