/**
 * @module taskService
 * @description Business logic layer for Task operations
 */
const mongoose = require('mongoose');
const Task = require('../models/Task');

const PRIORITY_SORT_MAP = { high: 1, medium: 2, low: 3 };

/**
 * Build a Mongoose filter object from query params
 * @param {{ status?: string, priority?: string }} query
 * @returns {object} Mongoose filter
 */
const buildFilter = ({ status, priority, q }) => {
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (q && q.trim()) filter.title = { $regex: q.trim(), $options: 'i' };
  return filter;
};

/**
 * Build Mongoose sort object from query params
 * @param {string} [sortBy='createdAt'] - Field to sort by
 * @param {string} [order='desc'] - Sort direction
 * @returns {object} Mongoose sort
 */
const buildSort = (sortBy = 'createdAt', order = 'desc') => {
  const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority'];
  const field = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const direction = order === 'asc' ? 1 : -1;
  return { [field]: direction };
};

/**
 * Retrieve all tasks with filtering, sorting, and pagination
 * @param {object} queryParams - Express req.query object
 * @param {string} [queryParams.status] - Filter by status
 * @param {string} [queryParams.priority] - Filter by priority
 * @param {string} [queryParams.sortBy] - Sort field
 * @param {string} [queryParams.order] - Sort direction ('asc' | 'desc')
 * @param {string|number} [queryParams.page=1] - Page number
 * @param {string|number} [queryParams.limit=10] - Items per page
 * @returns {Promise<{tasks: object[], total: number, pagination: object}>}
 */
const getAllTasks = async ({ status, priority, q, sortBy, order, page = 1, limit = 10 }, userId) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { ...buildFilter({ status, priority, q }), owner: userId };
  const sort = buildSort(sortBy, order);

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(parsedLimit).lean(),
    Task.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / parsedLimit);

  return {
    tasks,
    total,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Retrieve a single task by ID
 * @param {string} id - Task MongoDB ObjectId
 * @returns {Promise<object>} Task document
 * @throws {Error} 404 if not found
 */
const getTaskById = async (id, userId) => {
  const task = await Task.findOne({ _id: id, owner: userId }).lean();
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
};

/**
 * Create a new task
 * @param {object} taskData - Validated task data
 * @returns {Promise<object>} Created task document
 */
const createTask = async (taskData, userId) => {
  const task = await Task.create({ ...taskData, owner: userId });
  return task.toObject();
};

/**
 * Update a task by ID
 * @param {string} id - Task MongoDB ObjectId
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated task document
 * @throws {Error} 404 if not found
 */
const updateTask = async (id, updateData, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: id, owner: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  return task;
};

/**
 * Update only the status of a task
 * @param {string} id - Task MongoDB ObjectId
 * @param {string} status - New status value
 * @returns {Promise<object>} Updated task document
 * @throws {Error} 404 if not found
 */
const updateTaskStatus = async (id, status, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: id, owner: userId },
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean();

  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  return task;
};

/**
 * Delete a task by ID
 * @param {string} id - Task MongoDB ObjectId
 * @returns {Promise<object>} Deleted task document
 * @throws {Error} 404 if not found
 */
const deleteTask = async (id, userId) => {
  const task = await Task.findOneAndDelete({ _id: id, owner: userId }).lean();
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
};

/**
 * Get aggregate statistics for tasks
 * @returns {Promise<object>} Stats object
 */
const getTaskStats = async (userId) => {
  const ownerId = new mongoose.Types.ObjectId(userId);

  const stats = await Task.aggregate([
    {
      $match: {
        owner: ownerId,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const priorityStats = await Task.aggregate([
    {
      $match: {
        owner: ownerId,
      },
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusMap = { pending: 0, 'in-progress': 0, completed: 0 };
  stats.forEach(({ _id, count }) => { statusMap[_id] = count; });

  const priorityMap = { low: 0, medium: 0, high: 0 };
  priorityStats.forEach(({ _id, count }) => { priorityMap[_id] = count; });

  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return { total, byStatus: statusMap, byPriority: priorityMap };
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
};
