import '@testing-library/jest-dom/vitest'
// jsdom não implementa um canvas 2D real (precisa do pacote nativo `canvas`,
// que não instalamos) — sem isso, o BarChart do ECharts (components/ui/
// echarts/BarChart.tsx) lança ao tentar desenhar. O mock não desenha nada de
// verdade, só evita que as chamadas de Canvas2D quebrem em teste.
import 'vitest-canvas-mock'

// jsdom doesn't implement matchMedia — polyfill the minimal shape our
// responsive layout code (DashboardLayout's breakpoint listener) needs.
window.matchMedia ??= (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

// jsdom doesn't implement ResizeObserver — polyfill the minimal shape our
// ECharts wrapper (components/ui/echarts/BarChart.tsx) needs to observe its
// container. Charts don't actually lay out in jsdom (no real canvas
// dimensions), so a no-op is enough for tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver ??= ResizeObserverStub
