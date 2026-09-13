const ApiError = require('../utils/ApiError');

/**
 * Generic Zod-schema-validation middleware. Pass a Zod schema; on failure it
 * throws a 400 ApiError with the flattened issues so the client can render
 * field-level errors.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(ApiError.badRequest('Validation failed', result.error.flatten().fieldErrors));
  }
  req.body = result.data;
  next();
};

module.exports = validate;
