import styles from './fisico.module.css'

export interface ZonaEscena {
  id: string
  x: string
  y: string
  ancho: string
  alto: string
}

interface EscenaFotoProps {
  src: string
  alt: string
  zonas?: ZonaEscena[]
}

/** Fotografía del mundo real: no imita ninguna app ni fuerza una proporción. */
export function EscenaFoto({ src, alt, zonas = [] }: EscenaFotoProps) {
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
    </div>
  )
}
