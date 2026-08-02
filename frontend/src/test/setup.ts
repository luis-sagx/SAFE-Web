import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom conserva DOM y localStorage entre pruebas.
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
