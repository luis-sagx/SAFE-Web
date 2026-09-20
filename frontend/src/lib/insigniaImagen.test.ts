import { afterEach, describe, expect, it, vi } from 'vitest'
import { svgAPng } from './insigniaImagen'

// jsdom no carga imágenes de verdad: `Image.onload` nunca dispara solo. Este
// doble lo dispara apenas se asigna `src`, como si la carga fuera instantánea.
class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private currentSrc = ''
  get src() {
    return this.currentSrc
  }
  set src(value: string) {
    this.currentSrc = value
    queueMicrotask(() => this.onload?.())
  }
}

function stubBrowserApis() {
  vi.stubGlobal('Image', FakeImage)
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:fake-url'),
    revokeObjectURL: vi.fn(),
  })

  const ctx = { drawImage: vi.fn() }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
  ) {
    callback(new Blob(['fake-png'], { type: 'image/png' }))
  })

  return ctx
}

function fakeSvg(): SVGSVGElement {
  return document.createElementNS('http://www.w3.org/2000/svg', 'svg')
}

describe('svgAPng', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('convierte el SVG a un blob PNG del tamaño pedido', async () => {
    const ctx = stubBrowserApis()

    const blob = await svgAPng(fakeSvg(), 320, 360)

    expect(blob.type).toBe('image/png')
    expect(ctx.drawImage).toHaveBeenCalledTimes(1)
    expect(ctx.drawImage.mock.calls[0]?.slice(1)).toEqual([0, 0, 320, 360])
  })

  it('libera el object URL del SVG intermedio tras dibujarlo', async () => {
    stubBrowserApis()
    const revoke = URL.revokeObjectURL as ReturnType<typeof vi.fn>

    await svgAPng(fakeSvg(), 320, 360)

    expect(revoke).toHaveBeenCalledWith('blob:fake-url')
  })

  it('sin contexto de canvas disponible, rechaza en vez de colgarse', async () => {
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake-url'), revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    await expect(svgAPng(fakeSvg(), 320, 360)).rejects.toThrow()
  })
})
