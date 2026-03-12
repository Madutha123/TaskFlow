/**
 * @module App
 * @description Application root — sets up providers, global toasts, error boundary
 */
import React from 'react';
import { TaskProvider } from './context/TaskContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import TaskDashboard from './components/TaskDashboard/TaskDashboard';
import ToastContainer from './components/common/Toast';
import useToast from './hooks/useToast';
import './styles/global.css';

/**
 * Inner app with access to toast hook (must be inside providers)
 */
const AppInner = () => {
  const { toasts, showToast, removeToast } = useToast();

  return (
    <>
      <header className="app-header">
        <span className="app-header__wordmark">TaskFlow</span>
        <div className="app-header__divider" />
        <span className="app-header__tagline">TASK MANAGEMENT SYSTEM</span>
      </header>

      <ErrorBoundary>
        <TaskDashboard showToast={showToast} />
      </ErrorBoundary>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

/**
 * App wraps everything in required providers
 */
const App = () => (
  <TaskProvider>
    <AppInner />
  </TaskProvider>
);

export default App;
