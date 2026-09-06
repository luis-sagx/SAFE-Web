import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import PrivacidadClaves from './PrivacidadClaves'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function cerrarTodo(pantalla: HTMLElement) {
  for (const cerrar of within(pantalla).getAllByRole('button', { name: /^Cerrar la pestaña/ })) {
    fireEvent.click(cerrar)
  }
}

describe('PrivacidadClaves', () => {
  it('abre con las tres pestañas sensibles y la sesión desbloqueada', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    expect(within(pantalla).getAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(3)
    expect(within(pantalla).getByText('vault.andes.ec/mis-claves')).toBeDefined()
  })

  it('cambiar de pestaña muestra su página y su URL', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    fireEvent.click(within(pantalla).getByText('Mis documentos'))

    expect(within(pantalla).getByText('drive.andes.ec/mis-documentos')).toBeDefined()
    expect(within(pantalla).getByText('mi_salario_2026.pdf')).toBeDefined()
  })

  it('bloquear tapa la ventana entera: no se puede cerrar nada sin desbloquear', () => {
    const pantalla = empezar(<PrivacidadClaves />)

    fireEvent.click(within(pantalla).getByRole('button', { name: 'Bloquear pantalla' }))

    expect(within(pantalla).queryAllByRole('button', { name: /^Cerrar la pestaña/ })).toHaveLength(0)
    expect(within(pantalla).getByText(/Sesión bloqueada/)).toBeDefined()
  })

  it('cerrar todo y bloquear antes de girarse es la decisión segura', async () => {
    const pantalla = empezar(<PrivacidadClaves />)

    cerrarTodo(pantalla)
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Bloquear pantalla' }))
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('Nada que mirar')).toBeDefined()
  })

  it('bloquear con las pestañas puestas queda a medias, no aprobado', async () => {
    const pantalla = empezar(<PrivacidadClaves />)

    fireEvent.click(within(pantalla).getByRole('button', { name: 'Bloquear pantalla' }))
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('A medio resolver')).toBeDefined()
    expect(screen.getByText(/vuelve a estar todo a la vista/)).toBeDefined()
  })

  it('girarse sin hacer nada lo deja todo expuesto', async () => {
    empezar(<PrivacidadClaves />)

    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))

    expect(await screen.findByText('Lo vio todo')).toBeDefined()
    expect(screen.getByText(/3 pestañas abiertas/)).toBeDefined()
  })

  it('el repaso de señales reabre la pestaña de la que habla y la resalta', async () => {
    const pantalla = empezar(<PrivacidadClaves />)

    cerrarTodo(pantalla)
    fireEvent.click(within(pantalla).getByRole('button', { name: 'Bloquear pantalla' }))
    fireEvent.click(screen.getByRole('button', { name: 'Girarme a atenderlo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ver las señales' }))

    await waitFor(() => {
      expect(
        pantalla.querySelector('[data-signal="claves"]')?.classList.contains('senal-resaltada'),
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
