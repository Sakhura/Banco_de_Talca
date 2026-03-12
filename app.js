// Cargar las variables de archivo .env
require("dotenv").config();

const express = require("express");
const path = require("path");

// importar la fx que conecta con mongodb
const connectDB = require("./src/config/db");

// importar   el middleware de express , resgistra visitas en el log.txt
const { logAccess } = require("./src/middlewares/logAccess");


// importacion de rutas
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const accountRoutes = require("./src/routes/accountRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

// importar manejador de errores
const errorHadler = require("./src/middlewares/errorHandler");

// crear aplicacion express
const app = express();

// middleware de express para leer JSON del body de las solicitudes
app.use(express.static(path.join(__dirname, "public")));

// Middleware para servir archivos estáticos desde /public
app.use("/uploads", express.static(path.join(__dirname, "public")));

// middleware para registrar visitas
app.use(logAccess);

// conectar a la base de datos
connectDB();

// rutas publicas

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/status", (req, res) => {
  res.json({ 
    status: "ok", 
    message : "TALK-A-BANK API esta operativa",
    timestamp: new Date().toISOString() });
});

// rutas privadas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/upload", uploadRoutes);

// ruta 404
app.use((req, res) => {
  res.status(404).json({ 
    status : "error",
    message : "Ruta no encontrada",
    dara: null,
   });
});

// manejador errores global
app.use(errorHadler);

// iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado  en http://localhost:${PORT}`);
});

