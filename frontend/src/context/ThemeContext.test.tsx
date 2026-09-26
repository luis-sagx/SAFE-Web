import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeContext'

function Consumer() {
  const { preferencia: preference, temaEfectivo: themeEffective, setPreferencia: setPreference } = useTheme()
  return (
    <div>
      <span data-testid="preferencia">{preference}</span>
      <span data-testid="efectivo">{themeEffective}</span>
      <button onClick={() => setPreference('claro')}>claro</button>
      <button onClick={() => setPreference('oscuro')}>oscuro</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>,
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-tema')
  })

  it('sin localStorage previo, arranca en claro', () => {
    renderWithProvider()

    expect(screen.getByTestId('preferencia').textContent).toBe('claro')
    expect(screen.getByTestId('efectivo').textContent).toBe('claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
  })

  it('lee la preferencia guardada en localStorage', () => {
    localStorage.setItem('tema', 'oscuro')
    renderWithProvider()

    expect(screen.getByTestId('preferencia').textContent).toBe('oscuro')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
  })

  // "sistema" lo guardaba la versión anterior; un valor corrupto tampoco
  // debe romper el arranque. Ambos cuentan como "no eligió": claro.
  it.each(['sistema', 'sepia'])('un "%s" guardado arranca en claro', (saved) => {
    localStorage.setItem('tema', saved)
    renderWithProvider()

    expect(screen.getByTestId('preferencia').textContent).toBe('claro')
  })

  it('elegir "oscuro" actualiza preferencia, data-tema y localStorage', () => {
    renderWithProvider()

    fireEvent.click(screen.getByRole('button', { name: 'oscuro' }))

    expect(screen.getByTestId('preferencia').textContent).toBe('oscuro')
    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
    expect(document.documentElement.dataset.tema).toBe('oscuro')
    expect(localStorage.getItem('tema')).toBe('oscuro')
  })

  it('volver a "claro" lo guarda y lo aplica', () => {
    localStorage.setItem('tema', 'oscuro')
    renderWithProvider()

    fireEvent.click(screen.getByRole('button', { name: 'claro' }))

    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(localStorage.getItem('tema')).toBe('claro')
  })

  // Ventana privada o almacenamiento bloqueado: ni leer ni escribir debe
  // tirar la aplicación abajo.
  it('si localStorage.getItem lanza, arranca en claro sin romperse', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => renderWithProvider()).not.toThrow()
    expect(screen.getByTestId('preferencia').textContent).toBe('claro')
  })

  it('si localStorage.setItem lanza, el tema cambia igual solo que sin persistir', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    renderWithProvider()
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'oscuro' }))).not.toThrow()

    expect(screen.getByTestId('efectivo').textContent).toBe('oscuro')
  })

  // useTheme() fuera de un <ThemeProvider> no lanza (a diferencia de
  // useAuth()): cae al valor por defecto, claro.
  it('useTheme() sin ThemeProvider no lanza y devuelve claro', () => {
    expect(() => render(<Consumer />)).not.toThrow()
    expect(screen.getByTestId('preferencia').textContent).toBe('claro')
  })
})
