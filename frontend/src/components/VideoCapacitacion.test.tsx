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
  it('la portada del boleto es la miniatura del propio video, sin cargar YouTube', () => {
    const { container } = render(
      <VideoCapacitacion
        video={{ ...BASE_VIDEO, youtubeUrl: 'https://youtu.be/abcdefghijk' }}
        folio="GEN-00"
      />,
    )

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
    )
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('en la tira, cada fila abre y cierra su reproductor sin tocar a las demás', () => {
    const { container } = render(
      <ul>
        <VideoCapacitacion
          video={{ ...BASE_VIDEO, title: 'Phishing', youtubeUrl: 'https://youtu.be/abcdefghijk' }}
          folio="MOD-01"
          etiqueta="Correo y web"
          variante="fila"
        />
      </ul>,
    )

    expect(screen.getByText('MOD-01')).toBeDefined()
    expect(screen.getByText('Correo y web')).toBeDefined()
    expect(container.querySelector('iframe')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir Phishing' }))
    expect(container.querySelector('iframe')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar Phishing' }))
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('una fila sin video muestra el sello en vez de un reproductor', () => {
    const { container } = render(
      <ul>
        <VideoCapacitacion
          video={{ ...BASE_VIDEO, title: 'Vishing', youtubeUrl: null }}
          folio="MOD-03"
          variante="fila"
          conMuescas
        />
      </ul>,
    )

    expect(screen.getByText('Sin grabar')).toBeDefined()
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('ignora una URL que no es de YouTube en vez de incrustarla', () => {
    const { container } = render(
      <VideoCapacitacion
        video={{ ...BASE_VIDEO, youtubeUrl: 'https://ejemplo.test/video' }}
        folio="GEN-00"
      />,
    )

    expect(screen.getByText('Este video se publica pronto.')).toBeDefined()
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })
})
