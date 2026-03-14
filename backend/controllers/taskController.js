/**
 * @module taskController
 * @description Thin controller layer for Task routes — delegates to taskService
 */
const taskService = require('../services/taskService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get all tasks with filtering, sorting, and pagination
 * @route   GET /api/tasks
 * @access  Public
 */
const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getAllTasks(req.query, req.user.id);
    sendSuccess(res, 200, result.tasks, `Found ${result.total} task(s)`, {
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single task by ID
 * @route   GET /api/tasks/:id
 * @access  Public
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);
    sendSuccess(res, 200, task, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Public
 */
const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user.id);
    sendSuccess(res, 201, task, 'Task created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a task by ID
 * @route   PUT /api/tasks/:id
 * @access  Public
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
    sendSuccess(res, 200, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Patch task status by ID
 * @route   PATCH /api/tasks/:id/status
 * @access  Public
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await taskService.updateTaskStatus(req.params.id, req.body.status, req.user.id);
    sendSuccess(res, 200, task, 'Task status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task by ID
 * @route   DELETE /api/tasks/:id
 * @access  Public
 */
const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    sendSuccess(res, 200, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Public
 */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await taskService.getTaskStats(req.user.id);
    sendSuccess(res, 200, stats, 'Task statistics retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
};
