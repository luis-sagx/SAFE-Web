import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ClonedCard from './TarjetaClonada'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('TarjetaClonada', () => {
  it('abre en el cajero con las opciones a la vista', () => {
    start(<ClonedCard />)
    expect(screen.getByAltText(/Junto a un cajero/)).toBeDefined()
    expect(screen.getByRole('button', { name: /revisar ahí mismo/ })).toBeDefined()
  })

  it('el contexto no nombra la modalidad', () => {
    start(<ClonedCard />)
    expect(screen.queryByText(/cambiazo/i)).toBeNull()
  })

  it('revisar que la tarjeta sea la tuya detecta el cambiazo', async () => {
    start(<ClonedCard />)
    fireEvent.click(screen.getByRole('button', { name: /revisar ahí mismo/ }))
    expect(await screen.findByText('Cambiazo detectado')).toBeDefined()
  })

  it('tapar el teclado al reintentar ya no sirve: caíste', async () => {
    start(<ClonedCard />)
    fireEvent.click(screen.getByRole('button', { name: /tapando el teclado/ }))
    expect(await screen.findByText('Te cambiaron la tarjeta')).toBeDefined()
    expect(screen.getByText(/vio tu clave en el primer intento/)).toBeDefined()
  })

  it('irse a otro cajero sin revisar también es caer', async () => {
    start(<ClonedCard />)
    fireEvent.click(screen.getByRole('button', { name: /buscar otro cajero/ }))
    expect(await screen.findByText('Te cambiaron la tarjeta')).toBeDefined()
  })
})
