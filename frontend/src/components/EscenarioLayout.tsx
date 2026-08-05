import { Info } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import AppHeader from './AppHeader'
import InfoLink from './InfoLink'
import { useAuth } from '../context/AuthContext'
import { getEscenario, getSeccion } from '../data/catalogo'

interface EscenarioLayoutProps {
  /** Misma clave que recibe useScenarioRun, p. ej. 'estafa/saldo-contable'. */
  escenarioId: string
  /** Una línea; queda visible durante todo el escenario. */
  resumen: string
  /** La situación: quién eres y qué te está pasando. Solo historia, nada de
   *  mecánica — acompaña al participante también dentro del escenario, donde
   *  una frase como "vas a ver tu correo" ya no tendría sentido. */
  contexto: ReactNode
  /** Cómo se juega. Aparece únicamente en el briefing, antes de entrar. */
  nota?: ReactNode
  /** Dominio del correo del participante dentro de este escenario. Los
   *  ambientados en una empresa lo fijan al de esa empresa; el resto usan el
   *  del entrenamiento. */
  dominioCorreo?: string
  /** Va dentro del marco del dispositivo. Solo lo que la app real mostraría. */
  pantalla: ReactNode
  /** Va debajo del marco: pregunta, opciones, feedback, resultado. */
  decision: ReactNode
  onEmpezar: () => void
  /** Forma del marco exterior. 'telefono' es el default: la mayoría de
   *  escenarios (SMS, llamada, chat) se abren en el celular. 'escritorio' es
   *  para correo y web: el phishing se abre más en computador, y así se
   *  distingue de inmediato del resto de amenazas, que sí son de celular. */
  dispositivo?: 'telefono' | 'escritorio'
}

/**
 * Marco común de los escenarios. Sostiene una sola regla: si la app real lo
 * mostraría va en `pantalla`, si no va en `decision`. Un participante no aparece
 * dentro de su propia app bancaria y un banco no tiene una sección "Contexto".
 */
/** Alto y angosto, como se sostiene un celular. */
const MARCO_TELEFONO =
  'sm:max-h-[40rem] sm:w-[28.75rem] sm:rounded-[1.75rem] sm:border sm:border-hairline-strong sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-[40rem] lg:max-h-full lg:flex-none lg:self-center'

/** Ancho y bajo, como una ventana de escritorio. Los anchos con vw + min/max
 *  se recalculan solos según el viewport en vez de un solo punto de quiebre
 *  fijo: sin eso, la ventana se sale de pantalla en un portátil de 1024px, que
 *  es justo donde el layout pasa de apilado a lado a lado.
 *
 *  El alto llena la columna (`h-full`) en vez de pedir una fracción del
 *  viewport. Con `min(76vh, 720px)` la ventana dejaba sin usar unos 80px que
 *  tenía disponibles en un portátil de 768px de alto, y ese espacio es
 *  exactamente el que le faltaba al correo para no tener que desplazarse. El
 *  tope de 60rem evita el efecto contrario en un monitor grande, donde una
 *  ventana altísima tampoco se parece a nada real. Subió de 53.75 a 60rem al
 *  pasar el escenario a navegador: sus barras —pestañas, dirección y
 *  marcadores— gastan unos 140px que la ventana anterior no gastaba, y salían
 *  enteros del espacio del mensaje.
 *
 *  Las medidas van en rem y no en px: en rem se recalculan solas si alguien
 *  sube el tamaño de letra del navegador, que es lo primero que hace mucha
 *  gente mayor. En px la ventana se quedaría del mismo tamaño y el texto, ya
 *  más grande, dejaría de caber. Solo siguen en píxeles los bordes, los
 *  contornos y las sombras, que escalados se ven borrosos sin ganar nada.
 *
 *  Los topes subieron junto con la tipografía: el curso lo van a hacer adultos
 *  mayores, y una letra legible en una ventana que no crece con ella solo
 *  consigue que el correo no quepa.
 *
 *  El ancho se pide con `calc(100vw - 33.75rem)` y no con una fracción del
 *  viewport: esos 33.75rem son lo que ocupan la columna de decisión, el hueco entre
 *  ambas y los márgenes. Así la ventana se queda con TODO lo que sobra en vez
 *  de con un porcentaje fijo, que en pantallas anchas dejaba un vacío enorme a
 *  los lados y en las estrechas se pasaba de largo.
 *
 *  `self-center` y no `self-stretch`: al estirar, el tope de 720px deja la
 *  ventana anclada arriba del todo en una pantalla alta, con el hueco entero
 *  debajo. Con `h-full` ya ocupa el alto disponible, así que centrarla solo
 *  reparte lo que sobre cuando el tope se queda corto.
 */
const MARCO_ESCRITORIO =
  'sm:max-h-[min(88vh,60rem)] sm:w-[96vw] sm:max-w-[68.75rem] sm:rounded-xl sm:border sm:border-hairline-strong sm:shadow-[0_30px_70px_rgba(0,0,0,0.22)] lg:h-full lg:max-h-[60rem] lg:w-[calc(100vw-33.75rem)] lg:min-w-[35rem] lg:max-w-[75rem] lg:flex-none lg:self-center'

function EscenarioLayout({
  escenarioId,
  resumen,
  contexto,
  nota,
  dominioCorreo,
  pantalla,
  decision,
  onEmpezar,
  dispositivo = 'telefono',
}: EscenarioLayoutProps) {
  const escenario = getEscenario(escenarioId)

  if (!escenario) {
    throw new Error(`Escenario "${escenarioId}" no está en el catálogo.`)
  }

  const { displayName, roleLabel, correoSimulado, usuarioSimulado } = useAuth()
  const correoDelEscenario = dominioCorreo ? `${usuarioSimulado}@${dominioCorreo}` : correoSimulado
  const [fase, setFase] = useState<'briefing' | 'escenario'>('briefing')
  const empezarRef = useRef<HTMLButtonElement>(null)
  const escenaRef = useRef<HTMLDivElement>(null)
  const dialogoRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (fase === 'briefing') {
      empezarRef.current?.focus()
    } else {
      escenaRef.current?.focus()
    }
  }, [fase])

  function handleEmpezar() {
    // Reinicia la corrida para que durationMs no incluya el tiempo de lectura
    // del briefing: el hook fija startedAt al montarse, mucho antes de esto.
    onEmpezar()
    setFase('escenario')
  }

  const volver = (
    <Link
      to={`/seccion/${escenario.seccionId}`}
      className="text-base font-medium text-link underline"
    >
      ← Volver a la sección
    </Link>
  )

  if (fase === 'briefing') {
    return (
      <div className="min-h-dvh bg-canvas">
        <AppHeader>
          {volver}
          <InfoLink />
        </AppHeader>

        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-base font-medium text-muted">{getSeccion(escenario.seccionId)?.canal}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
            {escenario.titulo}
          </h1>

          {/* El saludo con nombre vive aquí y no en cada escenario: la historia
              que escribe el autor empieza siempre en la escena, y quién la
              protagoniza lo sabe el layout, no el guion. */}
          <p className="mt-6 text-lg leading-relaxed text-ink">
            Hola, <strong className="font-semibold">{displayName}</strong>. Esto es lo que te está
            pasando:
          </p>

          <div className="mt-3 space-y-4 text-lg leading-relaxed text-body">{contexto}</div>

          {/* Se avisa antes de entrar, y en todos los escenarios: si alguien
              ve su propio nombre en una bandeja simulada sin saber que la
              dirección es inventada, puede creer que el ejercicio le está
              mandando correo de verdad —o peor, que le llegó uno real. El
              dominio no existe fuera de la simulación. */}
          <p className="mt-6 text-base leading-relaxed text-body">
            En los escenarios usas un correo ficticio,{' '}
            <span className="font-medium text-ink">{correoDelEscenario}</span>. No existe fuera de
            este entrenamiento: nada de lo que ocurra aquí sale ni entra a tu correo real.
          </p>

          {nota && (
            <div className="mt-4 rounded-lg border border-hairline-strong bg-canvas-soft p-5 text-base leading-relaxed text-body">
              {nota}
            </div>
          )}

          <button
            ref={empezarRef}
            type="button"
            onClick={handleEmpezar}
            className="mt-10 min-h-12 rounded-md bg-primary px-7 py-3.5 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Empezar
          </button>
        </main>
      </div>
    )
  }

  return (
    // h-dvh + overflow-hidden: la página no se desplaza nunca. Lo que se
    // desplaza es el interior del dispositivo, como en una app real, y el
    // bloque de decisión si su contenido no cabe.
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas-soft">
      <AppHeader>
        {volver}
        <p className="text-base text-muted lg:order-3">
          {displayName} · {roleLabel}
        </p>
        <p className="w-full text-base leading-snug text-body lg:order-2 lg:w-auto lg:flex-1 lg:px-6">
          {resumen}
        </p>
        <span className="lg:order-4">
          <InfoLink />
        </span>
      </AppHeader>

      {/* Apilado hasta 1024px; lado a lado arriba de eso. En una pantalla de
          900px de alto no entran a la vez un dispositivo creíble y un bloque de
          opciones largo: apilarlos ahí aplasta el dispositivo justo cuando es lo
          que hay que juzgar. */}
      <main className="flex min-h-0 flex-1 flex-col items-center sm:gap-4 sm:px-4 sm:py-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8 lg:py-6 [@media(max-height:940px)]:sm:py-2 [@media(max-height:940px)]:lg:py-3">
        <div
          ref={escenaRef}
          // Fijo a propósito: el recorrido de señales de un escenario
          // interactivo ubica el elemento a resaltar con
          // document.getElementById en vez de hilar una ref nueva a través de
          // props. Solo hay un escenario montado a la vez, así que un id fijo
          // no puede colisionar.
          id="pantalla-escenario"
          tabIndex={-1}
          aria-label={`${escenario.titulo}: pantalla simulada`}
          className={`flex min-h-0 w-full flex-1 overflow-hidden focus:outline-none ${
            dispositivo === 'escritorio' ? MARCO_ESCRITORIO : MARCO_TELEFONO
          }`}
        >
          {pantalla}
        </div>

        {/* Apilado, el bloque nunca pasa de media pantalla: si no cabe, se
            desplaza él, no la página. Al costado puede usar todo el alto. */}
        <div className="max-h-[45%] w-full shrink-0 overflow-y-auto border-t border-hairline bg-canvas px-4 py-4 sm:w-[28.75rem] sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 lg:w-[23.75rem] lg:max-h-full lg:self-center xl:w-[28.75rem]">
          {/* La historia queda a un clic, no ocupando espacio permanente. Vive
              en un diálogo y no en un bloque fijo porque se consulta poco: casi
              siempre se recuerda, y cuando no, se abre.

              Va encima de la decisión y con aspecto de enlace, no de botón: es
              una consulta de apoyo, no una acción del ejercicio, y compitiendo
              en peso con "¿Qué haces?" desviaba la atención de lo único que hay
              que hacer aquí. Sigue siendo un <button> porque abre un diálogo;
              solo se viste de enlace. */}
          <button
            type="button"
            onClick={() => dialogoRef.current?.showModal()}
            className="mb-4 inline-flex items-center gap-1.5 text-base font-medium text-link underline decoration-dotted underline-offset-4 transition hover:decoration-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            <Info aria-hidden className="size-3.5" strokeWidth={2} />
            Ver contexto
          </button>

          {decision}
        </div>
      </main>

      {/* <dialog> nativo: el navegador ya resuelve el foco atrapado, el cierre
          con Escape y el fondo inerte. Una capa propia con divs tendría que
          reimplementar las tres cosas y saldría peor. */}
      <dialog
        ref={dialogoRef}
        aria-labelledby="titulo-contexto"
        className="m-auto w-[min(92vw,32rem)] rounded-lg border border-hairline-strong bg-surface p-6 text-ink shadow-card backdrop:bg-ink/40"
      >
        <h2 id="titulo-contexto" className="text-[0.6875rem] font-semibold uppercase tracking-[0.88px] text-muted">
          Tu situación
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-ink">
          Hola, <strong className="font-semibold">{displayName}</strong>.
        </p>
        <div className="mt-2 space-y-3 text-lg leading-relaxed text-body">{contexto}</div>

        <form method="dialog" className="mt-6 flex justify-end">
          <button
            type="submit"
            className="min-h-11 rounded-md bg-primary px-6 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Seguir
          </button>
        </form>
      </dialog>
    </div>
  )
}

export default EscenarioLayout
