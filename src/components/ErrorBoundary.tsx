import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from '@/components/ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Top-level safety net for errors thrown OUTSIDE the router tree (e.g. a
 * provider misconfiguration). Errors thrown by route elements are caught
 * first by React Router's own per-route error boundary — see
 * RouteErrorBoundary.tsx / routes/index.tsx's errorElement — this one is
 * the fallback of last resort.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback onReload={this.handleReload} />
    }

    return this.props.children
  }
}
