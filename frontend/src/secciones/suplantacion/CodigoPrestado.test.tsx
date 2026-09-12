import { fireEvent, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import SharedCode from './CodigoPrestado'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

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
    const phone = start(<SharedCode />)

    fireEvent.click(within(phone).getByRole('button', { name: 'Deja veo si me llegó algo.' }))
    expect(within(phone).getByText(/Tu código es 418-207/)).toBeDefined()

    fireEvent.click(within(phone).getByRole('button', { name: 'Mensajes' }))

    expect(within(phone).getByText(/¿Ya\? Pásamelo porfa/)).toBeDefined()
    expect(within(phone).getByRole('button', { name: 'Te paso: 418-207' })).toBeDefined()
  })

  it('distingue SMS del chat de la prima', () => {
    const phone = start(<SharedCode />)

    expect(within(phone).getByRole('button', { name: 'Mensajes' })).toBeDefined()
    expect(within(phone).getByRole('button', { name: 'SMS' })).toBeDefined()
  })

  it('baja al último mensaje cuando se envía una respuesta', () => {
    const phone = start(<SharedCode />)
    scrollTo.mockClear()

    fireEvent.click(within(phone).getByRole('button', { name: 'Deja veo si me llegó algo.' }))
    fireEvent.click(within(phone).getByRole('button', { name: 'Mensajes' }))

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: expect.any(Number) })
  })
})
