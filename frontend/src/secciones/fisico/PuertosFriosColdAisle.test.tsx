import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import PuertosFriosColdAisle from './PuertosFriosColdAisle'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function tocarDestello() {
  fireEvent.click(screen.getByRole('button', { name: 'Inspeccionar' }))
}

describe('PuertosFriosColdAisle', () => {
 it('muestra la foto sin opciones hasta tocar el destello', () => {
   empezar(<PuertosFriosColdAisle />)
   expect(screen.getByAltText(/Puerta abierta/)).toBeDefined()
   expect(screen.queryByRole('button', { name: /Cerrar la puerta y reportar/ })).toBeNull()
 })
 it('cierra/reporta correctamente tras tocar el destello', async () => {
   empezar(<PuertosFriosColdAisle />)
   tocarDestello()
   fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y reportar/}))
   expect(await screen.findByText('Decisión excelente')).toBeDefined()
 })
 it('distingue las salidas parcial y mala', async () => {
   empezar(<PuertosFriosColdAisle />)
   tocarDestello()
   fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y seguir/}))
   expect(await screen.findByText(/respuesta incompleta/)).toBeDefined()
 })
})
