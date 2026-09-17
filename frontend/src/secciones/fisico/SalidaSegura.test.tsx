import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SafeExit from './SalidaSegura'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function zoomIn(scene: HTMLElement) {
  fireEvent.click(within(scene).getByRole('button', { name: 'Acercarte a la pantalla' }))
}

function ensureDesktop(scene: HTMLElement) {
  zoomIn(scene)
  for (const close of within(scene).getAllByRole('button', { name: /^Cerrar la pestaña/ })) {
    fireEvent.click(close)
  }
  fireEvent.click(within(scene).getByRole('button', { name: 'Volver al escritorio' }))
  for (const document of within(scene).getAllByRole('button', { name: /^Guardar / })) {
    fireEvent.click(document)
  }
  fireEvent.click(within(scene).getByRole('button', { name: 'Bloquear la sesión' }))
}

describe('SalidaSegura', () => {
  it('abre con las cuatro pestañas, los tres documentos y la sesión sin bloquear', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    expect(within(scene).getAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(4)
    fireEvent.click(within(scene).getByRole('button', { name: 'Volver al escritorio' }))
    expect(within(scene).getAllByRole('button', { name: /^Guardar / })).toHaveLength(3)
    expect(within(scene).getByText(/0 de 3 guardados/)).toBeDefined()
  })

  it('el checklist va marcando lo que ya está hecho', () => {
    const scene = start(<SafeExit />)

    fireEvent.click(within(scene).getByRole('button', { name: 'Guardar Contratos en el cajón' }))

    expect(screen.getByText('(1 de 3)')).toBeDefined()
    expect(within(scene).getAllByRole('button', { name: /^Guardar / })).toHaveLength(2)
  })

  it('abre en la primera pestaña y muestra su URL', () => {
    const scene = start(<SafeExit />)

    expect(within(scene).getByText('intranet.andes.ec/rrhh/nominas')).toBeDefined()
  })

  it('en el escritorio el monitor es una miniatura: para tocar pestañas hay que acercarse', () => {
    const scene = start(<SafeExit />)

    expect(within(scene).queryAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(0)
    zoomIn(scene)
    expect(within(scene).getAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(4)
    // Acercada, lo demás de la escena queda fuera de alcance.
    // jsdom no aplica `inert` al árbol accesible: se comprueba el atributo.
    const paper = within(scene).getByRole('button', { name: 'Guardar Contratos en el cajón' })
    expect(paper.closest('[inert]')).not.toBeNull()
  })

  it('cerrar la pestaña del medio deja las demás en su orden', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    fireEvent.click(within(scene).getByRole('button', { name: 'Cerrar la pestaña Clientes' }))

    const names = within(scene)
      .getAllByRole('button', { name: /^Cerrar la pestaña/ })
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual([
      'Cerrar la pestaña Nóminas',
      'Cerrar la pestaña Contraseñas',
      'Cerrar la pestaña Reportes',
    ])
  })

  it('cerrar la pestaña activa pasa a la de al lado, no a una ventana en blanco', () => {
    const scene = start(<SafeExit />)

    zoomIn(scene)
    fireEvent.click(within(scene).getByRole('button', { name: 'Cerrar la pestaña Nóminas' }))

    expect(within(scene).getByText('vault.andes.ec/mis-claves')).toBeDefined()
  })

  it('con la sesión bloqueada no se puede tocar el navegador', () => {
    const scene = start(<SafeExit />)

    fireEvent.click(within(scene).getByRole('button', { name: 'Bloquear la sesión' }))

    expect(within(scene).queryAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(0)
    expect(within(scene).getByText('SESIÓN BLOQUEADA')).toBeDefined()

    // Desbloquear devuelve el navegador: bloquearse antes de tiempo no deja
    // encerrado a nadie.
    fireEvent.click(within(scene).getByRole('button', { name: 'Desbloquear la sesión' }))
    zoomIn(scene)
    expect(within(scene).getAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(4)
  })

  it('el repaso de señales resalta la parte de la escena de la que habla', async () => {
    const scene = start(<SafeExit />)

    ensureDesktop(scene)
    fireEvent.click(screen.getByRole('button', { name: 'Irme: el puesto está listo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        scene.querySelector('[data-signal="pestanas"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
    // Y la escena vuelve a mostrar lo que ya se había cerrado: si no, no habría
    // nada que señalar.
    const monitor = scene.querySelector<HTMLElement>('[data-signal="pestanas"]')!
    expect(monitor.querySelectorAll('[data-pestana]')).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        scene.querySelector('[data-signal="papeles"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })

  it('irse con todo asegurado cierra bien el escenario', async () => {
    const scene = start(<SafeExit />)

    ensureDesktop(scene)
    fireEvent.click(screen.getByRole('button', { name: 'Irme: el puesto está listo' }))

    expect(await screen.findByText('Puesto asegurado')).toBeDefined()
  })

  it('irse dejando cosas a la vista es un fallo, y dice qué quedó expuesto', async () => {
    const scene = start(<SafeExit />)

    fireEvent.click(within(scene).getByRole('button', { name: 'Bloquear la sesión' }))
    fireEvent.click(screen.getByRole('button', { name: 'Irme de la oficina' }))

    expect(await screen.findByText('Dejaste tu puesto expuesto')).toBeDefined()
    expect(screen.getByText(/4 pestañas abiertas/)).toBeDefined()
    expect(screen.getByText(/3 documentos sobre el escritorio/)).toBeDefined()
  })

  it('muestra el panel "¿Qué haces?" con la pista de los tres pasos', () => {
    start(<SafeExit />)

    expect(screen.getByText('¿Qué haces?')).toBeDefined()
    fireEvent.click(screen.getByText('No sé por dónde empezar'))
    expect(screen.getByText(/Puedes irte cuando quieras/)).toBeDefined()
  })

  it('explica cuándo termina el escenario', () => {
    start(<SafeExit />)

    fireEvent.click(screen.getByText('¿Cuándo termina el escenario?'))

    expect(screen.getByText(/el escenario registra si dejaste/)).toBeDefined()
  })
})
