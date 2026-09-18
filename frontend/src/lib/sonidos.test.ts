import { afterEach, describe, expect, it, vi } from 'vitest'
import { reproducirModuloCompleto, reproducirResultado, reproducirSenal } from './sonidos'

// Doble mínimo de HTMLAudioElement: solo lo que reproducirResultado usa.
// Cada instancia creada queda registrada para poder revisar con qué url se
// construyó y si se le pidió reproducir.
function mockAudio() {
  const instancias: Array<{ url: string; played: boolean }> = []

  class FakeAudio {
    url: string
    play: () => Promise<void>
    constructor(url: string) {
      this.url = url
      const registro = { url, played: false }
      instancias.push(registro)
      this.play = vi.fn(() => {
        registro.played = true
        return Promise.resolve()
      })
    }
  }

  vi.stubGlobal('Audio', FakeAudio)
  return { instancias }
}

describe('reproducirResultado', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sin Audio disponible, no lanza', () => {
    vi.stubGlobal('Audio', undefined)

    expect(() => reproducirResultado('good')).not.toThrow()
  })

  it('"good" reproduce un archivo', () => {
    const { instancias } = mockAudio()

    reproducirResultado('good')

    expect(instancias).toHaveLength(1)
    expect(instancias[0]!.played).toBe(true)
    expect(instancias[0]!.url).toMatch(/\.\w+$/)
  })

  it('"good", "bad" y "partial" reproducen archivos distintos entre sí', () => {
    const good = mockAudio()
    reproducirResultado('good')
    vi.unstubAllGlobals()

    const bad = mockAudio()
    reproducirResultado('bad')
    vi.unstubAllGlobals()

    const partial = mockAudio()
    reproducirResultado('partial')

    const urls = [good.instancias[0]!.url, bad.instancias[0]!.url, partial.instancias[0]!.url]
    expect(new Set(urls).size).toBe(3)
  })

  it('si play() rechaza (autoplay bloqueado por el navegador), no rompe el escenario', () => {
    class RejectingAudio {
      play() {
        return Promise.reject(new Error('bloqueado'))
      }
    }
    vi.stubGlobal('Audio', RejectingAudio)

    expect(() => reproducirResultado('bad')).not.toThrow()
  })

  it('si el propio constructor de Audio lanza, no rompe el escenario', () => {
    class ThrowingAudio {
      constructor() {
        throw new Error('sin audio')
      }
    }
    vi.stubGlobal('Audio', ThrowingAudio)

    expect(() => reproducirResultado('bad')).not.toThrow()
  })
})

describe('reproducirSenal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reproduce el archivo de señal', () => {
    const { instancias } = mockAudio()

    reproducirSenal()

    expect(instancias).toHaveLength(1)
    expect(instancias[0]!.played).toBe(true)
  })

  it('sin Audio disponible, no lanza', () => {
    vi.stubGlobal('Audio', undefined)

    expect(() => reproducirSenal()).not.toThrow()
  })
})

describe('reproducirModuloCompleto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reproduce el archivo de módulo completo', () => {
    const { instancias } = mockAudio()

    reproducirModuloCompleto()

    expect(instancias).toHaveLength(1)
    expect(instancias[0]!.played).toBe(true)
  })

  it('sin Audio disponible, no lanza', () => {
    vi.stubGlobal('Audio', undefined)

    expect(() => reproducirModuloCompleto()).not.toThrow()
  })

  it('toca un archivo distinto al de señal y al de los veredictos', () => {
    const senal = mockAudio()
    reproducirSenal()
    vi.unstubAllGlobals()

    const bueno = mockAudio()
    reproducirResultado('good')
    vi.unstubAllGlobals()

    const modulo = mockAudio()
    reproducirModuloCompleto()

    const urls = [senal.instancias[0]!.url, bueno.instancias[0]!.url, modulo.instancias[0]!.url]
    expect(new Set(urls).size).toBe(3)
  })
})
