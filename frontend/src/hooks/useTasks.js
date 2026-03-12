/**
 * @module useTasks
 * @description Custom hook providing all CRUD operations for tasks
 */
import { useCallback } from 'react';
import { useTaskContext } from '../context/TaskContext';
import taskApi from '../services/api';

/**
 * useTasks hook — provides task state and CRUD operations
 * @returns {object} Task state and action handlers
 */
const useTasks = () => {
  const { state, dispatch } = useTaskContext();

  /**
   * Fetch tasks list with current filters and pagination
   * @param {object} [overrideParams={}] - Additional query params
   */
  const fetchTasks = useCallback(
    async (overrideParams = {}) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const params = { ...state.filters, ...overrideParams };
        const res = await taskApi.getTasks(params);
        dispatch({
          type: 'SET_TASKS',
          payload: { tasks: res.data, pagination: res.pagination },
        });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message });
      }
    },
    [dispatch, state.filters]
  );

  /**
   * Fetch task statistics
   */
  const fetchStats = useCallback(async () => {
    dispatch({ type: 'SET_STATS_LOADING', payload: true });
    try {
      const res = await taskApi.getStats();
      dispatch({ type: 'SET_STATS', payload: res.data });
    } catch (err) {
      dispatch({ type: 'SET_STATS_LOADING', payload: false });
    }
  }, [dispatch]);

  /**
   * Create a new task
   * @param {object} taskData
   * @returns {Promise<object>} Created task
   */
  const createTask = useCallback(
    async (taskData) => {
      const res = await taskApi.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: res.data });
      fetchStats();
      return res.data;
    },
    [dispatch, fetchStats]
  );

  /**
   * Update an existing task
   * @param {string} id
   * @param {object} taskData
   * @returns {Promise<object>} Updated task
   */
  const updateTask = useCallback(
    async (id, taskData) => {
      const res = await taskApi.updateTask(id, taskData);
      dispatch({ type: 'UPDATE_TASK', payload: res.data });
      fetchStats();
      return res.data;
    },
    [dispatch, fetchStats]
  );

  /**
   * Update task status only
   * @param {string} id
   * @param {string} status
   * @returns {Promise<object>} Updated task
   */
  const updateTaskStatus = useCallback(
    async (id, status) => {
      const res = await taskApi.updateTaskStatus(id, status);
      dispatch({ type: 'UPDATE_TASK', payload: res.data });
      fetchStats();
      return res.data;
    },
    [dispatch, fetchStats]
  );

  /**
   * Delete a task by ID
   * @param {string} id
   */
  const deleteTask = useCallback(
    async (id) => {
      await taskApi.deleteTask(id);
      dispatch({ type: 'REMOVE_TASK', payload: id });
      fetchStats();
    },
    [dispatch, fetchStats]
  );

  return {
    tasks: state.tasks,
    stats: state.stats,
    pagination: state.pagination,
    filters: state.filters,
    loading: state.loading,
    statsLoading: state.statsLoading,
    error: state.error,
    fetchTasks,
    fetchStats,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
};

export default useTasks;
