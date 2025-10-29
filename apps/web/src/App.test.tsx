import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App Component', () => {
  it('should render login page when not authenticated', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /⚽ TeamPulse/i })).toBeInTheDocument()
  })

  it('should render sign in text on login page', () => {
    render(<App />)
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument()
  })

  it('should render email input field', () => {
    render(<App />)
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument()
  })

  it('should render password input field', () => {
    render(<App />)
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
  })

  it('should render sign in button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('should wrap app with required providers', () => {
    const { container } = render(<App />)
    // If it renders without errors, all providers are working
    expect(container).toBeTruthy()
  })
})
