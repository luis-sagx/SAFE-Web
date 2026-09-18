import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ColdAislePorts from './PuertosFriosColdAisle'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('PuertosFriosColdAisle', () => {
 it('muestra la foto con las opciones a la vista', () => {
   start(<ColdAislePorts />)
   expect(screen.getByAltText(/Puerta abierta/)).toBeDefined()
   expect(screen.getByRole('button', { name: /Cerrar la puerta y reportar/ })).toBeDefined()
 })
 it('cerrar y reportar es la decisión excelente', async () => {
   start(<ColdAislePorts />)
   fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y reportar/}))
   expect(await screen.findByText('Decisión excelente')).toBeDefined()
 })
 it('distingue las salidas parcial y mala', async () => {
   start(<ColdAislePorts />)
   fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y seguir/}))
   expect(await screen.findByText(/respuesta incompleta/)).toBeDefined()
 })
})
