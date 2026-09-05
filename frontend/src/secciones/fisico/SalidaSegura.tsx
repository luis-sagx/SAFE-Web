import { useState, type ReactNode } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import FlashOverlay from '../../components/ui/FlashOverlay'
import Instrucciones from '../../components/ui/Instrucciones'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { useFlashTransition } from '../../hooks/useFlashTransition'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import { useScenarioRun } from '../../hooks/useScenarioRun'
import type { StoryNode } from '../../hooks/useStoryEngine'
import styles from './fisico.module.css'

interface Pestana {
  /** El de la barra. Corto a propósito: tiene que caber sin recortarse. */
  corto: string
  /** El de la página, donde sí hay sitio. */
  titulo: string
  url: string
  contenido: string[]
  color: string
}

const PESTANAS: Pestana[] = [
  {
    corto: 'Nóminas',
    titulo: 'Nóminas 2026',
    url: 'intranet.andes.ec/rrhh/nominas',
    contenido: ['Sueldos del área — enero a marzo', 'Cuentas bancarias de 42 personas'],
    color: '#4ade80',
  },
  {
    corto: 'Contraseñas',
    titulo: 'Gestor de contraseñas',
    url: 'vault.andes.ec/mis-claves',
    contenido: ['Usuario del portal: mariaperez', 'Clave guardada: visible en pantalla'],
    color: '#fbbf24',
  },
  {
    corto: 'Clientes',
    titulo: 'Clientes VIP',
    url: 'crm.andes.ec/clientes-vip',
    contenido: ['Contactos y montos de 18 cuentas', 'Marcado como confidencial'],
    color: '#60a5fa',
  },
  {
    corto: 'Reportes',
    titulo: 'Reportes financieros',
    url: 'intranet.andes.ec/finanzas/cierre',
    contenido: ['Cierre trimestral sin publicar', 'Borrador para el directorio'],
    color: '#f87171',
  },
]

interface Documento {
  nombre: string
  x: number
  rotacion: number
}

const DOCUMENTOS: Documento[] = [
  { nombre: 'Contratos', x: 52, rotacion: -4 },
  { nombre: 'Nóminas', x: 128, rotacion: 3 },
  { nombre: 'Datos bancarios', x: 812, rotacion: -3 },
]

/** Todas apuntan a la escena tal como estaba al empezar: ver PANTALLA_REPASO. */
const SENALES: Senal[] = [
  {
    id: 'pestanas',
    targetId: 'pestanas',
    pantalla: 'repaso',
    texto:
      'Una pestaña abierta con <b>nóminas o contraseñas</b> es información servida: quien pase por tu puesto la lee sin tocar tu teclado y sin dejar rastro.',
  },
  {
    id: 'papeles',
    targetId: 'papeles',
    pantalla: 'repaso',
    texto:
      'Los papeles sobre el escritorio se fotografían en un segundo. Lo confidencial se guarda <b>bajo llave</b>, no boca arriba.',
  },
  {
    id: 'bloqueo',
    targetId: 'bloqueo',
    pantalla: 'repaso',
    texto:
      'Bloquear la sesión con <b>Win + L</b> cuesta un segundo. Sin eso, tu sesión abierta es tu correo, tus sistemas y tus permisos en manos de cualquiera.',
  },
]

const REGLA =
  '<b>Escritorio limpio y pantalla bloqueada.</b> Cada vez que dejas tu puesto —aunque sea cinco minutos— no debe quedar nada a la vista ni ninguna sesión abierta.'

/** Ancho de cada pestaña en la barra, en unidades del viewBox. */
const ANCHO_PESTANA = 128
const X_PESTANAS = 244

const SIN_CERRAR: ReadonlySet<number> = new Set()

/** Una línea del checklist: qué falta y qué ya está hecho. */
function Tarea({ hecho, children }: { hecho: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          hecho ? 'bg-success text-white' : 'border border-hairline-strong text-transparent'
        }`}
      >
        ✓
      </span>
      <span className={`text-lg leading-relaxed ${hecho ? 'text-muted' : 'text-body'}`}>
        {children}
      </span>
    </li>
  )
}

function SalidaSegura() {
  const run = useScenarioRun('fisico/salida-segura')

  const [cerradas, setCerradas] = useState<ReadonlySet<number>>(SIN_CERRAR)
  const [guardados, setGuardados] = useState<ReadonlySet<number>>(SIN_CERRAR)
  const [bloqueada, setBloqueada] = useState(false)
  // Arranca en la primera pestaña, como cualquier navegador que se deja
  // abierto: una ventana sin ninguna pestaña activa no existe.
  const [pestanaActiva, setPestanaActiva] = useState<number | null>(0)
  const [final, setFinal] = useState<StoryNode | null>(null)
  // El repaso de señales apunta a cosas que el participante ya cerró o guardó.
  // Mientras dura, la escena vuelve a como estaba al empezar para que haya algo
  // que señalar.
  const [repaso, setRepaso] = useState(false)

  const stampFlash = useFlashTransition()

  const pestanasAbiertas = PESTANAS.length - cerradas.size
  const papelesExpuestos = DOCUMENTOS.length - guardados.size
  const todoListo = pestanasAbiertas === 0 && papelesExpuestos === 0 && bloqueada

  const vistaCerradas = repaso ? SIN_CERRAR : cerradas
  const vistaGuardados = repaso ? SIN_CERRAR : guardados
  const vistaBloqueada = repaso ? false : bloqueada
  const vistaActiva = repaso ? 0 : pestanaActiva
  const abiertas = PESTANAS.map((_, i) => i).filter((i) => !vistaCerradas.has(i))

  function cerrarPestana(indice: number) {
    if (final) return

    const quedan = PESTANAS.map((_, i) => i).filter((i) => i !== indice && !cerradas.has(i))
    setCerradas(new Set(cerradas).add(indice))
    // Como en un navegador: al cerrar la que estás viendo pasas a la de al
    // lado, no a una ventana en blanco.
    if (pestanaActiva === indice) {
      const siguiente = quedan.find((i) => i > indice) ?? quedan.at(-1) ?? null
      setPestanaActiva(siguiente)
    }
  }

  function guardarDocumento(indice: number) {
    if (final) return
    setGuardados(new Set(guardados).add(indice))
  }

  function alternarBloqueo() {
    if (final) return
    setBloqueada((estaba) => !estaba)
  }

  function irse() {
    if (final) return

    run.recordDecision({ pestanasAbiertas, papelesExpuestos, bloqueada })

    stampFlash.trigger(() => {
      // Lo que quedó a la vista se enumera tal cual: un "no completaste todo"
      // no dice qué se llevó puesto quien entre mañana.
      const expuesto = [
        pestanasAbiertas > 0 &&
          `${pestanasAbiertas} ${pestanasAbiertas === 1 ? 'pestaña abierta' : 'pestañas abiertas'} con datos internos`,
        papelesExpuestos > 0 &&
          `${papelesExpuestos} ${papelesExpuestos === 1 ? 'documento' : 'documentos'} sobre el escritorio`,
        !bloqueada && 'la sesión sin bloquear',
      ].filter(Boolean) as string[]

      const nodo: StoryNode = todoListo
        ? {
            kind: 'good',
            verdict: 'Puesto asegurado',
            outcome:
              'Cerraste las cuatro pestañas, guardaste los tres documentos en el cajón y bloqueaste la sesión. Quien entre esta noche no encuentra nada tuyo a la vista.',
          }
        : {
            kind: 'bad',
            verdict: 'Dejaste tu puesto expuesto',
            outcome: `Te fuiste dejando ${expuesto.join(', ')}. Personal de limpieza, visitas y cualquiera que pase por el pasillo tiene toda la noche para mirar.`,
          }

      setFinal(nodo)
      void run.finish({
        endingId: todoListo ? 'good' : 'bad',
        outcome: todoListo ? 'CORRECTO' : 'INCORRECTO',
      })
    }, 750)
  }

  function reiniciar() {
    run.restart()
    setCerradas(SIN_CERRAR)
    setGuardados(SIN_CERRAR)
    setBloqueada(false)
    setPestanaActiva(0)
    setFinal(null)
    setRepaso(false)
  }

  const contexto: Contexto = {
    antes: (
      <p>
        La seguridad física pesa tanto como la digital. Lo que dejas a la vista al irte —una
        pantalla encendida, una carpeta abierta— no necesita que nadie te robe una contraseña:
        basta con mirar.
      </p>
    ),
    ahora: (
      <>
        <strong>Son las 5:50 PM y eres el último en salir</strong>. En tu pantalla quedaron
        pestañas abiertas con nóminas y contraseñas, sobre el escritorio hay carpetas con datos de
        clientes y tu sesión sigue abierta. Esta noche entra personal de limpieza, y mañana la
        oficina se llena antes que tú.
      </>
    ),
  }

  const paginaActiva = vistaActiva !== null ? PESTANAS[vistaActiva] : undefined

  // Un elemento, no un componente definido aquí dentro: declarado como
  // `function Escena()` local, cada render creaba un tipo de componente nuevo y
  // React desmontaba y volvía a montar el SVG entero en cada clic. De ahí venía
  // la sensación de que los papeles necesitaban doble clic.
  const escena = (
    <svg
      viewBox="0 0 1000 620"
      className={styles.escena}
      role="img"
      aria-label="Tu puesto de trabajo al final del día"
    >
      <defs>
        <linearGradient id="salida-pared" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4ebde" />
          <stop offset="1" stopColor="#e6d8c3" />
        </linearGradient>
        <linearGradient id="salida-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7f93bd" />
          <stop offset="0.55" stopColor="#e0a07a" />
          <stop offset="1" stopColor="#f5c98a" />
        </linearGradient>
        <linearGradient id="salida-mesa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c39a67" />
          <stop offset="1" stopColor="#a97b48" />
        </linearGradient>
        <filter id="salida-sombra" x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#4a3418" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Pared, zócalo y piso */}
      <rect width="1000" height="470" fill="url(#salida-pared)" />
      <rect y="462" width="1000" height="10" fill="#d6c4a9" />
      <rect y="472" width="1000" height="148" fill="#c39a68" />

      {/* Ventana: es lo que dice que ya anocheció, sin tener que escribirlo */}
      <g filter="url(#salida-sombra)">
        <rect x="58" y="92" width="188" height="150" rx="6" fill="#8a6a45" />
        <rect x="66" y="100" width="172" height="134" fill="url(#salida-cielo)" />
        <circle cx="152" cy="196" r="19" fill="#fbe3ad" opacity="0.9" />
        <rect x="148" y="100" width="8" height="134" fill="#8a6a45" />
        <rect x="66" y="163" width="172" height="8" fill="#8a6a45" />
        <rect x="50" y="242" width="204" height="12" rx="4" fill="#a5825a" />
      </g>

      {/* Reloj: las 5:50, la hora del escenario */}
      <g filter="url(#salida-sombra)">
        <circle cx="884" cy="150" r="46" fill="#fbfaf7" stroke="#5c6470" strokeWidth="4" />
        <line x1="884" y1="150" x2="886" y2="172" stroke="#5c6470" strokeWidth="5" strokeLinecap="round" />
        <line x1="884" y1="150" x2="855" y2="133" stroke="#5c6470" strokeWidth="4" strokeLinecap="round" />
        <circle cx="884" cy="150" r="4" fill="#5c6470" />
      </g>

      {/* Escritorio */}
      <rect x="30" y="410" width="940" height="28" rx="7" fill="url(#salida-mesa)" />
      <rect x="30" y="410" width="940" height="8" rx="4" fill="#d3ab77" />
      <rect x="76" y="438" width="848" height="132" fill="#96693b" />
      <rect x="76" y="438" width="848" height="132" fill="none" stroke="#7c5529" strokeWidth="3" />

      {/* Cajón con llave: el destino de los papeles, con su contador */}
      <g>
        <rect x="640" y="462" width="252" height="86" rx="8" fill="#a97444" stroke="#7c5529" strokeWidth="3" />
        <rect x="728" y="500" width="76" height="11" rx="5" fill="#5b3f1f" />
        <circle cx="874" cy="505" r="7" fill="#5b3f1f" />
        <text x="766" y="487" textAnchor="middle" className={styles.rotuloMueble}>
          CAJÓN CON LLAVE
        </text>
        <text x="766" y="536" textAnchor="middle" className={styles.contadorMueble}>
          {vistaGuardados.size} de {DOCUMENTOS.length} guardados
        </text>
      </g>

      {/* Monitor */}
      <g filter="url(#salida-sombra)">
        <rect x="472" y="374" width="56" height="30" fill="#454b54" />
        <rect x="430" y="398" width="140" height="14" rx="7" fill="#3a3f47" />
        <rect x="228" y="52" width="544" height="332" rx="14" fill="#2a2f36" />
      </g>

      {/* Ventana del navegador. Con la sesión bloqueada no se dibuja: lo que
          hay es la pantalla de bloqueo, y así no se puede cerrar una pestaña
          desde un equipo que supuestamente está bloqueado. Para volver al
          navegador hay que desbloquear, como en la vida real. */}
      <g>
        <rect x="240" y="64" width="520" height="308" rx="6" fill="#1a1e23" />

        {vistaBloqueada ? (
          <g>
            <rect x="240" y="64" width="520" height="308" rx="6" fill="#12161a" />
            <path
              d="M 487 244 v -14 a 13 13 0 0 1 26 0 v 14"
              fill="none"
              stroke="#16a34a"
              strokeWidth="6"
            />
            <rect x="478" y="244" width="44" height="34" rx="6" fill="#16a34a" />
            <circle cx="500" cy="260" r="4" fill="#12161a" />
            <text x="500" y="308" textAnchor="middle" className={styles.pantallaBloqueada}>
              SESIÓN BLOQUEADA
            </text>
          </g>
        ) : (
          <>
        {/* Barra de pestañas. Cada una se coloca por su sitio ENTRE LAS
            ABIERTAS, no por su índice original: al cerrar una del medio las de
            la derecha se deslizan y no queda el hueco. */}
        <g data-signal="pestanas">
          {PESTANAS.map((pestana, i) => {
            const posicion = abiertas.indexOf(i)
            if (posicion === -1) return null

            const activa = vistaActiva === i
            const x = X_PESTANAS + posicion * ANCHO_PESTANA

            return (
              <g
                key={pestana.corto}
                className={styles.pestana}
                style={{ transform: `translateX(${x}px)` }}
              >
                <g className={styles.hotspot} onClick={() => setPestanaActiva(i)}>
                  <rect
                    x="0"
                    y="72"
                    width="122"
                    height="34"
                    rx="6"
                    fill={activa ? '#f7f7f5' : '#272c33'}
                  />
                  <circle cx="16" cy="89" r="5" fill={pestana.color} />
                  <text
                    x="30"
                    y="94"
                    className={activa ? styles.pestanaTextoActiva : styles.pestanaTexto}
                  >
                    {pestana.corto}
                  </text>
                </g>

                {/* La ✕ va en su propio hueco a la derecha, fuera del texto:
                    antes se dibujaba encima del título y se leían las dos cosas
                    superpuestas. */}
                <g
                  className={styles.cerrar}
                  onClick={() => cerrarPestana(i)}
                  role="button"
                  aria-label={`Cerrar la pestaña ${pestana.titulo}`}
                >
                  <circle cx="104" cy="89" r="13" fill="transparent" />
                  <circle cx="104" cy="89" r="11" className={styles.cerrarHalo} />
                  <path
                    d="M 99 84 L 109 94 M 109 84 L 99 94"
                    stroke={activa ? '#3d434b' : '#c8cfd7'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              </g>
            )
          })}
        </g>

        {/* Barra de dirección: la URL es la de la pestaña que estás viendo */}
        <rect x="240" y="110" width="520" height="34" fill="#23282f" />
        <rect x="252" y="116" width="496" height="22" rx="11" fill="#31373f" />
        <text x="500" y="132" textAnchor="middle" className={styles.url}>
          {paginaActiva ? `https://${paginaActiva.url}` : ''}
        </text>

        {/* Contenido */}
        <rect x="240" y="144" width="520" height="228" fill="#f7f7f5" />

        {paginaActiva ? (
          <g>
            <text x="268" y="186" className={styles.paginaTitulo}>
              {paginaActiva.titulo}
            </text>
            <line x1="268" y1="200" x2="732" y2="200" stroke="#e3e3df" strokeWidth="2" />
            {paginaActiva.contenido.map((linea, i) => (
              <text key={linea} x="268" y={232 + i * 28} className={styles.paginaLinea}>
                {linea}
              </text>
            ))}
          </g>
        ) : (
          <text x="500" y="262" textAnchor="middle" className={styles.paginaVacia}>
            No queda ninguna pestaña abierta
          </text>
        )}
          </>
        )}
      </g>

      {/* Documentos sobre el escritorio */}
      <g data-signal="papeles">
        {DOCUMENTOS.map((documento, i) =>
          vistaGuardados.has(i) ? null : (
            <g
              key={documento.nombre}
              className={styles.hotspot}
              onClick={() => guardarDocumento(i)}
              role="button"
              aria-label={`Guardar ${documento.nombre} en el cajón`}
              transform={`rotate(${documento.rotacion} ${documento.x + 54} 350)`}
            >
              <g filter="url(#salida-sombra)">
                <rect x={documento.x} y="294" width="108" height="116" rx="5" className={styles.papel} />
              </g>
              <line x1={documento.x + 14} y1="318" x2={documento.x + 94} y2="318" className={styles.papelLinea} />
              <line x1={documento.x + 14} y1="334" x2={documento.x + 94} y2="334" className={styles.papelLinea} />
              <line x1={documento.x + 14} y1="350" x2={documento.x + 72} y2="350" className={styles.papelLinea} />
              <rect x={documento.x + 1} y="374" width="106" height="35" className={styles.papelBanda} />
              <text x={documento.x + 54} y="397" textAnchor="middle" className={styles.papelRotulo}>
                {documento.nombre}
              </text>
              <rect
                x={documento.x - 6}
                y="288"
                width="120"
                height="128"
                rx="9"
                className={`${styles.revelable} ${styles.contorno}`}
              />
              <g className={styles.revelable} style={{ pointerEvents: 'none' }}>
                <rect x={documento.x - 18} y="252" width="144" height="28" rx="14" className={styles.pastilla} />
                <text x={documento.x + 54} y="271" textAnchor="middle" className={styles.pastillaTexto}>
                  Guardar en el cajón
                </text>
              </g>
            </g>
          ),
        )}
      </g>

      {/* Teclado: bloquear la sesión es lo que se hace desde él, así que el
          control es el teclado y no un botón flotante inventado. */}
      <g
        data-signal="bloqueo"
        className={styles.hotspot}
        onClick={alternarBloqueo}
        role="button"
        aria-label={vistaBloqueada ? 'Desbloquear la sesión' : 'Bloquear la sesión'}
      >
        <g filter="url(#salida-sombra)">
          <rect x="378" y="386" width="244" height="34" rx="7" fill="#e6e7ea" stroke="#b9bcc3" strokeWidth="2" />
        </g>
        {[0, 1, 2].map((fila) =>
          Array.from({ length: 13 }, (_, columna) => (
            <rect
              key={`${fila}-${columna}`}
              x={386 + columna * 17.6 + (fila === 2 ? 6 : 0)}
              y={391 + fila * 9}
              width="14"
              height="7"
              rx="2"
              fill="#c7cad0"
            />
          )),
        )}
        <rect x="440" y="418" width="120" height="7" rx="3" fill="#c7cad0" />
        {/* Piloto del equipo: verde fijo cuando la sesión quedó bloqueada. */}
        <circle cx="612" cy="393" r="4" className={vistaBloqueada ? styles.pilotoOk : styles.pilotoOff} />

        <rect x="368" y="378" width="264" height="52" rx="10" className={`${styles.revelable} ${styles.contorno}`} />

        {/* Con la sesión bloqueada no se rotula nada: ya lo dice la pantalla, y
            repetirlo en la madera del escritorio no es algo que exista ahí. */}
        {!vistaBloqueada && (
          <text x="500" y="452" textAnchor="middle" className={styles.rotuloTeclado}>
            Bloquear la sesión · Win + L
          </text>
        )}
      </g>
    </svg>
  )

  const pantalla = (
    <div className={styles.escenaMarco}>
      {escena}
      <FlashOverlay active={stampFlash.active} />
    </div>
  )

  const decision = final ? (
    <PanelVeredicto
      estadoGuardado={run.status}
      escenarioId="fisico/salida-segura"
      node={final}
      senales={SENALES}
      regla={REGLA}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => setRepaso(Boolean(id))}
    />
  ) : (
    <div className="grid gap-4">
      <p className="text-lg font-semibold text-ink">Antes de irte, deja el puesto listo</p>

      <Instrucciones
        pista={
          <p>
            Cada pestaña se cierra con su <strong>✕</strong>, como en tu navegador. Los documentos
            se guardan con un clic y se van al cajón. La sesión se bloquea desde el teclado. Puedes
            irte cuando quieras: lo que dejes a la vista, ahí queda.
          </p>
        }
      >
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre tu puesto como lo harías al final de un día real. Nadie te va a avisar de lo
          que falta.
        </p>

        <ul className="grid gap-2.5">
          <Tarea hecho={pestanasAbiertas === 0}>
            Cerrar las pestañas del navegador{' '}
            <span className="tabular-nums text-muted">
              ({cerradas.size} de {PESTANAS.length})
            </span>
          </Tarea>
          <Tarea hecho={papelesExpuestos === 0}>
            Guardar los documentos en el cajón{' '}
            <span className="tabular-nums text-muted">
              ({guardados.size} de {DOCUMENTOS.length})
            </span>
          </Tarea>
          <Tarea hecho={bloqueada}>Bloquear la sesión</Tarea>
        </ul>
      </Instrucciones>

      {/* Siempre habilitado: irse dejando cosas a la vista es justamente la
          decisión que este escenario mide. Deshabilitarlo hasta tenerlo todo
          hecho convertía el ejercicio en un trámite que no se puede fallar. */}
      <button
        type="button"
        onClick={irse}
        className="min-h-12 w-full rounded-md bg-primary px-4 py-3 text-lg font-medium text-on-primary transition hover:bg-primary-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        {todoListo ? 'Irme: el puesto está listo' : 'Irme de la oficina'}
      </button>
    </div>
  )

  const nota = (
    <div className="text-base leading-relaxed text-body">
      <p>
        Vas a ver tu puesto de trabajo. Puedes tocar lo que quieras de la escena; el escenario
        termina cuando decides irte.
      </p>
    </div>
  )

  return (
    <EscenarioLayout
      escenarioId="fisico/salida-segura"
      resumen="Fin de jornada — Deja tu puesto asegurado"
      contexto={contexto}
      nota={nota}
      identidad={[]}
      pantalla={pantalla}
      decision={decision}
      resultado={final?.kind === 'good' ? 'good' : final ? 'bad' : undefined}
      onEmpezar={reiniciar}
      dispositivo="escritorio"
    />
  )
}

export default SalidaSegura
