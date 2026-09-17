import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { start } from '../../test/escenario'
import BirthdayInvitation from './InvitacionCumpleanos'

vi.mock('../../context/AuthContext', async () => (await import('../../test/escenario')).mockAuth())
vi.mock('../../lib/api', async () => (await import('../../test/escenario')).offlineApi())

const send = (container: HTMLElement) =>
  fireEvent.click(within(container).getByRole('button', { name: 'Enviar el mensaje' }))

// El clip adjunta todas las fotos; se descartan con la X las que no se quieren.
function keepOnlyAndSend(container: HTMLElement, ...keep: string[]) {
  fireEvent.click(within(container).getByRole('button', { name: 'Adjuntar imágenes' }))
  for (const name of ['sofia_uniforme.jpg', 'aula_3B_grupo.jpg', 'dibujo_sofia.png', 'decoracion_fiesta.jpg']) {
    if (!keep.includes(name)) fireEvent.click(within(container).getByRole('button', { name: `Quitar ${name}` }))
  }
  send(container)
}

describe('InvitacionCumpleanos', () => {
  it('sin nada adjunto ni escrito no se puede enviar', () => {
    const container = start(<BirthdayInvitation />)
    expect((within(container).getByRole('button', { name: 'Enviar el mensaje' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('soltar una foto arrastrada desde la galería la adjunta', () => {
    const container = start(<BirthdayInvitation />)
    // Se suelta sobre el hilo del chat, no sobre el campo: toda la pantalla acepta la imagen.
    const chat = within(container).getByRole('region', { name: 'Chat con el asistente' })
    fireEvent.drop(chat, { dataTransfer: { getData: () => 'dibujo' } })
    expect(within(container).getByRole('button', { name: 'Quitar dibujo_sofia.png' })).toBeDefined()
  })

  it('el clip adjunta todas las fotos, cada una con su X', () => {
    const container = start(<BirthdayInvitation />)
    fireEvent.click(within(container).getByRole('button', { name: 'Adjuntar imágenes' }))
    expect(within(container).getAllByRole('button', { name: /^Quitar / })).toHaveLength(4)
  })

  it('la tarjeta de la galería lleva su id al arrastrarla', () => {
    start(<BirthdayInvitation />)
    const setData = vi.fn()
    fireEvent.dragStart(screen.getByText('dibujo_sofia.png'), { dataTransfer: { setData } })
    expect(setData).toHaveBeenCalledWith('text/plain', 'dibujo')
  })

  it('el chat se marca al arrastrar encima y se desmarca al salir; lo desconocido no se adjunta', () => {
    const container = start(<BirthdayInvitation />)
    const chat = within(container).getByRole('region', { name: 'Chat con el asistente' })
    fireEvent.dragOver(chat)
    expect(chat.className).toMatch(/smsZonaActiva/)
    fireEvent.dragLeave(chat, { relatedTarget: document.body })
    expect(chat.className).not.toMatch(/smsZonaActiva/)
    fireEvent.drop(chat, { dataTransfer: { getData: () => 'texto cualquiera' } })
    expect(within(container).queryByRole('button', { name: /^Quitar / })).toBeNull()
  })

  it('soltar dos veces la misma foto no la duplica, y la X la quita', () => {
    const container = start(<BirthdayInvitation />)
    const chat = within(container).getByRole('region', { name: 'Chat con el asistente' })
    fireEvent.drop(chat, { dataTransfer: { getData: () => 'dibujo' } })
    fireEvent.drop(chat, { dataTransfer: { getData: () => 'dibujo' } })
    expect(within(container).getAllByRole('button', { name: /^Quitar / })).toHaveLength(1)
    fireEvent.click(within(container).getByRole('button', { name: 'Quitar dibujo_sofia.png' }))
    expect(within(container).queryByRole('button', { name: /^Quitar / })).toBeNull()
  })

  it('el mensaje enviado muestra las imágenes, y ya no se aceptan más', async () => {
    const container = start(<BirthdayInvitation />)
    keepOnlyAndSend(container, 'dibujo_sofia.png')
    await screen.findByText('Armaste la invitación sin subir ninguna cara')
    const chat = within(container).getByRole('region', { name: 'Chat con el asistente' })
    fireEvent.dragOver(chat)
    expect(chat.className).not.toMatch(/smsZonaActiva/)
  })

  it('subir la foto del aula, con otros niños, es el fallo', async () => {
    const container = start(<BirthdayInvitation />)
    keepOnlyAndSend(container, 'aula_3B_grupo.jpg', 'dibujo_sofia.png')
    expect(await screen.findByText('Subiste caras de niños sin permiso de sus papás')).toBeDefined()
    expect(container.querySelector('[data-signal="foto-grupo"]')?.textContent).toBe('aula_3B_grupo.jpg')
  })

  it('subir la foto de tu hija también es un fallo', async () => {
    const container = start(<BirthdayInvitation />)
    keepOnlyAndSend(container, 'sofia_uniforme.jpg', 'decoracion_fiesta.jpg')
    expect(await screen.findByText('Subiste la cara de tu hija a un servicio externo')).toBeDefined()
  })

  it('escribir sin adjuntar ninguna imagen no sube ninguna cara', async () => {
    const container = start(<BirthdayInvitation />)
    fireEvent.change(within(container).getByLabelText('Escribe tu mensaje'), { target: { value: 'Una invitación con dinosaurios' } })
    send(container)
    expect(await screen.findByText('Armaste la invitación sin subir ninguna cara')).toBeDefined()
  })

  it('solo imágenes sin caras es el acierto', async () => {
    const container = start(<BirthdayInvitation />)
    keepOnlyAndSend(container, 'dibujo_sofia.png', 'decoracion_fiesta.jpg')
    expect(await screen.findByText('Armaste la invitación sin subir ninguna cara')).toBeDefined()
  })
})
