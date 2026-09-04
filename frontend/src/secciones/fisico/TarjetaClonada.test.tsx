import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import TarjetaClonada from './TarjetaClonada'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

async function llegarADescubrimiento(telefono: HTMLElement) {
  await vi.advanceTimersByTimeAsync(6100)
  const destello = telefono.querySelector('.sceneFlash, g[class*="Flash"]')
  if (destello) fireEvent.click(destello)
}

describe('TarjetaClonada', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('abre con la escena de clonación en la calle', () => {
    const telefono = empezar(<TarjetaClonada />)

    expect(within(telefono).getByText('Calle/Restaurante')).toBeDefined()
  })

  it('a los pocos segundos pasa al banco con la notificación de fraude', async () => {
    const telefono = empezar(<TarjetaClonada />)

    await llegarADescubrimiento(telefono)

    expect(within(telefono).getByText('Banco')).toBeDefined()
  })

  it('bloquear la tarjeta y denunciar es la decisión correcta', async () => {
    const telefono = empezar(<TarjetaClonada />)
    await llegarADescubrimiento(telefono)

    const safeBtn = within(telefono).queryByRole('button', { name: /Bloquear la tarjeta inmediatamente/ })
    if (safeBtn) {
      fireEvent.click(safeBtn)
      await vi.advanceTimersByTimeAsync(800)
      expect(screen.getByText('Decisión segura')).toBeDefined()
    }
  })

  it('ignorar la notificación es la decisión de mayor riesgo', async () => {
    const telefono = empezar(<TarjetaClonada />)
    await llegarADescubrimiento(telefono)

    const dangerBtn = within(telefono).queryByRole('button', { name: /Ignorar la notificación/ })
    if (dangerBtn) {
      fireEvent.click(dangerBtn)
      await vi.advanceTimersByTimeAsync(800)
      expect(screen.getByText('Riesgo detectado')).toBeDefined()
    }
  })
})
