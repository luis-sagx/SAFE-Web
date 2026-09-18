import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SoundProvider, useSound } from './SoundContext'

function Consumer() {
  const { activado: enabled, setActivado: setEnabled } = useSound()
  return (
    <div>
      <span data-testid="activado">{String(enabled)}</span>
      <button onClick={() => setEnabled(true)}>activar</button>
      <button onClick={() => setEnabled(false)}>desactivar</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <SoundProvider>
      <Consumer />
    </SoundProvider>,
  )
}

describe('SoundContext', () => {
  it('sin localStorage previo, arranca activado', () => {
    renderWithProvider()

    expect(screen.getByTestId('activado').textContent).toBe('true')
  })

  it('lee la preferencia guardada en localStorage', () => {
    localStorage.setItem('sonido', 'desactivado')
    renderWithProvider()

    expect(screen.getByTestId('activado').textContent).toBe('false')
  })

  // Un valor viejo o corrupto no debe romper el arranque: cae al default (activado).
  it('un valor inválido en localStorage cae a activado', () => {
    localStorage.setItem('sonido', 'algo-raro')
    renderWithProvider()

    expect(screen.getByTestId('activado').textContent).toBe('true')
  })

  it('desactivar actualiza el estado y localStorage', () => {
    renderWithProvider()

    fireEvent.click(screen.getByRole('button', { name: 'desactivar' }))

    expect(screen.getByTestId('activado').textContent).toBe('false')
    expect(localStorage.getItem('sonido')).toBe('desactivado')
  })

  it('volver a activar actualiza el estado y localStorage', () => {
    localStorage.setItem('sonido', 'desactivado')
    renderWithProvider()

    fireEvent.click(screen.getByRole('button', { name: 'activar' }))

    expect(screen.getByTestId('activado').textContent).toBe('true')
    expect(localStorage.getItem('sonido')).toBe('activado')
  })

  it('si localStorage.getItem lanza, arranca activado sin romperse', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => renderWithProvider()).not.toThrow()
    expect(screen.getByTestId('activado').textContent).toBe('true')

    spy.mockRestore()
  })

  it('si localStorage.setItem lanza, el estado cambia igual solo que sin persistir', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    renderWithProvider()
    expect(() =>
      act(() => fireEvent.click(screen.getByRole('button', { name: 'desactivar' }))),
    ).not.toThrow()

    expect(screen.getByTestId('activado').textContent).toBe('false')

    spy.mockRestore()
  })

  it('useSound() sin SoundProvider no lanza y devuelve el valor por defecto', () => {
    expect(() => render(<Consumer />)).not.toThrow()
    expect(screen.getByTestId('activado').textContent).toBe('true')
  })
})
