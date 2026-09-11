import { ArrowDown, ArrowRight, Check, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ResultadoEscenario } from '../../hooks/useScenarioRun'
import styles from './AvisoFinEscenario.module.css'

// Debe cuadrar con el retardo de `capaSale` en el CSS.
const DURACION_MS = 1800

// Titular de tres palabras: el aviso dura menos de dos segundos, lo que no se
// lea de un vistazo no se lee. `satisfies` para que falte un resultado sea
// error de compilación.
const TONOS = {
  good: { Icono: Check, clase: styles.bien, titulo: 'Bien resuelto' },
  partial: { Icono: TriangleAlert, clase: styles.medias, titulo: 'A medias' },
  bad: { Icono: X, clase: styles.mal, titulo: 'No salió bien' },
} satisfies Record<ResultadoEscenario, unknown>

// aria-hidden: quien usa lector de pantalla ya recibe el aviso por el foco
// que PanelVeredicto lleva a su primer botón al montarse.
function AvisoFinEscenario({ resultado }: { resultado?: ResultadoEscenario }) {
  const [visible, setVisible] = useState(false)
  // Solo en el flanco de subida: el aviso es de la transición, no del estado.
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

  if (!resultado || !visible) return null

  const { Icono, clase, titulo } = TONOS[resultado]

  return (
    <>
      <div className={`${styles.capa} ${clase}`} aria-hidden>
        <span className={styles.disco}>
          <Icono className={styles.icono} strokeWidth={3.5} />
        </span>

        <div className={styles.texto}>
          <p className={styles.titulo}>{titulo}</p>
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
