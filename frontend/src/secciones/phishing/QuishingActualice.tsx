import { Forward, Landmark, Newspaper, Reply, ShieldAlert, Trash2 } from 'lucide-react'
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

// QR decorativo y fijo: no es escaneable de verdad, solo tiene que leerse
// como un código QR dentro del cuerpo del correo. Tocarlo es "escanearlo".
const QR_SVG = `
  <svg width="120" height="120" viewBox="0 0 29 29" style="background:#fff;border:1px solid #ddd;padding:6px;">
    <rect width="29" height="29" fill="#fff"/>
    <g fill="#111">
      <rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/>
      <rect x="22" y="0" width="7" height="7"/><rect x="23" y="1" width="5" height="5" fill="#fff"/><rect x="24" y="2" width="3" height="3"/>
      <rect x="0" y="22" width="7" height="7"/><rect x="1" y="23" width="5" height="5" fill="#fff"/><rect x="2" y="24" width="3" height="3"/>
      <rect x="9" y="1" width="2" height="2"/><rect x="13" y="1" width="2" height="2"/><rect x="17" y="3" width="2" height="2"/>
      <rect x="9" y="9" width="3" height="3"/><rect x="14" y="9" width="2" height="4"/><rect x="18" y="10" width="4" height="2"/>
      <rect x="9" y="14" width="4" height="2"/><rect x="16" y="14" width="2" height="6"/><rect x="20" y="15" width="3" height="3"/>
      <rect x="9" y="18" width="2" height="4"/><rect x="13" y="19" width="3" height="2"/><rect x="9" y="24" width="6" height="2"/>
      <rect x="18" y="20" width="4" height="4"/><rect x="24" y="9" width="2" height="6"/><rect x="24" y="18" width="4" height="2"/>
      <rect x="24" y="22" width="2" height="5"/>
    </g>
  </svg>
`

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },

  e_datos: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome: `Entregaste tu cédula ${IDENTIDAD_FICTICIA.cedula} y tu clave ${IDENTIDAD_FICTICIA.clave} en litoral-actualiza.web.app, un sitio que no es del banco. Con esos datos entraron a tu cuenta esa misma noche.`,
  },
  // Absorbe el antiguo final "vista previa antes de escanear": un QR no tiene
  // href, así que no existe una vista previa real — escanear ya abre la
  // página falsa, y lo que distingue el buen final es cerrarla sin enviar el
  // formulario (ver spec §4.1).
  e_app: {
    kind: 'good',
    verdict: 'No caíste · entraste por tu cuenta',
    outcome:
      'Entraste a la app del banco por tu cuenta. No había ninguna actualización de datos pendiente: el correo era falso.',
  },
  e_eliminar: {
    kind: 'good',
    verdict: 'No caíste · lo eliminaste',
    outcome:
      'Lo borraste sin escanear el código, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
  },
  e_spam: {
    kind: 'good',
    verdict: 'No caíste · lo reportaste',
    outcome:
      'Marcarlo como spam es la mejor reacción posible: no caíste y además tu proveedor de correo aprende a filtrar ese remitente.',
  },
  e_responder: {
    kind: 'partial',
    verdict: 'No entregaste nada, pero contestaste',
    outcome:
      'No escaneaste el código, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado.',
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'No caíste tú, pero lo pasaste',
    outcome:
      'Se lo reenviaste a otra persona para que opine. Tú no caíste, pero pusiste el código QR en la bandeja de alguien que quizá lo escanee sin la misma desconfianza.',
  },
}

const ACCIONES: AccionCorreo[] = [
  {
    Icono: Reply,
    etiqueta: 'Responder',
    titulo: 'Responder',
    goto: 'e_responder',
    label: 'Respondió el correo',
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
    goto: 'e_eliminar',
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

const ASUNTO = 'Actualice sus datos antes de que se limite su cuenta'
const REMITENTE_NOMBRE = 'Banco del Litoral · Actualización de datos'
const DIRECCION = 'notificaciones@bancodellitoral.com'

/// El mensaje tal como lo muestran las carpetas cuando una acción de la barra
/// lo mueve de bandeja. Lo pinta `carpetasCorreo`, compartido por todos los
/// escenarios de correo.
const MENSAJE = { nombre: REMITENTE_NOMBRE, direccion: DIRECCION, asunto: ASUNTO }

const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'qr',
    pantalla: 'n1',
    texto:
      'Un <b>código QR es un enlace escondido dentro de un dibujo</b>: no hay texto que leer, así que no puedes ver a dónde te lleva hasta que ya lo abriste.',
  },
  {
    id: 's2',
    targetId: 'remitente',
    pantalla: 'n1',
    texto:
      'El QR abre <b>litoral-actualiza.web.app</b>. Menciona al banco en el nombre, pero no es la dirección del banco: es un sitio gratuito que cualquiera puede crear en minutos con el nombre que quiera.',
  },
  {
    id: 's3',
    targetId: 'campo-clave',
    pantalla: 'n2',
    texto:
      'El formulario pide la <b>clave de acceso</b>. Actualizar unos datos no necesita tu clave: la clave es lo que se usa para entrar a la cuenta, y es justo lo que buscan.',
  },
  {
    id: 's4',
    targetId: 'plazo',
    pantalla: 'n1',
    texto:
      'Mete <b>prisa</b> con un plazo de 72 horas, para que actúes antes de comprobar nada con el banco.',
  },
]

const RULE =
  'Regla de oro: al escanear un QR, primero <b>lee la vista previa de la URL</b> y recién ahí decide. Vale igual para los QR de correos, locales, surtidores y parquímetros.'

const RESUMEN = 'Un correo del banco pide escanear un QR para "actualizar tus datos".'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Sos cliente del <strong>Banco del Litoral</strong>. <strong>Este mes</strong> el banco sí
      pidió, dentro de su app, que los clientes actualicen algunos datos.
    </>
  ),
  ahora: (
    <>
      <strong>Días después</strong> te llega un correo aparte, con un <strong>código QR</strong>{' '}
      grande.
    </>
  ),
  detalle: 'No trae ningún enlace de texto que puedas revisar antes de escanear.',
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

const MINUTOS_DE_ANTIGUEDAD = 40

function horaDeLlegada(): string {
  const llegada = new Date(Date.now() - MINUTOS_DE_ANTIGUEDAD * 60_000)
  return `hoy ${formatoHora(llegada)}`
}

const PESTANAS: Record<string, PestanaConfig> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Actualización de datos',
    url: 'http://litoral-actualiza.web.app/actualizar',
    segura: false,
    cierra: 'n1',
  },
}

const MARCADORES: MarcadorNavegador[] = [
  {
    Icono: Landmark,
    texto: 'Banco del Litoral',
    goto: 'e_app',
    label: 'Entró directamente a la app del banco desde sus marcadores',
  },
  { Icono: Newspaper, texto: 'El Comercio' },
]

function ContenidoCorreo({ recibido, carpetas }: { recibido: string; carpetas: CarpetaCorreo[] }) {
  return (
    <CuerpoCorreo
      acciones={ACCIONES}
      carpetas={carpetas}
      asunto={ASUNTO}
      remitente={{
        nombre: REMITENTE_NOMBRE,
        direccion: DIRECCION,
        etiqueta: 'Externo',
        senalDireccion: 'remitente',
        senalEtiqueta: 'externo',
      }}
      recibido={recibido}
      pie={<p className="fine">Banco del Litoral · Este es un mensaje automático.</p>}
    >
      <p>Estimado cliente:</p>
      <p>
        Según nuestra política de actualización de datos, necesitamos que confirme su información
        antes de{' '}
        <mark className={styles.marca} data-signal="plazo">
          72 horas
        </mark>
        . Escanee el siguiente código con la cámara de su celular para continuar:
      </p>
      <div style={{ textAlign: 'center', margin: '14px 0' }}>
        {/* El nombre accesible de un botón sale de su texto visible, y el SVG
            no tiene ninguno: sin este span el botón quedaría sin nombre para
            un lector de pantalla (y sin forma de ubicarlo por rol+nombre en
            los tests). */}
        <BotonHotspot goto="n2" label="Escaneó el código QR" signalId="qr">
          <span className="sr-only">Código QR, escanear para continuar</span>
          <span dangerouslySetInnerHTML={{ __html: QR_SVG }} />
        </BotonHotspot>
      </div>
    </CuerpoCorreo>
  )
}

function ContenidoPortalFalso() {
  return (
    <div className={styles.page}>
      <CabeceraSitio
        marca="Banco del Litoral"
        menu={['Cuentas', 'Transferencias', 'Pagos', 'Ayuda']}
      />
      <h2 className={styles.pageTitle}>Actualización de datos</h2>
      <p className={styles.pageSub}>
        Confirme su información para evitar la limitación de su cuenta.
      </p>

      <div className={styles.form}>
        <label className={styles.field}>
          <span>Cédula</span>
          <span className={styles.input}>
            <span className="sr-only">Tu cédula, ya completada: </span>
            {IDENTIDAD_FICTICIA.cedula}
          </span>
        </label>
        <label className={styles.field} data-signal="campo-clave">
          <span>Clave de acceso</span>
          <span className={styles.input}>
            <span className="sr-only">Tu clave, ya completada: </span>
            ••••••••
          </span>
        </label>
        <BotonHotspot
          goto="e_datos"
          label="Ingresó su cédula y su clave de acceso"
          className={styles.submit}
        >
          Confirmar datos
        </BotonHotspot>
      </div>

      <AvisoSitio>
        La actualización es obligatoria para mantener activa su cuenta. Sus datos viajan cifrados y
        no se comparten con terceros.
      </AvisoSitio>

      <PieSitio texto="Banco del Litoral · Entidad supervisada" enlaces={ENLACES_PIE} />
    </div>
  )
}

function DecisionEnCurso({ fallo, enPagina }: { fallo: boolean; enPagina: boolean }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <Instrucciones
        fallo={fallo}
        pista={
          <p>
            Tienes tres caminos posibles: escanear el código y ver a dónde lleva, dejarlo de lado y
            entrar a la app del banco por tu cuenta desde los marcadores, o usar alguno de los
            botones de la barra de arriba. Cuál de ellos es el acertado es justamente lo que decides
            tú.
          </p>
        }
      >
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
          <strong>cualquier parte de ella</strong>, incluida la barra de abajo.
        </p>

        {enPagina && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El formulario ya aparece con{' '}
            <strong className="text-ink">tu cédula y tu clave de acceso escritas</strong>. Es así
            para no pedirte datos reales, pero enviarlo cuenta como entregarlos.
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

function QuishingActualice() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/quishing-actualice')

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
            engine.isEnding && !repasando ? engine.current : undefined,
          )}
        />
      ) : (
        <ContenidoPortalFalso />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      escenarioId="phishing/quishing-actualice"
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
    <DecisionEnCurso fallo={tocoEnVacio} enPagina={pantallaActual === 'n2'} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/quishing-actualice"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      identidad={['cedula', 'clave']}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default QuishingActualice
