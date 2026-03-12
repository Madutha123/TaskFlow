/**
 * @module useToast
 * @description Custom hook for managing toast notifications
 */
import { useState, useCallback } from 'react';

let toastIdCounter = 0;

/**
 * useToast — manages toast notification queue
 * @returns {{ toasts: Array, showToast: Function, removeToast: Function }}
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {'success'|'error'|'info'|'warning'} [type='info'] - Toast type
   * @param {number} [duration=3500] - Auto-dismiss duration in ms
   */
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  /**
   * Manually remove a toast
   * @param {number} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

export default useToast;
