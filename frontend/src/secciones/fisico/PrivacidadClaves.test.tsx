import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import PasswordPrivacy from './PrivacidadClaves'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function block(container: HTMLElement) {
  fireEvent.click(within(container).getByRole('button', { name: 'Inicio y apagado' }))
  fireEvent.click(within(container).getByRole('menuitem', { name: 'Bloquear' }))
}

function closeAll(container: HTMLElement) {
  for (const close of within(container).getAllByRole('button', { name: /^Cerrar / })) {
    fireEvent.click(close)
  }
}

describe('PrivacidadClaves', () => {
  it('abre con las tres aplicaciones y la sesión desbloqueada', () => {
    const container = start(<PasswordPrivacy />)

    expect(within(container).getByRole('region', { name: 'Bóveda Andes — Mis credenciales' })).toBeDefined()
    expect(within(container).getByRole('region', { name: 'Explorador de archivos' })).toBeDefined()
    expect(within(container).getByRole('region', { name: 'Navegador — Correo Andes' })).toBeDefined()
    expect(within(container).getAllByRole('button', { name: /^Cerrar / })).toHaveLength(3)
  })

  it('cerrar una ventana deja las otras dos en pie', () => {
    const container = start(<PasswordPrivacy />)

    fireEvent.click(within(container).getByRole('button', { name: 'Cerrar Explorador de archivos' }))

    expect(within(container).queryByRole('region', { name: 'Explorador de archivos' })).toBeNull()
    expect(within(container).queryByText('mi_salario_2026.pdf')).toBeNull()
    expect(within(container).getAllByRole('button', { name: /^Cerrar / })).toHaveLength(2)
  })

  it('la barra de tareas lista lo abierto y salta a esa ventana', () => {
    const container = start(<PasswordPrivacy />)

    expect(within(container).getByRole('button', { name: 'Credenciales' })).toBeDefined()
    expect(within(container).getByRole('button', { name: 'Archivos' })).toBeDefined()
    expect(within(container).getByRole('button', { name: 'Navegador' })).toBeDefined()

    const vault = within(container).getByRole('region', { name: 'Bóveda Andes — Mis credenciales' })
    const email = within(container).getByRole('region', { name: 'Navegador — Correo Andes' })
    fireEvent.click(within(container).getByRole('button', { name: 'Credenciales' }))
    expect(Number(vault.style.zIndex)).toBeGreaterThan(Number(email.style.zIndex))

    // Y al cerrarla desaparece de la barra.
    fireEvent.click(within(container).getByRole('button', { name: 'Cerrar Explorador de archivos' }))
    expect(within(container).queryByRole('button', { name: 'Archivos' })).toBeNull()
  })

  it('pulsar una ventana la trae al frente', () => {
    const container = start(<PasswordPrivacy />)

    const vault = within(container).getByRole('region', { name: 'Bóveda Andes — Mis credenciales' })
    const email = within(container).getByRole('region', { name: 'Navegador — Correo Andes' })
    // El correo arranca al frente: es la última de la pila.
    expect(Number(email.style.zIndex)).toBeGreaterThan(Number(vault.style.zIndex))

    fireEvent.mouseDown(vault)

    expect(Number(vault.style.zIndex)).toBeGreaterThan(Number(email.style.zIndex))
  })

  it('el menú de encendido bloquea, y apagar no responde', () => {
    const container = start(<PasswordPrivacy />)

    fireEvent.click(within(container).getByRole('button', { name: 'Inicio y apagado' }))
    expect(
      within(container).getByRole('menuitem', { name: 'Apagar' }).getAttribute('aria-disabled'),
    ).toBe('true')
    fireEvent.click(within(container).getByRole('menuitem', { name: 'Bloquear' }))

    expect(within(container).queryAllByRole('button', { name: /^Cerrar / })).toHaveLength(0)
    expect(within(container).getByText(/Sesión bloqueada/)).toBeDefined()
  })

  it('cerrar todo y bloquear antes de girarse es la decisión segura', async () => {
    const container = start(<PasswordPrivacy />)

    closeAll(container)
    expect(within(container).getByText('Escritorio despejado')).toBeDefined()
    block(container)
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('Nada que mirar')).toBeDefined()
  })

  it('bloquear con las aplicaciones puestas queda a medias, no aprobado', async () => {
    const container = start(<PasswordPrivacy />)

    block(container)
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('A medio resolver')).toBeDefined()
    expect(screen.getByText(/vuelve a estar todo a la vista/)).toBeDefined()
  })

  it('girarse sin hacer nada lo deja todo expuesto', async () => {
    start(<PasswordPrivacy />)

    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('Lo vio todo')).toBeDefined()
    expect(screen.getByText(/3 aplicaciones abiertas/)).toBeDefined()
  })

  it('el repaso de señales reabre la aplicación de la que habla y la resalta', async () => {
    const container = start(<PasswordPrivacy />)

    closeAll(container)
    block(container)
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        container.querySelector('[data-signal="credenciales"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        container.querySelector('[data-signal="correo"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })
})
