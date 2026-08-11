import { useRouteError } from 'react-router'
import { ErrorFallback } from '@/components/ErrorFallback'

/**
 * React Router's data router (createBrowserRouter/RouterProvider) has its
 * own internal error boundary per route and intercepts render errors
 * BEFORE they'd reach a plain React error boundary wrapping <RouterProvider>
 * — without an errorElement, it falls back to the router's own unstyled
 * default error page. This wires the same visual fallback as
 * ErrorBoundary.tsx into that mechanism.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()
  console.error('[RouteErrorBoundary] Uncaught route error:', error)

  return <ErrorFallback onReload={() => window.location.reload()} />
}
