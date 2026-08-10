import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { HomePage } from '@/routes/HomePage'
import '@/lib/i18n'

function renderHomePage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter>
        <HomePage />
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  it('renders the app title', () => {
    renderHomePage()
    expect(screen.getByText('Vincel')).toBeInTheDocument()
  })
})
