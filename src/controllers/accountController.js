// crud relaciones  y rutas protegidas

const accountService = require("../services/accountService");

/**
 * POST /api/cuentas
 * Ruta protegida: Crea una nueva cuenta bancaria para el usuario autenticado.
 */
const crear = async (req, res, next) => {
  try {
    const { tipoCuenta, moneda } = req.body;

    if (!tipoCuenta) {
      return res.status(400).json({
        status: "error",
        message: "El tipo de cuenta es obligatorio (caja_ahorro o cuenta_corriente).",
        data: null,
      });
    }

    // La cuenta se asocia automáticamente al usuario del token
    const cuenta = await accountService.crearCuenta({
      tipoCuenta,
      moneda,
      usuarioId: req.usuario.id,
    });

    res.status(201).json({
      status: "ok",
      message: "Cuenta bancaria creada exitosamente en Talk A Bank.",
      data: { cuenta },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cuentas/mis-cuentas
 * Ruta protegida: Lista las cuentas del usuario autenticado.
 * Ejemplo de consulta con relación (populate).
 */
const misCuentas = async (req, res, next) => {
  try {
    const cuentas = await accountService.obtenerCuentasDeUsuario(req.usuario.id);
    res.status(200).json({
      status: "ok",
      message: `Tienes ${cuentas.length} cuenta(s) activa(s).`,
      data: { cuentas },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/cuentas
 * Ruta protegida (admin): Lista todas las cuentas del banco con datos del titular.
 * Soporta filtros: ?tipoCuenta=caja_ahorro&moneda=USD
 */
const listarTodas = async (req, res, next) => {
  try {
    const { tipoCuenta, moneda } = req.query;
    const cuentas = await accountService.obtenerTodas({ tipoCuenta, moneda });
    res.status(200).json({
      status: "ok",
      message: `Se encontraron ${cuentas.length} cuenta(s).`,
      data: { cuentas },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/cuentas/:id/saldo
 * Ruta protegida (admin): Actualiza el saldo de una cuenta.
 */
const actualizarSaldo = async (req, res, next) => {
  try {
    const { saldo } = req.body;

    if (saldo === undefined || saldo < 0) {
      return res.status(400).json({
        status: "error",
        message: "El saldo debe ser un número mayor o igual a 0.",
        data: null,
      });
    }

    const cuenta = await accountService.actualizarSaldo(req.params.id, saldo);
    res.status(200).json({
      status: "ok",
      message: "Saldo actualizado correctamente.",
      data: { cuenta },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cuentas/:id
 * Ruta protegida (admin): Desactiva una cuenta bancaria.
 */
const desactivar = async (req, res, next) => {
  try {
    const resultado = await accountService.desactivarCuenta(req.params.id);
    res.status(200).json({
      status: "ok",
      message: resultado.mensaje,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { crear, misCuentas, listarTodas, actualizarSaldo, desactivar };
