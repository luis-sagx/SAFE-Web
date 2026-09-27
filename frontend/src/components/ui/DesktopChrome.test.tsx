import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EmailBody } from './DesktopChrome'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ correoSimulado: 'mariaperez@safeweb.com' }),
}))

describe('CuerpoCorreo', () => {
  it('presenta la identidad visual declarada por el remitente sin reemplazar el contenido', () => {
    render(
      <EmailBody
        asunto="Aviso importante"
        remitente={{ nombre: 'TiendaExpress', direccion: 'seguridad@tiendaexpress.com.ec' }}
        recibido="hoy 08:15"
        marca={{
          nombre: 'TiendaExpress',
          detalle: 'Seguridad de la información',
          icono: 'tienda',
          variante: 'seguridad',
        }}
      >
        <p>Contenido que debe seguir disponible.</p>
      </EmailBody>,
    )

    const brand = screen.getByRole('group', { name: 'Identidad visual de TiendaExpress' })
    expect(brand.textContent).toContain('TiendaExpress')
    expect(brand.textContent).toContain('Seguridad de la información')
    expect(screen.getByText('Contenido que debe seguir disponible.')).toBeDefined()
  })

  it('etiqueta explícitamente quién envía y quién recibe el mensaje', () => {
    render(
      <EmailBody
        asunto="Aviso"
        remitente={{ nombre: 'Banco del Litoral', direccion: 'notificaciones@bancodel1itoral.com' }}
        recibido="hoy 08:15"
        destinatario="luissagnay@safeweb.com"
      >
        <p>Mensaje de prueba.</p>
      </EmailBody>,
    )

    expect(screen.getByText('de: notificaciones@bancodel1itoral.com')).toBeDefined()
    expect(screen.getByText('para: luissagnay@safeweb.com')).toBeDefined()
  })
})

// jsdom no calcula layout: se simulan medidas para ejercitar dónde cae el globo.
function simulateLayout(target: DOMRect, viewHeight = 500) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    return this.hasAttribute('data-signal') ? target : new DOMRect(0, 0, 600, viewHeight)
  })
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(600)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(viewHeight)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(80)
  const scrollTo = vi.fn()
  Element.prototype.scrollTo = scrollTo
  return scrollTo
}

function renderGuide(targetId: string) {
  return render(
    <EmailBody
      asunto="Aviso"
      remitente={{ nombre: 'Lotería', direccion: 'premios@hotmail.com', senalDireccion: 'remitente' }}
      recibido="hoy 08:15"
      guia={<p>Pista de prueba</p>}
      guiaTargetId={targetId}
    >
      <p>
        Pague <mark data-signal="pago">USD 85</mark> hoy.
      </p>
    </EmailBody>,
  )
}

const bubbleOf = () => screen.getByText('Pista de prueba').parentElement as HTMLElement

describe('globo de la guía', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('se coloca encima de la señal cuando cabe y la centra en la vista', () => {
    const scrollTo = simulateLayout(new DOMRect(100, 300, 120, 20))
    renderGuide('pago')

    const bubble = bubbleOf()
    expect(bubble.dataset.placement).toBe('above')
    expect(bubble.style.top).toBe('206px')
    expect(bubble.style.left).toBe('12px')
    expect(bubble.style.width).toBe('360px')
    expect(bubble.style.getPropertyValue('--arrow-left')).toBe('148px')
    expect(scrollTo).toHaveBeenCalledWith({ top: 13, behavior: 'smooth' })
  })

  it('se coloca debajo cuando la señal está arriba del todo', () => {
    simulateLayout(new DOMRect(100, 10, 120, 20))
    renderGuide('remitente')

    const bubble = bubbleOf()
    expect(bubble.dataset.placement).toBe('below')
    expect(bubble.style.top).toBe('44px')
    expect(document.querySelector('[data-signal="remitente"]')?.classList).toContain('guide-focus')
  })

  it('alinea arriba si globo y señal no caben juntos en la vista', () => {
    const scrollTo = simulateLayout(new DOMRect(100, 300, 120, 20), 60)
    renderGuide('pago')

    expect(scrollTo).toHaveBeenCalledWith({ top: 194, behavior: 'smooth' })
  })

  it('sin la señal en pantalla no mueve la vista ni resalta nada', () => {
    const scrollTo = simulateLayout(new DOMRect(100, 300, 120, 20))
    renderGuide('inexistente')

    expect(scrollTo).not.toHaveBeenCalled()
    expect(document.querySelector('.guide-focus')).toBeNull()
  })

  it('se recoloca al cambiar de tamaño y limpia el resaltado al desmontar', () => {
    let resize: () => void = () => {}
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    simulateLayout(new DOMRect(100, 300, 120, 20))
    const { unmount } = renderGuide('pago')

    vi.mocked(Element.prototype.getBoundingClientRect).mockImplementation(function (this: Element) {
      return this.hasAttribute('data-signal')
        ? new DOMRect(100, 10, 120, 20)
        : new DOMRect(0, 0, 600, 500)
    })
    act(() => resize())
    expect(bubbleOf().dataset.placement).toBe('below')

    const target = document.querySelector('[data-signal="pago"]')
    unmount()
    expect(target?.classList).not.toContain('senal-resaltada')
  })
})
