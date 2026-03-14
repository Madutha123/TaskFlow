/**
 * @module authService
 * @description Business logic for user registration, login, and session retrieval
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getSecret = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const getExpiry = () => process.env.JWT_EXPIRES_IN || '7d';

const signToken = (userId) => jwt.sign({ userId }, getSecret(), { expiresIn: getExpiry() });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existingUser) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email: email.toLowerCase(), password });
  const token = signToken(user._id.toString());

  return {
    user: sanitizeUser(user),
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id.toString());

  return {
    user: sanitizeUser(user),
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).lean();

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return sanitizeUser(user);
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
