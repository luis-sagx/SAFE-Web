import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import DataLeakNotice from './AvisoFiltracion'
import ExpiredPassword from './ClaveCaducada'
import SriInvoice from './FacturaSri'
import LotteryPrize from './LoteriaPremiada'
import QuishingUpdate from './QuishingActualice'
import PayrollStatement from './RolDePagos'
import ThreadHijacking from './SecuestroHilo'
import BogotaSession from './SesionBogota'

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
  const current = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return { ...current, createRun: vi.fn().mockResolvedValue(undefined) }
})

function openEmail(Component: ComponentType) {
  const toView = render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
  return toView
}

describe('correos de phishing realistas', () => {
  it.each([
    ['Premio de lotería', LotteryPrize, 'Lotería del Pacífico'],
    ['Factura del SRI', SriInvoice, 'Servicio de Rentas Internas'],
    ['Clave por caducar', ExpiredPassword, 'Corporación Andes'],
    ['Rol de pagos', PayrollStatement, 'Corporación Andes'],
    ['Actualización por QR', QuishingUpdate, 'Banco del Litoral'],
    ['Pago del colegio', ThreadHijacking, 'Unidad Educativa San Rafael'],
    ['Aviso de filtración', DataLeakNotice, 'TiendaExpress'],
    ['Sesión desconocida', BogotaSession, 'Banco del Litoral'],
  ])('%s muestra una identidad visual propia del remitente', (_case, Component, brand) => {
    openEmail(Component)

    expect(screen.getByRole('group', { name: `Identidad visual de ${brand}` })).toBeDefined()
  })

  it('usa los dos banners nuevos y elimina las ilustraciones genéricas', () => {
    const lottery = openEmail(LotteryPrize)
    expect(
      lottery.container.querySelector('img[src="/escenarios/phishing/premio-loteria.webp"]'),
    ).not.toBeNull()
    lottery.unmount()

    const leak = openEmail(DataLeakNotice)
    expect(
      leak.container.querySelector('img[src="/escenarios/phishing/aviso-seguridad.webp"]'),
    ).not.toBeNull()
    leak.unmount()

    const invoice = openEmail(SriInvoice)
    expect(invoice.container.querySelector('img.mailHero')).toBeNull()
    invoice.unmount()

    const school = openEmail(ThreadHijacking)
    expect(school.container.querySelector('img.mailHero')).toBeNull()
  })
})
