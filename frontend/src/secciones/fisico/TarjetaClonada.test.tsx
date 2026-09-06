import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import TarjetaClonada from './TarjetaClonada'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function tocarDestello() {
  fireEvent.click(screen.getByRole('button', { name: 'Inspeccionar' }))
}

describe('TarjetaClonada', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra primero el recuerdo, sin nada que tocar', () => {
    empezar(<TarjetaClonada />)
    expect(screen.getByAltText(/Escaneo de una billetera/)).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Inspeccionar' })).toBeNull()
  })

  it('avisa que la escena avanza sola, con contexto de qué está pasando', () => {
    empezar(<TarjetaClonada />)
    expect(screen.getByText('Recordando cómo pasó…')).toBeDefined()
  })

  it('pasados unos segundos avanza solo a la alerta del banco', async () => {
    empezar(<TarjetaClonada />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(screen.getByAltText(/Llamada del banco/)).toBeDefined()
  })

  it('las opciones de la alerta no aparecen hasta tocar el destello', async () => {
    empezar(<TarjetaClonada />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(screen.queryByRole('button', { name: /Bloquear la tarjeta inmediatamente/ })).toBeNull()
    tocarDestello()
    expect(screen.getByRole('button', { name: /Bloquear la tarjeta inmediatamente/ })).toBeDefined()
  })

  it('bloquear y denunciar es seguro', async () => {
    empezar(<TarjetaClonada />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    tocarDestello()
    fireEvent.click(screen.getByRole('button',{name:/Bloquear la tarjeta inmediatamente/}))
    expect(screen.getByText('Tarjeta protegida')).toBeDefined()
  })

  it('ignorar es riesgoso', async () => {
    empezar(<TarjetaClonada />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    tocarDestello()
    fireEvent.click(screen.getByRole('button',{name:/Ignorar la notificación/}))
    expect(screen.getByText('Riesgo detectado')).toBeDefined()
  })
})
