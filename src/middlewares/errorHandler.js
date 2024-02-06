import CustomError from "../services/errors/customError.js";

export default function errorHandler(err, req, res, next) {
  if (err instanceof CustomError) {
    req.logger.error("Error personalizado capturado:", err);
    res.status(Number.isInteger(err.code) ? err.code : 500).json({
      error: {
        code: err.code || 500,
        message: err.message || "Internal Server Error",
        cause: err.cause || null,
      },
    });
  } else {
    req.logger.error("Error no manejado capturado:", err);
    res.status(500).json({
      error: {
        code: 500,
        message: "Internal Server Error",
        cause: err,
      },
    });
  }
}
