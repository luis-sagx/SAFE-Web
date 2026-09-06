import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CableComprometido from './CableComprometido'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function tocarDestello() {
  fireEvent.click(screen.getByRole('button', { name: 'Inspeccionar' }))
}

describe('CableComprometido', () => {
 it('abre la escena de descanso sin mostrar opciones hasta tocar el destello', () => {
   empezar(<CableComprometido />)
   expect(screen.getByAltText(/sala de descanso/)).toBeDefined()
   expect(screen.queryByRole('button', { name: /avisar a IT/ })).toBeNull()
 })
 it('tocar el destello revela las opciones y permite reportar', async () => {
   empezar(<CableComprometido />)
   tocarDestello()
   fireEvent.click(screen.getByRole('button',{name:/avisar a IT/}))
   expect(await screen.findByText('Decisión segura')).toBeDefined()
 })
 it('llevarlo al escritorio no termina la corrida', () => {
   empezar(<CableComprometido />)
   tocarDestello()
   fireEvent.click(screen.getByRole('button',{name:/Llevártelo/}))
   expect(screen.getByAltText(/sobre un escritorio/)).toBeDefined()
   expect(screen.queryByText('Ver las señales')).toBeNull()
 })
 it('entregarlo a IT desde escritorio es seguro', async () => {
   empezar(<CableComprometido />)
   tocarDestello()
   fireEvent.click(screen.getByRole('button',{name:/Llevártelo/}))
   tocarDestello()
   fireEvent.click(screen.getByRole('button',{name:/Entregarlo a IT/}))
   expect(await screen.findByText('Decisión segura')).toBeDefined()
 })
})
