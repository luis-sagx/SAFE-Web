import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ScratchTicket from './BoletoRaspable'

function renderTicket(props: { onRevelar?: () => void } = {}) {
  return render(
    <ScratchTicket pista={<span>$1.200</span>} accion="Revelar las señales" {...props}>
      <p>La dirección no es del Estado</p>
    </ScratchTicket>,
  )
}

// jsdom no implementa getContext('2d'): sin este doble, el componente sale por
// su guarda de "navegador sin canvas" y el raspado nunca llega a ejecutarse.
// `alpha` decide qué lee getImageData, 0 es foil borrado, 255 es foil intacto.
function stubCanvas(alpha: number) {
  const ctx = {
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4 * 256).fill(alpha) })),
    globalCompositeOperation: '',
    fillStyle: '' as unknown,
    lineWidth: 0,
    lineCap: '' as CanvasLineCap,
    lineJoin: '' as CanvasLineJoin,
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  // El tamaño lo da el layout, y jsdom mide todo en cero.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 400,
    height: 300,
    top: 0,
    left: 0,
    right: 400,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  return ctx
}

function scratchAcross(canvas: HTMLCanvasElement) {
  canvas.setPointerCapture = vi.fn()
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 })
  fireEvent.pointerMove(canvas, { clientX: 200, clientY: 150, pointerId: 1 })
}

describe('BoletoRaspable', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mantiene lo tapado dentro del documento: el foil solo cubre a la vista', () => {
    const { container } = renderTicket()

    expect(screen.getByText('La dirección no es del Estado')).toBeDefined()
    // El atributo va en la envoltura, no en el <canvas>: el canvas recibe el
    // puntero y aria-hidden no puede ir sobre un elemento interactivo.
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('aria-hidden')).toBeNull()
    expect(canvas?.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('el botón revela sin raspar, para teclado y motricidad reducida', () => {
    const onReveal = vi.fn()
    const { container } = renderTicket({ onRevelar: onReveal })

    fireEvent.click(screen.getByRole('button', { name: 'Revelar las señales' }))

    expect(onReveal).toHaveBeenCalledOnce()
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Revelar las señales' })).toBeNull()
    expect(screen.getByText('La dirección no es del Estado')).toBeDefined()
  })

  it('pinta la lámina al montar, con su degradado y su grano', () => {
    const ctx = stubCanvas(255)
    renderTicket()

    expect(ctx.createLinearGradient).toHaveBeenCalled()
    // Un relleno para la lámina y una mota por cada punto del grano.
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(100)
  })

  it('raspar lo suficiente revela las señales sin tocar el botón', () => {
    const onReveal = vi.fn()
    stubCanvas(0)
    const { container } = renderTicket({ onRevelar: onReveal })

    scratchAcross(container.querySelector('canvas')!)

    expect(onReveal).toHaveBeenCalledOnce()
    expect(container.querySelector('canvas')).toBeNull()
  })

  it('un roce que no llega al umbral deja el foil puesto', () => {
    const ctx = stubCanvas(255)
    const { container } = renderTicket()

    scratchAcross(container.querySelector('canvas')!)

    expect(ctx.stroke).toHaveBeenCalled()
    expect(container.querySelector('canvas')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Revelar las señales' })).toBeDefined()
  })

  it('repinta la lámina cuando la persona cambia de tema', () => {
    const ctx = stubCanvas(255)
    renderTicket()
    const painted = ctx.createLinearGradient.mock.calls.length

    document.documentElement.setAttribute('data-tema', 'oscuro')

    return vi.waitFor(() => {
      expect(ctx.createLinearGradient.mock.calls.length).toBeGreaterThan(painted)
      document.documentElement.removeAttribute('data-tema')
    })
  })
  it('soltar o salirse del boleto corta el trazo en curso', () => {
    const ctx = stubCanvas(255)
    const { container } = renderTicket()
    const canvas = container.querySelector('canvas')!

    scratchAcross(canvas)
    fireEvent.pointerUp(canvas, { pointerId: 1 })
    const strokes = ctx.stroke.mock.calls.length

    // Sin volver a pulsar, mover el puntero ya no raspa.
    fireEvent.pointerMove(canvas, { clientX: 300, clientY: 200, pointerId: 1 })
    expect(ctx.stroke.mock.calls.length).toBe(strokes)

    scratchAcross(canvas)
    fireEvent.pointerLeave(canvas)
    const afterLeave = ctx.stroke.mock.calls.length
    fireEvent.pointerMove(canvas, { clientX: 320, clientY: 210, pointerId: 1 })
    expect(ctx.stroke.mock.calls.length).toBe(afterLeave)
  })

  it('repinta la lámina cuando el boleto cambia de tamaño', async () => {
    class FakeResizeObserver {
      constructor(private readonly cb: () => void) {
        FakeResizeObserver.last = this
      }
      static last: FakeResizeObserver | null = null
      observe = vi.fn()
      disconnect = vi.fn()
      trigger() {
        this.cb()
      }
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const ctx = stubCanvas(255)
    renderTicket()
    const painted = ctx.createLinearGradient.mock.calls.length

    FakeResizeObserver.last?.trigger()

    expect(ctx.createLinearGradient.mock.calls.length).toBeGreaterThan(painted)
    vi.unstubAllGlobals()
  })
})
