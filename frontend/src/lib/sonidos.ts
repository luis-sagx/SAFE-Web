// Sonidos del veredicto (issue #221): archivos reales servidos desde
// public/sonidos, no tonos sintetizados. El primer intento con Web Audio API
// sonaba a pitido genérico y no convencía; estos son efectos de sonido
// tomados de Mixkit (licencia de uso libre, sin atribución).

export type ResultKind = 'good' | 'bad' | 'partial'

const ARCHIVOS: Record<ResultKind, string> = {
  good: '/sonidos/acertar.wav',
  bad: '/sonidos/fallar.wav',
  partial: '/sonidos/a-medias.wav',
}

const ARCHIVO_SENAL = '/sonidos/senal.wav'
const ARCHIVO_MODULO_COMPLETO = '/sonidos/modulo-completo.wav'
let phoneAudio: HTMLAudioElement | undefined

// Sin `Audio` (navegador viejo, jsdom en tests) o si algo del audio falla
// —incluido el navegador bloqueando el autoplay—, no hace nada: cada uno de
// estos sonidos es un extra sobre una pantalla que ya dice lo mismo por su
// cuenta (veredicto, señal resaltada, certificado habilitado).
function reproducir(url: string, phoneVolume?: number): void {
  if (typeof Audio === 'undefined') return

  try {
    const audio = new Audio(url)
    if (phoneVolume !== undefined) {
      audio.volume = phoneVolume
      // Los dos efectos del teléfono comparten un solo canal.
      phoneAudio?.pause()
      phoneAudio = audio
    }
    audio.play()?.catch(() => {
      // Autoplay bloqueado u otro fallo de reproducción: se ignora.
    })
  } catch {
    // Sin sonido no debe romper el escenario.
  }
}

/** Toca el efecto del resultado (acertar/fallar/a medias). */
export function reproducirResultado(kind: ResultKind): void {
  reproducir(ARCHIVOS[kind])
}

/** Toca al resaltar cada señal durante "Ver las señales" en el veredicto. */
export function reproducirSenal(): void {
  reproducir(ARCHIVO_SENAL)
}

/** Toca cuando se aprueban todos los módulos y se habilita el certificado. */
export function reproducirModuloCompleto(): void {
  reproducir(ARCHIVO_MODULO_COMPLETO)
}

export function playFillerTap(): void {
  reproducir('/sonidos/tap-relleno-v1.wav', 0.22)
}

export function playPhoneNotification(): void {
  reproducir('/sonidos/notificacion-v1.wav', 0.2)
}
