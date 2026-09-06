import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import PuertosFriosColdAisle from './PuertosFriosColdAisle'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())
describe('PuertosFriosColdAisle', () => {
 it('muestra la foto y cierra/reporta correctamente', async () => { empezar(<PuertosFriosColdAisle />); expect(screen.getByAltText(/Puerta abierta/)).toBeDefined(); fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y reportar/})); expect(await screen.findByText('Decisión excelente')).toBeDefined() })
 it('distingue las salidas parcial y mala', async () => { empezar(<PuertosFriosColdAisle />); fireEvent.click(screen.getByRole('button',{name:/Cerrar la puerta y seguir/})); expect(await screen.findByText(/respuesta incompleta/)).toBeDefined() })
})
