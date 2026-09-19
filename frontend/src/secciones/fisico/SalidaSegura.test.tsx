import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SafeExit from './SalidaSegura'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function zoomIn(scene: HTMLElement) {
  fireEvent.click(within(scene).getByRole('button', { name: 'Acercarte a la pantalla' }))
}

function lockFromTaskbar(scene: HTMLElement) {
  fireEvent.click(within(scene).getByRole('button', { name: 'Bloquear' }))
}

function drawer(scene: HTMLElement) {
  return within(scene).getByRole('button', { name: /^Cajón con llave/ })
}

function secureEverything(scene: HTMLElement) {
  zoomIn(scene)
  fireEvent.click(within(scene).getByRole('button', { name: 'Cerrar el navegador' }))
  fireEvent.click(within(scene).getByRole('button', { name: 'Volver al escritorio' }))
  fireEvent.click(drawer(scene))
  fireEvent.click(within(scene).getByRole('button', { name: 'Bloquear la sesión' }))
}

describe('SalidaSegura', () => {
  it('abre con tres pestañas, tres documentos y la sesión sin bloquear', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    const tabs = within(scene).getAllByRole('button', { name: /^Cerrar la pestaña/ })
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Cerrar la pestaña Nóminas',
      'Cerrar la pestaña Clientes',
      'Cerrar la pestaña Reportes',
    ])
    fireEvent.click(within(scene).getByRole('button', { name: 'Volver al escritorio' }))
    expect(within(scene).getAllByRole('button', { name: /^Guardar / })).toHaveLength(3)
    // 3 pestañas + 3 documentos + sesión.
    expect(within(scene).getByRole('status').textContent).toBe('Quedan 7 cosas a la vista')
  })

  it('el panel no nombra las tareas: dice cuánto queda, no qué', () => {
    start(<SafeExit />)

    expect(screen.queryByText(/Cerrar las pestañas del navegador/)).toBeNull()
    expect(screen.queryByText(/Guardar los documentos en el cajón/)).toBeNull()
  })

  it('tocar una hoja la guarda en el cajón', () => {
    const scene = start(<SafeExit />)

    fireEvent.click(within(scene).getByRole('button', { name: 'Guardar Contratos en el cajón' }))

    expect(within(scene).queryByRole('button', { name: 'Guardar Contratos en el cajón' })).toBeNull()
    expect(within(scene).getByRole('status').textContent).toBe('Quedan 6 cosas a la vista')
    expect(within(scene).getByText('1 cosa guardada')).toBeDefined()
  })

  it('arrastrar una hoja hasta el cajón la guarda; soltarla fuera la deja donde estaba', () => {
    const scene = start(<SafeExit />)
    vi.spyOn(drawer(scene), 'getBoundingClientRect').mockReturnValue(new DOMRect(800, 100, 200, 300))
    const sheet = () => within(scene).queryByRole('button', { name: 'Guardar Nóminas en el cajón' })

    // Mientras se arrastra, la hoja original queda oculta: se guarda la referencia.
    let element = sheet()!
    fireEvent.pointerDown(element, { button: 0, pointerId: 1, clientX: 100, clientY: 400 })
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 300, clientY: 400 })
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 300, clientY: 400 })
    fireEvent.click(element)
    expect(sheet()).not.toBeNull()

    element = sheet()!
    fireEvent.pointerDown(element, { button: 0, pointerId: 1, clientX: 100, clientY: 400 })
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 900, clientY: 200 })
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 900, clientY: 200 })
    expect(sheet()).toBeNull()

    // La hoja guardada desapareció sin disparar su clic: el siguiente toque
    // sobre otra hoja tiene que funcionar igual.
    const other = within(scene).getByRole('button', { name: 'Guardar Contratos en el cajón' })
    fireEvent.pointerDown(other, { button: 0, pointerId: 1, clientX: 50, clientY: 400 })
    fireEvent.pointerUp(other, { pointerId: 1, clientX: 50, clientY: 400 })
    fireEvent.click(other)
    expect(within(scene).queryByRole('button', { name: 'Guardar Contratos en el cajón' })).toBeNull()
  })

  it('tocar el cajón guarda todos los documentos', () => {
    const scene = start(<SafeExit />)

    fireEvent.click(drawer(scene))

    expect(within(scene).queryAllByRole('button', { name: /^Guardar / })).toHaveLength(0)
    expect(within(scene).getByText('3 cosas guardadas')).toBeDefined()
  })

  it('la ✕ de la ventana cierra todas las pestañas de una vez', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    fireEvent.click(within(scene).getByRole('button', { name: 'Cerrar el navegador' }))

    expect(within(scene).queryAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(0)
    expect(within(scene).getByText('No queda ninguna pestaña abierta')).toBeDefined()
  })

  it('la sesión se bloquea con el botón a la vista de la barra de tareas', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    lockFromTaskbar(scene)

    expect(within(scene).getByText('SESIÓN BLOQUEADA')).toBeDefined()
    expect(within(scene).queryByRole('button', { name: 'Volver al escritorio' })).toBeNull()
    expect(within(scene).queryAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(0)
  })

  it('también se bloquea desde el teclado del escritorio, sin entrar a la computadora', () => {
    const scene = start(<SafeExit />)

    fireEvent.click(within(scene).getByRole('button', { name: 'Bloquear la sesión' }))

    expect(within(scene).getByText('SESIÓN BLOQUEADA')).toBeDefined()
    expect(within(scene).getByRole('status').textContent).toBe('Quedan 6 cosas a la vista')
  })

  it('tocar la pantalla bloqueada la desbloquea y la abre', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    lockFromTaskbar(scene)
    fireEvent.click(within(scene).getByRole('button', { name: 'Desbloquear la sesión' }))

    expect(within(scene).getAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(3)
  })

  it('abre en la primera pestaña y muestra su URL', () => {
    const scene = start(<SafeExit />)

    expect(within(scene).getByText('intranet.andes.ec/rrhh/nominas')).toBeDefined()
  })

  it('cerrar la pestaña activa pasa a la de al lado, no a una ventana en blanco', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    fireEvent.click(within(scene).getByRole('button', { name: 'Cerrar la pestaña Nóminas' }))

    expect(within(scene).getByText('crm.andes.ec/clientes-vip')).toBeDefined()
  })

  it('en el escritorio el monitor es una miniatura: para tocar pestañas hay que acercarse', () => {
    const scene = start(<SafeExit />)

    expect(within(scene).queryAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(0)
    zoomIn(scene)
    // jsdom no aplica `inert` al árbol accesible: se comprueba el atributo.
    const paper = within(scene).getByRole('button', { name: 'Guardar Contratos en el cajón' })
    expect(paper.closest('[inert]')).not.toBeNull()
  })

  it('irse con todo asegurado cierra bien el escenario', async () => {
    const scene = start(<SafeExit />)

    secureEverything(scene)
    expect(within(scene).getByRole('status').textContent).toBe('Nada a la vista')
    fireEvent.click(screen.getByRole('button', { name: 'Irme de la oficina' }))

    expect(await screen.findByText('Puesto asegurado')).toBeDefined()
  })

  it('irse dejando cosas a la vista es un fallo, y dice qué quedó expuesto', async () => {
    start(<SafeExit />)

    fireEvent.click(screen.getByRole('button', { name: 'Irme de la oficina' }))

    expect(await screen.findByText('Dejaste tu puesto expuesto')).toBeDefined()
    expect(screen.getByText(/3 pestañas abiertas/)).toBeDefined()
    expect(screen.getByText(/3 documentos confidenciales/)).toBeDefined()
    expect(screen.getByText(/la sesión sin bloquear/)).toBeDefined()
  })

  it('el repaso de señales resalta la parte de la escena de la que habla', async () => {
    const scene = start(<SafeExit />)

    secureEverything(scene)
    fireEvent.click(screen.getByRole('button', { name: 'Irme de la oficina' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar → Ver las señales' }))

    await waitFor(() => {
      expect(
        scene.querySelector('[data-signal="pestanas"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
    // Y la escena vuelve a mostrar lo que ya se había cerrado: si no, no habría
    // nada que señalar.
    const monitor = scene.querySelector<HTMLElement>('[data-signal="pestanas"]')!
    expect(monitor.querySelectorAll('[data-pestana]')).toHaveLength(3)
  })

  it('muestra la pista con cómo se hace cada cosa', () => {
    start(<SafeExit />)

    fireEvent.click(screen.getByText('No sé por dónde empezar'))
    expect(screen.getByText(/Puedes irte cuando quieras/)).toBeDefined()
  })

  it('en celular la miniatura del monitor no se reduce más allá de lo legible', () => {
    class FakeResizeObserver {
      constructor(private readonly cb: () => void) {
        FakeResizeObserver.last = this
      }
      static last: FakeResizeObserver | null = null
      observe = vi.fn()
      disconnect = vi.fn()
      trigger() {
        this.cb()
      }
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)

    const scene = start(<SafeExit />)
    const canvas = scene.querySelector('[data-signal="pestanas"] > div') as HTMLElement
    const monitor = canvas.parentElement as HTMLElement
    // Foto angosta de celular: el monitor mide una fracción diminuta del
    // lienzo de escritorio (60rem), como pasaba en el bug del issue #225.
    Object.defineProperty(monitor, 'clientWidth', { value: 60, configurable: true })
    Object.defineProperty(canvas, 'offsetWidth', { value: 960, configurable: true })

    act(() => {
      FakeResizeObserver.last?.trigger()
    })

    expect(canvas.style.transform).toBe('scale(0.32)')
    vi.unstubAllGlobals()
  })
})
