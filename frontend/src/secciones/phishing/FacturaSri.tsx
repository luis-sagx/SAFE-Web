import { useState } from 'react'
import EscenarioLayout from '../../components/EscenarioLayout'
import { VentanaEscritorio } from '../../components/ui/DesktopChrome'
import styles from '../../components/ui/DeviceScreen.module.css'
import { BotonHotspot, EnlaceHotspot, manejarClicHotspot } from '../../components/ui/interactivo'
import PanelVeredicto, { type Senal } from '../../components/ui/PanelVeredicto'
import { useStoryEngine, type Story, type StoryNode } from '../../hooks/useStoryEngine'

/**
 * Primer escenario interactivo del proyecto: en vez de elegir de una lista de
 * acciones descritas, el participante actúa directamente sobre el correo y la
 * página falsa —el enlace, el adjunto, el formulario, un atajo al portal
 * real— igual que lo haría frente a su bandeja de verdad. Ver
 * docs/superpowers/specs/2026-08-04-escenario-interactivo-factura-sri-design.md.
 *
 * Por eso no usa StoryEscenario/DeviceScreen/StoryChoices/StoryResultPanel:
 * esos siguen sirviendo tal cual a los escenarios que todavía eligen de una
 * lista (ClaveCaducada, RolDePagos). Este es la plantilla para cuando se
 * repliquen.
 */

/// El grafo no necesita `choices`: cada punto interactivo lleva su propio
/// `goto`/`label` en la pantalla, no en una lista aparte que haya que
/// mantener sincronizada.
const STORY: Story<StoryNode> = {
  n1: { kind: 'scene' },
  n2: { kind: 'scene' },
  e_adjunto: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'El adjunto no era una factura: era una página falsa que se abrió en tu navegador y copió tu clave del SRI en cuanto la escribiste.',
  },
  e_datos: {
    kind: 'bad',
    verdict: 'Caíste en la trampa',
    outcome:
      'Entregaste tu RUC y tu clave del portal en un sitio que no es del SRI. Con esos datos pueden emitir comprobantes a tu nombre y ver tu información tributaria.',
  },
  e_dominio: {
    kind: 'good',
    verdict: 'No caíste · revisaste la dirección',
    outcome:
      'La dirección era sri-facturacion-ec.com y ni siquiera usaba conexión segura. El portal real del SRI está en sri.gob.ec. Cerraste la página sin escribir nada.',
  },
  e_portal: {
    kind: 'good',
    verdict: 'No caíste · entraste por tu cuenta',
    outcome:
      'Entraste al portal del SRI escribiendo tú la dirección. No había ninguna factura pendiente ni multa: el correo era falso.',
  },
}

/// Cada señal apunta, cuando puede, al elemento real marcado con
/// data-signal en una de las dos pantallas. Si esa pantalla no es la que
/// llevó a este final, el recorrido igual muestra el texto, sin resaltar.
const SENALES: Senal[] = [
  {
    id: 'dominio',
    targetId: 'remitente',
    texto:
      'El remitente usa un <b>dominio parecido</b> pero ajeno: <b>sri-facturacion-ec.com</b>, no sri.gob.ec.',
  },
  {
    id: 'plazo',
    targetId: 'plazo',
    texto: 'Impone un <b>plazo de 24 horas</b> y amenaza con una multa.',
  },
  {
    id: 'conexion',
    targetId: 'url-insegura',
    texto: 'El enlace lleva a una página <b>sin conexión segura</b> (http).',
  },
  {
    id: 'adjunto',
    targetId: 'adjunto',
    texto: 'Trae un <b>adjunto .html</b>: una factura real nunca llega así.',
  },
  {
    id: 'clave',
    targetId: 'campo-clave',
    texto: 'Pide tu <b>clave</b> del portal para "validar" algo.',
  },
]

const RULE =
  'Regla de oro: ninguna entidad pública te pide tu clave por correo. Si un mensaje dice que tienes algo pendiente, <b>entra al portal oficial escribiendo tú la dirección</b>, nunca por el enlace del correo.'

const RESUMEN = 'Un correo dice que tienes una factura electrónica pendiente de validar.'

const CONTEXTO = (
  <>
    <p>
      Son las ocho y media de la mañana. Abres tu correo y ves un mensaje del{' '}
      <strong>Servicio de Rentas Internas</strong> sobre una factura pendiente.
    </p>
    <p>
      Emites facturas de vez en cuando, así que un aviso del SRI no te sorprende. Nunca antes te
      habían escrito por este tema.
    </p>
    <p>Vas a leer el correo y decidir qué haces.</p>
  </>
)

const ATAJO_PORTAL = {
  texto: '🏦 Portal SRI',
  goto: 'e_portal',
  label: 'Cerró el correo y entró al portal del SRI escribiendo la dirección',
}

interface PantallaProps {
  onHotspot: (event: React.MouseEvent) => void
}

function PantallaCorreo({ onHotspot }: PantallaProps) {
  return (
    <VentanaEscritorio
      titulo="Correo — Recibidos"
      ariaLabel="Bandeja de correo"
      onClick={onHotspot}
      atajo={ATAJO_PORTAL}
    >
      <div className={styles.desktopBody}>
        {/* Carpetas fijas, no interactivas: solo dan el aspecto de cliente de
            escritorio, igual que en la pantalla de correo no interactiva. */}
        <nav className={styles.mailNav} aria-hidden>
          <span className={`${styles.mailNavItem} ${styles.mailNavActive}`}>📥 Recibidos</span>
          <span className={styles.mailNavItem}>📤 Enviados</span>
          <span className={styles.mailNavItem}>🗑 Papelera</span>
        </nav>

        <div className={styles.mailbody}>
          <h1 className={styles.subject}>Factura electrónica pendiente de validación</h1>

          <div className={styles.senderRow}>
            <div className={styles.avatar} aria-hidden>
              S
            </div>
            <div className={styles.senderId}>
              <p className={styles.senderName}>
                SRI · Facturación Electrónica
                <span className={styles.label}>Externo</span>
              </p>
              <p className={styles.senderAddr} data-signal="remitente">
                notificaciones@sri-facturacion-ec.com
              </p>
              <p className={styles.senderTo}>para mí</p>
            </div>
            <span className={styles.date}>hoy 08:42</span>
          </div>

          <div className={styles.prose}>
            <p>Estimado contribuyente:</p>
            <p>
              Nuestro sistema detectó una <b>factura electrónica no validada</b> asociada a su
              RUC. Si no completa la validación en las próximas{' '}
              <mark className={styles.marca} data-signal="plazo">
                24 horas
              </mark>
              , su comprobante será anulado y se aplicará una multa administrativa.
            </p>
            <p>
              <EnlaceHotspot
                goto="n2"
                label="Abrió el enlace para validar la factura"
                href="http://sri-facturacion-ec.com/validar-ruc"
                className="cta"
              >
                Validar mi factura ahora
              </EnlaceHotspot>
            </p>
            <p className="fine">Este mensaje es automático, por favor no responda.</p>
          </div>

          <BotonHotspot
            goto="e_adjunto"
            label="Descargó el archivo adjunto"
            signalId="adjunto"
            className={styles.attachment}
          >
            <span aria-hidden>📎</span>
            Factura_004521.html (34 KB)
          </BotonHotspot>
        </div>
      </div>
    </VentanaEscritorio>
  )
}

function PantallaPortal({ onHotspot }: PantallaProps) {
  return (
    <VentanaEscritorio
      titulo="Validación de comprobante"
      ariaLabel="Página web simulada"
      onClick={onHotspot}
      atajo={{
        ...ATAJO_PORTAL,
        goto: 'e_dominio',
        label: 'Salió sin ingresar datos y entró al portal por su cuenta',
      }}
    >
      {/* Pestaña de navegador: en el celular no hay pestañas visibles. */}
      <div className={styles.tabstrip} aria-hidden>
        <span className={styles.tab}>Validación de comprobante</span>
      </div>

      <div className={styles.urlbar} data-signal="url-insegura">
        <span className={styles.warn}>⚠ No seguro</span>
        <span className={styles.url}>http://sri-facturacion-ec.com/validar-ruc</span>
      </div>

      <div className={styles.page}>
        <p className={styles.brand}>Servicio de Rentas</p>
        <h2 className={styles.pageTitle}>Validación de comprobante</h2>
        <p className={styles.pageSub}>Ingresa tus datos del portal para liberar la factura pendiente.</p>

        <div className={styles.form}>
          <label className={styles.field}>
            <span>RUC o cédula</span>
            {/* No editable a propósito: el participante juzga la pantalla,
                nunca escribe credenciales reales en ella. */}
            <span className={styles.input}>0000000000001</span>
          </label>
          <label className={styles.field} data-signal="campo-clave">
            <span>Clave del portal SRI</span>
            <span className={styles.input}>••••••••</span>
          </label>
          <BotonHotspot
            goto="e_datos"
            label="Ingresó su RUC y su clave para liberar la factura"
            className={styles.submit}
          >
            Validar factura
          </BotonHotspot>
        </div>

        <p className={styles.pageFooter}>Portal de validación · sri-facturacion-ec.com</p>
      </div>
    </VentanaEscritorio>
  )
}

const DECISION_EN_CURSO = (
  <div className="grid gap-3">
    <p className="text-sm font-semibold text-ink">¿Qué haces?</p>
    <p className="text-base leading-relaxed text-body">
      Investiga el correo como lo harías de verdad: pasa el mouse sobre los enlaces antes de
      decidir. La dirección real aparece abajo, en la barra de tu navegador. Haz clic en lo que
      harías a continuación.
    </p>
  </div>
)

function FacturaSri() {
  const engine = useStoryEngine(STORY, 'n1', 'phishing/factura-sri')

  // El nodo final (p. ej. "e_adjunto") no es una pantalla: es la consecuencia
  // de una. Se recuerda cuál era la pantalla activa para que el recorrido de
  // señales tenga sobre qué resaltar.
  const [pantallaActual, setPantallaActual] = useState<'n1' | 'n2'>('n1')

  function elegir(goto: string, label?: string) {
    if (engine.isEnding) {
      return
    }
    engine.choose(goto, label)
    if (goto === 'n2') {
      setPantallaActual('n2')
    }
  }

  function reiniciar() {
    engine.restart()
    setPantallaActual('n1')
  }

  const onHotspot = (event: React.MouseEvent) => manejarClicHotspot(event, elegir)

  const pantalla =
    pantallaActual === 'n1' ? (
      <PantallaCorreo onHotspot={onHotspot} />
    ) : (
      <PantallaPortal onHotspot={onHotspot} />
    )

  const decision = engine.isEnding ? (
    <PanelVeredicto
      node={engine.node}
      senales={SENALES}
      regla={RULE}
      restartLabel="↻ Repetir el escenario"
      onRestart={reiniciar}
      contenedorId="pantalla-escenario"
    />
  ) : (
    DECISION_EN_CURSO
  )

  return (
    <EscenarioLayout
      escenarioId="phishing/factura-sri"
      resumen={RESUMEN}
      contexto={CONTEXTO}
      pantalla={pantalla}
      decision={decision}
      onEmpezar={engine.restart}
      dispositivo="escritorio"
    />
  )
}

export default FacturaSri
