import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { VOCES } from '../../data/voces'
import styles from './DeviceScreen.module.css'

// La nota suena (no solo se lee) porque en suplantación la voz "es suya" es
// el ataque; la transcripción queda de apoyo debajo. Mismo audio para todos.
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
    // Evita que la voz siga sonando de fondo al cambiar de pantalla.
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
        {/* `data-control`: escuchar no cuenta como haber tocado un hotspot. */}
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
        // eslint-disable-next-line jsx-a11y/media-has-caption -- la
        // transcripción va justo encima, siempre visible.
        <audio ref={audioRef} src={url} onEnded={() => setSonando(false)} />
      )}
    </span>
  )
}

export default NotaDeVoz
