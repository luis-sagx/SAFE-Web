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

// Captura el callback que Confeti le pasa a requestAnimationFrame para poder
// invocarlo a mano: sin esto, el test solo prueba que se agenda un cuadro,
// nunca lo que ese cuadro dibuja.
function capturarCuadros() {
  const callbacks: FrameRequestCallback[] = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    callbacks.push(cb)
    return callbacks.length
  })
  return callbacks
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

  it('con los tokens de color del tema disponibles, los usa en vez del respaldo', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => (prop === '--color-primary' ? '#123456' : ''),
    } as CSSStyleDeclaration)
    const ctx = stubCanvas()
    const callbacks = capturarCuadros()
    render(<Confeti piezas={1} />)

    callbacks[0]!(0)

    expect(ctx.fillStyle).toBe('#123456')
  })

  it('sin canvas disponible en el navegador, no revienta', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    expect(() => render(<Confeti />)).not.toThrow()
  })

  it('en cada cuadro dentro de la duración, dibuja las piezas y agenda el siguiente cuadro', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const ctx = stubCanvas()
    const callbacks = capturarCuadros()
    render(<Confeti piezas={3} duracionMs={2000} />)

    callbacks[0]!(500)

    expect(ctx.clearRect).toHaveBeenCalled()
    expect(ctx.save).toHaveBeenCalledTimes(3)
    expect(ctx.fillRect).toHaveBeenCalledTimes(3)
    expect(ctx.restore).toHaveBeenCalledTimes(3)
    expect(callbacks.length).toBe(2)
  })

  it('al pasar la duración, deja de dibujar y no agenda más cuadros', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const ctx = stubCanvas()
    const callbacks = capturarCuadros()
    render(<Confeti piezas={3} duracionMs={2000} />)

    callbacks[0]!(5000)

    expect(ctx.clearRect).toHaveBeenCalled()
    expect(ctx.fillRect).not.toHaveBeenCalled()
    expect(callbacks.length).toBe(1)
  })
})
