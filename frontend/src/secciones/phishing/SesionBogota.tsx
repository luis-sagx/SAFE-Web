import { Forward, Landmark, Reply, ShieldAlert, Trash2 } from 'lucide-react'
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
import Instrucciones from '../../components/ui/Instrucciones'
import { BotonHotspot, EnlaceHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import {
  Navegador,
  type MarcadorNavegador,
  type PestanaConfig,
} from '../../components/ui/Navegador'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },
  n3: { kind: 'scene' },

  e_otp: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'Mientras escribías el código 418 902, el atacante lo usaba en vivo para entrar a tu cuenta real. Un código de un solo uso no es un trámite: es la última puerta, y la abriste tú. Cuando terminaste, tu cuenta ya estaba vacía.',
  },
  e_app: {
    kind: 'good',
    verdict: 'No caíste · verificaste por la app',
    outcome:
      'Entraste a la app del banco por tu cuenta. No había ningún acceso desde Bogotá: el correo era falso.',
  },
  e_eliminar: {
    kind: 'good',
    verdict: 'No caíste · lo eliminaste',
    outcome:
      'Lo borraste sin tocar el enlace de la alerta, que es suficiente para no caer. Marcarlo como spam habría hecho algo más: avisar al filtro para que no le llegue a otros.',
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
      'No tocaste el enlace, pero confirmaste que tu dirección existe y que alguien la lee. Es justo lo que un atacante busca para insistir con algo mejor preparado.',
  },
  e_reenviar: {
    kind: 'partial',
    verdict: 'No caíste tú, pero la pasaste',
    outcome:
      'Se la reenviaste a otra persona para que opine. Tú no caíste, pero pusiste la alerta (con su enlace) en la bandeja de alguien que quizá no la mire con la misma desconfianza.',
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

const ASUNTO = 'Alerta de seguridad: nuevo inicio de sesión'
const REMITENTE_NOMBRE = 'Banco del Litoral · Seguridad'
const DIRECCION = 'alertas@bancodellitoral.com.ec'

/// El mensaje tal como lo muestran las carpetas cuando una acción de la barra
/// lo mueve de bandeja. Lo pinta `carpetasCorreo`, compartido por todos los
/// escenarios de correo.
const MENSAJE = { nombre: REMITENTE_NOMBRE, direccion: DIRECCION, asunto: ASUNTO }

// s2 anclada a la URL de n2 (la página falsa), no al remitente: el
// remitente muestra un dominio limpio (bancodellitoral.com.ec), que es
// justo lo que dice s4 sobre lo impecable del correo — el truco del dominio
// está en la página, no en el mensaje. s3 anclada al campo de n3 (el OTP),
// no al de n2 (la contraseña).
const SENALES: Senal[] = [
  {
    id: 's1',
    targetId: 'cta-trampa',
    pantalla: 'n1',
    texto:
      'El botón que parece el seguro ("No fui yo") es justo la trampa: lleva a una página que te pide tu usuario y tu clave. Cuentan con que pulses el que suena a protegerte.',
  },
  {
    id: 's2',
    targetId: 'url-falsa',
    pantalla: 'n2',
    texto:
      'La dirección era <b>bancodellitoral.com.ec.seguridad-alertas.com</b>. El dueño del sitio es lo que está justo antes de la primera barra, o sea <b>seguridad-alertas.com</b>. El nombre del banco va pegado adelante como adorno.',
  },
  {
    id: 's3',
    targetId: 'campo-otp',
    pantalla: 'n3',
    texto:
      'Pide dentro de una página web el <b>código de un solo uso</b> que llega al celular, cuando el banco solo lo pide dentro de su propia app. Ese código es la última confirmación: quien lo recibe termina de entrar a tu cuenta.',
  },
  {
    id: 's4',
    texto:
      'El correo está impecable, sin errores de redacción. La trampa no estaba ahí, así que buscar faltas de ortografía no te habría salvado.',
  },
]

const RULE =
  'Regla de oro: en una dirección web manda el nombre que está <b>justo antes de la primera barra</b>. Todo lo que va antes puede escribirlo el atacante, incluido el nombre de tu banco. Y ninguna alerta se atiende desde el enlace de la propia alerta.'

const RESUMEN = 'Un correo avisa que alguien inició sesión en tu cuenta desde Bogotá.'

const CONTEXTO: Contexto = {
  antes: (
    <>
      Sos cliente del <strong>Banco del Litoral</strong>.
    </>
  ),
  ahora: (
    <>
      <strong>Casi a las diez de la noche</strong> te llega un aviso de un{' '}
      <strong>inicio de sesión desde Bogotá</strong> en tu cuenta.
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

const FALSO = 'bancodellitoral.com.ec.seguridad-alertas.com'

// n3 lleva `mismaPestana: true`: pasar de la página de clave al OTP es el
// mismo sitio avanzando un paso, no una pestaña nueva (spec §2.2 y §5).
const PESTANAS: Record<string, PestanaConfig & { mismaPestana?: boolean }> = {
  n1: { titulo: 'Correo', url: 'https://correo.safeweb.com/u/0/#recibidos', segura: true },
  n2: {
    titulo: 'Verificación de seguridad',
    url: `https://${FALSO}/clave`,
    segura: true,
    cierra: 'n1',
    senalUrl: 'url-falsa',
  },
  n3: {
    titulo: 'Un paso más',
    url: `https://${FALSO}/otp`,
    segura: true,
    cierra: 'n1',
    mismaPestana: true,
  },
}

const MARCADORES: MarcadorNavegador[] = [
  {
    Icono: Landmark,
    texto: 'Banco del Litoral',
    goto: 'e_app',
    label: 'Verificó los accesos desde la app del banco',
  },
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
      pie={<p>Banco del Litoral · Departamento de Seguridad</p>}
    >
      <p>Estimado(a) cliente:</p>
      <p>
        Detectamos un inicio de sesión en su cuenta desde <b>Bogotá, Colombia</b>, un dispositivo
        que no reconocemos.
      </p>
      <p>Si fue usted, puede ignorar este mensaje. Si no, actúe de inmediato:</p>
      <p>
        <EnlaceHotspot
          goto="n2"
          label="Hizo clic en 'No fui yo (proteger mi cuenta)'"
          href={`https://${FALSO}/clave`}
          signalId="cta-trampa"
          className="cta"
        >
          No fui yo (proteger mi cuenta)
        </EnlaceHotspot>
      </p>
    </CuerpoCorreo>
  )
}

function ContenidoPaginaClave() {
  return (
    <div className={styles.page}>
      <CabeceraSitio
        marca="Banco del Litoral"
        menu={['Cuentas', 'Transferencias', 'Pagos', 'Ayuda']}
      />
      <h2 className={styles.pageTitle}>Verificación de seguridad</h2>
      <p className={styles.pageSub}>Confirme su contraseña para cerrar el acceso no reconocido.</p>

      <div className={styles.form}>
        <div className={styles.field} role="group" aria-label="Contraseña de banca en línea">
          <span>Contraseña de banca en línea</span>
          <span className={styles.input}>
            <span className="sr-only">Tu contraseña, ya completada: </span>
            {' '}••••••••
          </span>
        </div>
        <BotonHotspot
          goto="n3"
          label="Escribió su contraseña para cerrar el acceso no reconocido"
          className={styles.submit}
        >
          Cerrar acceso no reconocido
        </BotonHotspot>
      </div>

      <AvisoSitio>
        Por su seguridad, cierre todas las sesiones activas si no reconoce el acceso. Nunca le
        pediremos su clave por correo ni por teléfono.
      </AvisoSitio>

      <PieSitio texto="Banco del Litoral · Entidad supervisada" enlaces={ENLACES_PIE} />
    </div>
  )
}

function ContenidoPaginaOtp() {
  return (
    <div className={styles.page}>
      <CabeceraSitio
        marca="Banco del Litoral"
        menu={['Cuentas', 'Transferencias', 'Pagos', 'Ayuda']}
      />
      <h2 className={styles.pageTitle}>Un paso más</h2>
      <p className={styles.pageSub}>Ingrese el código que le acabamos de enviar por SMS.</p>

      <div className={styles.form}>
        <div className={styles.field} data-signal="campo-otp" role="group" aria-label="Código de verificación">
          <span>Código de verificación</span>
          <span className={styles.input}>
            <span className="sr-only">El código, ya completado: </span>
            {' '}418 902
          </span>
        </div>
        <BotonHotspot
          goto="e_otp"
          label="Escribió el código que llegó por SMS"
          className={styles.submit}
        >
          Confirmar y cerrar sesión
        </BotonHotspot>
      </div>

      <AvisoSitio>
        El código caduca en cinco minutos. Si no lo recibió, verifique que su número esté
        actualizado en la aplicación.
      </AvisoSitio>

      <PieSitio texto="Banco del Litoral · Entidad supervisada" enlaces={ENLACES_PIE} />
    </div>
  )
}

function DecisionEnCurso({ fallo, pantalla }: { fallo: boolean; pantalla: string }) {
  return (
    <div className="grid gap-3">
      <p className="text-lg font-semibold text-ink">¿Qué haces?</p>
      <Instrucciones
        fallo={fallo}
        pista={
          <p>
            Tienes dos caminos posibles: hacer lo que la alerta pide, o dejarla de lado y entrar a
            verificar por la app del banco desde los marcadores. Cuál de los dos es el acertado es
            justamente lo que decides tú.
          </p>
        }
      >
        <p className="text-lg leading-relaxed text-body">
          Actúa sobre la ventana como lo harías frente a tu correo de verdad: puedes usar{' '}
          <strong>cualquier parte de ella</strong>, incluida la barra de abajo. Antes de tocar un
          enlace, mantén el cursor encima para ver a dónde lleva.
        </p>

        {pantalla === 'n2' && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El campo ya aparece con <strong className="text-ink">tu contraseña escrita</strong>. Es
            así para no pedirte datos reales, pero enviarla cuenta como entregarla.
          </p>
        )}
        {pantalla === 'n3' && (
          <p className="rounded-md border border-hairline-strong bg-canvas-soft px-3 py-2 text-base leading-relaxed text-body">
            El campo ya aparece con <strong className="text-ink">el código escrito</strong>. Es así
            para no pedirte datos reales, pero enviarlo cuenta como entregarlo.
          </p>
        )}

        {/* Detrás de un resumen: esto es mecánica, no la tarea. De corrido,
            los dos párrafos sumaban unas sesenta palabras antes de poder tocar
            nada, y para empezar solo hace falta el primero. */}
        <details className="text-base leading-relaxed text-body">
          <summary className="cursor-pointer list-none font-medium text-link underline decoration-dotted underline-offset-4">
            ¿Cuándo termina el escenario?
          </summary>
          <p className="mt-2">
            Cuando decidas qué hacer con el mensaje, o si caes en lo que pide. No hay confirmación,
            igual que en la vida real. Moverte entre pantallas, volver atrás o cerrar una pestaña no
            decide nada.
          </p>
        </details>
      </Instrucciones>
    </div>
  )
}

function SesionBogota() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/sesion-bogota')

  const [pantallaActual, setPantallaActual] = useState('n1')
  const [tocoEnVacio, setTocoEnVacio] = useState(false)
  const [pestanas, setPestanas] = useState(['n1'])
  const [repasando, setRepasando] = useState(false)

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) return
    engine.choose(goto, label)
    if (STORY[goto]?.kind === 'scene') {
      const destino = pantallaActual
      setPantallaActual(goto)
      setPestanas((abiertas) => {
        if (PESTANAS[goto]?.mismaPestana) {
          return abiertas.map((id) => (id === destino ? goto : id))
        }
        return abiertas.includes(goto) ? abiertas : [...abiertas, goto]
      })
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
    setPestanas(['n1'])
    setRepasando(false)
    setTocoEnVacio(false)
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
          carpetas={carpetasCorreo(
            MENSAJE,
            engine.isEnding && !repasando ? engine.current : undefined,
          )}
          recibido="hoy 21:47"
        />
      ) : pantallaActual === 'n2' ? (
        <ContenidoPaginaClave />
      ) : (
        <ContenidoPaginaOtp />
      )}
    </Navegador>
  )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      estadoGuardado={engine.runStatus}
      escenarioId="phishing/sesion-bogota"
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
    <DecisionEnCurso fallo={tocoEnVacio} pantalla={pantallaActual} />
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/sesion-bogota"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      nota={NOTA}
      pantalla={pantalla}
      identidad={['clave']}
      decision={decision}
      resultado={engine.resultado}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default SesionBogota
