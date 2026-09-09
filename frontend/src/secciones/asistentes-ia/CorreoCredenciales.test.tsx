import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CorreoCredenciales from './CorreoCredenciales'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CorreoCredenciales', () => {
  it('el chat arranca con un saludo, no con el usuario y la contraseña ya mandados', () => {
    const telefono = empezar(<CorreoCredenciales />)
    expect(within(telefono).getByText('Hola, ¿en qué puedo ayudarte?')).toBeDefined()
  })

  it('las respuestas muestran el texto completo que se enviaría', () => {
    const telefono = empezar(<CorreoCredenciales />)
    expect(within(telefono).getByText(/lejaramillo5 y su contraseña es 45664329/)).toBeDefined()
  })

  it('enviar el usuario y la contraseña tal cual es el fallo', () => {
    const telefono = empezar(<CorreoCredenciales />)
    fireEvent.click(
      within(telefono).getByRole('button', { name: /lejaramillo5 y su contraseña es 45664329/ }),
    )
    expect(screen.getByText('Credenciales de acceso compartidas con la IA')).toBeDefined()
  })

  it('pedir el correo sin la contraseña es el acierto', () => {
    const telefono = empezar(<CorreoCredenciales />)
    fireEvent.click(
      within(telefono).getByRole('button', { name: /usuario y contraseña de acceso le llegarán por separado/ }),
    )
    expect(screen.getByText('Correo redactado sin exponer el acceso')).toBeDefined()
  })

  it('enviar solo el usuario real deja la respuesta a medias', () => {
    const telefono = empezar(<CorreoCredenciales />)
    fireEvent.click(within(telefono).getByRole('button', { name: /Inventa un ejemplo/ }))
    expect(screen.getByText('Solo protegiste la mitad del acceso')).toBeDefined()
  })
})
