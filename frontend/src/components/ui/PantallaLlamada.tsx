import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { VOICES } from '../../data/voces'
import type { ScreenView } from './DeviceScreen'
import styles from './DeviceScreen.module.css'

// Pantalla de llamada: se decide con gestos (contestar/rechazar/colgar/silenciar),
// no con una lista de opciones, y manda el audio, la transcripción es solo apoyo.
type Call = Extract<ScreenView, { kind: 'call' }>
type Line = NonNullable<Call['dialogo']>[number]

// Cuenta cuántas líneas propias (`mio`) encabezan el arreglo: no tienen
// audio que esperar, así que se revelan de inmediato, una tras otra.
function leadingOwnLines(lines: Line[]): number {
  let i = 0
  while (i < lines.length && lines[i]!.mio) i++
  return i
}

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
  // Mostrar toda la transcripción de golpe se sentía como un audio ya
  // grabado, no como una llamada: cada frase del otro lado se revela recién
  // cuando termina de sonar. Las propias (`mio`) no tienen audio que
  // esperar, así que se revelan de inmediato.
  const [revealed, setRevealed] = useState(0)
  // Líneas del tramo nuevo que aún no se revelan (a la espera de su audio):
  // una vez revelada la que va sonando, puede haber líneas propias justo
  // después que tampoco necesitan esperar.
  const pendingReveal = useRef<Line[]>([])
  // Texto ya sonado de la frase en curso, para que se vea como un subtítulo
  // en vivo (issue #250) en vez de aparecer completa recién al terminar.
  const [partial, setPartial] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)
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
    let previouslySpoken = spoken.current
    if (lines.length < previouslySpoken) {
      previouslySpoken = 0
      setRevealed(0)
    }
    const newLines = lines.slice(previouslySpoken)
    const leading = leadingOwnLines(newLines)
    spoken.current = lines.length
    setRevealed(previouslySpoken + leading)
    pendingReveal.current = newLines.slice(leading)
    setPartial('')

    const newVoiceUrls = newLines
      .filter((line) => !line.mio)
      .map((line) => VOICES[line.texto])
      .filter((url): url is string => Boolean(url))

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

  // El texto crece hacia abajo sin que el participante lo pida: sin esto
  // quedaría tapado por el resto de la pantalla en vez de a la vista.
  useEffect(() => {
    const el = transcriptRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [revealed, partial])

  // Silenciar pausa; volver a pulsarlo continúa donde se quedó, no reinicia la frase.
  function toggleMute() {
    setSilence((s) => !s)
  }

  // La línea que acaba de sonar se revela, y con ella cualquier línea propia
  // que la siga de inmediato (no tiene audio propio que esperar).
  function revealNextSpoken() {
    const remaining = pendingReveal.current.slice(1)
    const leading = leadingOwnLines(remaining)
    pendingReveal.current = remaining.slice(leading)
    setRevealed((r) => Math.min(r + 1 + leading, spoken.current))
    setPartial('')
  }

  // Subtítulo en vivo: al ritmo del audio, no de golpe al final (issue #250).
  function revealAsSpoken() {
    const audio = audioRef.current
    const line = pendingReveal.current[0]
    if (!audio || !line || !Number.isFinite(audio.duration) || audio.duration <= 0) return
    const fraction = Math.min(audio.currentTime / audio.duration, 1)
    setPartial(line.texto.slice(0, Math.floor(line.texto.length * fraction)))
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
        onTimeUpdate={revealAsSpoken}
        onEnded={() => {
          setQueue((pending) => pending.slice(1))
          revealNextSpoken()
        }}
        onError={() => {
          setQueue((pending) => pending.slice(1))
          revealNextSpoken()
        }}
      />

      {/* Secundaria a propósito: apoyo, no el contenido principal del escenario.
          El orden vuelve a ser transcripción-y-luego-respuestas (como antes de
          #250): moverlas arriba se veía raro sobre la barra de voz. Lo que sí
          se mantiene es que el contenedor ya no recorta en silencio
          (overflow-y: auto) y que las respuestas esperan su turno (ver
          `disabled` abajo). */}
      <div className={styles.callTranscripcion} ref={transcriptRef}>
        <span className={styles.callTag}>Transcripción</span>
        {(view.dialogo ?? []).slice(0, revealed).map((line) => (
          <p
            key={line.texto}
            className={`${styles.callLinea} ${line.mio ? styles.callLineaMia : ''}`}
            data-signal={line.senal}
          >
            {line.texto}
          </p>
        ))}
        {partial && (
          <p className={styles.callLinea} data-signal={pendingReveal.current[0]?.senal}>
            {partial}
          </p>
        )}
      </div>

      {!finished && view.decir && view.decir.length > 0 && (
        <div className={styles.callDecir}>
          <span className={styles.callTag}>Tú contestas</span>
          {view.decir.map((phrase) => (
            <button
              key={phrase.texto}
              type="button"
              className={styles.callFrase}
              // Deshabilitadas mientras suena el audio del otro lado (issue
              // #250): antes se podía contestar de inmediato, sin esperar,
              // que es lo que hacía que se sintiera como elegir de una lista
              // en vez de como esperar el turno en una llamada de verdad.
              disabled={ringing}
              data-hotspot-goto={ringing ? undefined : phrase.goto}
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
