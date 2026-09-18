import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CompromisedCable from './CableComprometido'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('CableComprometido', () => {
  it('abre justo después del robo con las opciones a la vista', () => {
    start(<CompromisedCable />)
    expect(screen.getByAltText(/levanta tu celular/)).toBeDefined()
    expect(screen.getByRole('button', { name: /llamar primero a tu banco/ })).toBeDefined()
  })

  it('el contexto deja claro que el celular no tiene clave', () => {
    start(<CompromisedCable />)
    expect(screen.getByText(/No le pusiste clave de bloqueo/)).toBeDefined()
  })

  it('bloquear primero el banco protege las cuentas', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /llamar primero a tu banco/ }))
    expect(await screen.findByText('Cuentas protegidas')).toBeDefined()
  })

  it('esperar a llegar a casa es caer', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /Ir primero a casa/ }))
    expect(await screen.findByText('Vaciaron tu cuenta')).toBeDefined()
  })

  it('denunciar primero queda como respuesta incompleta', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /Fiscalía/ }))
    expect(await screen.findByText('Respuesta incompleta')).toBeDefined()
  })

  it('bloquear solo el chip no cierra las apps abiertas', async () => {
    start(<CompromisedCable />)
    fireEvent.click(screen.getByRole('button', { name: /solo a la operadora/ }))
    expect(await screen.findByText(/sesión abierta siguieron funcionando/)).toBeDefined()
  })
})
