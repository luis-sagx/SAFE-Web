import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { VOCES } from '../../data/voces'
import type { ScreenView } from './DeviceScreen'
import styles from './DeviceScreen.module.css'

// Pantalla de llamada: se decide con gestos (contestar/rechazar/colgar/silenciar),
// no con una lista de opciones, y manda el audio — la transcripción es solo apoyo.
type Llamada = Extract<ScreenView, { kind: 'call' }>

function reloj(segundos: number) {
  const m = String(Math.floor(segundos / 60)).padStart(2, '0')
  const s = String(segundos % 60).padStart(2, '0')
  return `${m}:${s}`
}

function PantallaLlamada({ view, terminada }: { view: Llamada; terminada?: boolean }) {
  const [segundos, setSegundos] = useState(0)
  const [silencio, setSilencio] = useState(false)
  // Audios pendientes, en cola: un nodo puede traer varias frases seguidas.
  const [cola, setCola] = useState<string[]>([])
  const [sonando, setSonando] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  // Cada nodo trae la conversación entera; sin esto se repetiría desde el inicio en cada paso.
  const dichas = useRef(0)
  // Evita reasignar el mismo `src` al salir del silencio, lo que reiniciaba la frase.
  const cargado = useRef('')
  // Última frase dicha, para el botón "repetir" (como pedir "¿me lo repite?").
  const ultimas = useRef<string[]>([])

  useEffect(() => {
    if (view.entrante || view.marcando) {
      setSegundos(0)
      return undefined
    }
    // Colgada, no sigue contando: el cronómetro bajo el veredicto no debe seguir corriendo.
    if (terminada) return undefined
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [view.entrante, view.marcando, terminada])

  useEffect(() => {
    const lineas = view.dialogo ?? []
    // Al reiniciar el escenario la conversación se acorta.
    if (lineas.length < dichas.current) dichas.current = 0
    const nuevas = lineas
      .slice(dichas.current)
      .filter((linea) => !linea.mio)
      .map((linea) => VOCES[linea.texto])
      .filter((url): url is string => Boolean(url))
    dichas.current = lineas.length

    if (nuevas.length === 0) return
    ultimas.current = nuevas
    // Se encola aunque esté silenciado, para no perderlo al quitar el silencio.
    setCola(nuevas)
  }, [view.dialogo])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Colgar calla a quien hablaba, como en un teléfono de verdad.
    if (terminada || cola.length === 0) {
      audio.pause()
      setSonando(false)
      return
    }

    const siguiente = cola[0]!
    if (cargado.current !== siguiente) {
      cargado.current = siguiente
      audio.src = siguiente
    }

    if (silencio) {
      audio.pause()
      setSonando(false)
      return
    }

    setSonando(true)
    // `as`: en jsdom `play()` no devuelve promesa y los tests fallaban al encadenar `.catch`.
    const reproduccion = audio.play() as Promise<void> | undefined
    reproduccion?.catch(() => {
      setSonando(false)
      setCola([])
    })
  }, [cola, silencio, terminada])

  // Silenciar pausa; volver a pulsarlo continúa donde se quedó, no reinicia la frase.
  function alternarSilencio() {
    setSilencio((s) => !s)
  }

  const inicial = view.quien.trim().charAt(0).toUpperCase()


  if (view.entrante || view.marcando) {
    // Marcador y llamada entrante comparten pantalla; solo cambia qué significan los botones.
    const rotulos = view.marcando
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
      <section className={`${styles.call} ${styles.callEntrante}`} aria-label={rotulos.region}>
        <p className={styles.callEstado}>{rotulos.estado}</p>
        <div className={styles.callQuien} data-signal={view.senalQuien}>
          <span className={`${styles.callAvatar} ${styles.callAvatarGrande}`} aria-hidden>
            {inicial}
          </span>
          <p className={styles.callNombre}>{view.quien}</p>
          <p className={styles.callNumero}>{view.numero}</p>
          {view.etiqueta && <span className={styles.callEtiqueta}>{view.etiqueta}</span>}
        </div>

        <div className={styles.callEntranteAcciones}>
          <button
            type="button"
            className={`${styles.callBotonRedondo} ${rotulos.claseNo}`}
            aria-label={rotulos.noAria}
            data-hotspot-goto={view.rechazarGoto}
            data-hotspot-label={view.rechazarLabel}
          >
            <rotulos.NoIcono aria-hidden className={styles.callBotonIcono} strokeWidth={2} />
            <span className={styles.callBotonTexto}>{rotulos.no}</span>
          </button>
          <button
            type="button"
            className={`${styles.callBotonRedondo} ${styles.callContestar}`}
            aria-label={rotulos.siAria}
            data-hotspot-goto={view.contestarGoto}
            data-hotspot-label={view.contestarLabel}
          >
            <Phone aria-hidden className={styles.callBotonIcono} strokeWidth={2} />
            <span className={styles.callBotonTexto}>{rotulos.si}</span>
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
            className={`${styles.callPunto} ${terminada ? styles.callPuntoApagado : ''}`}
            aria-hidden
          />
          {terminada ? 'Llamada finalizada' : 'En llamada'}
        </span>
        <span className={styles.callReloj}>{reloj(segundos)}</span>
      </div>

      <div className={styles.callQuienFila} data-signal={view.senalQuien}>
        <span className={styles.callAvatar} aria-hidden>
          {inicial}
        </span>
        <span className={styles.callQuienTextos}>
          <span className={styles.callNombre}>{view.quien}</span>
          <span className={styles.callNumeroFila}>
            {view.numero}
            {view.etiqueta && <span className={styles.callEtiqueta}>{view.etiqueta}</span>}
          </span>
        </span>
      </div>

      {!terminada && (
      <div className={styles.callVoz}>
        <span className={`${styles.callOnda} ${sonando ? styles.callOndaActiva : ''}`} aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className={styles.callVozTexto}>
          {silencio
            ? 'Silenciado'
            : sonando
              ? 'Están hablando…'
              : 'Terminaron de hablar. Te toca a ti.'}
        </span>
        <button
          type="button"
          className={styles.callRepetir}
          data-control=""
          onClick={() => {
            if (ultimas.current.length) setCola(ultimas.current)
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
        onEnded={() => setCola((pendientes) => pendientes.slice(1))}
        onError={() => setCola((pendientes) => pendientes.slice(1))}
      />

      {/* Secundaria a propósito: apoyo, no el contenido principal del escenario. */}
      <div className={styles.callTranscripcion}>
        <span className={styles.callTag}>Transcripción</span>
        {(view.dialogo ?? []).map((linea) => (
          <p
            key={linea.texto}
            className={`${styles.callLinea} ${linea.mio ? styles.callLineaMia : ''}`}
            data-signal={linea.senal}
          >
            {linea.texto}
          </p>
        ))}
      </div>

      {!terminada && view.decir && view.decir.length > 0 && (
        <div className={styles.callDecir}>
          <span className={styles.callTag}>Tú contestas</span>
          {view.decir.map((frase) => (
            <button
              key={frase.texto}
              type="button"
              className={styles.callFrase}
              data-hotspot-goto={frase.goto}
              data-hotspot-label={frase.label}
            >
              {frase.texto}
            </button>
          ))}
        </div>
      )}

      {/* Los cuatro controles reaccionan aunque solo colgar decida algo, para no
          delatar con el cursor cuál resuelve el escenario. */}
      <div className={styles.callControles}>
        <button
          type="button"
          className={`${styles.callControl} ${silencio ? styles.callControlActivo : ''}`}
          aria-pressed={silencio}
          data-control=""
          onClick={alternarSilencio}
        >
          <span className={styles.callControlIcono}>
            {silencio ? (
              <MicOff aria-hidden className={styles.callControlGlifo} strokeWidth={2} />
            ) : (
              <Mic aria-hidden className={styles.callControlGlifo} strokeWidth={2} />
            )}
          </span>
          {silencio ? 'Silenciado' : 'Silenciar'}
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

export default PantallaLlamada
