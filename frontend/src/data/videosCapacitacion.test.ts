import { describe, expect, it } from 'vitest'
import { SECTIONS } from './catalogo'
import { getModuleVideoUrl, getYouTubeId, TRAINING_VIDEOS } from './videosCapacitacion'

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

  it('publica un video válido de YouTube para cada módulo', () => {
    const urls = Object.fromEntries(
      TRAINING_VIDEOS.filter((video) => video.sectionId).map((video) => [
        video.sectionId,
        video.youtubeUrl,
      ]),
    )

    expect(urls).toEqual({
      phishing: 'https://youtu.be/fQwaj4hSK2k',
      smishing: 'https://youtu.be/nCR5Y_s-8yI',
      vishing: 'https://youtu.be/KVbLpJkYgcE',
      suplantacion: 'https://youtu.be/t--XkxE_UCc',
      estafa: 'https://youtu.be/lc1kgtKNVSk',
      fisico: 'https://youtu.be/d7RWul7r-00',
      'asistentes-ia': 'https://youtu.be/4kOlEheYMNY',
    })
    for (const video of TRAINING_VIDEOS) {
      expect(video.youtubeUrl && getYouTubeId(video.youtubeUrl)).toBeTruthy()
    }
  })

  it('un módulo sin video grabado queda como próximo', () => {
    expect(getModuleVideoUrl('modulo-sin-video')).toBeNull()
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
