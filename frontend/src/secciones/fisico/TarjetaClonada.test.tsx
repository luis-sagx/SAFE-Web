import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import TarjetaClonada from './TarjetaClonada'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())
describe('TarjetaClonada', () => {
 it('comienza inmediatamente con la alerta del banco', () => { empezar(<TarjetaClonada />); expect(screen.getByAltText(/Llamada del banco/)).toBeDefined() })
 it('bloquear y denunciar es seguro', async () => { empezar(<TarjetaClonada />); fireEvent.click(screen.getByRole('button',{name:/Bloquear la tarjeta inmediatamente/})); expect(await screen.findByText('Tarjeta protegida')).toBeDefined() })
 it('ignorar es riesgoso', async () => { empezar(<TarjetaClonada />); fireEvent.click(screen.getByRole('button',{name:/Ignorar la notificación/})); expect(await screen.findByText('Riesgo detectado')).toBeDefined() })
})
