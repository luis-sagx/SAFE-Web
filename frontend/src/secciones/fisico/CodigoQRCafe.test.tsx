import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CodigoQRCafe from './CodigoQRCafe'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CodigoQRCafe', () => {
  it('abre en el café con las tres opciones de conexión', () => {
    const telefono = empezar(<CodigoQRCafe />)

    expect(within(telefono).getByRole('button', { name: /Escanear el código QR/ })).toBeDefined()
    expect(within(telefono).getByRole('button', { name: /Preguntar al personal/ })).toBeDefined()
    expect(within(telefono).getByRole('button', { name: /Usar datos móviles/ })).toBeDefined()
  })

  it('escanear el QR desconocido no sale bien', async () => {
    const telefono = empezar(<CodigoQRCafe />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Escanear el código QR/ }))

    expect(await screen.findByText('✗ No salió bien')).toBeDefined()
  })

  it('preguntar al personal por la contraseña es la decisión bien resuelta', async () => {
    const telefono = empezar(<CodigoQRCafe />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Preguntar al personal/ }))

    expect(await screen.findByText('✓ Bien resuelto')).toBeDefined()
  })

  it('usar datos móviles queda a medias', async () => {
    const telefono = empezar(<CodigoQRCafe />)

    fireEvent.click(within(telefono).getByRole('button', { name: /Usar datos móviles/ }))

    expect(await screen.findByText('◐ A medias')).toBeDefined()
  })

  it('explica cuándo termina el escenario', () => {
    empezar(<CodigoQRCafe />)

    fireEvent.click(screen.getByText('¿Cuándo termina el escenario?'))

    expect(screen.getByText(/La primera opción que toques/)).toBeDefined()
  })
})
