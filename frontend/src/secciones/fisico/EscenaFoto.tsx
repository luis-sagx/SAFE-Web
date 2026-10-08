import { useContext, useState, type CSSProperties } from 'react'
import { SceneRatioContext } from '../../components/sceneRatioContext'
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
  const [photoRatio, setPhotoRatio] = useState(16 / 9)
  const reportRatio = useContext(SceneRatioContext)

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className={styles.escenaFotoSuperficie}
        style={{ '--photo-ratio': photoRatio } as CSSProperties}
      >
        <img
          src={src}
          alt={alt}
          className={styles.escenaFoto}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget
            if (naturalWidth && naturalHeight) {
              const ratio = naturalWidth / naturalHeight
              setPhotoRatio(ratio)
              reportRatio?.(ratio)
            }
          }}
        />
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
    </div>
  )
}
