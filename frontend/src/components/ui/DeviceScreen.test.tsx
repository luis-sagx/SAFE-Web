import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DeviceScreen, { type ScreenView } from './DeviceScreen'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())

const chat = (archivos?: { id: string; nombre: string }[]): ScreenView => ({
  kind: 'sms',
  sender: 'Asistente IA',
  sub: 'servicio externo',
  sitio: { titulo: 'Asistente IA', url: 'https://chat.ejemplo.com' },
  msgs: [],
  entradaLibre: { placeholder: 'Escribe', hora: '10:00', respuestaIA: 'Listo', onEnviar: () => ({ goto: 'fin' }), archivos },
})

const region = () => screen.getByRole('region', { name: 'Chat con el asistente' })

// Un DragEvent de jsdom no deja fijar relatedTarget desde fireEvent: se define a mano.
function dragLeaveTo(target: EventTarget | null) {
  const event = new Event('dragleave', { bubbles: true })
  Object.defineProperty(event, 'relatedTarget', { value: target })
  fireEvent(region(), event)
}

describe('DeviceScreen, adjuntar imágenes en el chat', () => {
  it('un chat sin archivos no acepta que le suelten nada', () => {
    render(<DeviceScreen view={chat()} />)
    fireEvent.dragOver(region())
    expect(region().className).not.toMatch(/smsZonaActiva/)
  })

  it('pasar sobre un hijo del chat no apaga la zona de soltar', () => {
    render(<DeviceScreen view={chat([{ id: 'a', nombre: 'a.jpg' }])} />)
    fireEvent.dragOver(region())
    dragLeaveTo(screen.getByLabelText('Escribe tu mensaje'))
    expect(region().className).toMatch(/smsZonaActiva/)
  })

  it('intentar de nuevo descarta las imágenes adjuntas', () => {
    const view = chat([{ id: 'a', nombre: 'a.jpg' }])
    const { rerender } = render(<DeviceScreen view={view} />)
    fireEvent.click(screen.getByRole('button', { name: 'Adjuntar imágenes' }))
    expect(screen.getByRole('button', { name: 'Quitar a.jpg' })).toBeDefined()
    rerender(<DeviceScreen view={view} terminada />)
    rerender(<DeviceScreen view={view} terminada={false} />)
    expect(screen.queryByRole('button', { name: 'Quitar a.jpg' })).toBeNull()
  })
})

describe('DeviceScreen, compositor libre', () => {
  it('Enter envía el mensaje escrito', () => {
    render(<DeviceScreen view={chat()} />)
    const input = screen.getByLabelText('Escribe tu mensaje')
    fireEvent.change(input, { target: { value: 'Resume este informe.' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Resume este informe.')).toBeDefined()
    expect(screen.queryByLabelText('Escribe tu mensaje')).toBeNull()
  })

  it('Shift+Enter conserva el campo abierto para escribir otra línea', () => {
    render(<DeviceScreen view={chat()} />)
    const input = screen.getByLabelText('Escribe tu mensaje') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'Primera línea' } })
    const event = createEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    fireEvent(input, event)
    expect(screen.getByLabelText('Escribe tu mensaje')).toBeDefined()
    expect(input.value).toBe('Primera línea')
    expect(event.defaultPrevented).toBe(false)
  })
})
