// ============================================
// Talk A Bank - Middleware de Log (Módulo 6)
// Registra cada acceso en logs/log.txt
// ============================================

// ==========================================
// IMPORTACIONES
// ==========================================

// Módulo nativo de Node.js para trabajar con el sistema de archivos
// "fs" = File System → nos permite leer, escribir y modificar archivos
const fs = require("fs");

// Módulo nativo de Node.js para trabajar con rutas de archivos/carpetas
// Nos ayuda a construir rutas compatibles con cualquier sistema operativo
// (Windows usa \ y Linux/Mac usan /, path lo resuelve automáticamente)
const path = require("path");


// ==========================================
// CONFIGURACIÓN DE RUTA DEL ARCHIVO DE LOG
// ==========================================

// Construimos la ruta absoluta donde se guardará el archivo de log
// __dirname → carpeta donde está ESTE archivo (ej: /src/middlewares)
// "../.."   → subimos dos niveles (de /middlewares a /src, luego a la raíz del proyecto)
// "logs/log.txt" → carpeta logs y archivo log.txt en la raíz del proyecto
// Resultado final: /ruta/del/proyecto/logs/log.txt
const logPath = path.join(__dirname, "../../logs/log.txt");


// ==========================================
// MIDDLEWARE 1: logAccess
// ==========================================
/**
 * Middleware que registra cada petición HTTP en un archivo de texto plano.
 * Formato: [fecha] [hora] | MÉTODO | ruta | IP del cliente
 */
// Este middleware es SINCRÓNICO en su lógica pero escribe el archivo de forma ASÍNCRONA
// Recibe los 3 parámetros clásicos de Express: req, res, next
const logAccess = (req, res, next) => {

  // Capturamos el momento exacto en que llegó la petición
  // new Date() crea un objeto con la fecha y hora actual del servidor
  const ahora = new Date();

  // Formateamos la fecha en estilo latinoamericano: DD/MM/YYYY
  // "es-AR" es el locale de Argentina (mismo formato que Chile y gran parte de LatAm)
  // Ejemplo resultado: "13/03/2026"
  const fecha = ahora.toLocaleDateString("es-AR");

  // Formateamos la hora en formato HH:MM:SS
  // Ejemplo resultado: "14:35:22"
  const hora = ahora.toLocaleTimeString("es-AR");

  // Construimos la línea completa que se escribirá en el archivo
  // Template literal que arma una línea con formato fijo y legible:
  //   [13/03/2026] [14:35:22] | GET    | /api/usuarios                           | IP: 192.168.1.1
  //
  // .padEnd(6)  → rellena con espacios hasta 6 caracteres (alinea los métodos: GET, POST, DELETE...)
  // .padEnd(40) → rellena con espacios hasta 40 caracteres (alinea las URLs)
  // req.method  → método HTTP de la petición (GET, POST, PUT, DELETE, etc.)
  // req.url     → ruta que se solicitó (ej: /api/usuarios/123)
  // req.ip      → dirección IP del cliente que hizo la petición
  // \n          → salto de línea para que cada entrada quede en su propia línea
  const linea = `[${fecha}] [${hora}] | ${req.method.padEnd(6)} | ${req.url.padEnd(40)} | IP: ${req.ip}\n`;

  // fs.appendFile agrega la línea AL FINAL del archivo sin borrar el contenido anterior
  // A diferencia de fs.writeFile que sobreescribe todo, appendFile ACUMULA las líneas
  // Parámetros: (ruta del archivo, contenido a agregar, callback cuando termina)
  fs.appendFile(logPath, linea, (err) => {
    if (err) {
      // Si hay un error al escribir (ej: carpeta logs no existe, sin permisos)
      // Solo lo mostramos en consola del servidor — NO detenemos la petición del usuario
      // El log es un proceso secundario: un fallo aquí no debe romper la app
      console.error("Error al escribir en log:", err.message);
    }
  });

  // ⚠️ IMPORTANTE: next() se llama ANTES de que termine de escribir el archivo
  // Esto es intencional — la escritura en disco es asíncrona y no debe
  // hacer esperar al usuario. El log se escribe "en paralelo"
  next();
};


// ==========================================
// FUNCIÓN 2: logEvento
// ==========================================
/**
 * Función para registrar errores críticos o transacciones fallidas (Módulo 7 PLUS)
 * @param {string} mensaje - Descripción del evento a registrar
 */
// A diferencia de logAccess, esta NO es un middleware de Express
// Es una función utilitaria que se puede llamar desde CUALQUIER parte del código
// cuando queremos registrar un evento importante manualmente
// Ejemplo de uso: logEvento('Transferencia fallida: usuario 123 → cuenta 456')
const logEvento = (mensaje) => {

  // Igual que en logAccess, capturamos fecha y hora actuales
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-AR");
  const hora = ahora.toLocaleTimeString("es-AR");

  // La línea tiene un formato diferente a logAccess:
  // en lugar del método HTTP, escribe la palabra "EVENTO" para distinguirlos
  // Ejemplo: [13/03/2026] [14:35:22] | EVENTO | Transferencia fallida
  const linea = `[${fecha}] [${hora}] | EVENTO | ${mensaje}\n`;

  // Mismo proceso: appendFile para no sobreescribir el historial
  // Al estar en el mismo logPath, los eventos y accesos quedan en el MISMO archivo
  // en orden cronológico, lo que facilita el debugging
  fs.appendFile(logPath, linea, (err) => {
    // Versión compacta del manejo de error (equivalente al if/err del logAccess)
    if (err) console.error("Error al escribir evento en log:", err.message);
  });
};


// ==========================================
// EXPORTACIONES
// ==========================================
// Exportamos ambas funciones como objeto
// logAccess → se usa como middleware en app.js
// logEvento → se importa y se llama directamente donde se necesite
module.exports = { logAccess, logEvento };