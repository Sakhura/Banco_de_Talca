// ==========================================
// IMPORTACIONES
// ==========================================

// Mongoose es una librería ODM (Object Document Mapper)
// Actúa como "traductor" entre Node.js y MongoDB:
//   - Nos permite definir Schemas (estructura de los datos)
//   - Convierte objetos JavaScript en documentos MongoDB y viceversa
//   - Provee métodos como .find(), .create(), .findById(), etc.
// ⚠️ Hay un typo en el nombre de la variable: "mongosee" debería ser "mongoose"
//    aunque funciona igual porque es solo el nombre de la variable local
const mongosee = require('mongoose');


// ==========================================
// FUNCIÓN DE CONEXIÓN
// ==========================================

// Función asíncrona porque conectarse a una base de datos es una operación
// que toma tiempo — necesitamos esperar (await) a que se establezca la conexión
const connectDB = async () => {
    try {
        // Intentamos conectarnos a MongoDB usando la URI de conexión
        // process.env.MONGODB_URI → variable de entorno guardada en el archivo .env
        // Ejemplo de URI: "mongodb+srv://usuario:pass@cluster.mongodb.net/talkABank"
        // La URI contiene: protocolo + credenciales + host + nombre de la base de datos
        // await → esperamos a que la conexión se establezca antes de continuar
        // conn  → objeto con información sobre la conexión establecida
        const conn = await mongosee.connect(process.env.MONGODB_URI)

        // Si la conexión fue exitosa, mostramos el host al que nos conectamos
        // conn.connection.host → dirección del servidor MongoDB
        // Ejemplo: "cluster0.abc123.mongodb.net" (MongoDB Atlas) o "127.0.0.1" (local)
        // Útil para confirmar visualmente en consola que la app se conectó al lugar correcto
        console.log(`MongoDB conectado: ${conn.connection.host}`);

    } catch (error) {

        // Si la conexión falla (credenciales incorrectas, red caída, URI mal formada, etc.)
        // mostramos el mensaje de error específico para facilitar el debugging
        console.error(`Error al conectar a MongoDB: ${error.message}`);

        // process.exit(1) → detiene COMPLETAMENTE la aplicación Node.js
        // El argumento "1" es el código de salida: 0 = éxito, cualquier otro número = error
        // Esto es intencional: si no hay base de datos, la app no tiene sentido seguir corriendo
        // Es preferible fallar rápido y con claridad que seguir ejecutándose sin BD
        process.exit(1);
    }
};


// ==========================================
// EXPORTACIÓN
// ==========================================
// Exportamos solo la función (no un objeto) porque es lo único que contiene este módulo
// Se importará en app.js o index.js para llamarla al iniciar el servidor
module.exports = connectDB;