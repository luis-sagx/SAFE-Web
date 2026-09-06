import { BotonHotspot } from '../../components/ui/interactivo'
import styles from './fisico.module.css'

export interface ZonaEscena {
  id: string
  x: string
  y: string
  ancho: string
  alto: string
}

/** El punto que hay que tocar antes de que aparezcan las opciones: la escena
 *  se mira primero, se decide después. */
export interface DestelloEscena {
  x: string
  y: string
  /** Nodo con las opciones, al que salta el grafo al tocarlo. */
  goto: string
  label: string
}

/** Aviso de que la escena avanza sola: sin esto, una foto que no responde al
 *  tacto y no cambia durante varios segundos se lee como colgada, no como
 *  "espera, ya vuelvo". El tiempo de la barra debe coincidir con el `ms` de
 *  `autoAvanza` en el nodo del grafo. */
export interface ProgresoEscena {
  ms: number
  texto: string
}

interface EscenaFotoProps {
  src: string
  alt: string
  zonas?: ZonaEscena[]
  destello?: DestelloEscena
  progreso?: ProgresoEscena
}

/** Fotografía del mundo real: no imita ninguna app ni fuerza una proporción. */
export function EscenaFoto({ src, alt, zonas = [], destello, progreso }: Readonly<EscenaFotoProps>) {
  return (
    <div className="relative w-full lg:h-full lg:w-fit lg:max-w-full lg:flex-none">
      <img src={src} alt={alt} className={`${styles.escenaFoto} h-auto w-full lg:h-full lg:w-auto lg:max-w-full`} />
      {zonas.map((zona) => (
        <span
          key={zona.id}
          id={zona.id}
          data-signal={zona.id}
          className={styles.zonaSenal}
          style={{ left: zona.x, top: zona.y, width: zona.ancho, height: zona.alto }}
        />
      ))}
      {destello && (
        <>
          <BotonHotspot
            goto={destello.goto}
            label={destello.label}
            className={styles.destello}
            style={{ left: destello.x, top: destello.y }}
            ariaLabel="Inspeccionar"
          >
            <span className={styles.destelloPulso} aria-hidden />
            <span className={styles.destelloPunto} aria-hidden>
              ⚡
            </span>
          </BotonHotspot>
          <div className={styles.destelloAviso}>
            <p className={styles.destelloAvisoTexto}>Da clic en el destello ⚡ para ver las opciones</p>
          </div>
        </>
      )}
      {progreso && (
        <div className={styles.progresoAviso}>
          <p className={styles.progresoTexto}>{progreso.texto}</p>
          <div className={styles.progresoBarra}>
            <div
              className={styles.progresoRelleno}
              style={{ animationDuration: `${progreso.ms}ms` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
