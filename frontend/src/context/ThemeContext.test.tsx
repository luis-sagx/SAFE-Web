import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'

/** Doble de matchMedia: jsdom no lo implementa. `cambiar` dispara el
 *  listener de "change" como haría el sistema operativo real al alternar de
 *  tema con la pestaña abierta. */
function mockMatchMedia(prefiereOscuro: boolean) {
  let listeners: Array<() => void> = []
  const mql = {
    matches: prefiereOscuro,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_evento: string, cb: () => void) => listeners.push(cb),
    // Tiene que quitar de verdad: si no, el listener de un render anterior
    // (por ejemplo cuando la preferencia deja de ser "sistema") sigue vivo y
    // el test "no la mueve" fallaría por una fuga del doble, no de la app.
    removeEventListener: (_evento: string, cb: () => void) => {
      listeners = listeners.filter((l) => l !== cb)
    },
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  )
  return {
    cambiar(nuevo: boolean) {
      mql.matches = nuevo
      listeners.forEach((cb) => cb())
    },
  }
}

function Consumidor() {
  const { preferencia, temaEfectivo, setPreferencia } = useTheme()
  return (
    <div>
      <span data-testid="preferencia">{preferencia}</span>
      <span data-testid="efectivo">{temaEfectivo}</span>
      <button onClick={() => setPreferencia('claro')}>claro</button>
      <button onClick={() => setPreferencia('oscuro')}>oscuro</button>
      <button onClick={() => setPreferencia('sistema')}>sistema</button>
    </div>
  )
}

function renderConProvider() {
  return render(
    <ThemeProvider>
      <Consumidor />
    </ThemeProvider>,
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    mockMatchMedia(false)
    document.documentElement.removeAttribute('data-tema')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sin localStorage previo, arranca en "sistema" resuelto contra el SO', () => {
    renderConProvider()

    expect(screen.getByTestId('preferencia').textContent).toBe('sistema')
    expect(screen.getByTestId('efectivo').textContent).toBe('claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
  })

  it('arranca en oscuro si el SO lo prefiere y la preferencia es "sistema"', () => {
    mockMatchMedia(true)
    renderConProvider()

    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
  })

  it('lee la preferencia guardada en localStorage', () => {
    localStorage.setItem('tema', 'oscuro')
    renderConProvider()

    expect(screen.getByTestId('preferencia').textContent).toBe('oscuro')
    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
  })

  // Un valor corrupto o de una versión vieja no debe romper el arranque: cae
  // al comportamiento por defecto en vez de propagar algo inválido.
  it('un valor inválido en localStorage cae a "sistema"', () => {
    localStorage.setItem('tema', 'sepia')
    renderConProvider()

    expect(screen.getByTestId('preferencia').textContent).toBe('sistema')
  })

  it('elegir "oscuro" actualiza preferencia, efectivo, data-tema y localStorage', () => {
    renderConProvider()

    fireEvent.click(screen.getByRole('button', { name: 'oscuro' }))

    expect(screen.getByTestId('preferencia').textContent).toBe('oscuro')
    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
    expect(localStorage.getItem('tema')).toBe('oscuro')
  })

  it('elegir "claro" fija el tema efectivo aunque el SO prefiera oscuro', () => {
    mockMatchMedia(true)
    renderConProvider()

    fireEvent.click(screen.getByRole('button', { name: 'claro' }))

    expect(screen.getByTestId('efectivo').textContent).toBe('claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
  })

  // Con la preferencia en "sistema", si la persona cambia el tema del SO con
  // la pestaña abierta, la página tiene que seguirlo sin recargar.
  it('en "sistema", sigue en vivo el cambio de tema del sistema operativo', () => {
    const medios = mockMatchMedia(false)
    renderConProvider()

    expect(screen.getByTestId('efectivo').textContent).toBe('claro')

    act(() => medios.cambiar(true))

    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
  })

  // Fijada explícitamente en claro/oscuro, un cambio del SO no debe moverla:
  // solo "sistema" escucha matchMedia.
  it('con una preferencia explícita, un cambio del SO no la mueve', () => {
    const medios = mockMatchMedia(false)
    renderConProvider()

    fireEvent.click(screen.getByRole('button', { name: 'claro' }))
    act(() => medios.cambiar(true))

    expect(screen.getByTestId('efectivo').textContent).toBe('claro')
  })

  it('volver a "sistema" retoma la preferencia del sistema operativo', () => {
    mockMatchMedia(true)
    renderConProvider()

    fireEvent.click(screen.getByRole('button', { name: 'claro' }))
    expect(screen.getByTestId('efectivo').textContent).toBe('claro')

    fireEvent.click(screen.getByRole('button', { name: 'sistema' }))
    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
  })

  // Ventana privada o almacenamiento bloqueado: ni leer ni escribir debe
  // tirar la aplicación abajo.
  it('si localStorage.getItem lanza, arranca en "sistema" sin romperse', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => renderConProvider()).not.toThrow()
    expect(screen.getByTestId('preferencia').textContent).toBe('sistema')

    spy.mockRestore()
  })

  it('si localStorage.setItem lanza, el tema cambia igual solo que sin persistir', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    renderConProvider()
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'oscuro' }))).not.toThrow()

    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')

    spy.mockRestore()
  })

  // useTheme() fuera de un <ThemeProvider> no lanza (a diferencia de
  // useAuth()): cae al valor por defecto, claro/sistema.
  it('useTheme() sin ThemeProvider no lanza y devuelve el valor por defecto', () => {
    expect(() => render(<Consumidor />)).not.toThrow()
    expect(screen.getByTestId('preferencia').textContent).toBe('sistema')
    expect(screen.getByTestId('efectivo').textContent).toBe('claro')
  })
})
