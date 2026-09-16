import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VideoCapacitacion from './VideoCapacitacion'

const BASE_VIDEO = {
  id: 'general',
  sectionId: null,
  title: 'Introducción a SAFE-Web',
  description: 'Cómo funciona la plataforma.',
}

describe('VideoCapacitacion', () => {
  it('informa que un video sin URL todavía no está disponible sin insertar un iframe', () => {
    const { container } = render(
      <VideoCapacitacion video={{ ...BASE_VIDEO, youtubeUrl: null }} folio="GEN-00" />,
    )

    expect(screen.getByText('Este video se publica pronto.')).toBeDefined()
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('carga un reproductor de privacidad mejorada solo al pedir reproducir un video válido', () => {
    const { container } = render(
      <VideoCapacitacion
        video={{ ...BASE_VIDEO, youtubeUrl: 'https://youtu.be/abcdefghijk' }}
        folio="GEN-00"
      />,
    )

    expect(container.querySelector('iframe')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir Introducción a SAFE-Web' }))

    const player = container.querySelector('iframe')
    expect(player?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1')
    expect(player?.getAttribute('title')).toBe('Introducción a SAFE-Web')
    expect(screen.getByRole('link', { name: 'Abrir en YouTube' }).getAttribute('href')).toBe(
      'https://www.youtube.com/watch?v=abcdefghijk',
    )
  })
})
