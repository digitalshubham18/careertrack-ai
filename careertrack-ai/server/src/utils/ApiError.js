/**
 * Standard application error. Controllers/services throw this; the
 * centralized error middleware turns it into the standard error envelope.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null, isOperational = true, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.code = code; // stable machine-readable identifier, safe to expose in prod (e.g. 'EMAIL_NOT_VERIFIED')
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Not authorized', code = null) {
    return new ApiError(403, message, null, true, code);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, null, false);
  }
}

module.exports = ApiError;
