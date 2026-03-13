// ==========================================
// PASO 1: VARIABLES DE ENTORNO
// ==========================================

// Debe ser la PRIMERA línea del archivo — carga el archivo .env antes que todo lo demás
// Sin esto, process.env.MONGODB_URI, process.env.JWT_SECRET, etc. serían undefined
// en todos los archivos de la aplicación, ya que Node.js no los lee automáticamente
require("dotenv").config();


// ==========================================
// IMPORTACIONES: LIBRERÍAS EXTERNAS
// ==========================================

// Framework principal — gestiona rutas, middlewares y el ciclo request/response
const express = require("express");

// Módulo nativo de Node.js para construir rutas de archivos
// compatibles entre Windows (\) y Linux/Mac (/)
const path = require("path");


// ==========================================
// IMPORTACIONES: MÓDULOS PROPIOS DEL PROYECTO
// ==========================================

// Función que establece la conexión con MongoDB (archivo config/db.js)
// La llamaremos más adelante para conectar antes de levantar el servidor
const connectDB = require("./src/config/db");

// Middleware que registra cada visita en logs/log.txt (archivo middlewares/logAccess.js)
// ⚠️ Inconsistencia detectada: el archivo real se llama "logger" o "logMiddleware"
//    según lo visto antes — verificar que el nombre del archivo coincida
const { logAccess } = require("./src/middlewares/logAccess");


// ==========================================
// IMPORTACIONES: RUTAS
// ==========================================

// Cada archivo de rutas agrupa los endpoints de un recurso específico
// y ya tiene asignados sus middlewares de autenticación internamente

const authRoutes    = require("./src/routes/authRoutes");    // /api/auth/registro, /api/auth/login
const userRoutes    = require("./src/routes/userRoutes");    // /api/users (CRUD usuarios)
const accountRoutes = require("./src/routes/accountRoutes"); // /api/accounts (CRUD cuentas)
const uploadRoutes  = require("./src/routes/uploadRoutes");  // /api/upload (subida de imágenes)


// ==========================================
// IMPORTACIONES: MANEJADOR DE ERRORES
// ==========================================

// El errorHandler global que vimos antes — debe importarse aquí para registrarse al final
// ⚠️ Typo detectado: "errorHadler" debería ser "errorHandler"
//    Funciona igual porque es solo el nombre de la variable local
const errorHadler = require("./src/middlewares/errorHandler");


// ==========================================
// PASO 2: CREAR LA APLICACIÓN EXPRESS
// ==========================================

// express() crea la instancia principal de la aplicación
// Toda la configuración, middlewares y rutas se aplican sobre este objeto
const app = express();


// ==========================================
// PASO 3: MIDDLEWARES GLOBALES
// ==========================================

// Habilita a Express para leer el body de las peticiones en formato JSON
// Sin esto, req.body sería undefined en todos los controladores
// ⚠️ BUG CRÍTICO DETECTADO: falta esta línea en el código original
//    DEBE AGREGARSE: app.use(express.json());
//    Sin ella, req.body llega vacío en POST/PUT y nada funciona correctamente
app.use(express.json()); // ← LÍNEA FALTANTE — agregar obligatoriamente

// Sirve los archivos de la carpeta /public como archivos estáticos accesibles via HTTP
// Ejemplo: /public/index.html → accesible en http://localhost:3000/index.html
//          /public/styles.css → accesible en http://localhost:3000/styles.css
app.use(express.static(path.join(__dirname, "public")));

// Sirve los archivos subidos por los usuarios (fotos de perfil) como estáticos
// Ejemplo: /uploads/usuario_64abc_123.jpg → http://localhost:3000/uploads/usuario_64abc_123.jpg
// Este es el mismo path que construimos en uploadController: `/uploads/${req.file.filename}`
// ⚠️ Inconsistencia detectada: la carpeta real de uploads debería ser /uploads en la raíz
//    pero aquí apunta a /public — debería ser:
//    app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "public")));

// Registra cada petición entrante en logs/log.txt ANTES de procesarla
// Al estar antes que las rutas, intercepta absolutamente todas las peticiones
app.use(logAccess);


// ==========================================
// PASO 4: CONEXIÓN A LA BASE DE DATOS
// ==========================================

// Iniciamos la conexión a MongoDB
// Si falla, connectDB llama a process.exit(1) y la app se detiene completamente
// No esperamos con await porque app.listen y connectDB pueden correr en paralelo
// (los controladores tienen await internamente — no responderán hasta que BD esté lista)
connectDB();


// ==========================================
// PASO 5: RUTAS PÚBLICAS (sin autenticación)
// ==========================================

// Ruta raíz → sirve el frontend (interfaz web del banco)
// Devuelve el archivo HTML principal de la carpeta /public
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta de estado → permite verificar rápidamente si la API está operativa
// Útil para herramientas de monitoreo, health checks de servidores y debugging
// timestamp en formato ISO 8601: "2026-03-13T14:35:22.000Z"
app.get("/status", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "TALK-A-BANK API esta operativa",
    timestamp: new Date().toISOString() // Fecha y hora exacta de la consulta
  });
});


// ==========================================
// PASO 6: RUTAS PRIVADAS (con autenticación)
// ==========================================

// Cada app.use() monta un grupo de rutas bajo un prefijo común
// Los middlewares de autenticación están DENTRO de cada archivo de rutas

app.use("/api/auth",     authRoutes);    // POST /api/auth/registro, POST /api/auth/login
app.use("/api/users",    userRoutes);    // GET/PUT/DELETE /api/users/:id
app.use("/api/accounts", accountRoutes); // GET/POST/PUT/DELETE /api/accounts
app.use("/api/upload",   uploadRoutes);  // POST /api/upload/foto-perfil


// ==========================================
// PASO 7: RUTA 404 — RECURSO NO ENCONTRADO
// ==========================================

// Este middleware se ejecuta SOLO si ninguna ruta anterior coincidió con la petición
// El orden es crucial: debe ir DESPUÉS de todas las rutas y ANTES del errorHandler
// Si una petición llega a este punto, significa que la URL no existe en la API
app.use((req, res) => {
  res.status(404).json({ 
    status: "error",
    message: "Ruta no encontrada",
    // ⚠️ Typo detectado: "dara" debería ser "data"
    data: null, // ← corregido
  });
});


// ==========================================
// PASO 8: MANEJADOR DE ERRORES GLOBAL
// ==========================================

// DEBE SER EL ÚLTIMO middleware registrado — Express lo identifica por tener 4 parámetros
// Captura cualquier error pasado con next(error) desde controladores y middlewares
// Si estuviera antes del 404, los errores podrían no llegar hasta aquí correctamente
app.use(errorHadler);


// ==========================================
// PASO 9: INICIAR EL SERVIDOR
// ==========================================

// process.env.PORT → puerto definido en .env (útil en producción, ej: Render, Railway)
// || 3000          → puerto por defecto si no está definido en .env (desarrollo local)
const PORT = process.env.PORT || 3000;

// app.listen() pone el servidor a escuchar conexiones entrantes en el puerto indicado
// El callback se ejecuta UNA SOLA VEZ cuando el servidor está listo
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});


