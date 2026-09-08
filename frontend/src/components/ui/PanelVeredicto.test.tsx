import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
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
})
