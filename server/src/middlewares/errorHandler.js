const config = require('../config/env');
const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid ID format: "${err.value}" is not a valid identifier`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate field value entered for: ${fields}`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  // Handle SyntaxError in JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload provided in request body', 400);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
  };

  if (error.details) {
    response.details = error.details;
  }

  if (config.isDev) {
    response.stack = err.stack;
  }

  if (!config.isTest && statusCode === 500) {
    console.error('[Unhandled Server Error]', err);
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
