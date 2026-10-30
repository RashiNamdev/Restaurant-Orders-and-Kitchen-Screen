const AppError = require('../utils/appError');

/**
 * Reusable request validation middleware.
 * Supports schema definitions for body, query, and params.
 *
 * Example Schema:
 * {
 *   body: {
 *     tableNumber: { required: true, type: 'string' },
 *     items: { required: true, type: 'array', minLength: 1 }
 *   }
 * }
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    ['body', 'query', 'params'].forEach((target) => {
      if (!schema[target]) return;

      const rules = schema[target];
      const data = req[target] || {};

      Object.entries(rules).forEach(([field, rule]) => {
        const val = data[field];

        // Required check
        if (rule.required && (val === undefined || val === null || val === '')) {
          errors.push({ field, location: target, message: `${field} is required` });
          return;
        }

        // Skip subsequent checks if optional and not provided
        if (val === undefined || val === null) {
          return;
        }

        // Type check
        if (rule.type) {
          if (rule.type === 'array') {
            if (!Array.isArray(val)) {
              errors.push({ field, location: target, message: `${field} must be an array` });
            }
          } else if (typeof val !== rule.type) {
            errors.push({ field, location: target, message: `${field} must be of type ${rule.type}` });
          }
        }

        // Min length check (for string or array)
        if (rule.minLength !== undefined && (typeof val === 'string' || Array.isArray(val))) {
          if (val.length < rule.minLength) {
            errors.push({
              field,
              location: target,
              message: `${field} must have at least ${rule.minLength} items/characters`,
            });
          }
        }

        // Enum check
        if (rule.enum && !rule.enum.includes(val)) {
          errors.push({
            field,
            location: target,
            message: `${field} must be one of: ${rule.enum.join(', ')}`,
          });
        }

        // Custom validator function
        if (typeof rule.validator === 'function') {
          const customResult = rule.validator(val, data);
          if (customResult !== true) {
            errors.push({
              field,
              location: target,
              message: typeof customResult === 'string' ? customResult : `${field} failed validation`,
            });
          }
        }
      });
    });

    if (errors.length > 0) {
      return next(new AppError('Request validation failed', 400, errors));
    }

    next();
  };
};

module.exports = {
  validate,
};
