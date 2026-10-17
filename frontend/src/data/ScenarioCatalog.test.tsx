import { Suspense } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { getScenario } from './catalogo'

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())
vi.mock('../lib/api', async () => (await import('../test/escenario')).offlineApi())

describe('ScenarioCatalog', () => {
  it('carga desde el catálogo la llamada de antifraude y permite rechazarla', async () => {
    const scenario = getScenario('vishing/antifraude-banco')
    if (!scenario) throw new Error('El escenario de antifraude debe estar registrado')
    const { Component } = scenario
    const { container } = render(
      <MemoryRouter>
        <Suspense fallback={<p>Cargando escenario</p>}><Component /></Suspense>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Empezar' }, { timeout: 5_000 }))
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement
    expect(within(phone).getByText('+593 2 380 4412')).toBeDefined()
    fireEvent.click(within(phone).getByRole('button', { name: 'Rechazar la llamada' }))
    expect(screen.getByText('No entregaste nada, pero te quedaste con la duda')).toBeDefined()
  }, 10_000)
})
