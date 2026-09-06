import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import PrivacidadClaves from './PrivacidadClaves'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function bloquear(pantalla: HTMLElement) {
  fireEvent.click(within(pantalla).getByRole('button', { name: 'Inicio y apagado' }))
  fireEvent.click(within(pantalla).getByRole('menuitem', { name: 'Bloquear' }))
}

function cerrarTodo(pantalla: HTMLElement) {
  for (const cerrar of within(pantalla).getAllByRole('button', { name: /^Cerrar / })) {
    fireEvent.click(cerrar)
  }
}

describe('PrivacidadClaves', () => {
  it('abre con las tres aplicaciones y la sesión desbloqueada', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    expect(within(pantalla).getByRole('region', { name: 'Bóveda Andes — Mis credenciales' })).toBeDefined()
    expect(within(pantalla).getByRole('region', { name: 'Explorador de archivos' })).toBeDefined()
    expect(within(pantalla).getByRole('region', { name: 'Navegador — Correo Andes' })).toBeDefined()
    expect(within(pantalla).getAllByRole('button', { name: /^Cerrar / })).toHaveLength(3)
  })

  it('cerrar una ventana deja las otras dos en pie', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    fireEvent.click(within(pantalla).getByRole('button', { name: 'Cerrar Explorador de archivos' }))

    expect(within(pantalla).queryByRole('region', { name: 'Explorador de archivos' })).toBeNull()
    expect(within(pantalla).queryByText('mi_salario_2026.pdf')).toBeNull()
    expect(within(pantalla).getAllByRole('button', { name: /^Cerrar / })).toHaveLength(2)
  })

  it('la barra de tareas lista lo abierto y salta a esa ventana', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    expect(within(pantalla).getByRole('button', { name: 'Credenciales' })).toBeDefined()
    expect(within(pantalla).getByRole('button', { name: 'Archivos' })).toBeDefined()
    expect(within(pantalla).getByRole('button', { name: 'Navegador' })).toBeDefined()

    const boveda = within(pantalla).getByRole('region', { name: 'Bóveda Andes — Mis credenciales' })
    const correo = within(pantalla).getByRole('region', { name: 'Navegador — Correo Andes' })
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Credenciales' }))
    expect(Number(boveda.style.zIndex)).toBeGreaterThan(Number(correo.style.zIndex))

    // Y al cerrarla desaparece de la barra.
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Cerrar Explorador de archivos' }))
    expect(within(pantalla).queryByRole('button', { name: 'Archivos' })).toBeNull()
  })

  it('pulsar una ventana la trae al frente', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    const boveda = within(pantalla).getByRole('region', { name: 'Bóveda Andes — Mis credenciales' })
    const correo = within(pantalla).getByRole('region', { name: 'Navegador — Correo Andes' })
    // El correo arranca al frente: es la última de la pila.
    expect(Number(correo.style.zIndex)).toBeGreaterThan(Number(boveda.style.zIndex))

    fireEvent.mouseDown(boveda)

    expect(Number(boveda.style.zIndex)).toBeGreaterThan(Number(correo.style.zIndex))
  })

  it('el menú de encendido bloquea, y apagar no responde', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    fireEvent.click(within(pantalla).getByRole('button', { name: 'Inicio y apagado' }))
    expect(
      within(pantalla).getByRole('menuitem', { name: 'Apagar' }).getAttribute('aria-disabled'),
    ).toBe('true')
    fireEvent.click(within(pantalla).getByRole('menuitem', { name: 'Bloquear' }))

    expect(within(pantalla).queryAllByRole('button', { name: /^Cerrar / })).toHaveLength(0)
    expect(within(pantalla).getByText(/Sesión bloqueada/)).toBeDefined()
  })

  it('cerrar todo y bloquear antes de girarse es la decisión segura', async () => {
    const pantalla = empezar(<PrivacidadClaves />)

    cerrarTodo(pantalla)
    expect(within(pantalla).getByText('Escritorio despejado')).toBeDefined()
    bloquear(pantalla)
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('Nada que mirar')).toBeDefined()
  })

  it('bloquear con las aplicaciones puestas queda a medias, no aprobado', async () => {
    const pantalla = empezar(<PrivacidadClaves />)

    bloquear(pantalla)
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('A medio resolver')).toBeDefined()
    expect(screen.getByText(/vuelve a estar todo a la vista/)).toBeDefined()
  })

  it('girarse sin hacer nada lo deja todo expuesto', async () => {
    empezar(<PrivacidadClaves />)

    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('Lo vio todo')).toBeDefined()
    expect(screen.getByText(/3 aplicaciones abiertas/)).toBeDefined()
  })

  it('el repaso de señales reabre la aplicación de la que habla y la resalta', async () => {
    const pantalla = empezar(<PrivacidadClaves />)

    cerrarTodo(pantalla)
    bloquear(pantalla)
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        pantalla.querySelector('[data-signal="credenciales"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }))

    await waitFor(() => {
      expect(
        pantalla.querySelector('[data-signal="correo"]')?.classList.contains('senal-resaltada'),
      ).toBe(true)
    })
  })
})
