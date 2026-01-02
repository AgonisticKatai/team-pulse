import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorPage />}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // TODO: Send to error reporting service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="max-w-md text-center">
            <h1 className="mb-4 font-bold text-4xl">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer font-medium text-sm">Error Details (Dev Only)</summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
