import { Landmark, Paperclip, Search, SendHorizontal, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'
import { AvisoSitio, CabeceraSitio, PieSitio } from './armazonSitio'
import { CuerpoCorreo, type AccionCorreo, type CarpetaCorreo } from './DesktopChrome'
import NotaDeVoz from './NotaDeVoz'
import PantallaLlamada from './PantallaLlamada'
import styles from './DeviceScreen.module.css'

/**
 * Contenido de las pantallas simuladas de correo, web y SMS. Solo dibuja lo que
 * la app real mostraría (regla diegética de EscenarioLayout); las preguntas y
 * el feedback viven fuera del marco.
 *
 * El correo y la web devuelven contenido a secas, sin ventana: van dentro de
 * una pestaña del navegador, que es quien pone la barra de título, la de
 * direcciones y la de tareas. El SMS conserva su propio marco porque no es una
 * página web sino un teléfono.
 *
 * Los campos de formulario no son editables a propósito: el participante juzga
 * una pantalla, nunca escribe credenciales reales en ella.
 */
export type ScreenView =
  | {
      kind: 'mail'
      from: string
      address: string
      subject: string
      date: string
      /** HTML fijo del escenario, nunca contenido de un usuario. Puede llevar
       *  `data-signal` en cualquier elemento para que el repaso lo resalte. */
      body: string
      /** Pie institucional del mensaje. HTML fijo, como `body`. */
      footer?: string
      attachment?: string
      /** Nodo al que lleva abrir el adjunto. Sin esto el adjunto es de adorno:
       *  se ve pero no se abre, que es justo lo que un participante intenta
       *  hacer primero cuando el correo dice "adjunto el comprobante". */
      adjuntoGoto?: string
      adjuntoLabel?: string
      /** Etiqueta del cliente de correo: "Promociones", "Externo"… */
      label?: string
      /** `data-signal` del repaso para la dirección, la etiqueta y el adjunto. */
      senalDireccion?: string
      senalEtiqueta?: string
      senalAdjunto?: string
    }
  | {
      kind: 'web'
      url: string
      /** Nombre de la app cuando esta pantalla no es una página del navegador
       *  sino una app del teléfono (la del banco, la del courier). El marco
       *  cambia la barra de direcciones por la cabecera de la app: una app no
       *  tiene URL, y pintarle una enseñaría a buscar el candado donde no lo
       *  hay. Solo lo usa el marco de celular. */
      app?: string
      /** Candado del navegador. Falso pinta la advertencia "No seguro". */
      secure: boolean
      /** Archivo abierto desde el disco (un adjunto descargado, p. ej.). No
       *  lleva candado ni advertencia: poner candado a un archivo local
       *  enseñaría justo lo contrario de lo que mide este módulo. */
      local?: boolean
      brand: string
      /** Entradas del menú de la cabecera del sitio. Decorativas.
       *
       *  Un sitio de verdad tiene cabecera y pie, y sin ellos las pantallas se
       *  leían como fichas y no como sitios. Va por escenario porque el menú de
       *  un banco no es el de una intranet — y **si se le pone a una página
       *  legítima hay que ponérselo también a la falsa del mismo escenario**:
       *  un kit de phishing clona el sitio entero, y dejar la falsa desnuda
       *  enseñaría que se reconoce por el acabado, que es mentira. La señal
       *  está en la dirección. */
      menu?: string[]
      /** Enlaces del pie, junto al aviso de `footer`. Decorativos. */
      pie?: string[]
      /** Nota que el sitio pone bajo el formulario o la ficha. Las páginas
       *  falsas copian estos avisos igual que copian el logotipo, así que las
       *  lleva tanto la real como la clonada. */
      aviso?: string
      title: string
      subtitle?: string
      fields: {
        label: string
        placeholder: string
        senal?: string
        /** Rellena el campo con los datos del participante en vez del texto de
         *  ejemplo. Un formulario que ya trae *tu* correo se lee como el de un
         *  sitio que te conoce, que es media trampa; y de paso deja tu dominio
         *  real a la vista, junto al falso de la barra de direcciones. */
        valor?: 'correo' | 'usuario' | 'cedula' | 'cuenta'
      }[]
      /** Datos de una página informativa. Cuando los hay, sustituyen al
       *  formulario: un directorio no se rellena, se lee. */
      datos?: { etiqueta: string; valor: string; senal?: string }[]
      /** Menú de una app o lista de sitios frecuentes del navegador. Manda
       *  sobre todo lo demás.
       *
       *  Existe para que llegar al canal propio cueste lo que cuesta de
       *  verdad: abrir la app te deja en su inicio, y la consulta la haces tú.
       *  Un icono que resuelve el escenario de un toque premia haber
       *  encontrado el icono, no haber sabido qué hacer.
       *
       *  Las entradas sin `goto` se pulsan igual pero no llevan a ningún lado
       *  —el menú de una app real tampoco es todo accionable— y por eso el
       *  realce al pasar el cursor va en todas por igual: si solo se marcara
       *  la viva, la lista volvería a ser un cuestionario. */
      opciones?: {
        texto: string
        detalle?: string
        goto?: string
        label?: string
      }[]
      /** Resultados de una búsqueda. Mandan sobre `datos` y sobre el
       *  formulario: comprobar algo por tu cuenta es media lección del módulo,
       *  y una lista de pares etiqueta/valor no se lee como un buscador. */
      resultados?: {
        titulo: string
        url: string
        fragmento: string
        senal?: string
      }[]
      button: string
      footer?: string
      /** `data-signal` de la barra de direcciones. */
      senalUrl?: string
      /** Nodo al que lleva enviar el formulario. Sin esto el botón es de
       *  adorno, y un botón de envío que no responde es lo que menos se
       *  perdona en una pantalla que imita a una real. */
      botonGoto?: string
      botonLabel?: string
      /** Nodo al que lleva cerrar la pestaña de esta página. Sin esto la
       *  pestaña no lleva la ✕: cerrar tiene que significar algo. */
      cerrarGoto?: string
      cerrarLabel?: string
    }
  | {
      kind: 'sms'
      sender: string
      sub: string
      /** El `text` es HTML fijo del escenario: el enlace del mensaje va como
       *  `<a href>` con `data-hotspot-goto`, para que tocarlo sea la decisión y
       *  el navegador revele el destino al pasar el cursor. */
      msgs: {
        text: string
        time: string
        mine?: boolean
        senal?: string
        /** Duración de la nota de voz ("0:11"). Con ella el mensaje deja de ser
         *  texto y pasa a oírse: en suplantación la voz *es* el ataque, y
         *  leerla escrita quita lo que hay que aprender a dudar. El `text` pasa
         *  a ser su transcripción, y también la clave de su audio. */
        voz?: string
        /** Quién manda la nota, si no es la voz por defecto del escenario. */
        rol?: string
        /** Una captura de pantalla pegada en el chat, dibujada como lo que es:
         *  un trozo de otra conversación, con su cabecera y sus burbujas,
         *  enmarcado dentro del mensaje. Escrita como "[Captura] ..." se lee
         *  como notación de guion, y delante de alguien que no es técnico un
         *  corchete en mitad de un chat parece un error de la app.
         *
         *  Va dibujada y no como imagen porque el nombre que la encabeza es la
         *  prueba —hay que poder cambiarlo desde el escenario—, porque tiene
         *  que llevar el `data-signal` de la señal, y porque un .png ni escala
         *  en el marco del teléfono ni lo lee un lector de pantalla. */
        captura?: {
          /** Quién encabeza la captura: en suplantación, el nombre y la foto
           *  que copiaron; en estafa, el banco que supuestamente emitió el
           *  comprobante. */
          quien: string
          sub?: string
          /** Icono de la cabecera. Una captura de un chat lleva la foto de
           *  perfil; una de un comprobante, el sello del banco. */
          icono?: 'persona' | 'banco'
          /** Lo que se ve escrito, en orden. Son mensajes recibidos por quien
           *  sacó la captura, así que van todos del lado de quien escribe. */
          mensajes?: string[]
          /** Un comprobante en vez de un chat: el papel que manda quien dice
           *  que ya pagó. Se dibuja igual de bien que uno de verdad porque
           *  falsificarlo es igual de fácil, y esa es la lección entera del
           *  módulo de estafa: el comprobante no es el dinero. */
          datos?: { etiqueta: string; valor: string }[]
        }
      }[]
      /** `data-signal` de la cabecera del hilo: el número o el nombre corto del
       *  remitente es la primera señal de un SMS, antes que el texto. */
      senalRemitente?: string
      /** Nodo al que lleva tocar el nombre de la cabecera. En mensajería eso
       *  abre la ficha del contacto, que es donde se ve el número de verdad y
       *  desde cuándo existe esa cuenta: la comprobación entera del módulo de
       *  suplantación cabe ahí. Sin esto la cabecera no responde. */
      perfilGoto?: string
      perfilLabel?: string
      /** Nodo al que lleva salir del hilo con la flecha de la cabecera. Sin
       *  esto la flecha se pinta apagada: volver a la lista de mensajes tiene
       *  que significar algo (dejarlo pasar) o no ser una salida. */
      volverGoto?: string
      volverLabel?: string
      /** Nodo al que lleva tocar el campo de escribir. Lleva a una pantalla del
       *  mismo hilo que ya trae el `borrador` puesto: escribir y enviar son dos
       *  gestos distintos, y separarlos deja ver qué se iba a mandar. */
      composerGoto?: string
      composerLabel?: string
      /** Lo que puedes escribirle ahora, cuando la conversación tiene varias
       *  salidas. Es el equivalente en mensajería de lo que se dice en una
       *  llamada: va como burbujas del propio hilo, encima del campo de
       *  escribir, y nunca como lista de opciones al lado de la pantalla.
       *
       *  Con `respuestas` el campo de escribir queda de adorno: escribir a mano
       *  y elegir una frase serían dos formas de hacer lo mismo. */
      respuestas?: { texto: string; goto: string; label?: string }[]
      /** Texto ya escrito y sin enviar. Con él, el campo deja de ser marcador
       *  de posición y aparece el botón de enviar. No es editable, como los
       *  campos de los formularios simulados. */
      borrador?: string
      senalBorrador?: string
      enviarGoto?: string
      enviarLabel?: string
    }
  | {
      kind: 'call'
      /** Todavía sonando: la pantalla solo enseña contestar y rechazar. No
       *  contestar es una decisión legítima y tiene que poder tomarse antes de
       *  oír nada, igual que en el teléfono de uno. */
      entrante?: boolean
      /** El marcador, con el número puesto y todavía sin llamar. Es el paso que
       *  falta cuando la llamada la hace el participante: tocar un número en un
       *  mensaje abre el marcador, no la llamada, y decidir marcarlo es una
       *  decisión suya que tiene que quedar en la traza. Sin esto, tocar el
       *  número metía en la conversación de golpe, como si hubiera llamado
       *  alguien más.
       *
       *  Reutiliza `contestarGoto` (marcar) y `rechazarGoto` (salir del
       *  marcador) porque la pantalla es la misma: quién es, su número, y dos
       *  botones. Solo cambian los rótulos. */
      marcando?: boolean
      /** Lo que el teléfono dice que llama: el nombre del contacto si lo
       *  tienes guardado, y si no, el número tal cual. */
      quien: string
      numero: string
      /** Chip bajo el número: "No está en tus contactos". Es la primera señal
       *  de una llamada, antes que nada de lo que se diga dentro. */
      etiqueta?: string
      senalQuien?: string
      contestarGoto?: string
      contestarLabel?: string
      rechazarGoto?: string
      rechazarLabel?: string
      /** La conversación hasta este punto, con las líneas propias marcadas.
       *  Cada nodo la trae entera, como el hilo de un SMS trae los mensajes
       *  anteriores: lo que se dijo antes sigue siendo parte de la escena. */
      dialogo?: {
        texto: string
        mio?: boolean
        senal?: string
        /** Quién dice esta línea, cuando en la llamada habla más de una
         *  persona. Solo lo usa el generador de voces (scripts/voces.py) para
         *  darle a cada personaje la suya: una llamada donde la hija y el
         *  supuesto policía suenan igual no engaña a nadie. */
        rol?: string
      }[]
      /** Lo que puedes contestar ahora. Es lo único de la llamada que no
       *  puede ser un gesto del aparato —hablar es hablar—, así que va como
       *  burbujas del propio hilo y nunca como lista de opciones al lado. */
      decir?: { texto: string; goto: string; label?: string }[]
      /** Nodo al que lleva colgar. Sin esto el botón rojo se pinta igual pero
       *  no responde, y colgar es la salida que este módulo entero enseña. */
      colgarGoto?: string
      colgarLabel?: string
    }

/// El nombre del participante, allí donde la pantalla simulada lo diría.
///
/// Existe por el escenario del perfil clonado: una cuenta que te suplanta lleva
/// *tu* nombre en la cabecera, y escrito "Tu nombre" se lee como una etiqueta
/// del ejercicio y no como lo que tu gente ve en su teléfono. Los escenarios lo
/// escriben `{nombre}` en cualquier texto de la vista y aquí se cambia por el
/// de verdad, igual que el correo y la cédula prestados.
const TOKEN_NOMBRE = /\{nombre\}/g

function conNombre<T>(valor: T, nombre: string): T {
  if (typeof valor === 'string') return valor.replace(TOKEN_NOMBRE, nombre) as T
  if (Array.isArray(valor)) return valor.map((parte) => conNombre(parte, nombre)) as T
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, parte]) => [clave, conNombre(parte, nombre)]),
    ) as T
  }
  return valor
}

/// De dónde sale lo que se ve escrito en un campo. Un formulario que ya trae
/// *tus* datos se lee como el de un sitio que te conoce, que es media trampa, y
/// hace que enviarlo sea entregar algo tuyo y no rellenar casillas vacías.
const VALORES: Record<string, ((yo: { correo: string; usuario: string }) => string) | undefined> = {
  correo: (yo) => yo.correo,
  usuario: (yo) => yo.usuario,
  cedula: () => IDENTIDAD_FICTICIA.cedula,
  cuenta: () => CUENTA_FICTICIA,
}

/// El botón de una página simulada, sea el envío de un formulario o la acción
/// única de una página informativa ("llamar a este número"). Sin `botonGoto`
/// se pinta igual pero no responde: hay páginas donde el botón es decorado.
function Accion({ view }: { view: Extract<ScreenView, { kind: 'web' }> }) {
  if (!view.botonGoto) return <div className={styles.submit}>{view.button}</div>

  return (
    <button
      type="button"
      className={`${styles.hotspot} ${styles.submit}`}
      data-hotspot-goto={view.botonGoto}
      data-hotspot-label={view.botonLabel}
    >
      {view.button}
    </button>
  )
}

function DeviceScreen({
  view: vista,
  acciones,
  carpetas,
  destinatario,
  carpetaForzada,
  terminada,
}: {
  view: ScreenView
  /** Barra de acciones del cliente. Solo se pinta si el escenario declara sus
   *  finales; sin ellos los botones no tendrían a dónde saltar. */
  acciones?: AccionCorreo[]
  carpetas?: CarpetaCorreo[]
  destinatario?: string
  carpetaForzada?: string
  /** La corrida ya terminó. Solo lo mira la pantalla de llamada: una llamada
   *  colgada tiene que dejar de contar minutos y de hablar. */
  terminada?: boolean
}) {
  const { correoSimulado, displayName } = useAuth()
  const correo = destinatario ?? correoSimulado
  const usuario = correo.split('@')[0] ?? correo

  // Si la cuenta ya está anonimizada no queda nombre que poner, y "tu nombre"
  // en minúscula sigue leyéndose dentro de la frase.
  const view = useMemo(() => conNombre(vista, displayName || 'tu nombre'), [vista, displayName])
  const hiloRef = useRef<HTMLDivElement>(null)

  // Al enviar una respuesta, el nodo siguiente añade esa burbuja y la réplica
  // del remitente al final del hilo. Dejarlas fuera de la vista parece que no
  // hubiera llegado respuesta, aunque esté debajo del pliegue.
  useEffect(() => {
    if (view.kind !== 'sms') return
    const hilo = hiloRef.current
    if (!hilo) return
    if (typeof hilo.scrollTo === 'function') {
      hilo.scrollTo({ top: hilo.scrollHeight, behavior: 'smooth' })
    } else {
      hilo.scrollTop = hilo.scrollHeight
    }
  }, [view])

  if (view.kind === 'mail') {
    return (
      <CuerpoCorreo
        acciones={acciones}
        carpetas={carpetas}
        destinatario={destinatario}
        carpetaForzada={carpetaForzada}
        asunto={view.subject}
        remitente={{
          nombre: view.from,
          direccion: view.address,
          etiqueta: view.label,
          senalDireccion: view.senalDireccion,
          senalEtiqueta: view.senalEtiqueta,
        }}
        recibido={view.date}
        adjunto={
          view.attachment && (
            <span
              className={styles.attachment}
              data-signal={view.senalAdjunto}
              data-hotspot-goto={view.adjuntoGoto}
              data-hotspot-label={view.adjuntoLabel}
              role={view.adjuntoGoto ? 'button' : undefined}
              tabIndex={view.adjuntoGoto ? 0 : undefined}
            >
              <span className={styles.attachmentTipo} aria-hidden>
                <Paperclip className={styles.attachmentIcono} strokeWidth={1.75} />
              </span>
              <span className={styles.attachmentNombre}>{view.attachment}</span>
            </span>
          )
        }
        pie={view.footer && <div dangerouslySetInnerHTML={{ __html: view.footer }} />}
      >
        {/* Contenido fijo del escenario: permite negritas y el enlace falso. */}
        <div dangerouslySetInnerHTML={{ __html: view.body }} />
      </CuerpoCorreo>
    )
  }

  if (view.kind === 'web') {
    return (
      <div className={styles.page}>
        {view.menu ? (
          <CabeceraSitio marca={view.brand} menu={view.menu} />
        ) : (
          <p className={styles.brand}>{view.brand}</p>
        )}

        {/* Un buscador enseña lo que se buscó dentro de su caja, no como
            titular de la página: sin la caja, los resultados parecían el
            contenido del sitio en vez de una búsqueda que hizo el
            participante. */}
        {view.resultados ? (
          <div className={styles.cajaBusqueda} aria-label={`Búsqueda: ${view.title}`}>
            <span className={styles.consulta}>{view.title}</span>
            <Search aria-hidden className={styles.consultaIcono} strokeWidth={1.75} />
          </div>
        ) : (
          <h2 className={styles.pageTitle}>{view.title}</h2>
        )}
        {view.subtitle && <p className={styles.pageSub}>{view.subtitle}</p>}

        {view.opciones ? (
          <ul className={styles.opciones}>
            {view.opciones.map((opcion) => (
              <li key={opcion.texto}>
                <button
                  type="button"
                  className={styles.opcion}
                  data-hotspot-goto={opcion.goto}
                  data-hotspot-label={opcion.label}
                >
                  <span className={styles.opcionTextos}>
                    <span className={styles.opcionTexto}>{opcion.texto}</span>
                    {opcion.detalle && (
                      <span className={styles.opcionDetalle}>{opcion.detalle}</span>
                    )}
                  </span>
                  <span className={styles.opcionFlecha} aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : view.resultados ? (
          <div className={styles.resultados}>
            {view.resultados.map((resultado) => (
              <div key={resultado.url} data-signal={resultado.senal}>
                <span className={styles.resultadoUrl}>{resultado.url}</span>
                <span className={styles.resultadoTitulo}>{resultado.titulo}</span>
                <p className={styles.resultadoTexto}>{resultado.fragmento}</p>
              </div>
            ))}
          </div>
        ) : view.datos ? (
          <div className={styles.datos}>
            {view.datos.map((dato) => (
              <div key={dato.etiqueta} className={styles.dato}>
                <span className={styles.datoEtiqueta}>{dato.etiqueta}</span>
                <span className={styles.datoValor} data-signal={dato.senal}>
                  {dato.valor}
                </span>
              </div>
            ))}
            {view.button && <Accion view={view} />}
          </div>
        ) : (
          <div className={styles.form}>
            {view.fields.map((field) => (
              <label key={field.label} className={styles.field} data-signal={field.senal}>
                <span>{field.label}</span>
                <span className={styles.input}>
                  {VALORES[field.valor ?? '']?.({ correo, usuario }) ?? field.placeholder}
                </span>
              </label>
            ))}
            <Accion view={view} />
          </div>
        )}

        {view.aviso && <AvisoSitio>{view.aviso}</AvisoSitio>}

        <PieSitio texto={view.footer} enlaces={view.pie} />
      </div>
    )
  }

  if (view.kind === 'call') {
    return <PantallaLlamada view={view} terminada={terminada} />
  }

  // Los mensajes que llegan después de lo último que escribiste entran uno
  // detrás de otro. Dos o tres burbujas apareciendo a la vez se leen como un
  // bloque de texto, y así se pierde lo que hace un chat: que cada frase llega
  // sola y hay un momento para pensarla antes de la siguiente.
  const ultimoMio = view.msgs.map((msg) => Boolean(msg.mine)).lastIndexOf(true)

  return (
    <section className={`${styles.screen} ${styles.sms}`} aria-label="Mensajes de texto">
      <div className={styles.smsbar}>
        {view.volverGoto ? (
          <button
            type="button"
            className={`${styles.hotspot} ${styles.smsVolver}`}
            aria-label="Volver a la lista de mensajes"
            data-hotspot-goto={view.volverGoto}
            data-hotspot-label={view.volverLabel}
          >
            ‹
          </button>
        ) : (
          <span className={`${styles.smsVolver} ${styles.smsVolverApagado}`} aria-hidden>
            ‹
          </span>
        )}

        {view.perfilGoto ? (
          <button
            type="button"
            className={`${styles.hotspot} ${styles.smsId} ${styles.smsIdBoton}`}
            data-signal={view.senalRemitente}
            data-hotspot-goto={view.perfilGoto}
            data-hotspot-label={view.perfilLabel}
          >
            <span className={styles.smsName}>{view.sender}</span>
            <span className={styles.smsSub}>{view.sub}</span>
          </button>
        ) : (
          <div className={styles.smsId} data-signal={view.senalRemitente}>
            <p className={styles.smsName}>{view.sender}</p>
            <p className={styles.smsSub}>{view.sub}</p>
          </div>
        )}

        {/* Contrapeso de la flecha, para que el nombre del remitente quede
            centrado en la cabecera y no corrido hacia la derecha. */}
        <span className={styles.smsVolver} aria-hidden />
      </div>

      <div ref={hiloRef} className={styles.smsThread}>
        {view.msgs.map((msg, i) => (
          <div
            key={msg.text}
            className={`${styles.smsRow} ${msg.mine ? styles.mine : styles.theirs} ${
              i > ultimoMio ? styles.smsNuevo : ''
            }`}
            style={i > ultimoMio ? { animationDelay: `${(i - ultimoMio - 1) * 0.6}s` } : undefined}
          >
            <div className={styles.smsBubble}>
              {msg.voz ? (
                <NotaDeVoz texto={msg.text} duracion={msg.voz} senal={msg.senal} />
              ) : (
                <span
                  data-signal={msg.captura ? undefined : msg.senal}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
              )}

              {msg.captura && (
                /* La señal va en la captura y no en el texto que la acompaña:
                   lo que hay que mirar es el nombre de la cabecera. */
                <figure className={styles.captura} data-signal={msg.senal}>
                  <div className={styles.capturaBarra}>
                    <span className={styles.capturaFoto} aria-hidden>
                      {msg.captura.icono === 'banco' ? (
                        <Landmark className={styles.capturaFotoIcono} strokeWidth={2} />
                      ) : (
                        <UserRound className={styles.capturaFotoIcono} strokeWidth={2} />
                      )}
                    </span>
                    <span className={styles.capturaId}>
                      <span className={styles.capturaQuien}>{msg.captura.quien}</span>
                      {msg.captura.sub && (
                        <span className={styles.capturaSub}>{msg.captura.sub}</span>
                      )}
                    </span>
                  </div>

                  {msg.captura.mensajes && (
                    <div className={styles.capturaHilo}>
                      {msg.captura.mensajes.map((linea) => (
                        <span key={linea} className={styles.capturaBurbuja}>
                          {linea}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.captura.datos && (
                    <dl className={styles.capturaDatos}>
                      {msg.captura.datos.map((dato) => (
                        <div key={dato.etiqueta} className={styles.capturaDato}>
                          <dt className={styles.capturaEtiqueta}>{dato.etiqueta}</dt>
                          <dd className={styles.capturaValor}>{dato.valor}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <figcaption className={styles.capturaPie}>Captura de pantalla</figcaption>
                </figure>
              )}

              <span className={styles.smsTime}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {view.respuestas && view.respuestas.length > 0 && (
        <div className={styles.smsRespuestas}>
          <span className={styles.smsRespuestasTag}>Tú escribes</span>
          {view.respuestas.map((respuesta) => (
            <button
              key={respuesta.texto}
              type="button"
              className={styles.smsRespuesta}
              data-hotspot-goto={respuesta.goto}
              data-hotspot-label={respuesta.label}
            >
              {respuesta.texto}
            </button>
          ))}
        </div>
      )}

      <div className={styles.smsComposer}>
        {view.borrador ? (
          <>
            <span
              className={`${styles.smsField} ${styles.smsFieldEscrito}`}
              data-signal={view.senalBorrador}
            >
              {view.borrador}
            </span>
            <button
              type="button"
              className={`${styles.hotspot} ${styles.smsEnviar}`}
              aria-label="Enviar el mensaje"
              data-hotspot-goto={view.enviarGoto}
              data-hotspot-label={view.enviarLabel}
            >
              <SendHorizontal aria-hidden className={styles.smsEnviarIcono} strokeWidth={2} />
            </button>
          </>
        ) : view.composerGoto ? (
          <button
            type="button"
            className={`${styles.hotspot} ${styles.smsField} ${styles.smsFieldBoton}`}
            data-hotspot-goto={view.composerGoto}
            data-hotspot-label={view.composerLabel}
          >
            Mensaje de texto
          </button>
        ) : (
          <div className={styles.smsField}>Mensaje de texto</div>
        )}
      </div>
    </section>
  )
}

export default DeviceScreen
