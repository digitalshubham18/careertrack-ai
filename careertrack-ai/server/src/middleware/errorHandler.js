const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize known non-ApiError failure types into ApiError instances.
  if (err.name === 'ValidationError') {
    error = ApiError.badRequest('Validation failed', err.errors);
  } else if (err.code === 11000) {
    error = ApiError.conflict('A record with this value already exists');
  } else if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  } else if (err.name === 'MulterError') {
    error = ApiError.badRequest(err.message);
  } else if (!(err instanceof ApiError)) {
    error = ApiError.internal(env.nodeEnv === 'production' ? 'Internal server error' : err.message);
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(error.message, { stack: err.stack, path: req.originalUrl });
  } else {
    logger.warn(error.message, { path: req.originalUrl, statusCode: error.statusCode });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Something went wrong',
    code: error.code || undefined,
    error:
      env.nodeEnv === 'production'
        ? undefined
        : { details: error.details, stack: err.stack },
  });
}

module.exports = { notFoundHandler, errorHandler };
