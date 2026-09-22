import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BadgeModal from './ModalInsignia'

const { fetchAttestationMock, issueCertificateMock, svgAPngMock } = vi.hoisted(() => ({
  fetchAttestationMock: vi.fn(),
  issueCertificateMock: vi.fn(),
  svgAPngMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchAttestation: fetchAttestationMock, issueCertificate: issueCertificateMock }
})

vi.mock('../lib/insigniaImagen', () => ({ svgAPng: svgAPngMock }))

describe('BadgeModal', () => {
  beforeEach(() => {
    fetchAttestationMock.mockReset()
    issueCertificateMock.mockReset()
    svgAPngMock.mockReset()
  })

  it('carga el certificado y muestra la insignia con el nombre del participante', async () => {
    fetchAttestationMock.mockResolvedValue({ atestacion: 'firma-de-prueba' })
    issueCertificateMock.mockResolvedValue({
      codigo: 'SW-AB12-CD34',
      emitidoAt: '2026-09-18T00:00:00.000Z',
      modulos: ['phishing', 'smishing', 'vishing'],
      horas: 4,
      calificacion: 90,
    })

    render(<BadgeModal nombre="Sebastián Parra" onClose={vi.fn()} />)

    expect(await screen.findByText('Sebastián Parra')).toBeDefined()
    expect(screen.getByText(/3 módulos/)).toBeDefined()
  })

  it('si falla al emitir el certificado, avisa en vez de quedarse cargando', async () => {
    fetchAttestationMock.mockRejectedValue(new Error('sin red'))

    render(<BadgeModal nombre="Sebastián Parra" onClose={vi.fn()} />)

    expect(await screen.findByText(/No se pudo generar la insignia/)).toBeDefined()
  })

  it('descarga la insignia como PNG al presionar el botón', async () => {
    fetchAttestationMock.mockResolvedValue({ atestacion: 'firma-de-prueba' })
    issueCertificateMock.mockResolvedValue({
      codigo: 'SW-AB12-CD34',
      emitidoAt: '2026-09-18T00:00:00.000Z',
      modulos: ['phishing', 'smishing'],
      horas: 4,
      calificacion: 90,
    })
    const pngBlob = new Blob(['fake-png'], { type: 'image/png' })
    svgAPngMock.mockResolvedValue(pngBlob)
    const createObjectURL = vi.fn(() => 'blob:insignia')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    render(<BadgeModal nombre="Sebastián Parra" onClose={vi.fn()} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Descargar insignia' }))

    await vi.waitFor(() => expect(svgAPngMock).toHaveBeenCalledTimes(1))
    expect(createObjectURL).toHaveBeenCalledWith(pngBlob)

    vi.unstubAllGlobals()
  })

  it('ofrece un enlace para agregar el certificado a LinkedIn, con el código y la fecha de emisión', async () => {
    fetchAttestationMock.mockResolvedValue({ atestacion: 'firma-de-prueba' })
    issueCertificateMock.mockResolvedValue({
      codigo: 'SW-AB12-CD34',
      emitidoAt: '2026-03-15T00:00:00.000Z',
      modulos: ['phishing'],
      horas: 4,
      calificacion: 90,
    })

    render(<BadgeModal nombre="Sebastián Parra" onClose={vi.fn()} />)

    const link = (await screen.findByRole('link', { name: 'Agregar a LinkedIn' })) as HTMLAnchorElement
    const url = new URL(link.href)
    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/profile/add')
    expect(url.searchParams.get('certId')).toBe('SW-AB12-CD34')
    expect(link.target).toBe('_blank')
  })

  it('se puede cerrar', async () => {
    fetchAttestationMock.mockResolvedValue({ atestacion: 'firma-de-prueba' })
    issueCertificateMock.mockResolvedValue({
      codigo: 'SW-AB12-CD34',
      emitidoAt: '2026-09-18T00:00:00.000Z',
      modulos: ['phishing'],
      horas: 4,
      calificacion: 90,
    })
    const onClose = vi.fn()

    render(<BadgeModal nombre="Sebastián Parra" onClose={onClose} />)
    await screen.findByText('Sebastián Parra')

    const [, closeButton] = screen.getAllByRole('button', { name: 'Cerrar insignia' })
    fireEvent.click(closeButton!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
