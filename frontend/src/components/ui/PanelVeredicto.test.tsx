import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Toaster } from 'sonner'
import PanelVeredicto from './PanelVeredicto'

vi.mock('./AccionesFinal', () => ({
  default: () => <div>Acciones finales</div>,
}))

describe('PanelVeredicto', () => {
  it('separa el repaso de señales con un fondo propio y conserva compacto el veredicto', () => {
    render(
      <MemoryRouter>
        <PanelVeredicto
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[{ id: 's1', texto: 'La señal cambia.' }]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))

    const senales = screen.getByRole('region', { name: 'Repaso de señales' })
    expect(senales.className).toContain('bg-signal')
    expect(senales.className).toContain('border-signal')
    expect(within(senales).getAllByText('La señal cambia.')[1]!.className).toContain(
      'text-signal-body',
    )
  })

  it('muestra el intento en cola como aviso temporal y no dentro del panel', async () => {
    render(
      <MemoryRouter>
        <Toaster />
        <PanelVeredicto
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
          estadoGuardado="queued"
        />
      </MemoryRouter>,
    )

    const aviso = await screen.findByText(/quedó guardado en este equipo/i)
    expect(aviso.closest('[data-sonner-toast]')).not.toBeNull()
    expect(screen.getByText('Caíste').closest('.rounded-lg')?.contains(aviso)).toBe(false)
  })

  it('avisa sin encolar cuando el servidor rechaza definitivamente el intento', async () => {
    render(
      <MemoryRouter>
        <Toaster />
        <PanelVeredicto
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
          estadoGuardado="failed"
        />
      </MemoryRouter>,
    )

    const aviso = await screen.findByText(/no se pudo registrar este intento/i)
    expect(aviso.closest('[data-sonner-toast]')).not.toBeNull()
    expect(
      await screen.findByText(/fue rechazado y no volverá a enviarse automáticamente/i),
    ).toBeDefined()
  })
})
