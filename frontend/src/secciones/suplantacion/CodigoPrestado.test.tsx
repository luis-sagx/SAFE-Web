import { fireEvent, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CodigoPrestado from './CodigoPrestado'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

const scrollTo = vi.fn()
const scrollToOriginal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
})

afterEach(() => {
  if (scrollToOriginal) Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollToOriginal)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
})

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

  it('baja al último mensaje cuando se envía una respuesta', () => {
    const telefono = empezar(<CodigoPrestado />)
    scrollTo.mockClear()

    fireEvent.click(within(telefono).getByRole('button', { name: 'Deja veo si me llegó algo.' }))
    fireEvent.click(within(telefono).getByRole('button', { name: 'Mensajes' }))

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: expect.any(Number) })
  })
})
