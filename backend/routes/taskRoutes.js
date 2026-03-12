/**
 * @module taskRoutes
 * @description Express router for /api/tasks endpoints
 */
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { validateCreate, validateUpdate, validateStatus } = require('../middleware/validate');

// Stats must come before /:id to avoid being treated as an ID
router.get('/stats', taskController.getTaskStats);

router.route('/')
  .get(taskController.getTasks)
  .post(validateCreate, taskController.createTask);

router.route('/:id')
  .get(taskController.getTaskById)
  .put(validateUpdate, taskController.updateTask)
  .delete(taskController.deleteTask);

router.patch('/:id/status', validateStatus, taskController.updateTaskStatus);

module.exports = router;
