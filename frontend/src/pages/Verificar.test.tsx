import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Verificar from './Verificar'

const { verificarCertificadoMock } = vi.hoisted(() => ({
  verificarCertificadoMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, verificarCertificado: verificarCertificadoMock }
})

function renderVerificar(codigo = 'SW-RQFS-XBC2') {
  return render(
    <MemoryRouter initialEntries={[`/verificar/${codigo}`]}>
      <Routes>
        <Route path="/verificar/:codigo" element={<Verificar />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Verificar', () => {
  beforeEach(() => {
    verificarCertificadoMock.mockReset()
  })

  it('mientras verifica, no dice ni válido ni inválido', () => {
    verificarCertificadoMock.mockReturnValue(new Promise(() => {}))

    renderVerificar()

    expect(screen.getByText('Verificando…')).toBeDefined()
  })

  it('un código válido muestra la fecha, la duración y los módulos, nunca un nombre', async () => {
    verificarCertificadoMock.mockResolvedValue({
      valido: true,
      emitidoAt: '2026-09-04T00:00:00.000Z',
      horas: 4,
      modulos: ['phishing', 'smishing'],
    })

    renderVerificar()

    expect(await screen.findByText('Certificado válido')).toBeDefined()
    expect(screen.getByText(/con una duración de 4 horas/)).toBeDefined()
    expect(screen.getByText('Módulos: phishing, smishing')).toBeDefined()
  })

  it('un código inválido o revocado lo dice sin más detalle', async () => {
    verificarCertificadoMock.mockResolvedValue({ valido: false })

    renderVerificar()

    expect(
      await screen.findByText('Este código no corresponde a un certificado vigente.'),
    ).toBeDefined()
  })

  it('si la verificación falla, muestra el aviso de error', async () => {
    verificarCertificadoMock.mockRejectedValue(new Error('red caída'))

    renderVerificar()

    expect(
      await screen.findByText('No se pudo verificar el código. Vuelve a intentarlo más tarde.'),
    ).toBeDefined()
  })
})
