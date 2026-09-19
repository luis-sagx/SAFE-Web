import { ArrowDown, ArrowRight, Check, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ScenarioResult } from '../../hooks/useScenarioRun'
import styles from './AvisoFinEscenario.module.css'

// Debe cuadrar con el retardo de `capaSale` en el CSS. Subido de 1.8 s a
// 3.2 s (issue de UX): en las pruebas la gente seguía mirando el dispositivo,
// no la columna de al lado, y el aviso se apagaba antes de que llegaran a leer
// "Mira a la derecha".
const DURATION_MS = 3200

// Titular de tres palabras: el aviso dura menos de dos segundos, lo que no se
// lea de un vistazo no se lee. `satisfies` para que falte un resultado sea
// error de compilación.
const TONES = {
  good: { Icono: Check, clase: styles.bien, titulo: 'Bien resuelto' },
  partial: { Icono: TriangleAlert, clase: styles.medias, titulo: 'A medias' },
  bad: { Icono: X, clase: styles.mal, titulo: 'No salió bien' },
} satisfies Record<ScenarioResult, unknown>

// aria-hidden: quien usa lector de pantalla ya recibe el aviso por el foco
// que PanelVeredicto lleva a su primer botón al montarse.
function ScenarioEndNotice({ resultado: result }: { resultado?: ScenarioResult }) {
  const [visible, setVisible] = useState(false)
  // Solo en el flanco de subida: el aviso es de la transición, no del estado.
  const previous = useRef(result)

  useEffect(() => {
    if (result && !previous.current) {
      setVisible(true)
    }
    previous.current = result
  }, [result])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => setVisible(false), DURATION_MS)
    return () => clearTimeout(id)
  }, [visible])

  if (!result || !visible) return null

  const { Icono: Icon, clase, titulo: title } = TONES[result]

  return (
    <>
      <div className={`${styles.capa} ${clase}`} aria-hidden>
        <span className={styles.disco}>
          <Icon className={styles.icono} strokeWidth={3.5} />
        </span>

        <div className={styles.texto}>
          <p className={styles.titulo}>{title}</p>
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

export default ScenarioEndNotice
