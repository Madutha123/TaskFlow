/**
 * @module errorMiddleware
 * @description Centralized Express error handling middleware
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

/**
 * Handle 404 not found errors for unmatched routes
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const notFoundHandler = (req, res) => {
  sendError(res, 404, 'Route not found', `Cannot ${req.method} ${req.originalUrl}`);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return sendError(res, 400, 'Validation failed', message);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 400, 'Invalid ID format', `'${err.value}' is not a valid ID`);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, 'Duplicate field value', `${field} already exists`);
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  sendError(res, statusCode, message, process.env.NODE_ENV === 'development' ? err.stack : 'An unexpected error occurred');
};

module.exports = { notFoundHandler, errorHandler };
