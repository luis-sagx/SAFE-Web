import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import CodigoQRCafe from './CodigoQRCafe'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())
describe('CodigoQRCafe', () => {
 it('abre la escena y resuelve los tres finales', async () => { empezar(<CodigoQRCafe />); expect(screen.getByAltText(/Código QR/)).toBeDefined(); fireEvent.click(screen.getByRole('button',{name:/Escanear/})); expect(await screen.findByText('Riesgo detectado')).toBeDefined() })
 it('trata pedir la contraseña como seguro', async () => { empezar(<CodigoQRCafe />); fireEvent.click(screen.getByRole('button',{name:/Preguntar al personal/})); expect(await screen.findByText('Decisión segura')).toBeDefined() })
 it('trata datos móviles como parcial', async () => { empezar(<CodigoQRCafe />); fireEvent.click(screen.getByRole('button',{name:/Usar datos móviles/})); expect(await screen.findByText('Respuesta prudente')).toBeDefined() })
})
