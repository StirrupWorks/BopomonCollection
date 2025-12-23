import React, { useState, useEffect } from 'react'
import './SandtroutHarness.css'

// ============================================
// AUTH CREDENTIALS (hardcoded for now)
// ============================================
const VALID_CREDENTIALS = {
  username: 'damon',
  password: 'damon_pass_123'
}

const SESSION_KEY = 'sandtrout_session'

export default function SandtroutHarness({ component: Component, initialData = null, title = 'Sandtrout App' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (session === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  // Sandtrout store registration callback
  const handleRegisterStore = (store) => {
    // Expose store globally for debugging
    if (typeof window !== 'undefined') {
      window.__sandtrout_store = store
    }

    // Hydrate from initialData if provided
    if (initialData && !isHydrated) {
      // Zustand store: use getState() to access methods
      const storeState = store.getState ? store.getState() : store
      
      Object.values(initialData).forEach(({ setter, value }) => {
        if (storeState[setter]) {
          storeState[setter](value)
        } else {
          console.warn(`SandtroutHarness: setter "${setter}" not found on store`)
        }
      })
      setIsHydrated(true)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      localStorage.setItem(SESSION_KEY, 'authenticated')
      setIsAuthenticated(true)
    } else {
      setError('Invalid credentials')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  // Single return with conditional rendering
  return (
    <div className={`sandtrout-harness ${isLoading ? 'sandtrout-harness--loading' : ''} ${!isAuthenticated && !isLoading ? 'sandtrout-harness--login' : ''}`}>
      {isLoading && (
        <div className="sandtrout-harness__spinner" />
      )}

      {!isLoading && !isAuthenticated && (
        <form className="sandtrout-harness__login-form" onSubmit={handleLogin}>
          <h1 className="sandtrout-harness__login-title">{title}</h1>
          
          {error && (
            <div className="sandtrout-harness__login-error">{error}</div>
          )}
          
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
      )}

      {!isLoading && isAuthenticated && (
        <>
          <header className="sandtrout-harness__header">
            <h1 className="sandtrout-harness__title">{title}</h1>
            <button 
              className="sandtrout-harness__logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </header>
          
          <main className="sandtrout-harness__content">
            <Component __sandtrout_register_store={handleRegisterStore} />
          </main>
        </>
      )}
    </div>
  )
}