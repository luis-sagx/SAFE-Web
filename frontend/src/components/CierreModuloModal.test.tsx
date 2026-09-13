import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ModuleCompletionModal from './CierreModuloModal'
import type { Scenario, Section } from '../data/catalogo'
import type { Progress } from '../lib/api'

vi.mock('../lib/api', async () => {
  const current = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...current, fetchMyRuns: () => new Promise(() => {}) }
})

const SECTION = { id: 'phishing', titulo: 'Phishing' } as Section
const SCENARIOS = [{ id: 'phishing/e0' } as Scenario]
const PROGRESS: Progress = {
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
      <ModuleCompletionModal
        seccion={SECTION}
        escenarios={SCENARIOS}
        progreso={PROGRESS}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('Módulo aprobado')).toBeDefined()
  })

  it('el botón de cerrar (✕) llama a onClose', () => {
    render(
      <ModuleCompletionModal
        seccion={SECTION}
        escenarios={SCENARIOS}
        progreso={PROGRESS}
        onClose={onClose}
      />,
    )

    const [, closeButton] = screen.getAllByRole('button', { name: 'Cerrar resumen del módulo' })
    fireEvent.click(closeButton!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('el fondo también cierra al hacer clic (es un botón real, no un div)', () => {
    render(
      <ModuleCompletionModal
        seccion={SECTION}
        escenarios={SCENARIOS}
        progreso={PROGRESS}
        onClose={onClose}
      />,
    )

    const [backgroundButton] = screen.getAllByRole('button', { name: 'Cerrar resumen del módulo' })
    fireEvent.click(backgroundButton!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape cierra el modal', () => {
    render(
      <ModuleCompletionModal
        seccion={SECTION}
        escenarios={SCENARIOS}
        progreso={PROGRESS}
        onClose={onClose}
      />,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
