import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PhotoScene } from './EscenaFoto'

describe('PhotoScene', () => {
  it('ajusta la superficie de señales a la proporción real de una foto panorámica', () => {
    render(
      <PhotoScene
        src="/cambiazo.webp"
        alt="Escena junto al cajero"
        zonas={[{ id: 'tarjeta', x: '45%', y: '46%', ancho: '19%', alto: '17%' }]}
      />,
    )

    const photo = screen.getByRole('img', { name: 'Escena junto al cajero' })
    Object.defineProperties(photo, {
      naturalWidth: { value: 1672 },
      naturalHeight: { value: 941 },
    })
    fireEvent.load(photo)

    const surface = photo.parentElement as HTMLElement
    expect(Number(surface.style.getPropertyValue('--photo-ratio'))).toBeCloseTo(1672 / 941)
    expect(surface.querySelector('#tarjeta')).not.toBeNull()
  })
})
