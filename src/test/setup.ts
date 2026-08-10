import '@testing-library/jest-dom/vitest'

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
