import { Building2, Forward, Landmark, Newspaper, Reply, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import type { Contexto } from '../../components/ui/ContextoEscenario'
import { carpetasCorreo } from '../../components/ui/carpetasCorreo'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
} from '../../components/ui/DesktopChrome'
import { AvisoSitio, CabeceraSitio, ENLACES_PIE, PieSitio } from '../../components/ui/armazonSitio'
import styles from '../../components/ui/DeviceScreen.module.css'
import { useAuth } from '../../context/AuthContext'
import { IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'
import Instrucciones from '../../components/ui/Instrucciones'
import { BotonHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import {
  Navegador,
  type MarcadorNavegador,
  type PestanaConfig,
} from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { formatoHora } from '../../hooks/useRelojDelSistema'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },

  e_bien: {
    kind: 'good',
    verdict: 'Acertaste · el correo era legítimo',
    outcome:
      'Era un aviso real de Talento Humano y entraste por el portal de la empresa. Revisaste tu rol y notaste que faltaban dos horas extra: las reclamaste a tiempo.',
  },

  // Responder es, en este correo, exactamente "responder con mi usuario y mi
  // contraseña": el original nunca tuvo una acción de "responder genérico"
  // separada, así que el botón de la barra apunta directo a este final.
  e_credenciales: {
    kind: 'bad',
    verdict: 'Correo legítimo, reacción peligrosa',
    outcome: `El remitente era real, pero tu contraseña ${IDENTIDAD_FICTICIA.clave} quedó escrita en un correo. Cualquiera que lea ese buzón (o que lo intercepte) la tiene, y el propio mensaje avisaba que Talento Humano nunca la pide.`,
    score: 0,
  },
  e_borra: {
    kind: 'partial',
    verdict: 'Prudente, pero de más',
    outcome:
      'El correo era auténtico y lo descartaste sin mirarlo. No pasó nada malo, pero te quedaste sin revisar tu rol y el plazo para reclamar diferencias venció.',
    score: 50,
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'Lo pasaste, pero sigue pendiente',
    outcome:
      'El aviso era auténtico, así que reenviarlo no puso a nadie en riesgo. Pero pedir una opinión no es lo mismo que actuar: tu rol de pagos sigue sin revisar y el plazo para reclamar diferencias corre igual.',
    score: 50,
  },
  e_spam: {
    kind: 'bad',
    verdict: 'Descartaste un aviso real',
    outcome:
      'Talento Humano sí publicó tu rol de pagos. Marcarlo como spam no solo te lo saca de la vista: le enseña al filtro a esconder los próximos avisos del mismo remitente, y esos sí los vas a necesitar.',
    score: 0,
  },
}

const ACCIONES: AccionCorreo[] = [
  {
    Icono: Reply,
    etiqueta: 'Responder',
    titulo: 'Responder',
    goto: 'e_credenciales',
    label: 'Respondió el correo con su usuario y su contraseña',
  },
  {
    Icono: Forward,
    etiqueta: 'Reenviar',
    titulo: 'Reenviar',
    goto: 'e_reenviar',
    label: 'Reenvió el correo a otra persona',
  },
  {
    Icono: Trash2,
    etiqueta: 'Eliminar',
    titulo: 'Eliminar',
    goto: 'e_borra',
    label: 'Eliminó el correo',
  },
  {
    Icono: ShieldAlert,
    etiqueta: 'Spam',
    titulo: 'Marcar como spam',
    goto: 'e_spam',
    label: 'Marcó el correo como spam',
  },
]

const ASUNTO = 'Tu rol de pagos de julio ya está disponible'
const REMITENTE_NOMBRE = 'Talento Humano · Corporación Andes'
const DIRECCION = 'nomina@andes.com.ec'

/// El mensaje tal como lo muestran las carpetas cuando una acción de la barra
/// lo mueve de bandeja. Lo pinta `carpetasCorreo`, compartido por todos los
/// escenarios de correo.
const MENSAJE = { nombre: REMITENTE_NOMBRE, direccion: DIRECCION, asunto: ASUNTO }

/// Este escenario nombró dos de sus finales antes de que la barra tuviera
/// nombres comunes. Se traducen aquí, en la única línea que le importa a las
/// carpetas, en vez de renombrarlos en el grafo: el id del final viaja al
/// backend con cada corrida, y cambiarlo dejaría las corridas ya registradas
/// hablando de finales que no existen.
const ALIAS_FINAL: Record<string, string> = {
  e_borra: 'e_eliminar',
  e_credenciales: 'e_responder',
}

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'La dirección del remitente termina <b>exactamente</b> igual que la de la empresa, <b>andes.com.ec</b>, sin letras ni palabras de más. En una imitación esa parte final nunca coincide del todo.',
  },
  {
    id: 's2',
    targetId: 'saludo',
    pantalla: 'n1',
    texto: 'Te llama <b>por tu nombre</b> y menciona un período y un plazo concretos.',
  },
  {
    id: 's3',
    texto: '<b>No pide credenciales</b> ni datos: solo avisa dónde está la información.',
  },
  {
    id: 's4',
    targetId: 'canal',
    pantalla: 'n1',
    texto: 'Ofrece un <b>canal alterno verificable</b> (la extensión 214).',
  },
  {
    id: 's5',
    targetId: 'portal',
    pantalla: 'n1',
    texto:
      'El enlace lleva al portal de la propia empresa, en su misma dirección de siempre y con el candado del navegador a la vista.',
  },
]

const RULE =
  'Regla de oro: no todo correo es una trampa. Lo que distingue a uno legítimo es que <b>no te pide tu clave y su dominio es el real</b>. Aun así, entra al portal escribiendo tú la dirección: es la costumbre que te protege siempre.'

const RESUMEN = 'Talento Humano avisa que tu rol de pagos de julio ya está en el portal.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Trabajas en <strong>Corporación Andes</strong>. Todos los meses Talento Humano publica el rol
      de pagos en el portal del colaborador y avisa por correo.
    </>
  ),
  ahora: (
    <>
      <strong>Antes de que cierre el plazo de reclamos</strong> llega el correo del rol de este mes.
    </>
  ),
}

const NOTA = (
  <>
    <p>
      Vas a ver tu computador con el correo abierto. Puedes actuar sobre la pantalla como lo harías
      de verdad.
    </p>
    <p className="mt-2">
      El escenario termina cuando decidas qué hacer con el mensaje, o si caes en lo que pide.
      Moverte por las pantallas y cerrarlas no decide nada.
    </p>
  </>
)

function horaDeLlegada(): string {
  const ahora = new Date()
  const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1, 17, 20)
  return `ayer ${formatoHora(ayer)}`
}

const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Portal del colaborador',
    url: 'https://portal.andes.com.ec/rrhh/rol',
    segura: true,
    // Cerrar el portal devuelve al correo: irse de una página no es todavía
    // una decisión sobre el mensaje (issue #24).
    cierra: 'n1',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  { Icono: Landmark, texto: 'Banco del Litoral' },
  {
    Icono: Building2,
    texto: 'Portal Andes',
    goto: 'n2',
    label: 'Abrió el portal del colaborador desde sus marcadores',
  },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{ nombre: REMITENTE_NOMBRE, direccion: DIRECCION, senalDireccion: 'remitente' }}
      recibido={recibido}
      pie={
        <>
          <p>Talento Humano · Corporación Andes</p>
          <p>Nunca te pediremos tu contraseña por correo ni por teléfono.</p>
        </>
      }
    >
      <p data-signal="saludo">Hola,</p>
      <p>
        Tu rol de pagos del período <b>julio 2026</b> ya está publicado en el portal del
        colaborador, junto con el detalle de horas extra y descuentos.
      </p>
      <p>
        Puedes consultarlo en <b data-signal="portal">portal.andes.com.ec</b>, con el mismo usuario
        de tu correo institucional. Si algo no cuadra, responde a este correo o escribe a{' '}
        <span data-signal="canal">la extensión 214</span> antes del 8 de agosto.
      </p>
    </CuerpoCorreo>
  )
}

function ContenidoPortal() {
  const { usuarioSimulado } = useAuth()

  return (
    <div className={styles.page}>
      <CabeceraSitio
        marca="Corporación Andes"
        menu={['Rol de pagos', 'Vacaciones', 'Certificados', 'Ayuda']}
      />
      <h2 className={styles.pageTitle}>Portal del colaborador</h2>
      <p className={styles.pageSub}>
        Ingresa con tu usuario institucional para ver tu rol de pagos.
      </p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Usuario</span>
          <span className={styles.input}>
            <span className="sr-only">Tu usuario, ya completado: </span>
            {usuarioSimulado}
          </span>
        </label>
        <label className={styles.field}>
          <span>Contraseña</span>
          <span className={styles.input}>
            <span className="sr-only">Tu contraseña, ya completada: </span>
            ••••••••
          </span>
        </label>
        <BotonHotspot
          goto="e_bien"
          label="Ingresó a su portal del colaborador"
          className={styles.submit}
        >
          Ingresar
        </BotonHotspot>
      </div>

      <AvisoSitio>
        Tu rol de pagos está disponible los primeros cinco días de cada mes. Los reclamos se
        registran desde el mismo portal.
      </AvisoSitio>

      <PieSitio texto="Corporación Andes · Talento Humano" enlaces={ENLACES_PIE} />
    </div>
  )
}

function DecisionEnCurso({ fallo, enFormulario }: { fallo: boolean; enFormulario: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <Instrucciones
        fallo={fallo}
        pista={
          <p>
            Tienes varios caminos posibles: entrar al portal por tu cuenta desde los marcadores del
            navegador, responder el correo, o usar alguno de los botones de la barra de arriba. Cuál
            de ellos es el acertado es justamente lo que decides tú.
          </p>
        }
      >
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
          <strong>cualquier parte de ella</strong>, incluida la barra de abajo.
        </p>

        {enFormulario && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El formulario ya aparece con{' '}
            <strong className="text-ink">tu usuario y tu clave escritos</strong>. Es así para no
            pedirte datos reales, pero enviarlo cuenta como iniciar sesión.
          </p>
        )}

        <p className="text-base leading-relaxed text-body">
          El escenario termina cuando decidas qué hacer con el mensaje, o si caes en lo que pide. No
          hay confirmación, igual que en la vida real. Moverte entre pantallas, volver atrás o
          cerrar una pestaña no decide nada.
        </p>
      </Instrucciones>
    </div>
  )
}

function RolDePagos() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/rol-de-pagos')

  const [pantallaActual, setPantallaActual] = useState('n1')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const [recibido, setRecibido] = useState(horaDeLlegada)
  const [pestanas, setPestanas] = useState(['n1'])
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) return
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      setPantallaActual(goto)
      setPestanas((abiertas) => (abiertas.includes(goto) ? abiertas : [...abiertas, goto]))
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setPestanas(['n1'])
    setRepasando(false)
    setTocoEnVacio(false)
    setRecibido(horaDeLlegada())
  }

  const onHotspot = (event: React.MouseEvent) => {
    const cerrada = (event.target as HTMLElement).closest<HTMLElement>('[data-cierra]')?.dataset
      .cierra
    if (cerrada) {
      const quedan = pestanas.filter((id) => id !== cerrada)
      setPestanas(quedan)
      // Cerrar la pestaña que se está viendo devuelve el navegador a la que
      // quede abierta (el correo). Con el escenario ya terminado `elegir` sale
      // sin tocar la pantalla, así que sin esto la página cerrada seguía a la
      // vista aunque su pestaña ya no estuviera en la barra (issue #26).
      if (cerrada === pantallaActual) setPantallaActual(quedan.at(-1) ?? 'n1')
    }

    if (!manejarClicHotspot(event, elegir) && !engine.isEnding) {
      setTocoEnVacio(true)
    }
  }

  // La pantalla que se está viendo siempre tiene su pestaña en la barra. Importa
  // en el repaso: las señales llevan a pantallas que se cerraron, o que nunca se
  // llegaron a abrir, y sin esto se explicaba la página con la pestaña del
  // correo marcada como activa.
  const abiertas = pestanas.includes(pantallaActual) ? pestanas : [...pestanas, pantallaActual]

  const pantalla = (
    <Navegador
      pestanas={PESTANAS}
      abiertas={abiertas}
      activa={pantallaActual}
      marcadores={MARCADORES}
      onHotspot={onHotspot}
    >
      {pantallaActual === 'n1' ? (
        <ContenidoCorreo
          recibido={recibido}
          carpetas={carpetasCorreo(
            MENSAJE,
            engine.isEnding && !repasando
              ? (ALIAS_FINAL[engine.current] ?? engine.current)
              : undefined,
          )}
        />
      ) : (
        <ContenidoPortal />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/rol-de-pagos"
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
      onPantalla={(id) => {
        setRepasando(Boolean(id))
        if (id) setPantallaActual(id)
      }}
    />
  ) : (
    <DecisionEnCurso fallo={tocoEnVacio} enFormulario={pantallaActual === 'n2'} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/rol-de-pagos"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      identidad={['usuario', 'clave']}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default RolDePagos
