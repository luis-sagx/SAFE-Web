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

  let id: string | null = null
  if (parsed.hostname === 'youtu.be') {
    id = parsed.pathname.slice(1)
  } else if (parsed.pathname.startsWith('/embed/')) {
    id = parsed.pathname.slice('/embed/'.length)
  } else if (parsed.pathname === '/watch') {
    id = parsed.searchParams.get('v')
  }

  return id && YOUTUBE_ID.test(id) ? id : null
}

// Qué explica el video de cada módulo. Una frase distinta por tema: la
// plantilla anterior ("Una guía para aprovechar el módulo de X") repetía la
// misma línea siete veces y no le decía nada a quien elige cuál ver.
const MODULE_DESCRIPTIONS: Record<string, string> = {
  phishing: 'Cómo mirar un remitente, un enlace y un adjunto antes de abrirlos.',
  smishing: 'Por qué un SMS del banco y uno falso llegan al mismo hilo, y qué los separa.',
  vishing: 'Qué hacer cuando la llamada apura, y por qué colgar y devolver la llamada resuelve casi todo.',
  suplantacion: 'Cómo verificar que quien escribe es quien dice ser, aunque el perfil y la voz cuadren.',
  estafa: 'Señales de una compra, una venta o una transferencia que no va a terminar bien.',
  fisico: 'Lo que pasa fuera de la pantalla: pantallas abiertas, USB encontrados y visitas sin cita.',
  'asistentes-ia': 'Qué puede inventar un asistente de IA y qué nunca deberías pegarle.',
}

const GENERAL_URL = 'https://youtu.be/xN-O2gGRQEU'

const MODULE_URLS: Record<string, string> = {
  phishing: 'https://youtu.be/fQwaj4hSK2k',
  smishing: 'https://youtu.be/nCR5Y_s-8yI',
  vishing: 'https://youtu.be/KVbLpJkYgcE',
  suplantacion: 'https://youtu.be/t--XkxE_UCc',
  estafa: 'https://youtu.be/lc1kgtKNVSk',
  fisico: 'https://youtu.be/d7RWul7r-00',
  'asistentes-ia': 'https://youtu.be/4kOlEheYMNY',
}

// Un módulo nuevo entra sin video hasta grabarlo: null muestra "se publica pronto".
export function getModuleVideoUrl(sectionId: string): string | null {
  return MODULE_URLS[sectionId] ?? null
}

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: 'general',
    sectionId: null,
    title: 'Introducción a SAFE-Web',
    description: 'Conoce cómo aprovechar los escenarios y conversar sobre las señales de cada situación.',
    youtubeUrl: GENERAL_URL,
  },
  ...SECTIONS.map((section) => ({
    id: section.id,
    sectionId: section.id,
    title: section.titulo,
    description: MODULE_DESCRIPTIONS[section.id] ?? section.descripcion,
    youtubeUrl: getModuleVideoUrl(section.id),
  })),
]
