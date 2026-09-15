import { SECTIONS } from './catalogo'

export interface TrainingVideo {
  id: string
  sectionId: string | null
  title: string
  description: string
  youtubeUrl: string | null
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'youtu.be'])
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

export function getYouTubeId(url: string): string | null {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!YOUTUBE_HOSTS.has(parsed.hostname)) return null

  const id = parsed.hostname === 'youtu.be'
    ? parsed.pathname.slice(1)
    : parsed.pathname.startsWith('/embed/')
      ? parsed.pathname.slice('/embed/'.length)
      : parsed.pathname === '/watch'
        ? parsed.searchParams.get('v')
        : null

  return id && YOUTUBE_ID.test(id) ? id : null
}

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: 'general',
    sectionId: null,
    title: 'Introducción a SAFE-Web',
    description: 'Conoce cómo aprovechar los escenarios y conversar sobre las señales de cada situación.',
    youtubeUrl: null,
  },
  ...SECTIONS.map((section) => ({
    id: section.id,
    sectionId: section.id,
    title: section.titulo,
    description: `Una guía para aprovechar el módulo de ${section.titulo} durante la capacitación.`,
    youtubeUrl: null,
  })),
]
