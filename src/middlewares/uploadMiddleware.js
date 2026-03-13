// ============================================
// Talk A Bank - Middleware de Subida de Archivos
// Módulo 8: Configuración de Multer
// ============================================

// ==========================================
// IMPORTACIONES
// ==========================================

// Multer es una librería de terceros especializada en manejar "multipart/form-data"
// que es el formato que usan los formularios HTML cuando incluyen archivos adjuntos
// Sin Multer, Express no puede leer archivos que llegan en las peticiones
const multer = require("multer");

// Módulo nativo de Node.js para construir rutas compatibles entre sistemas operativos
const path = require("path");


// ==========================================
// BLOQUE 1: CONFIGURACIÓN DE ALMACENAMIENTO
// ==========================================

// multer.diskStorage() define DÓNDE y CON QUÉ NOMBRE se guardan los archivos en el servidor
// Recibe un objeto con dos funciones: destination y filename
// Alternativa a diskStorage sería memoryStorage() que guarda en RAM en vez de disco
const storage = multer.diskStorage({

  // destination → función que decide en qué carpeta se guardará el archivo
  // Parámetros:
  //   req  → la petición HTTP (podemos acceder a req.usuario, req.body, etc.)
  //   file → información del archivo que está siendo subido (nombre, tipo, etc.)
  //   cb   → callback que debemos llamar con (error, rutaDestino)
  destination: (req, file, cb) => {

    // cb(null, ruta) → null significa "sin error", luego la ruta de destino
    // __dirname      → carpeta donde está este archivo (/src/middlewares)
    // "../.."        → subimos dos niveles hasta la raíz del proyecto
    // "uploads"      → carpeta donde se guardarán los archivos subidos
    // ⚠️ Esta carpeta debe existir previamente, Multer NO la crea automáticamente
    cb(null, path.join(__dirname, "../../uploads"));
  },

  // filename → función que decide cómo se llamará el archivo guardado en el servidor
  // Si no definimos esto, Multer genera un nombre aleatorio sin extensión
  filename: (req, file, cb) => {

    // Extraemos la extensión del archivo original para conservarla
    // path.extname("foto.jpg") → ".jpg"
    // path.extname("imagen.PNG") → ".PNG"
    const ext = path.extname(file.originalname);

    // Construimos un nombre único que evita colisiones entre archivos
    // req.usuario.id → ID del usuario autenticado (viene del middleware protegerRuta)
    // Date.now()     → timestamp en milisegundos (ej: 1710345600000), garantiza unicidad
    // Ejemplo resultado: "usuario_64abc123_1710345600000.jpg"
    const nombreArchivo = `usuario_${req.usuario.id}_${Date.now()}${ext}`;

    // cb(null, nombre) → null = sin error, luego el nombre final del archivo
    cb(null, nombreArchivo);
  },
});


// ==========================================
// BLOQUE 2: FILTRO DE TIPOS DE ARCHIVO
// ==========================================

// fileFilter → función que decide si SE ACEPTA o SE RECHAZA cada archivo
// Se ejecuta ANTES de guardar el archivo en disco
// Parámetros: igual que storage (req, file, cb)
const fileFilter = (req, file, cb) => {

  // Expresión regular que define los tipos de imagen permitidos
  // El operador | funciona como OR: jpeg O jpg O png O webp
  const tiposPermitidos = /jpeg|jpg|png|webp/;

  // VALIDACIÓN 1: Verificamos la extensión del nombre del archivo
  // path.extname(file.originalname) → extrae la extensión: ".jpg", ".png", etc.
  // .toLowerCase() → normalizamos a minúsculas para evitar fallar con ".JPG" o ".PNG"
  // .test() → devuelve true si la extensión coincide con algún tipo permitido
  const extValida = tiposPermitidos.test(
    path.extname(file.originalname).toLowerCase()
  );

  // VALIDACIÓN 2: Verificamos el MIME type real del archivo
  // El MIME type lo determina el navegador/cliente según el contenido del archivo
  // Ejemplo: "image/jpeg", "image/png", "image/webp"
  // Verificar ambos (extensión Y mime) es más seguro que verificar solo uno
  // Un usuario podría renombrar "virus.exe" como "foto.jpg" → la ext pasaría pero el mime no
  const mimeValido = tiposPermitidos.test(file.mimetype);

  // Solo aceptamos el archivo si AMBAS validaciones pasan
  if (extValida && mimeValido) {

    // cb(null, true) → sin error + ACEPTAR el archivo
    cb(null, true);

  } else {

    // cb(error, false) → enviamos un Error descriptivo + RECHAZAR el archivo
    // Este error será capturado por el errorHandler global que definimos antes
    cb(
      new Error("Solo se permiten imágenes (jpg, jpeg, png, webp)."),
      false // false = rechazar el archivo
    );
  }
};


// ==========================================
// BLOQUE 3: CONFIGURACIÓN FINAL DE MULTER
// ==========================================

// Creamos la instancia final de Multer combinando todo lo configurado arriba
// multer() recibe un objeto de opciones con todas las configuraciones
const upload = multer({

  // Le decimos a Multer que use nuestra configuración de almacenamiento en disco
  storage,

  // Le decimos a Multer que use nuestra función de validación de tipos
  fileFilter,

  // limits → objeto que define restricciones numéricas sobre los archivos
  limits: {
    // fileSize → tamaño máximo permitido en BYTES
    // 2 * 1024 * 1024 es más legible que escribir 2097152 directamente:
    //   1024       = 1 KB (kilobyte)
    //   1024 * 1024 = 1 MB (megabyte)
    //   2 * 1024 * 1024 = 2 MB
    // Si el archivo supera este límite, Multer rechaza automáticamente con error
    fileSize: 2 * 1024 * 1024, // Límite: 2 MB
  },
});


// ==========================================
// EXPORTACIÓN
// ==========================================
// Exportamos la instancia upload directamente (no como objeto)
// porque es lo único que exporta este módulo
module.exports = upload;