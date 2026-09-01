import { ArrowDown, ArrowRight, Check, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ResultadoEscenario } from '../../hooks/useScenarioRun'
import styles from './AvisoFinEscenario.module.css'

/** Cuánto se ve. Lo suficiente para que salte a la vista y no tanto como para
 *  estorbar a quien repite el escenario y ya sabe qué pasó. Tiene que cuadrar
 *  con el retardo de `capaSale` en el CSS. */
const DURACION_MS = 1800

/// Icono, color y titular de cada resultado.
///
/// El titular es de tres palabras porque el aviso dura menos de dos segundos:
/// lo que no se lea de un vistazo no se lee. El detalle está en el panel, que
/// es a donde apunta la flecha.
const TONOS = {
  good: { Icono: Check, clase: styles.bien, titulo: 'Bien resuelto' },
  partial: { Icono: TriangleAlert, clase: styles.medias, titulo: 'A medias' },
  bad: { Icono: X, clase: styles.mal, titulo: 'No salió bien' },
  // `satisfies` solo para que falte uno sea un error de compilación si algún
  // día se añade un resultado nuevo.
} satisfies Record<ResultadoEscenario, unknown>

/**
 * Golpe de fin de escenario, encima de la pantalla simulada.
 *
 * Existe porque el final solo se notaba en la columna del resultado: la
 * pantalla se queda igual, no se mueve nada, y quien estaba concentrado en el
 * correo seguía buscando qué tocar sin saber que ya había decidido. Aparece
 * donde están los ojos, tapa la pantalla el instante justo para sacarlos de
 * ahí, y apunta a dónde está la respuesta.
 *
 * No se anuncia a los lectores de pantalla (`aria-hidden`): quien usa uno ya
 * recibe el aviso por el foco, que PanelVeredicto se lleva a su primer botón al
 * montarse. Anunciarlo dos veces sería peor que no anunciarlo.
 */
function AvisoFinEscenario({ resultado }: { resultado?: ResultadoEscenario }) {
  const [visible, setVisible] = useState(false)
  // Solo en el flanco de subida: el escenario pasa muchos renders con el
  // resultado puesto —todo el repaso de señales— y el aviso es de la
  // transición, no del estado. Al repetir vuelve a `undefined` y el siguiente
  // final lo dispara otra vez.
  const anterior = useRef(resultado)

  useEffect(() => {
    if (resultado && !anterior.current) {
      setVisible(true)
    }
    anterior.current = resultado
  }, [resultado])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => setVisible(false), DURACION_MS)
    return () => clearTimeout(id)
  }, [visible])

  if (!resultado) return null

  const { Icono, clase, titulo } = TONOS[resultado]

  // La franja se queda mientras el escenario esté terminado. El golpe dura
  // menos de dos segundos y quien parpadea se lo pierde; entonces la pantalla
  // vuelve a verse exactamente igual que mientras se jugaba y el único rastro
  // del final vive en la columna de al lado, que es justo donde el ojo no
  // estaba. La franja deja el aviso pegado a la pantalla que lo provocó.
  const franja = (
    <div className={`${styles.franja} ${clase}`} aria-hidden>
      <span className={styles.franjaDisco}>
        <Icono className={styles.franjaIcono} strokeWidth={3} />
      </span>
      <span className={styles.franjaTexto}>
        Escenario terminado.
        <span className="hidden lg:inline"> El resultado está a la derecha.</span>
        <span className="lg:hidden"> El resultado está abajo.</span>
      </span>
      <ArrowRight className={`${styles.franjaFlecha} hidden lg:block`} strokeWidth={2.5} />
      <ArrowDown className={`${styles.franjaFlecha} lg:hidden`} strokeWidth={2.5} />
    </div>
  )

  if (!visible) return franja

  return (
    <>
      {franja}
      <div className={`${styles.capa} ${clase}`} aria-hidden>
        <span className={styles.disco}>
          <Icono className={styles.icono} strokeWidth={3.5} />
        </span>

        <div className={styles.texto}>
          <p className={styles.titulo}>{titulo}</p>
          {/* La columna del resultado está al costado en pantalla ancha y debajo
              cuando el diseño se apila. Una flecha que apunta al lado equivocado
              es peor que ninguna. */}
          <p className={styles.hacia}>
            <span className="hidden lg:inline">Mira a la derecha</span>
            <span className="lg:hidden">Mira abajo</span>
            <ArrowRight className={`${styles.flecha} hidden lg:block`} strokeWidth={2.5} />
            <ArrowDown className={`${styles.flecha} lg:hidden`} strokeWidth={2.5} />
          </p>
        </div>
      </div>
    </>
  )
}

export default AvisoFinEscenario
