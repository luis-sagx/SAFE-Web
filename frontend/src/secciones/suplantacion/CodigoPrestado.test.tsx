import { fireEvent, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CodigoPrestado from './CodigoPrestado'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

describe('CodigoPrestado', () => {
  it('al abrir SMS vuelve al chat que sigue, no al chat inicial', () => {
    const telefono = empezar(<CodigoPrestado />)

    fireEvent.click(within(telefono).getByRole('button', { name: 'Deja veo si me llegó algo.' }))
    expect(within(telefono).getByText(/Tu código es 418-207/)).toBeDefined()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Mensajes' }))

    expect(within(telefono).getByText(/¿Ya\? Pásamelo porfa/)).toBeDefined()
    expect(within(telefono).getByRole('button', { name: 'Te paso: 418-207' })).toBeDefined()
  })

  it('distingue SMS del chat de la prima', () => {
    const telefono = empezar(<CodigoPrestado />)

    expect(within(telefono).getByRole('button', { name: 'Mensajes' })).toBeDefined()
    expect(within(telefono).getByRole('button', { name: 'SMS' })).toBeDefined()
  })
})
