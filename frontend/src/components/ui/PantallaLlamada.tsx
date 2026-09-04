import { ArrowLeft, Mic, MicOff, Phone, PhoneOff, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { VOCES } from '../../data/voces'
import type { ScreenView } from './DeviceScreen'
import styles from './DeviceScreen.module.css'

/**
 * La pantalla de una llamada, dentro del mismo teléfono que usa smishing.
 *
 * El módulo de vishing no puede jugarse con una lista de opciones al lado por
 * lo mismo que el de smishing dejó de hacerlo: una llamada no se decide
 * leyendo alternativas rotuladas, se decide colgando, comprobando en otra app
 * o cediendo a lo que te piden. Aquí eso son gestos de la pantalla —contestar,
 * rechazar, colgar, silenciar— y el dock del teléfono sigue debajo, así que
 * salir de la llamada a mirar la app del banco mientras el otro habla es tan
 * posible como en un teléfono de verdad.
 *
 * Lo único que no puede ser un gesto es hablar: en una llamada la respuesta es
 * lo que uno dice. Va como burbujas del propio hilo de la conversación, nunca
 * como cuestionario, y siempre conviviendo con las salidas del aparato, que es
 * lo que impide que el escenario se resuelva barriendo dos botones.
 *
 * **Se oye.** El engaño de una llamada está en el tono, en la prisa y en la
 * confianza con la que hablan, y nada de eso sobrevive convertido en texto: un
 * escenario que solo se lee entrena a leer, que es justo lo contrario de lo que
 * hay que aprender aquí. Por eso manda el audio (voces.ts, MP3 generados una
 * vez para que todos oigan lo mismo) y la transcripción queda debajo, en
 * pequeño — como apoyo para quien no puede oírla o no la entendió, no como el
 * contenido principal.
 */
type Llamada = Extract<ScreenView, { kind: 'call' }>

function reloj(segundos: number) {
  const m = String(Math.floor(segundos / 60)).padStart(2, '0')
  const s = String(segundos % 60).padStart(2, '0')
  return `${m}:${s}`
}

function PantallaLlamada({ view, terminada }: { view: Llamada; terminada?: boolean }) {
  const [segundos, setSegundos] = useState(0)
  const [silencio, setSilencio] = useState(false)
  /// Los audios que quedan por sonar. Van en cola y no todos a la vez porque
  /// un nodo puede traer varias frases seguidas.
  const [cola, setCola] = useState<string[]>([])
  const [sonando, setSonando] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  /// Cuántas líneas del diálogo ya sonaron. Cada nodo trae la conversación
  /// entera —como el hilo de un SMS trae los mensajes anteriores— así que sin
  /// esto el teléfono repetiría la llamada desde el principio en cada paso.
  const dichas = useRef(0)
  /// Qué audio está cargado en el elemento. Sin esto, volver del silencio le
  /// asignaba el mismo `src` otra vez y la frase empezaba desde el principio,
  /// en vez de seguir donde se había quedado.
  const cargado = useRef('')
  /// Lo último que dijo quien llama, para el botón de repetir. En una llamada
  /// de verdad se pide "¿me lo repite?", y sin eso la única forma de volver a
  /// oír algo sería reiniciar el escenario.
  const ultimas = useRef<string[]>([])

  useEffect(() => {
    if (view.entrante || view.marcando) {
      setSegundos(0)
      return undefined
    }
    // Una llamada colgada no sigue contando: el cronómetro corriendo bajo el
    // veredicto decía que seguías hablando con quien acababas de cortar.
    if (terminada) return undefined
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [view.entrante, view.marcando, terminada])

  useEffect(() => {
    const lineas = view.dialogo ?? []
    // Al repetir el escenario la conversación se acorta: lo que quedaba dicho
    // vuelve a estar por decir.
    if (lineas.length < dichas.current) dichas.current = 0
    const nuevas = lineas
      .slice(dichas.current)
      .filter((linea) => !linea.mio)
      .map((linea) => VOCES[linea.texto])
      .filter((url): url is string => Boolean(url))
    dichas.current = lineas.length

    if (nuevas.length === 0) return
    ultimas.current = nuevas
    // Se encola aunque esté silenciado: al quitar el silencio hay que poder
    // seguir oyendo lo que quedaba, no perderlo.
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
    // Si el navegador bloquea la reproducción automática, la transcripción
    // sigue ahí y el botón de repetir —que sí nace de un clic— la desbloquea.
    // El `as` no sobra: en jsdom `play()` no devuelve promesa ninguna, y los
    // tests del módulo se caían al encadenarle el `catch`.
    const reproduccion = audio.play() as Promise<void> | undefined
    reproduccion?.catch(() => {
      setSonando(false)
      setCola([])
    })
  }, [cola, silencio, terminada])

  /// Silenciar pausa; volver a pulsarlo sigue donde se quedó, que es lo que
  /// hace el botón en un teléfono. Reiniciar la frase entera obligaba a
  /// volver a oír lo que uno ya había escuchado solo por haberla parado.
  function alternarSilencio() {
    setSilencio((s) => !s)
  }

  const inicial = view.quien.trim().charAt(0).toUpperCase()


  if (view.entrante || view.marcando) {
    // El marcador y la llamada entrante son la misma pantalla —quién es, su
    // número y dos botones— y solo cambia qué significan. Marcar es salir a
    // buscar a alguien; contestar es dejar entrar a quien ya está llamando.
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

      {/* En una fila: el nombre manda, y el número con su aviso al lado ocupan
          una línea en vez de tres. Lo alto de la pantalla es para lo que se
          dice, que es donde está el escenario. */}
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

      {/* Lo que manda es el audio: la barra dice si están hablando y deja
          volver a oírlo, como cuando uno pide que le repitan algo. */}
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

      {/* Secundaria a propósito: apoyo para quien no puede oír el audio o no
          entendió una frase, no el contenido principal del escenario. */}
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

      {/* Los cuatro controles reaccionan, aunque solo colgar decida algo. Es la
          misma regla del dock: si únicamente respondiera el que resuelve el
          escenario, el realce del cursor lo delataría antes de escuchar nada. */}
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
