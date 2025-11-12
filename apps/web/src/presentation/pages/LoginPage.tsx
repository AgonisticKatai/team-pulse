/**
 * Login Page Component
 *
 * Provides user authentication interface with:
 * - Email and password form validation
 * - Loading states during authentication
 * - Error handling and display
 * - Automatic redirect after successful login
 * - Accessible form controls
 */

import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../application/hooks/use-auth'
import './LoginPage.css'

export function LoginPage() {
  const { isAuthenticated, isLoading: authLoading, error: authError, login, clearError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({})

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    // Email validation
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email'
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearError()
    setFormErrors({})

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      await login(email, password)
      // Navigation will happen automatically via ProtectedRoute
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * If already authenticated, redirect to home
   */
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  /**
   * Show loading spinner while initializing auth
   */
  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-loading">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>⚽ TeamPulse</h1>
          <p>Sign in to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Global error message */}
          {authError && (
            <div className="alert alert-error" role="alert">
              <strong>Error:</strong> {authError}
            </div>
          )}

          {/* Email field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${formErrors.email ? 'form-input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            {formErrors.email && (
              <p className="form-error" role="alert">
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${formErrors.password ? 'form-input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
            {formErrors.password && (
              <p className="form-error" role="alert">
                {formErrors.password}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner spinner-sm" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="login-footer">
          <p className="text-muted">
            <strong>Demo:</strong> admin@teampulse.com / Admin123!
          </p>
        </div>
      </div>
    </div>
  )
}
