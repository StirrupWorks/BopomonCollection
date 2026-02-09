import React, { useState, useEffect } from 'react';

// ============================================
// AUTH CREDENTIALS (hardcoded for now)
// ============================================
const VALID_CREDENTIALS = {
  username: 'damon',
  password: 'damon_pass_123'
};

const SESSION_KEY = 'sandtrout_session';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, logout };
}

export default function SandtroutHarness({ children, title = 'Bopomon Minigames' }) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      localStorage.setItem(SESSION_KEY, 'authenticated');
      window.location.reload();
    } else {
      setError('Invalid credentials');
    }
  };

  if (isLoading) {
    return (
      <div className="sandtrout-harness sandtrout-harness--loading">
        <div className="sandtrout-harness__spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="sandtrout-harness sandtrout-harness--login">
        <form className="sandtrout-harness__login-form" onSubmit={handleLogin}>
          <h1 className="sandtrout-harness__login-title">{title}</h1>
          {error && <div className="sandtrout-harness__login-error">{error}</div>}
          <div className="sandtrout-harness__login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="sandtrout-harness__login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="sandtrout-harness__login-button">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return children;
}
