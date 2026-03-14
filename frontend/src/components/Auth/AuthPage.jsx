/**
 * @module AuthPage
 * @description Combined login and registration screen
 */
import React, { useMemo, useState } from 'react';
import './AuthPage.css';

const LOGIN_DEFAULT = { email: '', password: '' };
const REGISTER_DEFAULT = { name: '', email: '', password: '' };

const AuthPage = ({ onLogin, onRegister, loading }) => {
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState(LOGIN_DEFAULT);
  const [registerData, setRegisterData] = useState(REGISTER_DEFAULT);
  const [error, setError] = useState('');

  const activeData = useMemo(
    () => (mode === 'login' ? loginData : registerData),
    [mode, loginData, registerData]
  );

  const setField = (field, value) => {
    setError('');
    if (mode === 'login') {
      setLoginData((prev) => ({ ...prev, [field]: value }));
      return;
    }
    setRegisterData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (mode === 'register' && (!registerData.name || registerData.name.trim().length < 2)) {
      return 'Name must be at least 2 characters';
    }

    const emailToCheck = activeData.email || '';
    if (!/^\S+@\S+\.\S+$/.test(emailToCheck)) {
      return 'Please enter a valid email address';
    }

    const passwordToCheck = activeData.password || '';
    if (passwordToCheck.length < 6) {
      return 'Password must be at least 6 characters';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (mode === 'login') {
        await onLogin({
          email: loginData.email.trim().toLowerCase(),
          password: loginData.password,
        });
      } else {
        await onRegister({
          name: registerData.name.trim(),
          email: registerData.email.trim().toLowerCase(),
          password: registerData.password,
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-card__eyebrow">SECURE ACCESS</p>
        <h1 className="auth-card__title">TaskFlow Login</h1>
        <p className="auth-card__subtitle">
          {mode === 'login'
            ? 'Welcome back. Sign in to access your personal task workspace.'
            : 'Create an account to start managing tasks with your private board.'}
        </p>

        <div className="auth-card__tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <label className="auth-form__field" htmlFor="name">
              <span>NAME</span>
              <input
                id="name"
                type="text"
                value={registerData.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-form__field" htmlFor="email">
            <span>EMAIL</span>
            <input
              id="email"
              type="email"
              value={activeData.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="auth-form__field" htmlFor="password">
            <span>PASSWORD</span>
            <input
              id="password"
              type="password"
              value={activeData.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="auth-form__error">{error}</p>}

          <button type="submit" className="auth-form__submit" disabled={loading}>
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default AuthPage;
