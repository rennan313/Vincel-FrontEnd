import { Button } from '@/components/ui/Button'

interface ErrorFallbackProps {
  onReload: () => void
}

export function ErrorFallback({ onReload }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--th-bg) p-8 text-center">
      <h1 className="text-xl font-semibold text-(--th-text)">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-(--th-text-muted)">
        Ocorreu um erro inesperado nesta tela. Tente recarregar a página — se
        o problema continuar, avise o time.
      </p>
      <Button type="button" variant="primary" onClick={onReload}>
        Recarregar página
      </Button>
    </div>
  )
}
