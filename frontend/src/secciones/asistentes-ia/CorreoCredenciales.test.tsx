import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CorreoCredenciales from './CorreoCredenciales'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CorreoCredenciales', () => {
  it('muestra el borrador con el usuario y la contraseña reales', () => {
    const telefono = empezar(<CorreoCredenciales />)
    expect(within(telefono).getByText(/lejaramillo5/)).toBeDefined()
    expect(within(telefono).getByText(/45664329/)).toBeDefined()
  })

  it('enviar el usuario y la contraseña tal cual es el fallo', () => {
    empezar(<CorreoCredenciales />)
    fireEvent.click(screen.getByRole('button', { name: /Enviar el mensaje tal cual/ }))
    expect(screen.getByText('Credenciales de acceso compartidas con la IA')).toBeDefined()
  })

  it('pedir el correo sin la contraseña es el acierto', () => {
    empezar(<CorreoCredenciales />)
    fireEvent.click(
      screen.getByRole('button', { name: /Pedir que redacte el correo sin la contraseña/ }),
    )
    expect(screen.getByText('Correo redactado sin exponer el acceso')).toBeDefined()
  })

  it('enviar solo el usuario real deja la respuesta a medias', () => {
    empezar(<CorreoCredenciales />)
    fireEvent.click(screen.getByRole('button', { name: /Enviar el usuario real/ }))
    expect(screen.getByText('Solo protegiste la mitad del acceso')).toBeDefined()
  })
})
