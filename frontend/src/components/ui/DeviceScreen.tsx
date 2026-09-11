import { Bot, Landmark, Paperclip, Search, SendHorizontal, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { CUENTA_FICTICIA, IDENTIDAD_FICTICIA } from '../../lib/identidadFicticia'
import { AvisoSitio, CabeceraSitio, PieSitio } from './armazonSitio'
import {
  CuerpoCorreo,
  type AccionCorreo,
  type CarpetaCorreo,
  type MarcaCorreo,
} from './DesktopChrome'
import NotaDeVoz from './NotaDeVoz'
import PantallaLlamada from './PantallaLlamada'
import { EscenaFoto, type DestelloEscena, type ProgresoEscena, type ZonaEscena } from '../../secciones/fisico/EscenaFoto'
import styles from './DeviceScreen.module.css'

// Solo dibuja lo que la app real mostraría (regla diegética de
// EscenarioLayout); preguntas y feedback viven fuera del marco. Los campos de
// formulario no son editables: el participante juzga, nunca escribe credenciales reales.
export type ScreenView =
  | {
      kind: 'escena'
      src: string
      alt: string
      zonas?: ZonaEscena[]
      // Punto a tocar para que aparezcan las opciones; sin esto se muestran de entrada.
      destello?: DestelloEscena
      progreso?: ProgresoEscena
    }
  | {
      kind: 'mail'
      from: string
      address: string
      subject: string
      date: string
      // HTML fijo del escenario, nunca contenido de un usuario.
      body: string
      footer?: string
      attachment?: string
      // Sin esto el adjunto se ve pero no se abre.
      adjuntoGoto?: string
      adjuntoLabel?: string
      label?: string
      senalDireccion?: string
      senalEtiqueta?: string
      senalAdjunto?: string
      marca?: MarcaCorreo
    }
  | {
      kind: 'web'
      url: string
      // Nombre de app cuando la pantalla es una app del teléfono, no una
      // página del navegador (sin URL ni candado que buscar). Solo en celular.
      app?: string
      secure: boolean
      // Archivo local: sin candado ni advertencia (no es una conexión).
      local?: boolean
      brand: string
      // Si se pone a la página legítima hay que ponerlo también a la falsa
      // del mismo escenario: un kit de phishing clona el sitio entero.
      menu?: string[]
      pie?: string[]
      aviso?: string
      title: string
      subtitle?: string
      fields: {
        label: string
        placeholder: string
        senal?: string
        // Rellena con los datos del participante en vez del placeholder.
        valor?: 'correo' | 'usuario' | 'cedula' | 'cuenta'
      }[]
      // Datos de una página informativa; sustituyen al formulario.
      datos?: { etiqueta: string; valor: string; senal?: string }[]
      // Menú de app o sitios frecuentes; manda sobre todo lo demás. Las
      // entradas sin goto se pulsan igual (mismo realce) para no delatar cuál decide.
      opciones?: {
        texto: string
        detalle?: string
        goto?: string
        label?: string
      }[]
      // Resultados de búsqueda; mandan sobre `datos` y el formulario.
      resultados?: {
        titulo: string
        url: string
        fragmento: string
        senal?: string
      }[]
      button: string
      footer?: string
      senalUrl?: string
      botonGoto?: string
      botonLabel?: string
      // Sin esto la pestaña no lleva la ✕.
      cerrarGoto?: string
      cerrarLabel?: string
    }
  | {
      kind: 'sms'
      sender: string
      sub: string
      // Chat que vive en un sitio de escritorio (asistente de IA) en vez del
      // marco de teléfono; se pinta dentro del navegador con su pestaña.
      sitio?: { titulo: string; url: string }
      // text es HTML fijo; el enlace va como <a href> con data-hotspot-goto.
      msgs: {
        text: string
        time: string
        mine?: boolean
        senal?: string
        // Duración de la nota de voz; en suplantación la voz es el ataque.
        // text pasa a ser su transcripción y la clave del audio.
        voz?: string
        rol?: string
        // Captura de otra conversación pegada en el chat, dibujada (no imagen)
        // porque lleva data-signal y el nombre debe poder cambiarse.
        captura?: {
          quien: string
          sub?: string
          icono?: 'persona' | 'banco'
          mensajes?: string[]
          // Comprobante en vez de chat: falsificarlo es fácil, y esa es la
          // lección del módulo de estafa (el comprobante no es el dinero).
          datos?: { etiqueta: string; valor: string }[]
        }
      }[]
      senalRemitente?: string
      // Abre la ficha del contacto: número real y antigüedad de la cuenta.
      perfilGoto?: string
      perfilLabel?: string
      volverGoto?: string
      volverLabel?: string
      // Lleva a una pantalla del mismo hilo con el borrador ya puesto.
      composerGoto?: string
      composerLabel?: string
      // Respuestas posibles cuando la conversación se ramifica; van como
      // burbujas sobre el campo, nunca como lista de opciones aparte.
      respuestas?: { texto: string; goto: string; label?: string }[]
      // Texto ya escrito y sin enviar; no editable, como los campos de formulario.
      borrador?: string
      senalBorrador?: string
      enviarGoto?: string
      enviarLabel?: string
    }
  | {
      kind: 'call'
      entrante?: boolean
      // El marcador (número puesto, sin llamar aún): tocar un número abre
      // esto, no la llamada, para que marcar quede en la traza. Reutiliza
      // contestarGoto/rechazarGoto porque la pantalla es la misma.
      marcando?: boolean
      quien: string
      numero: string
      etiqueta?: string
      senalQuien?: string
      contestarGoto?: string
      contestarLabel?: string
      rechazarGoto?: string
      rechazarLabel?: string
      dialogo?: {
        texto: string
        mio?: boolean
        senal?: string
        // Quién habla, para el generador de voces (scripts/voces.py).
        rol?: string
      }[]
      // Lo que se puede contestar; va como burbujas del hilo, no como lista aparte.
      decir?: { texto: string; goto: string; label?: string }[]
      colgarGoto?: string
      colgarLabel?: string
    }

// Existe por el perfil clonado: una cuenta que suplanta lleva *tu* nombre en
// la cabecera. Los escenarios escriben {nombre} y aquí se sustituye.
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

// Un formulario que ya trae *tus* datos se lee como el de un sitio que te conoce.
const VALORES: Record<string, ((yo: { correo: string; usuario: string }) => string) | undefined> = {
  correo: (yo) => yo.correo,
  usuario: (yo) => yo.usuario,
  cedula: () => IDENTIDAD_FICTICIA.cedula,
  cuenta: () => CUENTA_FICTICIA,
}

// Sin botonGoto se pinta igual pero no responde (botón decorativo).
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
  acciones?: AccionCorreo[]
  carpetas?: CarpetaCorreo[]
  destinatario?: string
  carpetaForzada?: string
  // Solo lo mira la pantalla de llamada: colgada, deja de contar y de hablar.
  terminada?: boolean
}) {
  const { correoSimulado, displayName } = useAuth()
  const correo = destinatario ?? correoSimulado
  const usuario = correo.split('@')[0] ?? correo

  // Sin nombre queda "tu nombre" en minúscula, que sigue leyéndose en la frase.
  const view = useMemo(() => conNombre(vista, displayName || 'tu nombre'), [vista, displayName])
  const hiloRef = useRef<HTMLDivElement>(null)

  // Sin autoscroll parece que no hubiera llegado respuesta (queda bajo el pliegue).
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

  if (view.kind === 'escena') {
    return (
      <EscenaFoto src={view.src} alt={view.alt} zonas={view.zonas} destello={view.destello} progreso={view.progreso} />
    )
  }

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
        marca={view.marca}
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

        {/* La caja de búsqueda deja claro que los resultados vienen de buscar. */}
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

  // Los mensajes nuevos entran uno detrás de otro, no todos a la vez, para
  // que se lean como un chat y no como un bloque de texto.
  const ultimoMio = view.msgs.map((msg) => Boolean(msg.mine)).lastIndexOf(true)

  return (
    <section
      className={`${styles.screen} ${styles.sms} ${view.sitio ? styles.smsAncho : ''}`}
      aria-label={view.sitio ? 'Chat con el asistente' : 'Mensajes de texto'}
    >
      {/* Un chat web no lleva cabecera: el nombre ya está en la pestaña. */}
      {!view.sitio && (
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
      )}

      <div ref={hiloRef} className={styles.smsThread}>
        {view.msgs.map((msg, i) => (
          <div
            key={msg.text}
            className={`${styles.smsRow} ${msg.mine ? styles.mine : styles.theirs} ${
              i > ultimoMio ? styles.smsNuevo : ''
            }`}
            style={i > ultimoMio ? { animationDelay: `${(i - ultimoMio - 1) * 0.6}s` } : undefined}
          >
            {/* Sin cabecera que diga quién escribe, el avatar es lo que
                distingue al asistente: cada respuesta suya sale firmada. */}
            {view.sitio && !msg.mine && (
              <span className={styles.smsAvatar} aria-hidden>
                <Bot className={styles.smsAvatarIcono} strokeWidth={2} />
              </span>
            )}
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
          <div className={styles.smsField}>
            {view.sitio ? 'Escríbele al asistente' : 'Mensaje de texto'}
          </div>
        )}
      </div>
    </section>
  )
}

export default DeviceScreen
