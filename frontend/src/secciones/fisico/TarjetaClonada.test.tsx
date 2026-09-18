import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ClonedCard from './TarjetaClonada'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('TarjetaClonada', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra primero el recuerdo, sin nada que tocar', () => {
    start(<ClonedCard />)
    expect(screen.getByAltText(/Escaneo de una billetera/)).toBeDefined()
    expect(screen.queryByRole('button', { name: /Bloquear la tarjeta inmediatamente/ })).toBeNull()
  })

  it('avisa que la escena avanza sola, con contexto de qué está pasando', () => {
    start(<ClonedCard />)
    expect(screen.getByText('Recordando cómo pasó…')).toBeDefined()
  })

  it('pasados unos segundos avanza solo a la alerta del banco', async () => {
    start(<ClonedCard />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(screen.getByAltText(/Llamada del banco/)).toBeDefined()
  })

  it('al llegar la alerta las opciones ya están a la vista', async () => {
    start(<ClonedCard />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    expect(screen.getByRole('button', { name: /Bloquear la tarjeta inmediatamente/ })).toBeDefined()
  })

  it('bloquear y denunciar es seguro', async () => {
    start(<ClonedCard />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    fireEvent.click(screen.getByRole('button',{name:/Bloquear la tarjeta inmediatamente/}))
    expect(screen.getByText('Tarjeta protegida')).toBeDefined()
  })

  it('ignorar es riesgoso', async () => {
    start(<ClonedCard />)
    for (let i = 0; i < 45; i += 1) {
      await vi.advanceTimersByTimeAsync(100)
    }
    fireEvent.click(screen.getByRole('button',{name:/Ignorar la notificación/}))
    expect(screen.getByText('Riesgo detectado')).toBeDefined()
  })
})
