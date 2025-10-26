import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App Component', () => {
  it('should render the app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /⚽ TeamPulse/i, level: 1 })).toBeInTheDocument()
  })

  it('should render status message', () => {
    render(<App />)
    expect(screen.getByText(/Status: Ready for development/i)).toBeInTheDocument()
  })

  it('should render and interact with counter button', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: /Clicks: 0/i })
    expect(button).toBeInTheDocument()

    // Click the button
    await user.click(button)

    // Check if count incremented
    expect(screen.getByRole('button', { name: /Clicks: 1/i })).toBeInTheDocument()
  })

  it('should render welcome message', () => {
    render(<App />)
    expect(screen.getByText(/Welcome to TeamPulse!/i)).toBeInTheDocument()
  })
})
