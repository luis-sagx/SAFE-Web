import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import ClaveNueva from './ClaveNueva'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('ClaveNueva', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const pantalla = empezar(<ClaveNueva />)
    expect(
      within(pantalla).getByText('Hola, necesito una contraseña nueva para el sistema del trabajo.'),
    ).toBeDefined()
    expect(within(pantalla).getByText(/qué requisitos exige el sistema/)).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const pantalla = empezar(<ClaveNueva />)
    expect(within(pantalla).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('pegar la contraseña actual es el fallo', () => {
    const pantalla = empezar(<ClaveNueva />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /Mi clave de ahora es Clave-de-practica-2026/ }))
    expect(screen.getByText('Tu contraseña real quedó escrita en la IA')).toBeDefined()
    // La clave se señala dos veces: la que escribiste y la que la IA repitió.
    expect(pantalla.querySelector('[data-signal="clave-escrita"]')?.textContent).toBe(
      'Clave-de-practica-2026',
    )
    expect(pantalla.querySelector('[data-signal="clave-repetida"]')).not.toBeNull()
  })

  it('contar el patrón con el que la armas deja la respuesta a medias', () => {
    const pantalla = empezar(<ClaveNueva />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /mi apellido y el año/ }))
    expect(screen.getByText('Diste el patrón, no la contraseña')).toBeDefined()
  })

  it('pedir ejemplos solo con los requisitos del sistema es el acierto', () => {
    const pantalla = empezar(<ClaveNueva />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /Dame tres ejemplos/ }))
    expect(screen.getByText('Contraseña nueva sin entregar la anterior')).toBeDefined()
  })
})
