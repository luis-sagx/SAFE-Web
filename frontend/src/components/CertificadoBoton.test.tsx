import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CertificadoBoton from './CertificadoBoton'
import { ApiError } from '../lib/api'

const { fetchAtestacionMock, emitirCertificadoMock, descargarCertificadoPdfMock } = vi.hoisted(
  () => ({
    fetchAtestacionMock: vi.fn(),
    emitirCertificadoMock: vi.fn(),
    descargarCertificadoPdfMock: vi.fn(),
  }),
)

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAtestacion: fetchAtestacionMock,
    emitirCertificado: emitirCertificadoMock,
    descargarCertificadoPdf: descargarCertificadoPdfMock,
  }
})

describe('CertificadoBoton', () => {
  beforeEach(() => {
    fetchAtestacionMock.mockReset()
    emitirCertificadoMock.mockReset()
    descargarCertificadoPdfMock.mockReset()
    URL.createObjectURL = vi.fn(() => 'blob:falso')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('encadena atestación → emisión → descarga, en ese orden', async () => {
    const orden: string[] = []
    fetchAtestacionMock.mockImplementation(async () => {
      orden.push('atestacion')
      return { atestacion: 'un.jwt.firmado' }
    })
    emitirCertificadoMock.mockImplementation(async (atestacion: string) => {
      orden.push('emitir:' + atestacion)
      return { codigo: 'SW-AAAA-BBBB' }
    })
    descargarCertificadoPdfMock.mockImplementation(async (atestacion: string) => {
      orden.push('pdf:' + atestacion)
      return new Blob(['%PDF-'])
    })

    render(<CertificadoBoton />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())

    expect(orden).toEqual([
      'atestacion',
      'emitir:un.jwt.firmado',
      'pdf:un.jwt.firmado',
    ])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:falso')
    // Vuelve al texto normal, sin quedarse en "Generando…".
    expect(await screen.findByText('Descargar certificado')).toBeDefined()
  })

  it('un ApiError (p. ej. 409 por progreso cambiado) muestra el aviso sin registrar en consola', async () => {
    fetchAtestacionMock.mockRejectedValue(new ApiError('Todavía no apruebas todos los módulos.', 409))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CertificadoBoton />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))

    expect(
      await screen.findByText('No se pudo generar el certificado. Vuelve a intentarlo en un momento.'),
    ).toBeDefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('un error inesperado también muestra el aviso, y sí se registra en consola', async () => {
    fetchAtestacionMock.mockRejectedValue(new Error('falla de red'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CertificadoBoton />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar certificado' }))

    await screen.findByText('No se pudo generar el certificado. Vuelve a intentarlo en un momento.')
    expect(consoleError).toHaveBeenCalled()
  })
})
