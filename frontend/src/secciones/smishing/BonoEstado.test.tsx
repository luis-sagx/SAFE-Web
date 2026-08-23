import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import BonoEstado from './BonoEstado'

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
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function empezar() {
  const { container } = render(
    <MemoryRouter>
      <BonoEstado />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return container
}

describe('BonoEstado', () => {
  it('se decide tocando el propio teléfono, sin lista de opciones', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    expect(telefono).not.toBeNull()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ver contexto y mis datos' })).toBeDefined()

    // El enlace del SMS es el punto interactivo: no hay ningún botón fuera del
    // teléfono que describa la acción.
    const enlace = within(telefono).getByText('bit.ly/bono-ec-2026')
    fireEvent.click(enlace)

    expect(within(telefono).getByText('Acreditación del bono de $180')).toBeDefined()
    expect(within(telefono).getByText('bono-social-ec.online/registro')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Acreditar mi bono' }))
    expect(screen.getByText('Caíste en la trampa')).toBeDefined()
  })

  it('salir de la página falsa no entrega datos', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Volver atrás' }))
    expect(screen.getByText('No caíste · el formulario te delató')).toBeDefined()
  })

  it('desde la página falsa se puede volver al hilo a releer el SMS', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByText('bit.ly/bono-ec-2026'))
    expect(within(telefono).getByText('Acreditación del bono de $180')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Mensajes/ }))
    expect(within(telefono).getByText(/MIES INFORMA/)).toBeDefined()
    // Volver a leer no decide: la corrida sigue en la página falsa.
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /Mensajes/ }))
    expect(within(telefono).getByText('Acreditación del bono de $180')).toBeDefined()
  })

  it('volver al navegador desde el hilo no deja la pantalla en Mensajes', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement
    const app = (nombre: RegExp) => within(telefono).getByRole('button', { name: nombre })

    fireEvent.click(app(/Navegador/))
    expect(within(telefono).getByText('Nueva pestaña')).toBeDefined()

    // Releer el SMS, mirar otra app y volver al navegador: el destino es el
    // nodo en el que ya estamos, así que el hilo tapaba la pantalla.
    fireEvent.click(app(/Mensajes/))
    expect(within(telefono).getByText(/MIES INFORMA/)).toBeDefined()

    fireEvent.click(app(/Banco/))
    expect(within(telefono).getByText(/Saldo disponible/)).toBeDefined()

    fireEvent.click(app(/Navegador/))
    expect(within(telefono).getByText('Nueva pestaña')).toBeDefined()
    expect(within(telefono).queryByText(/MIES INFORMA/)).toBeNull()
  })

  it('mirar una app sobre el hilo y volver a Mensajes deja el hilo, no la pantalla del grafo', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement
    const app = (nombre: RegExp) => within(telefono).getByRole('button', { name: nombre })

    fireEvent.click(within(telefono).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(app(/Mensajes/))
    fireEvent.click(app(/Cámara/))
    fireEvent.click(app(/Mensajes/))

    expect(within(telefono).getByText(/MIES INFORMA/)).toBeDefined()
  })

  it('abrir el navegador no comprueba nada: la dirección la eliges tú', () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByRole('button', { name: /Navegador/ }))

    // El navegador abre en sus sitios frecuentes, no en el portal, y la
    // corrida sigue abierta: tocar el icono todavía no es un veredicto.
    expect(within(telefono).getByText('Nueva pestaña')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: /inclusion\.gob\.ec/ }))

    // La respuesta se lee en pantalla y la corrida sigue abierta: comprobar es
    // mirar, y la decisión es lo que se haga después con el mensaje (#74).
    expect(within(telefono).getByText('Consulta de beneficiarios')).toBeDefined()
    expect(within(telefono).getByText('Procesos de preselección')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()

    // Volver al hilo y dejarlo ahí, ya sabiendo lo que es: eso sí acredita.
    fireEvent.click(within(telefono).getByRole('button', { name: 'Salir de la aplicación' }))
    fireEvent.click(within(telefono).getByRole('button', { name: /Volver a la lista de mensajes/ }))

    expect(screen.getByText('No caíste · buscaste la fuente oficial')).toBeDefined()
  })

  it('el repaso de señales resalta elementos dentro del celular', async () => {
    const container = empezar()
    const telefono = container.querySelector('#pantalla-escenario') as HTMLElement

    fireEvent.click(within(telefono).getByText('bit.ly/bono-ec-2026'))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Acreditar mi bono' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        within(telefono)
          .getByText(/MIES INFORMA/)
          .closest('[data-signal="mensaje"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        within(telefono)
          .getByText('bono-social-ec.online/registro')
          .closest('[data-signal="url"]')
          ?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })
})
