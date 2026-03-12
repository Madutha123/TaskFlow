/**
 * @module ErrorBoundary
 * @description React error boundary to catch unexpected render errors
 */
import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <span className="error-boundary__code">ERROR</span>
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__detail">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button className="error-boundary__btn" onClick={this.handleReset}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
