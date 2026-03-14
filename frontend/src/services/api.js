/**
 * @module apiService
 * @description Centralized HTTP client for communicating with the Task Manager API
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

/**
 * @typedef {object} ApiResponse
 * @property {boolean} success
 * @property {*} data
 * @property {string} message
 * @property {string|null} error
 * @property {object} [pagination]
 */

/**
 * Core fetch wrapper with error normalization
 * @param {string} endpoint - URL path after base URL
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<ApiResponse>}
 */
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const config = {
    headers,
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.statusCode = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

/**
 * Build query string from params object, omitting undefined/null/empty values
 * @param {object} params
 * @returns {string} Query string (including leading '?')
 */
const buildQueryString = (params) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `?${query}` : '';
};

/**
 * Fetch all tasks with optional filters
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<ApiResponse>}
 */
const getTasks = (params = {}) => apiFetch(`/tasks${buildQueryString(params)}`);

/**
 * Fetch a task by ID
 * @param {string} id
 * @returns {Promise<ApiResponse>}
 */
const getTaskById = (id) => apiFetch(`/tasks/${id}`);

/**
 * Create a new task
 * @param {object} taskData
 * @returns {Promise<ApiResponse>}
 */
const createTask = (taskData) =>
  apiFetch('/tasks', { method: 'POST', body: JSON.stringify(taskData) });

/**
 * Update a task by ID
 * @param {string} id
 * @param {object} taskData
 * @returns {Promise<ApiResponse>}
 */
const updateTask = (id, taskData) =>
  apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) });

/**
 * Update only the status of a task
 * @param {string} id
 * @param {string} status
 * @returns {Promise<ApiResponse>}
 */
const updateTaskStatus = (id, status) =>
  apiFetch(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

/**
 * Delete a task by ID
 * @param {string} id
 * @returns {Promise<ApiResponse>}
 */
const deleteTask = (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' });

/**
 * Fetch task statistics
 * @returns {Promise<ApiResponse>}
 */
const getStats = () => apiFetch('/tasks/stats');

const register = (payload) =>
  apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });

const login = (payload) =>
  apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });

const getMe = () => apiFetch('/auth/me');

const taskApi = { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, deleteTask, getStats };
export const authApi = { register, login, getMe };

export default taskApi;
