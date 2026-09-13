import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VerifyCertificate from './Verificar'

const { verifyCertificateMock } = vi.hoisted(() => ({
  verifyCertificateMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, verifyCertificate: verifyCertificateMock }
})

function renderVerification(code = 'SW-RQFS-XBC2') {
  return render(
    <MemoryRouter initialEntries={[`/verificar/${code}`]}>
      <Routes>
        <Route path="/verificar/:codigo" element={<VerifyCertificate />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Verificar', () => {
  beforeEach(() => {
    verifyCertificateMock.mockReset()
  })

  it('mientras verifica, no dice ni válido ni inválido', () => {
    verifyCertificateMock.mockReturnValue(new Promise(() => {}))

    renderVerification()

    expect(screen.getByText('Verificando…')).toBeDefined()
  })

  it('un código válido muestra la fecha, la duración y los módulos, nunca un nombre', async () => {
    verifyCertificateMock.mockResolvedValue({
      valido: true,
      emitidoAt: '2026-09-04T00:00:00.000Z',
      horas: 4,
      modulos: ['phishing', 'smishing'],
    })

    renderVerification()

    expect(await screen.findByText('Certificado válido')).toBeDefined()
    expect(screen.getByText(/con una duración de 4 horas/)).toBeDefined()
    expect(screen.getByText('Módulos: phishing, smishing')).toBeDefined()
  })

  it('un código inválido o revocado lo dice sin más detalle', async () => {
    verifyCertificateMock.mockResolvedValue({ valido: false })

    renderVerification()

    expect(
      await screen.findByText('Este código no corresponde a un certificado vigente.'),
    ).toBeDefined()
  })

  it('si la verificación falla, muestra el aviso de error', async () => {
    verifyCertificateMock.mockRejectedValue(new Error('red caída'))

    renderVerification()

    expect(
      await screen.findByText('No se pudo verificar el código. Vuelve a intentarlo más tarde.'),
    ).toBeDefined()
  })
})
