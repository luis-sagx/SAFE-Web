import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Confeti from './Confeti'

function stubCanvas() {
  const ctx = {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '' as unknown,
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  return ctx
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
}

describe('Confeti', () => {
  beforeEach(() => {
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('pinta un canvas decorativo, invisible para lectores de pantalla', () => {
    stubCanvas()
    const { container } = render(<Confeti />)

    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  it('con motion reducido, no anima nada', () => {
    stubReducedMotion(true)
    const ctx = stubCanvas()
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    render(<Confeti />)

    expect(rafSpy).not.toHaveBeenCalled()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it('sin motion reducido, arranca la animación', () => {
    stubCanvas()
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    render(<Confeti />)

    expect(rafSpy).toHaveBeenCalled()
  })

  it('al desmontar, cancela la animación en curso', () => {
    stubCanvas()
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<Confeti />)

    unmount()

    expect(cancelSpy).toHaveBeenCalled()
  })

  it('sin canvas disponible en el navegador, no revienta', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    expect(() => render(<Confeti />)).not.toThrow()
  })
})
