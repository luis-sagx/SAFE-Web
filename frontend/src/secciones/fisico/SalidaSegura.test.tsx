import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { empezar } from '../../test/escenario'
import SalidaSegura from './SalidaSegura'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).authFalso())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).apiSinRed())

function asegurarEscritorio(telefono: HTMLElement) {
  while (within(telefono).queryAllByText('✕').length > 0) {
    fireEvent.click(within(telefono).getAllByText('✕')[0]!)
  }
  fireEvent.click(within(telefono).getByText('Contratos'))
  fireEvent.click(within(telefono).getByText('Nóminas'))
  fireEvent.click(within(telefono).getByText('Datos Bancarios'))
  // El botón de bloquear es un <rect> con el onClick, no su <g>: el texto
  // "⌨️ Bloquear" es un hermano y no burbujea hasta el manejador.
  const lockRect = telefono.querySelector('rect[width="180"][height="50"]')
  if (lockRect) fireEvent.click(lockRect)
}

describe('SalidaSegura', () => {
  it('abre con pestañas, documentos y la computadora sin bloquear', () => {
    const telefono = empezar(<SalidaSegura />)

    expect(within(telefono).getByText(/Completa todo/)).toBeDefined()
  })

  it('el botón de terminar sigue deshabilitado mientras falte algo', () => {
    const telefono = empezar(<SalidaSegura />)

    fireEvent.click(within(telefono).getByText('Contratos'))

    expect(within(telefono).getByRole('button', { name: /Completa todo/ }).hasAttribute('disabled')).toBe(true)
  })

  it('cerrar todo, guardar documentos y bloquear la computadora habilita terminar', () => {
    const telefono = empezar(<SalidaSegura />)

    asegurarEscritorio(telefono)

    expect(within(telefono).getByRole('button', { name: 'Listo para irme' }).hasAttribute('disabled')).toBe(false)
  })

  it('terminar con todo asegurado es la decisión segura', async () => {
    const telefono = empezar(<SalidaSegura />)

    asegurarEscritorio(telefono)
    fireEvent.click(within(telefono).getByRole('button', { name: 'Listo para irme' }))

    expect(await screen.findByText('Decisión segura')).toBeDefined()
    expect(screen.getByText(/4 pestañas cerradas/)).toBeDefined()
  })
})
