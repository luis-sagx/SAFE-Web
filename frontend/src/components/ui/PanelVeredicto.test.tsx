import { StrictMode } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from 'sonner'
import VerdictPanel from './PanelVeredicto'

vi.mock('./AccionesFinal', () => ({
  default: () => <div>Acciones finales</div>,
}))

const { reproducirResultadoMock, reproducirSenalMock, useSoundMock } = vi.hoisted(() => ({
  reproducirResultadoMock: vi.fn(),
  reproducirSenalMock: vi.fn(),
  useSoundMock: vi.fn(),
}))

vi.mock('../../lib/sonidos', () => ({
  reproducirResultado: reproducirResultadoMock,
  reproducirSenal: reproducirSenalMock,
}))
vi.mock('../../context/SoundContext', () => ({ useSound: useSoundMock }))

describe('PanelVeredicto', () => {
  beforeEach(() => {
    reproducirResultadoMock.mockReset()
    reproducirSenalMock.mockReset()
    useSoundMock.mockReturnValue({ activado: true, setActivado: vi.fn() })
  })

  it('separa el repaso de señales con un fondo propio y conserva compacto el veredicto', () => {
    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[{ id: 's1', texto: 'La señal cambia.' }]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continuar → Ver las señales' }))

    const signals = screen.getByRole('region', { name: 'Repaso de señales' })
    expect(signals.className).toContain('bg-signal')
    expect(signals.className).toContain('border-signal')
    expect(within(signals).getByText('La señal cambia.').className).toContain('text-signal-body')
  })

  it('muestra el intento en cola como aviso temporal y no dentro del panel', async () => {
    render(
      <MemoryRouter>
        <Toaster />
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
          estadoGuardado="queued"
        />
      </MemoryRouter>,
    )

    const notice = await screen.findByText(/quedó guardado en este equipo/i)
    expect(notice.closest('[data-sonner-toast]')).not.toBeNull()
    expect(screen.getByText('Caíste').closest('.rounded-lg')?.contains(notice)).toBe(false)
  })

  it('avisa sin encolar cuando el servidor rechaza definitivamente el intento', async () => {
    render(
      <MemoryRouter>
        <Toaster />
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
          estadoGuardado="failed"
        />
      </MemoryRouter>,
    )

    const notice = await screen.findByText(/no se pudo registrar este intento/i)
    expect(notice.closest('[data-sonner-toast]')).not.toBeNull()
    expect(
      await screen.findByText(/fue rechazado y no volverá a enviarse automáticamente/i),
    ).toBeDefined()
  })

  it('al mostrar el veredicto, toca el sonido del resultado (issue #221)', () => {
    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'good', verdict: 'Acertaste', outcome: 'No caíste.' }}
          senales={[]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    expect(reproducirResultadoMock).toHaveBeenCalledWith('good')
    expect(reproducirResultadoMock).toHaveBeenCalledTimes(1)
  })

  it('avanzar por el repaso de señales no vuelve a tocar el sonido', () => {
    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[{ id: 's1', texto: 'La señal cambia.' }]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continuar → Ver las señales' }))

    expect(reproducirResultadoMock).toHaveBeenCalledTimes(1)
  })

  it('con el sonido desactivado, no toca nada', () => {
    useSoundMock.mockReturnValue({ activado: false, setActivado: vi.fn() })

    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'partial', verdict: 'Casi', outcome: 'Quedó a medias.' }}
          senales={[]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    expect(reproducirResultadoMock).not.toHaveBeenCalled()
  })

  it('reserva el alto con todas las señales reales (no con una "más larga" adivinada por longitud de texto)', () => {
    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[
            { id: 's1', texto: 'Corta.' },
            { id: 's2', texto: 'La dirección era bancodellitoral.com.ec.seguridad-alertas.com, un dominio largo.' },
          ]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continuar → Ver las señales' }))

    // Las dos señales están en el DOM (así el contenedor reserva el alto de
    // la más alta de verdad, no el de un cálculo por cantidad de caracteres
    // que se equivoca con una señal que trae una URL larga sin espacios).
    const corta = screen.getByText('Corta.')
    const larga = screen.getByText(/dominio largo/)
    expect(corta.className).toContain('text-signal-body')
    expect(corta.getAttribute('aria-hidden')).toBe('false')
    expect(larga.className).toContain('invisible')
    expect(larga.getAttribute('aria-hidden')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    expect(screen.getByText('Corta.').className).toContain('invisible')
    expect(screen.getByText(/dominio largo/).className).toContain('text-signal-body')
  })

  it('al resaltar una señal durante el repaso, toca su propio sonido', () => {
    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[
            { id: 's1', texto: 'Primera señal.' },
            { id: 's2', texto: 'Segunda señal.' },
          ]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    expect(reproducirSenalMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Continuar → Ver las señales' }))
    expect(reproducirSenalMock).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    expect(reproducirSenalMock).toHaveBeenCalledTimes(2)
  })

  it('con el sonido desactivado, el repaso de señales no toca nada', () => {
    useSoundMock.mockReturnValue({ activado: false, setActivado: vi.fn() })

    render(
      <MemoryRouter>
        <VerdictPanel
          escenarioId="phishing/prueba"
          node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
          senales={[{ id: 's1', texto: 'Primera señal.' }]}
          regla="Comprueba por otro canal."
          contenedorId="pantalla-escenario"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continuar → Ver las señales' }))
    expect(reproducirSenalMock).not.toHaveBeenCalled()
  })

  it('con StrictMode (doble efecto de montaje, como en producción) solo toca el sonido una vez', () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <VerdictPanel
            escenarioId="phishing/prueba"
            node={{ kind: 'bad', verdict: 'Caíste', outcome: 'Entregaste tus datos.' }}
            senales={[]}
            regla="Comprueba por otro canal."
            contenedorId="pantalla-escenario"
          />
        </MemoryRouter>
      </StrictMode>,
    )

    expect(reproducirResultadoMock).toHaveBeenCalledTimes(1)
  })
})
