import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { VOCES } from '../../data/voces'
import styles from './DeviceScreen.module.css'

/**
 * Una nota de voz dentro de un hilo de mensajería.
 *
 * En suplantación es el ataque, no un adorno: la nota de voz es lo que hace
 * creíble a quien dice ser tu hijo o tu jefe, porque la voz "es suya". Leerla
 * escrita quita justo lo que hay que aprender a dudar, así que suena — y la
 * transcripción se queda debajo, en pequeño, como apoyo para quien no puede
 * oírla (misma regla que la pantalla de llamada).
 *
 * El audio sale del mismo índice generado que las llamadas: un MP3 fijo por
 * frase, para que todos los participantes oigan exactamente lo mismo.
 */
function NotaDeVoz({
  texto,
  duracion,
  senal,
}: {
  /** Lo que dice la nota. Es también la clave del audio en `VOCES`. */
  texto: string
  /** Lo que marca la burbuja, como en cualquier mensajería: "0:11". */
  duracion: string
  senal?: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [sonando, setSonando] = useState(false)
  const url = VOCES[texto]

  useEffect(() => {
    // Cambiar de pantalla con una nota sonando dejaría la voz de fondo sobre
    // otra cosa, que es lo único que no pasa en un teléfono de verdad.
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  function alternar() {
    const audio = audioRef.current
    if (!audio) return
    if (sonando) {
      audio.pause()
      setSonando(false)
      return
    }
    setSonando(true)
    const reproduccion = audio.play() as Promise<void> | undefined
    reproduccion?.catch(() => setSonando(false))
  }

  return (
    <span className={styles.nota}>
      <span className={styles.notaFila}>
        {/* `data-control` lo deja fuera del manejador de puntos interactivos:
            escuchar no es decidir, y sin esto pulsar play contaba como haber
            tocado una parte muerta de la pantalla. */}
        <button
          type="button"
          className={styles.notaPlay}
          aria-label={sonando ? 'Pausar la nota de voz' : 'Reproducir la nota de voz'}
          data-control=""
          onClick={alternar}
          disabled={!url}
        >
          {sonando ? (
            <Pause aria-hidden className={styles.notaPlayIcono} strokeWidth={2} />
          ) : (
            <Play aria-hidden className={styles.notaPlayIcono} strokeWidth={2} />
          )}
        </button>
        <span className={`${styles.notaOnda} ${sonando ? styles.notaOndaActiva : ''}`} aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className={styles.notaDuracion}>{duracion}</span>
      </span>

      <span className={styles.notaTexto} data-signal={senal}>
        {texto}
      </span>

      {url && (
        <audio ref={audioRef} src={url} onEnded={() => setSonando(false)}>
          <track kind="captions" srcLang="es" label="Español" src="data:text/vtt,WEBVTT%0A" />
        </audio>
      )}
    </span>
  )
}

export default NotaDeVoz
