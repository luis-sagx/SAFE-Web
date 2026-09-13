import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { VOICES } from '../../data/voces'
import type { ScreenView } from './DeviceScreen'
import styles from './DeviceScreen.module.css'

// Pantalla de llamada: se decide con gestos (contestar/rechazar/colgar/silenciar),
// no con una lista de opciones, y manda el audio — la transcripción es solo apoyo.
type Call = Extract<ScreenView, { kind: 'call' }>

function clock(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function CallScreen({ view, terminada: finished }: { view: Call; terminada?: boolean }) {
  const [seconds, setSeconds] = useState(0)
  const [silence, setSilence] = useState(false)
  // Audios pendientes, en cola: un nodo puede traer varias frases seguidas.
  const [queue, setQueue] = useState<string[]>([])
  const [ringing, setRinging] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  // Cada nodo trae la conversación entera; sin esto se repetiría desde el inicio en cada paso.
  const spoken = useRef(0)
  // Evita reasignar el mismo `src` al salir del silencio, lo que reiniciaba la frase.
  const loaded = useRef('')
  // Última frase dicha, para el botón "repetir" (como pedir "¿me lo repite?").
  const latest = useRef<string[]>([])

  useEffect(() => {
    if (view.entrante || view.marcando) {
      setSeconds(0)
      return undefined
    }
    // Colgada, no sigue contando: el cronómetro bajo el veredicto no debe seguir corriendo.
    if (finished) return undefined
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [view.entrante, view.marcando, finished])

  useEffect(() => {
    const lines = view.dialogo ?? []
    // Al reiniciar el escenario la conversación se acorta.
    if (lines.length < spoken.current) spoken.current = 0
    const newVoiceUrls = lines
      .slice(spoken.current)
      .filter((line) => !line.mio)
      .map((line) => VOICES[line.texto])
      .filter((url): url is string => Boolean(url))
    spoken.current = lines.length

    if (newVoiceUrls.length === 0) return
    latest.current = newVoiceUrls
    // Se encola aunque esté silenciado, para no perderlo al quitar el silencio.
    setQueue(newVoiceUrls)
  }, [view.dialogo])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Colgar calla a quien hablaba, como en un teléfono de verdad.
    if (finished || queue.length === 0) {
      audio.pause()
      setRinging(false)
      return
    }

    const next = queue[0]!
    if (loaded.current !== next) {
      loaded.current = next
      audio.src = next
    }

    if (silence) {
      audio.pause()
      setRinging(false)
      return
    }

    setRinging(true)
    // `as`: en jsdom `play()` no devuelve promesa y los tests fallaban al encadenar `.catch`.
    const playback = audio.play() as Promise<void> | undefined
    playback?.catch(() => {
      setRinging(false)
      setQueue([])
    })
  }, [queue, silence, finished])

  // Silenciar pausa; volver a pulsarlo continúa donde se quedó, no reinicia la frase.
  function toggleMute() {
    setSilence((s) => !s)
  }

  const initial = view.quien.trim().charAt(0).toUpperCase()


  if (view.entrante || view.marcando) {
    // Marcador y llamada entrante comparten pantalla; solo cambia qué significan los botones.
    const labels = view.marcando
      ? {
          region: 'Marcador',
          estado: 'Marcar',
          no: 'Volver',
          noAria: 'Salir del marcador sin llamar',
          NoIcono: ArrowLeft,
          claseNo: styles.callVolver,
          si: 'Llamar',
          siAria: 'Llamar a este número',
        }
      : {
          region: 'Llamada entrante',
          estado: 'Llamada entrante',
          no: 'Rechazar',
          noAria: 'Rechazar la llamada',
          NoIcono: PhoneOff,
          claseNo: styles.callRechazar,
          si: 'Contestar',
          siAria: 'Contestar la llamada',
        }

    return (
      <section className={`${styles.call} ${styles.callEntrante}`} aria-label={labels.region}>
        <p className={styles.callEstado}>{labels.estado}</p>
        <div className={styles.callQuien} data-signal={view.senalQuien}>
          <span className={`${styles.callAvatar} ${styles.callAvatarGrande}`} aria-hidden>
            {initial}
          </span>
          <p className={styles.callNombre}>{view.quien}</p>
          <p className={styles.callNumero}>{view.numero}</p>
          {view.etiqueta && <span className={styles.callEtiqueta}>{view.etiqueta}</span>}
        </div>

        <div className={styles.callEntranteAcciones}>
          <button
            type="button"
            className={`${styles.callBotonRedondo} ${labels.claseNo}`}
            aria-label={labels.noAria}
            data-hotspot-goto={view.rechazarGoto}
            data-hotspot-label={view.rechazarLabel}
          >
            <labels.NoIcono aria-hidden className={styles.callBotonIcono} strokeWidth={2} />
            <span className={styles.callBotonTexto}>{labels.no}</span>
          </button>
          <button
            type="button"
            className={`${styles.callBotonRedondo} ${styles.callContestar}`}
            aria-label={labels.siAria}
            data-hotspot-goto={view.contestarGoto}
            data-hotspot-label={view.contestarLabel}
          >
            <Phone aria-hidden className={styles.callBotonIcono} strokeWidth={2} />
            <span className={styles.callBotonTexto}>{labels.si}</span>
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.call} aria-label="Llamada en curso">
      <div className={styles.callBarra}>
        <span className={styles.callEnCurso}>
          <span
            className={`${styles.callPunto} ${finished ? styles.callPuntoApagado : ''}`}
            aria-hidden
          />
          {finished ? 'Llamada finalizada' : 'En llamada'}
        </span>
        <span className={styles.callReloj}>{clock(seconds)}</span>
      </div>

      <div className={styles.callQuienFila} data-signal={view.senalQuien}>
        <span className={styles.callAvatar} aria-hidden>
          {initial}
        </span>
        <span className={styles.callQuienTextos}>
          <span className={styles.callNombre}>{view.quien}</span>
          <span className={styles.callNumeroFila}>
            {view.numero}
            {view.etiqueta && <span className={styles.callEtiqueta}>{view.etiqueta}</span>}
          </span>
        </span>
      </div>

      {!finished && (
      <div className={styles.callVoz}>
        <span className={`${styles.callOnda} ${ringing ? styles.callOndaActiva : ''}`} aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className={styles.callVozTexto}>
          {silence
            ? 'Silenciado'
            : ringing
              ? 'Están hablando…'
              : 'Terminaron de hablar. Te toca a ti.'}
        </span>
        <button
          type="button"
          className={styles.callRepetir}
          data-control=""
          onClick={() => {
            if (latest.current.length) setQueue(latest.current)
          }}
        >
          <RotateCcw aria-hidden className={styles.callRepetirIcono} strokeWidth={2} />
          Repetir
        </button>
      </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- la transcripción
          está debajo, siempre visible, que es la misma información. */}
      <audio
        ref={audioRef}
        onEnded={() => setQueue((pending) => pending.slice(1))}
        onError={() => setQueue((pending) => pending.slice(1))}
      />

      {/* Secundaria a propósito: apoyo, no el contenido principal del escenario. */}
      <div className={styles.callTranscripcion}>
        <span className={styles.callTag}>Transcripción</span>
        {(view.dialogo ?? []).map((line) => (
          <p
            key={line.texto}
            className={`${styles.callLinea} ${line.mio ? styles.callLineaMia : ''}`}
            data-signal={line.senal}
          >
            {line.texto}
          </p>
        ))}
      </div>

      {!finished && view.decir && view.decir.length > 0 && (
        <div className={styles.callDecir}>
          <span className={styles.callTag}>Tú contestas</span>
          {view.decir.map((phrase) => (
            <button
              key={phrase.texto}
              type="button"
              className={styles.callFrase}
              data-hotspot-goto={phrase.goto}
              data-hotspot-label={phrase.label}
            >
              {phrase.texto}
            </button>
          ))}
        </div>
      )}

      {/* Los cuatro controles reaccionan aunque solo colgar decida algo, para no
          delatar con el cursor cuál resuelve el escenario. */}
      <div className={styles.callControles}>
        <button
          type="button"
          className={`${styles.callControl} ${silence ? styles.callControlActivo : ''}`}
          aria-pressed={silence}
          data-control=""
          onClick={toggleMute}
        >
          <span className={styles.callControlIcono}>
            {silence ? (
              <MicOff aria-hidden className={styles.callControlGlifo} strokeWidth={2} />
            ) : (
              <Mic aria-hidden className={styles.callControlGlifo} strokeWidth={2} />
            )}
          </span>
          {silence ? 'Silenciado' : 'Silenciar'}
        </button>


        <button
          type="button"
          className={`${styles.callControl} ${styles.callColgar}`}
          aria-label="Colgar la llamada"
          data-hotspot-goto={view.colgarGoto}
          data-hotspot-label={view.colgarLabel}
        >
          <span className={styles.callControlIcono}>
            <PhoneOff aria-hidden className={styles.callControlGlifo} strokeWidth={2} />
          </span>{' '}
          Colgar
        </button>
      </div>
    </section>
  )
}

export default CallScreen
