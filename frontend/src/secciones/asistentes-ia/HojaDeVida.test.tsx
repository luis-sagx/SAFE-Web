import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import HojaDeVida from './HojaDeVida'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('HojaDeVida', () => {
  it('el chat alterna: escribes tú, contesta la IA, y recién entonces eliges', () => {
    const pantalla = empezar(<HojaDeVida />)
    expect(
      within(pantalla).getByText('Hola, ayúdame a mejorar la hoja de vida de mi prima.'),
    ).toBeDefined()
    expect(within(pantalla).getByText(/Pégame el contenido que quieres mejorar/)).toBeDefined()
  })

  it('se abre en el computador, con la dirección del servicio a la vista', () => {
    const pantalla = empezar(<HojaDeVida />)
    expect(within(pantalla).getAllByText(/chat\.asistente-ia\.com/).length).toBeGreaterThan(0)
  })

  it('la hoja es la de otra persona, con su propia identidad ficticia', () => {
    const pantalla = empezar(<HojaDeVida />)
    expect(within(pantalla).getByText(/^Aquí va: Paola Guamán, cédula 1799999980/)).toBeDefined()
    expect(within(pantalla).getAllByText(/correo paola\.guaman@safeweb\.com/).length).toBe(2)
  })

  it('pegar la hoja completa es el fallo, y cada dato se señala solo', () => {
    const pantalla = empezar(<HojaDeVida />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /fecha de nacimiento 12\/03\/1999/ }))
    expect(
      screen.getByText('La hoja de vida entera de tu prima quedó en un servicio externo'),
    ).toBeDefined()
    expect(pantalla.querySelector('[data-signal="dato-cedula"]')?.textContent).toBe('1799999980')
    expect(pantalla.querySelector('[data-signal="dato-nacimiento"]')?.textContent).toBe('12/03/1999')
    expect(pantalla.querySelector('[data-signal="dato-direccion"]')?.textContent).toBe(
      'Av. Napo y Quimiag, casa 214',
    )
    expect(pantalla.querySelector('[data-signal="dato-telefono"]')?.textContent).toBe('099 000 0011')
  })

  it('dejar solo el contacto deja la respuesta a medias', () => {
    const pantalla = empezar(<HojaDeVida />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /^Aquí va: Paola Guamán, teléfono/ }))
    expect(screen.getByText('Quitaste lo peor, pero dejaste cómo encontrarla')).toBeDefined()
  })

  it('pegar solo la experiencia y los estudios es el acierto', () => {
    const pantalla = empezar(<HojaDeVida />)
    fireEvent.click(within(pantalla).getByRole('button', { name: /solo la parte que hay que mejorar/ }))
    expect(screen.getByText('Hoja de vida mejorada sin entregar los datos de nadie')).toBeDefined()
  })
})
