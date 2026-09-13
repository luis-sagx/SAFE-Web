import { fireEvent, render, screen } from '@testing-library/react'
import { useContext, useEffect } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ScenarioLayout from './EscenarioLayout'
import { ViewedReviewContext } from './ui/repasoVisto'
import type { ScenarioResult } from '../hooks/useScenarioRun'

vi.mock('../context/AuthContext', async () => (await import('../test/escenario')).mockAuth())

/// Hace de PanelVeredicto: en cuanto se monta avisa de que el repaso está visto.
function CompletedReview() {
  const notify = useContext(ViewedReviewContext)
  useEffect(() => {
    notify?.(true)
  }, [notify])
  return <p>cierre</p>
}

function renderLayout(opts: { resultado?: ScenarioResult; decision?: React.ReactNode } = {}) {
  render(
    <MemoryRouter>
      <ScenarioLayout
        escenarioId="fisico/trampa-usb"
        resumen="Resumen"
        contexto={{ antes: 'antes', ahora: 'ahora' }}
        pantalla={<div>pantalla</div>}
        decision={opts.decision ?? <p>decision</p>}
        resultado={opts.resultado}
        onEmpezar={vi.fn()}
      />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))
}

// jsdom no implementa <dialog>.showModal, así que los tests no lo pulsan: lo
// que importa es qué control de salida se pinta y qué texto lleva el diálogo.
describe('EscenarioLayout · salida', () => {
  it('sin decidir: botón "Salir sin terminar" y aviso de que no se guarda', () => {
    renderLayout()

    expect(screen.getByRole('button', { name: '← Salir sin terminar' })).toBeDefined()
    expect(screen.getByText(/este intento no se va a guardar/)).toBeDefined()
  })

  it('decidido pero sin ver señales: botón "Salir" y aviso de señales pendientes', () => {
    renderLayout({ resultado: 'bad' })

    expect(screen.getByRole('button', { name: '← Salir' })).toBeDefined()
    expect(screen.getByText(/todavía no has visto las señales/i)).toBeDefined()
  })

  it('decidido y repaso visto: "Salir" es un enlace directo, sin botón de diálogo', () => {
    renderLayout({ resultado: 'bad', decision: <CompletedReview /> })

    expect(screen.getByRole('link', { name: '← Salir' }).getAttribute('href')).toBe('/seccion/fisico')
    expect(screen.queryByRole('button', { name: /Salir/ })).toBeNull()
  })
})
