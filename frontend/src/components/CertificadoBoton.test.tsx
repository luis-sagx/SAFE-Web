import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CertificateButton from './CertificadoBoton'
import { ApiError } from '../lib/api'

const { fetchAttestationMock, issueCertificateMock, downloadCertificatePdfMock } = vi.hoisted(
  () => ({
    fetchAttestationMock: vi.fn(),
    issueCertificateMock: vi.fn(),
    downloadCertificatePdfMock: vi.fn(),
  }),
)

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...current,
    fetchAttestation: fetchAttestationMock,
    issueCertificate: issueCertificateMock,
    downloadCertificatePdf: downloadCertificatePdfMock,
  }
})

describe('CertificadoBoton', () => {
  beforeEach(() => {
    fetchAttestationMock.mockReset()
    issueCertificateMock.mockReset()
    downloadCertificatePdfMock.mockReset()
    URL.createObjectURL = vi.fn(() => 'blob:falso')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('encadena atestación → emisión → descarga, en ese orden', async () => {
    const order: string[] = []
    fetchAttestationMock.mockImplementation(async () => {
      order.push('atestacion')
      return { atestacion: 'un.jwt.firmado' }
    })
    issueCertificateMock.mockImplementation(async (attestation: string) => {
      order.push('emitir:' + attestation)
      return { codigo: 'SW-AAAA-BBBB' }
    })
    downloadCertificatePdfMock.mockImplementation(async (attestation: string) => {
      order.push('pdf:' + attestation)
      return new Blob(['%PDF-'])
    })

    render(<CertificateButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())

    expect(order).toEqual([
      'atestacion',
      'emitir:un.jwt.firmado',
      'pdf:un.jwt.firmado',
    ])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:falso')
    // Vuelve al texto normal, sin quedarse en "Generando…".
    expect(await screen.findByText('Descargar certificado')).toBeDefined()
  })

  it('un ApiError (p. ej. 409 por progreso cambiado) muestra el aviso sin registrar en consola', async () => {
    fetchAttestationMock.mockRejectedValue(new ApiError('Todavía no apruebas todos los módulos.', 409))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CertificateButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))

    expect(
      await screen.findByText('No se pudo generar el certificado. Vuelve a intentarlo en un momento.'),
    ).toBeDefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('un error inesperado también muestra el aviso, y sí se registra en consola', async () => {
    fetchAttestationMock.mockRejectedValue(new Error('falla de red'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CertificateButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))

    await screen.findByText('No se pudo generar el certificado. Vuelve a intentarlo en un momento.')
    expect(consoleError).toHaveBeenCalled()
  })
})
