/**
 * @module validationMiddleware
 * @description Request validation middleware using Joi schemas
 */
const Joi = require('joi');
const { sendError } = require('../utils/apiResponse');

const futureDate = Joi.date().greater('now').messages({
  'date.greater': 'Due date must be a future date',
});

/** Joi schema for creating a task */
const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 100 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': 'Description must not exceed 500 characters',
  }),
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: futureDate.optional(),
  tags: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(5)
    .optional()
    .messages({
      'array.max': 'A task can have at most 5 tags',
    }),
});

/** Joi schema for fully updating a task */
const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: futureDate.optional().allow(null),
  tags: Joi.array().items(Joi.string().trim().max(30)).max(5).optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided' });

/** Joi schema for patching task status */
const patchStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'in-progress', 'completed').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be one of: pending, in-progress, completed',
  }),
});

/** Joi schema for registering a user */
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'A valid email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(64).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password must not exceed 64 characters',
    'any.required': 'Password is required',
  }),
});

/** Joi schema for logging in a user */
const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'A valid email is required',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Creates a validation middleware for the given Joi schema
 * @param {Joi.ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return sendError(res, 400, 'Validation failed', message);
  }

  req[source] = value;
  next();
};

module.exports = {
  validateCreate: validate(createTaskSchema),
  validateUpdate: validate(updateTaskSchema),
  validateStatus: validate(patchStatusSchema),
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};
