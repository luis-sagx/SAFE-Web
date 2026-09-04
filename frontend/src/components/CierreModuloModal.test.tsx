import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CierreModuloModal from './CierreModuloModal'
import type { Escenario, Seccion } from '../data/catalogo'
import type { Progreso } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchMyRuns: () => new Promise(() => {}) }
})

const SECCION = { id: 'phishing', titulo: 'Phishing' } as Seccion
const ESCENARIOS = [{ id: 'phishing/e0' } as Escenario]
const PROGRESO: Progreso = {
  modulo: 'phishing',
  escenarios: [],
  aprobados: 6,
  requeridos: 6,
  aprobado: true,
}

describe('CierreModuloModal', () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    onClose = vi.fn<() => void>()
  })

  it('muestra el contenido de CierreModulo dentro del diálogo', () => {
    render(
      <CierreModuloModal
        seccion={SECCION}
        escenarios={ESCENARIOS}
        progreso={PROGRESO}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('Módulo aprobado')).toBeDefined()
  })

  it('el botón de cerrar (✕) llama a onClose', () => {
    render(
      <CierreModuloModal
        seccion={SECCION}
        escenarios={ESCENARIOS}
        progreso={PROGRESO}
        onClose={onClose}
      />,
    )

    const [, botonCerrar] = screen.getAllByRole('button', { name: 'Cerrar resumen del módulo' })
    fireEvent.click(botonCerrar!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('el fondo también cierra al hacer clic (es un botón real, no un div)', () => {
    render(
      <CierreModuloModal
        seccion={SECCION}
        escenarios={ESCENARIOS}
        progreso={PROGRESO}
        onClose={onClose}
      />,
    )

    const [botonFondo] = screen.getAllByRole('button', { name: 'Cerrar resumen del módulo' })
    fireEvent.click(botonFondo!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape cierra el modal', () => {
    render(
      <CierreModuloModal
        seccion={SECCION}
        escenarios={ESCENARIOS}
        progreso={PROGRESO}
        onClose={onClose}
      />,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
