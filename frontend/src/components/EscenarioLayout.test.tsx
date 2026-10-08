import { fireEvent, render, screen } from '@testing-library/react'
import { useContext, useEffect } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ScenarioLayout from './EscenarioLayout'
import { ViewedReviewContext } from './ui/repasoVisto'
import type { ScenarioResult } from '../hooks/useScenarioRun'
import { PhotoScene } from '../secciones/fisico/EscenaFoto'

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

describe('EscenarioLayout · escena fotográfica', () => {
  it.each([
    { width: 1024, height: 1024, ratio: 1 },
    { width: 1672, height: 941, ratio: 1672 / 941 },
  ])('adapta el marco a una foto de $width × $height', ({ width, height, ratio }) => {
    render(
      <MemoryRouter>
        <ScenarioLayout
          escenarioId="fisico/trampa-usb"
          resumen="Resumen"
          contexto={{ antes: 'antes', ahora: 'ahora' }}
          pantalla={<PhotoScene src="/foto.webp" alt="Foto de prueba" />}
          decision={<p>Decisión</p>}
          onEmpezar={vi.fn()}
          dispositivo="escena"
        />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }))

    const photo = screen.getByRole('img', { name: 'Foto de prueba' })
    Object.defineProperties(photo, {
      naturalWidth: { value: width },
      naturalHeight: { value: height },
    })
    fireEvent.load(photo)

    const frame = document.getElementById('pantalla-escenario') as HTMLElement
    expect(Number.parseFloat(frame.style.aspectRatio)).toBeCloseTo(ratio)
    expect(Number(frame.style.getPropertyValue('--scene-ratio'))).toBeCloseTo(ratio)
  })
})
