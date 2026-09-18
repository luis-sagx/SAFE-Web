import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import ColdAislePorts from './PuertosFriosColdAisle'
vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

describe('PuertosFriosColdAisle', () => {
  it('abre en la puerta del área de Tecnología con las opciones a la vista', () => {
    start(<ColdAislePorts />)
    expect(screen.getByAltText(/puerta de vidrio del área de Tecnología/)).toBeDefined()
    expect(screen.getByRole('button', { name: /registre en recepción/ })).toBeDefined()
  })

  it('mandarlo a recepción y avisar a seguridad es la decisión correcta', async () => {
    start(<ColdAislePorts />)
    fireEvent.click(screen.getByRole('button', { name: /registre en recepción/ }))
    expect(await screen.findByText('Acceso controlado')).toBeDefined()
  })

  it('abrirle porque lleva credencial es caer', async () => {
    start(<ColdAislePorts />)
    fireEvent.click(screen.getByRole('button', { name: /lleva credencial/ }))
    expect(await screen.findByText('Entró con tu tarjeta')).toBeDefined()
  })

  it('revisar la credencial tampoco basta', async () => {
    start(<ColdAislePorts />)
    fireEvent.click(screen.getByRole('button', { name: /Revisar su credencial/ }))
    expect(await screen.findByText('Entró con tu tarjeta')).toBeDefined()
  })

  it('acompañarlo queda como respuesta incompleta', async () => {
    start(<ColdAislePorts />)
    fireEvent.click(screen.getByRole('button', { name: /acompañarlo/ }))
    expect(await screen.findByText('Respuesta incompleta')).toBeDefined()
  })
})
