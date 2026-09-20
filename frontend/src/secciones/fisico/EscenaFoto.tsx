import styles from './fisico.module.css'

export interface SceneZone {
  id: string
  x: string
  y: string
  ancho: string
  alto: string
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
  progreso?: SceneProgress
}

/** Fotografía del mundo real: no imita ninguna app ni fuerza una proporción. */
export function PhotoScene({ src, alt, zonas: zones = [], progreso: progress }: Readonly<PhotoSceneProps>) {
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
