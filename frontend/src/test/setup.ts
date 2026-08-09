import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom no implementa scrollIntoView, y el repaso de señales lo usa para llevar
// la vista a lo que resalta.
Element.prototype.scrollIntoView = vi.fn()

// jsdom conserva DOM y localStorage entre pruebas.
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
