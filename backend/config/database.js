/**
 * @module database
 * @description MongoDB connection manager with retry logic and event handling
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connect to MongoDB with exponential-backoff retry logic
 * @param {number} [attempt=1] - Current attempt number
 * @returns {Promise<void>}
 */
const connectDatabase = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host} 🔥`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — attempting reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });
  } catch (error) {
    logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, {
      error: error.message,
    });

    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      logger.info(`Retrying in ${delay / 1000}s...`);
      await sleep(delay);
      await connectDatabase(attempt + 1);
    } else {
      logger.error('Max MongoDB connection retries reached. Exiting.');
      process.exit(1);
    }
  }
};

module.exports = { connectDatabase };
