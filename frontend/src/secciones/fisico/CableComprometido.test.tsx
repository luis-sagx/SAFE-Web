import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CableComprometido from './CableComprometido'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function tocarDestello(telefono: HTMLElement) {
  const destello = telefono.querySelector('.sceneFlash, g[class*="Flash"]')
  if (destello) fireEvent.click(destello)
}

describe('CableComprometido', () => {
  it('abre en la sala de descanso con el cable en el tomacorriente', () => {
    const telefono = empezar(<CableComprometido />)

    expect(within(telefono).getByText('Sala de descanso')).toBeDefined()
  })

  it('usar el cable en la sala de descanso es la opción de mayor riesgo, y Siguiente no rompe la navegación', async () => {
    const telefono = empezar(<CableComprometido />)
    tocarDestello(telefono)

    const usarBtn = within(telefono).getByRole('button', { name: /Usarlo para cargar/ })
    fireEvent.click(usarBtn)

    expect(await screen.findByText('Riesgo detectado')).toBeDefined()
    fireEvent.click(within(telefono).getByRole('button', { name: 'Siguiente' }))
  })

  it('llevarse el cable al escritorio pasa a la segunda fase, no termina la corrida', async () => {
    const telefono = empezar(<CableComprometido />)
    tocarDestello(telefono)

    const llevarBtn = within(telefono).getByRole('button', { name: /Llevártelo/ })
    fireEvent.click(llevarBtn)

    expect(await within(telefono).findByText('Tu escritorio')).toBeDefined()
  })

  it('entregar el cable a IT desde el escritorio es la decisión segura', async () => {
    const telefono = empezar(<CableComprometido />)
    tocarDestello(telefono)

    fireEvent.click(within(telefono).getByRole('button', { name: /Llevártelo/ }))
    await within(telefono).findByText('Tu escritorio')
    tocarDestello(telefono)

    const itBtn = within(telefono).getByRole('button', { name: /Entregarlo a IT/ })
    fireEvent.click(itBtn)

    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })
})
