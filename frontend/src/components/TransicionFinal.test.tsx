import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FinalTransition from './TransicionFinal'

const {
  fetchAttestationMock,
  issueCertificateMock,
  downloadCertificatePdfMock,
  reproducirModuloCompletoMock,
  useSoundMock,
} = vi.hoisted(() => ({
  fetchAttestationMock: vi.fn(),
  issueCertificateMock: vi.fn(),
  downloadCertificatePdfMock: vi.fn(),
  reproducirModuloCompletoMock: vi.fn(),
  useSoundMock: vi.fn(),
}))

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...current,
    fetchAttestation: fetchAttestationMock,
    issueCertificate: issueCertificateMock,
    downloadCertificatePdf: downloadCertificatePdfMock,
  }
})

vi.mock('../lib/sonidos', () => ({ reproducirModuloCompleto: reproducirModuloCompletoMock }))
vi.mock('../context/SoundContext', () => ({ useSound: useSoundMock }))

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

describe('FinalTransition', () => {
  beforeEach(() => {
    reproducirModuloCompletoMock.mockReset()
    useSoundMock.mockReturnValue({ activado: true, setActivado: vi.fn() })
    localStorage.clear()
  })

  it('celebra haber terminado los 7 módulos y ofrece el certificado y la insignia', () => {
    render(
      <MemoryRouter>
        <FinalTransition totalModulos={7} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Completaste todo el entrenamiento')).toBeDefined()
    expect(screen.getByText('7')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Descargar certificado' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ver insignia' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Ir al panel →' }).getAttribute('href')).toBe('/dashboard')
  })

  it('se puede cerrar para quedarse en la pantalla anterior', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <FinalTransition totalModulos={7} onClose={onClose} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Seguir aquí' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape también cierra la pantalla', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <FinalTransition totalModulos={7} onClose={onClose} />
      </MemoryRouter>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // El sonido vivía en Dashboard.tsx (issue #279-linkedin), disparado por su
  // propio `complete`. Se movió aquí: esta pantalla es ahora el verdadero
  // momento del logro, y Dashboard puede visitarse muchas veces después sin
  // que eso cuente como "lo acabo de lograr" otra vez.
  it('toca el sonido de logro al aparecer', async () => {
    render(
      <MemoryRouter>
        <FinalTransition totalModulos={7} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    await waitFor(() => expect(reproducirModuloCompletoMock).toHaveBeenCalledTimes(1))
  })

  it('si ya sonó antes en este navegador, no lo repite', async () => {
    localStorage.setItem('modulo-completo-sonado', '1')

    render(
      <MemoryRouter>
        <FinalTransition totalModulos={7} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    await screen.findByText('Completaste todo el entrenamiento')
    expect(reproducirModuloCompletoMock).not.toHaveBeenCalled()
  })
})
