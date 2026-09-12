import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ColdAislePorts from './PuertosFriosColdAisle'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

function triggerFlash() {
  fireEvent.click(screen.getByRole('button', { name: 'Inspeccionar' }))
}

describe('PuertosFriosColdAisle', () => {
 it('muestra la foto sin opciones hasta tocar el destello', () => {
   start(<ColdAislePorts />)
   expect(screen.getByAltText(/Puerta abierta/)).toBeDefined()
   expect(screen.queryByRole('button', { name: /Cerrar la puerta y reportar/ })).toBeNull()
 })
 it('cierra/reporta correctamente tras tocar el destello', async () => {
   start(<ColdAislePorts />)
   triggerFlash()
   fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y reportar/}))
   expect(await screen.findByText('Decisión excelente')).toBeDefined()
 })
 it('distingue las salidas parcial y mala', async () => {
   start(<ColdAislePorts />)
   triggerFlash()
   fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y seguir/}))
   expect(await screen.findByText(/respuesta incompleta/)).toBeDefined()
 })
})
