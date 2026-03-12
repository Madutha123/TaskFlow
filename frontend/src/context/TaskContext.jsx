/**
 * @module TaskContext
 * @description Global state management for tasks using React Context API
 */
import React, { createContext, useContext, useReducer, useCallback } from 'react';

/** @type {React.Context} */
const TaskContext = createContext(null);

const initialState = {
  tasks: [],
  stats: null,
  pagination: null,
  filters: { q: '', status: '', priority: '', sortBy: 'createdAt', order: 'desc' },
  loading: false,
  statsLoading: false,
  error: null,
};

/** @param {object} state @param {object} action */
const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_STATS_LOADING':
      return { ...state, statsLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload.tasks,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload, statsLoading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t._id === action.payload._id ? action.payload : t)),
      };
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t._id !== action.payload) };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    default:
      return state;
  }
};

/**
 * TaskProvider wraps the app and provides task state + dispatch
 * @param {{ children: React.ReactNode }} props
 */
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  return (
    <TaskContext.Provider value={{ state, dispatch, setFilters }}>
      {children}
    </TaskContext.Provider>
  );
};

/**
 * Custom hook to access TaskContext
 * @returns {{ state: object, dispatch: Function, setFilters: Function }}
 */
export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used inside TaskProvider');
  return ctx;
};
