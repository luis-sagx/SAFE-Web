import { describe, expect, it } from 'vitest'
import { SECTIONS } from './catalogo'
import { getYouTubeId, TRAINING_VIDEOS } from './videosCapacitacion'

describe('catálogo de videos de capacitación', () => {
  it('incluye el video general y uno para cada módulo en el orden del curso', () => {
    expect(TRAINING_VIDEOS).toHaveLength(8)
    expect(TRAINING_VIDEOS[0]?.sectionId).toBeNull()
    expect(TRAINING_VIDEOS.slice(1).map((video) => video.sectionId)).toEqual([
      'phishing',
      'smishing',
      'vishing',
      'suplantacion',
      'estafa',
      'fisico',
      'asistentes-ia',
    ])
    expect(TRAINING_VIDEOS.slice(1).map((video) => video.sectionId)).toEqual(
      SECTIONS.map((section) => section.id),
    )
  })

  it.each([
    ['https://youtu.be/abcdefghijk', 'abcdefghijk'],
    ['https://www.youtube.com/watch?v=abcdefghijk', 'abcdefghijk'],
    ['https://youtube.com/embed/abcdefghijk', 'abcdefghijk'],
    ['https://example.com/watch?v=abcdefghijk', null],
    ['https://youtu.be/demasiado-corto', null],
  ])('extrae solo identificadores válidos de YouTube: %s', (url, expected) => {
    expect(getYouTubeId(url)).toBe(expected)
  })
})
