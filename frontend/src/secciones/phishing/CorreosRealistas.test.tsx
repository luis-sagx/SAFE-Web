import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import AvisoFiltracion from './AvisoFiltracion'
import ClaveCaducada from './ClaveCaducada'
import FacturaSri from './FacturaSri'
import LoteriaPremiada from './LoteriaPremiada'
import QuishingActualice from './QuishingActualice'
import RolDePagos from './RolDePagos'
import SecuestroHilo from './SecuestroHilo'
import SesionBogota from './SesionBogota'

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

function abrirCorreo(Component: ComponentType) {
  const vista = render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return vista
}

describe('correos de phishing realistas', () => {
  it.each([
    ['Premio de lotería', LoteriaPremiada, 'Lotería del Pacífico'],
    ['Factura del SRI', FacturaSri, 'Servicio de Rentas Internas'],
    ['Clave por caducar', ClaveCaducada, 'Corporación Andes'],
    ['Rol de pagos', RolDePagos, 'Corporación Andes'],
    ['Actualización por QR', QuishingActualice, 'Banco del Litoral'],
    ['Pago del colegio', SecuestroHilo, 'Unidad Educativa San Rafael'],
    ['Aviso de filtración', AvisoFiltracion, 'TiendaExpress'],
    ['Sesión desconocida', SesionBogota, 'Banco del Litoral'],
  ])('%s muestra una identidad visual propia del remitente', (_caso, Component, marca) => {
    abrirCorreo(Component)

    expect(screen.getByRole('group', { name: `Identidad visual de ${marca}` })).toBeDefined()
  })

  it('usa los dos banners nuevos y elimina las ilustraciones genéricas', () => {
    const loteria = abrirCorreo(LoteriaPremiada)
    expect(
      loteria.container.querySelector('img[src="/escenarios/phishing/premio-loteria.webp"]'),
    ).not.toBeNull()
    loteria.unmount()

    const filtracion = abrirCorreo(AvisoFiltracion)
    expect(
      filtracion.container.querySelector('img[src="/escenarios/phishing/aviso-seguridad.webp"]'),
    ).not.toBeNull()
    filtracion.unmount()

    const factura = abrirCorreo(FacturaSri)
    expect(factura.container.querySelector('img.mailHero')).toBeNull()
    factura.unmount()

    const colegio = abrirCorreo(SecuestroHilo)
    expect(colegio.container.querySelector('img.mailHero')).toBeNull()
  })
})
