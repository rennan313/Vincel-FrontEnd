import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

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
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--th-bg) p-8 text-center">
          <h1 className="text-xl font-semibold text-(--th-text)">
            Algo deu errado
          </h1>
          <p className="max-w-sm text-sm text-(--th-text-muted)">
            Ocorreu um erro inesperado nesta tela. Tente recarregar a página —
            se o problema continuar, avise o time.
          </p>
          <Button type="button" variant="primary" onClick={this.handleReload}>
            Recarregar página
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
