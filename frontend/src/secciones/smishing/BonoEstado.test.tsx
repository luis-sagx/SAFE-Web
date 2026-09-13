import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import GovernmentBenefit from './BonoEstado'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    participant: {
      id: 'p1',
      nombre: 'María',
      apellido: 'Pérez',
      email: 'maria@ejemplo.com',
      role: 'PARTICIPANT',
      onboardingVisto: true,
    },
    loading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    marcarOnboardingVisto: vi.fn(),
    onboardingDismissed: true,
    displayName: 'María',
    roleLabel: 'Participante',
    initials: 'MP',
    correoSimulado: 'mariaperez@safeweb.com',
    usuarioSimulado: 'mariaperez',
  }),
}))

vi.mock('../../lib/api', async () => {
  const current = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...current, createRun: vi.fn().mockResolvedValue(undefined) }
})

function start() {
  const { container } = render(
    <MemoryRouter>
      <GovernmentBenefit />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container
}

describe('BonoEstado', () => {
  it('se decide tocando el propio teléfono, sin lista de opciones', () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement

    expect(phone).not.toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ver contexto y mis datos' })).toBeDefined()

    // El enlace del SMS es el punto interactivo: no hay ningún botón fuera del
    // teléfono que describa la acción.
    const link = within(phone).getByText('bit.ly/bono-ec-2026')
    fireEvent.click(link)

    expect(within(phone).getByText('Acreditación del bono de $180')).toBeDefined()
    expect(within(phone).getByText('bono-social-ec.online/registro')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Acreditar mi bono' }))
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('salir de la página falsa no entrega datos', () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(phone).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(within(phone).getByRole('button', { name: 'Volver atrás' }))
    expect(screen.getByText('No caíste · el formulario te delató')).toBeDefined()
  })

  it('desde la página falsa se puede volver al hilo a releer el SMS', () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(phone).getByText('bit.ly/bono-ec-2026'))
    expect(within(phone).getByText('Acreditación del bono de $180')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))
    expect(within(phone).getByText(/MIES INFORMA/)).toBeDefined()
    // Volver a leer no decide: la corrida sigue en la página falsa.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /Mensajes/ }))
    expect(within(phone).getByText('Acreditación del bono de $180')).toBeDefined()
  })

  it('volver al navegador desde el hilo no deja la pantalla en Mensajes', () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement
    const app = (name: RegExp) => within(phone).getByRole('button', { name: name })

    fireEvent.click(app(/Navegador/))
    expect(within(phone).getByText('Nueva pestaña')).toBeDefined()

    // Releer el SMS, mirar otra app y volver al navegador: el destino es el
    // nodo en el que ya estamos, así que el hilo tapaba la pantalla.
    fireEvent.click(app(/Mensajes/))
    expect(within(phone).getByText(/MIES INFORMA/)).toBeDefined()

    fireEvent.click(app(/Banco/))
    expect(within(phone).getByText(/Saldo disponible/)).toBeDefined()

    fireEvent.click(app(/Navegador/))
    expect(within(phone).getByText('Nueva pestaña')).toBeDefined()
    expect(within(phone).queryByText(/MIES INFORMA/)).toBeNull()
  })

  it('mirar una app sobre el hilo y volver a Mensajes deja el hilo, no la pantalla del grafo', () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement
    const app = (name: RegExp) => within(phone).getByRole('button', { name: name })

    fireEvent.click(within(phone).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(app(/Mensajes/))
    fireEvent.click(app(/Cámara/))
    fireEvent.click(app(/Mensajes/))

    expect(within(phone).getByText(/MIES INFORMA/)).toBeDefined()
  })

  it('abrir el navegador no comprueba nada, pero entrar al portal oficial sí', () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(phone).getByRole('button', { name: /Navegador/ }))

    // El navegador abre en sus sitios frecuentes, no en el portal, y la
    // corrida sigue abierta: tocar el icono todavía no es un veredicto.
    expect(within(phone).getByText('Nueva pestaña')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: /inclusion\.gob\.ec/ }))

    // La respuesta se lee en pantalla, y verla ya es la comprobación: no
    // queda nada abierto después, así que la corrida termina aquí.
    expect(within(phone).getByText('Consulta de beneficiarios')).toBeDefined()
    expect(within(phone).getByText('Procesos de preselección')).toBeDefined()
    expect(screen.getByText('No caíste · buscaste la fuente oficial')).toBeDefined()
  })

  it('el repaso de señales resalta elementos dentro del celular', async () => {
    const container = start()
    const phone = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(phone).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(within(phone).getByRole('button', { name: 'Acreditar mi bono' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        within(phone)
          .getByText(/MIES INFORMA/)
          .closest('[data-signal="mensaje"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        within(phone)
          .getByText('bono-social-ec.online/registro')
          .closest('[data-signal="url"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })
})
