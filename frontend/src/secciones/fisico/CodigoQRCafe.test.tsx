import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import CoffeeShopQrCode from './CodigoQRCafe'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('CodigoQRCafe', () => {
 it('abre la escena con las opciones a la vista', () => {
   start(<CoffeeShopQrCode />)
   expect(screen.getByAltText(/Código QR/)).toBeDefined()
   expect(screen.getByRole('button', { name: /Escanear/ })).toBeDefined()
 })
 it('escanear el QR es el riesgo', async () => {
   start(<CoffeeShopQrCode />)
   fireEvent.click(screen.getByRole('button',{name:/Escanear/}))
   expect(await screen.findByText('Riesgo detectado')).toBeDefined()
 })
 it('trata pedir la contraseña como seguro', async () => {
   start(<CoffeeShopQrCode />)
   fireEvent.click(screen.getByRole('button',{name:/Preguntar al personal/}))
   expect(await screen.findByText('Decisión segura')).toBeDefined()
 })
 it('trata datos móviles como parcial', async () => {
   start(<CoffeeShopQrCode />)
   fireEvent.click(screen.getByRole('button',{name:/Usar datos móviles/}))
   expect(await screen.findByText('Respuesta prudente')).toBeDefined()
 })
})
