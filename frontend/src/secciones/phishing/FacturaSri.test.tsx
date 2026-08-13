import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import FacturaSri from './FacturaSri'

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
  }),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...actual, createRun: vi.fn().mockResolvedValue(undefined) }
})

function renderEscenario() {
  render(
    <MemoryRouter>
      <FacturaSri />
    </MemoryRouter>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

describe('FacturaSri', () => {
  it('permite revisar Enviados sin cerrar el escenario', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Enviados' }))

    expect(screen.getByRole('heading', { name: 'Enviados' })).toBeDefined()
    expect(screen.getByText('No hay correos enviados.')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.queryByText('Escenario no aprobado')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Recibidos' }))

    expect(
      screen.getByRole('heading', { name: 'Factura electrónica pendiente de validación' }),
    ).toBeDefined()
  })

  it('permite revisar Papelera sin cerrar el escenario', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.getByText('La papelera está vacía.')).toBeDefined()
    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    expect(screen.queryByText('Escenario no aprobado')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Recibidos' }))

    expect(
      screen.getByRole('heading', { name: 'Factura electrónica pendiente de validación' }),
    ).toBeDefined()
  })

  it('con el escenario ya terminado, cerrar la pestaña del portal falso vuelve al correo', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('link', { name: 'Validar mi factura ahora' }))
    fireEvent.click(screen.getByRole('button', { name: 'Validar factura' }))

    // El escenario terminó, pero la pestaña del portal falso sigue abierta.
    expect(screen.getByText('Escenario no aprobado')).toBeDefined()
    expect(screen.getByRole('tab', { name: /Validación de comprobante/ })).toBeDefined()

    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar la pestaña Validación de comprobante' }),
    )

    // Cerrada esa pestaña solo queda el correo, y es lo que el navegador
    // muestra: antes se quedaba enseñando el portal sin pestaña en la barra.
    expect(screen.queryByRole('tab', { name: /Validación de comprobante/ })).toBeNull()
    expect(screen.getByText('https://correo.safeweb.com/u/0/#recibidos')).toBeDefined()
    expect(
      screen.queryByText('Ingresa tus datos del portal para liberar la factura pendiente.'),
    ).toBeNull()
    expect(screen.getByText('Factura electrónica pendiente de validación')).toBeDefined()
  })

  it('el repaso de señales enseña cada pantalla en su propia pestaña', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('link', { name: 'Validar mi factura ahora' }))
    fireEvent.click(screen.getByRole('button', { name: 'Validar factura' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Cerrar la pestaña Validación de comprobante' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver las señales' }))

    // Señal 1: el remitente, que vive en el correo.
    expect(screen.getByRole('tab', { name: /Correo/ }).getAttribute('aria-selected')).toBe('true')

    // Señal 2: el portal real, una pantalla que este recorrido nunca abrió.
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    expect(screen.getByRole('tab', { name: /SRI en Línea/ }).getAttribute('aria-selected')).toBe(
      'true',
    )

    // Señal 5: la conexión insegura, en la pestaña que se cerró al terminar.
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))
    expect(screen.getByRole('heading', { name: 'Señal 5 de 7' })).toBeDefined()
    expect(
      screen.getByRole('tab', { name: /Validación de comprobante/ }).getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('al eliminar el correo, la barra lateral lo refleja: sale de Recibidos y aparece en Papelera', () => {
    renderEscenario()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    // Recibidos se vacía sin más clics: la propia bandeja activa ya lo muestra.
    expect(screen.getByText('No hay correos en la bandeja de entrada.')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir Papelera' }))

    expect(screen.getByRole('heading', { name: 'Papelera' })).toBeDefined()
    expect(screen.queryByText('La papelera está vacía.')).toBeNull()
    expect(screen.getByText('Factura electrónica pendiente de validación')).toBeDefined()
    expect(screen.getByText('notificaciones@sri-facturacion-ec.com')).toBeDefined()
  })
})
