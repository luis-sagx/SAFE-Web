import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CompromisedCable from './CableComprometido'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('CableComprometido', () => {
  it('abre la estación de carga con las opciones a la vista', () => {
    start(<CompromisedCable />)
    expect(screen.getByAltText(/carga pública/)).toBeDefined()
    expect(screen.getByRole('button', { name: /tomacorriente/ })).toBeDefined()
  })

  it('conectar el cable directo al puerto público es el riesgo', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /Conectar tu cable directo/ }))
    expect(await screen.findByText('Riesgo detectado')).toBeDefined()
  })

  it('buscar un tomacorriente para el propio cargador es seguro', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /Buscar un tomacorriente/ }))
    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('cargar primero una batería portátil también es seguro', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /Conectar primero tu batería portátil/ }))
    expect(await screen.findByText('Decisión segura')).toBeDefined()
  })

  it('aguantar sin cargar evita el riesgo pero queda como respuesta incompleta', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /Aguantar sin cargar/ }))
    expect(await screen.findByText('Respuesta incompleta')).toBeDefined()
  })
})
