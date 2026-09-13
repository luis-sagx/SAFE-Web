import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CompromisedCable from './CableComprometido'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function triggerFlash() {
  fireEvent.click(screen.getByRole('button', { name: 'Inspeccionar' }))
}

describe('CableComprometido', () => {
  it('abre la estación de carga sin mostrar opciones hasta tocar el destello', () => {
    start(<CompromisedCable />)
    expect(screen.getByAltText(/carga pública/)).toBeDefined()
    expect(screen.queryByRole('button', { name: /tomacorriente/ })).toBeNull()
  })

  it('conectar el cable directo al puerto público es el riesgo', async () => {
    start(<CompromisedCable />)
    triggerFlash()
    fireEvent.click(screen.getByRole('button', { name: /Conectar tu cable directo/ }))
    expect(await screen.findByText('Riesgo detectado')).toBeDefined()
  })

  it('buscar un tomacorriente para el propio cargador es seguro', async () => {
    start(<CompromisedCable />)
    triggerFlash()
    fireEvent.click(screen.getByRole('button', { name: /Buscar un tomacorriente/ }))
    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('cargar primero una batería portátil también es seguro', async () => {
    start(<CompromisedCable />)
    triggerFlash()
    fireEvent.click(screen.getByRole('button', { name: /Conectar primero tu batería portátil/ }))
    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('aguantar sin cargar evita el riesgo pero queda como respuesta incompleta', async () => {
    start(<CompromisedCable />)
    triggerFlash()
    fireEvent.click(screen.getByRole('button', { name: /Aguantar sin cargar/ }))
    expect(await screen.findByText('Respuesta incompleta')).toBeDefined()
  })
})
