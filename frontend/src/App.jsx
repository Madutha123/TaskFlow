/**
 * @module App
 * @description Application root — sets up providers, global toasts, error boundary
 */
import React from 'react';
import { TaskProvider } from './context/TaskContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import TaskDashboard from './components/TaskDashboard/TaskDashboard';
import AuthPage from './components/Auth/AuthPage';
import ToastContainer from './components/common/Toast';
import useToast from './hooks/useToast';
import './styles/global.css';

/**
 * Inner app with access to toast hook (must be inside providers)
 */
const AppInner = () => {
  const { user, loading, authActionLoading, isAuthenticated, login, register, logout } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  return (
    <>
      <header className="app-header">
        <span className="app-header__wordmark">TaskFlow</span>
        <div className="app-header__divider" />
        <span className="app-header__tagline">TASK MANAGEMENT SYSTEM</span>

        {isAuthenticated && (
          <div className="app-header__auth">
            <span className="app-header__user">{user?.name || user?.email}</span>
            <button type="button" className="app-header__logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <main className="app-session-loading">Checking session...</main>
      ) : isAuthenticated ? (
        <TaskProvider>
          <ErrorBoundary>
            <TaskDashboard showToast={showToast} />
          </ErrorBoundary>
        </TaskProvider>
      ) : (
        <AuthPage onLogin={login} onRegister={register} loading={authActionLoading} />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

/**
 * App wraps everything in required providers
 */
const App = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
