/**
 * @module apiResponse
 * @description Standardized API response helpers
 */

/**
 * Send a success response
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Response payload
 * @param {string} message - Human-readable message
 * @param {object} [extra] - Additional top-level fields (e.g. pagination)
 */
const sendSuccess = (res, statusCode, data, message, extra = {}) => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
    ...extra,
  });
};

/**
 * Send an error response
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable message
 * @param {string} error - Error detail
 */
const sendError = (res, statusCode, message, error) => {
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error,
  });
};

module.exports = { sendSuccess, sendError };
