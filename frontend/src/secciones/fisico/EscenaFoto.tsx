import { HotspotButton } from '../../components/ui/interactivo'
import styles from './fisico.module.css'

export interface SceneZone {
  id: string
  x: string
  y: string
  ancho: string
  alto: string
}

/** El punto que hay que tocar antes de que aparezcan las opciones: la escena
 *  se mira primero, se decide después. */
export interface SceneFlash {
  x: string
  y: string
  goto: string
  label: string
}

// Sin este aviso, una foto que no cambia por segundos se lee como colgada.
// El tiempo de la barra debe coincidir con el `ms` de `autoAvanza` en el grafo.
export interface SceneProgress {
  ms: number
  texto: string
}

interface PhotoSceneProps {
  src: string
  alt: string
  zonas?: SceneZone[]
  destello?: SceneFlash
  progreso?: SceneProgress
}

/** Fotografía del mundo real: no imita ninguna app ni fuerza una proporción. */
export function PhotoScene({ src, alt, zonas: zones = [], destello: flash, progreso: progress }: Readonly<PhotoSceneProps>) {
  return (
    <div className="relative w-full lg:h-full lg:w-fit lg:max-w-full lg:flex-none">
      <img src={src} alt={alt} className={`${styles.escenaFoto} h-auto w-full lg:h-full lg:w-auto lg:max-w-full`} />
      {zones.map((zone) => (
        <span
          key={zone.id}
          id={zone.id}
          data-signal={zone.id}
          className={styles.zonaSenal}
          style={{ left: zone.x, top: zone.y, width: zone.ancho, height: zone.alto }}
        />
      ))}
      {flash && (
        <>
          <HotspotButton
            goto={flash.goto}
            label={flash.label}
            className={styles.destello}
            style={{ left: flash.x, top: flash.y }}
            ariaLabel="Inspeccionar"
          >
            <span className={styles.destelloPulso} aria-hidden />
            <span className={styles.destelloPunto} aria-hidden>
              ⚡
            </span>
          </HotspotButton>
          <div className={styles.destelloAviso}>
            <p className={styles.destelloAvisoTexto}>Da clic en el destello ⚡ para ver las opciones</p>
          </div>
        </>
      )}
      {progress && (
        <div className={styles.progresoAviso}>
          <p className={styles.progresoTexto}>{progress.texto}</p>
          <div className={styles.progresoBarra}>
            <div
              className={styles.progresoRelleno}
              style={{ animationDuration: `${progress.ms}ms` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
