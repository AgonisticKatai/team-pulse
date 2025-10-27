import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App Component', () => {
  it('should render the app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /⚽ TeamPulse/i, level: 1 })).toBeInTheDocument()
  })

  it('should render the subtitle', () => {
    render(<App />)
    expect(screen.getByText(/Football Team Statistics Platform/i)).toBeInTheDocument()
  })

  it('should render Teams page heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Teams/i })).toBeInTheDocument()
  })

  it('should render the footer', () => {
    render(<App />)
    expect(
      screen.getByText(/Built with React \+ TypeScript \+ Vite \+ Hexagonal Architecture/i),
    ).toBeInTheDocument()
  })

  it('should render create team button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /\+ Create Team/i })).toBeInTheDocument()
  })

  it('should wrap app with QueryClientProvider', () => {
    const { container } = render(<App />)
    // If it renders without errors, QueryClientProvider is working
    expect(container).toBeTruthy()
  })
})
