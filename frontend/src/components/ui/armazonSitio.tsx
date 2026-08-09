import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

/**
 * Cabecera, aviso y pie de las páginas simuladas.
 *
 * Ningún sitio real es marca, título y contenido sobre blanco: tiene su menú
 * arriba y su letra pequeña abajo. Sin eso, las pantallas se leían como fichas
 * y no como sitios, y el contenido acababa a media ventana.
 *
 * Vive suelto porque lo usan las dos mecánicas: las pantallas declarativas a
 * través de `DeviceScreen`, y los escenarios escritos a mano que arman su
 * página con estas mismas clases.
 *
 * **La regla que manda sobre el resto**: la página falsa de un escenario lleva
 * exactamente lo mismo que la real. Un kit de phishing clona el sitio entero
 * —menú, aviso y pie incluidos—, y dejar la falsa desnuda enseñaría que se
 * reconoce por el acabado. No se reconoce por ahí: se reconoce por la
 * dirección.
 */

/** Todo decorativo: nada de esto responde al clic, como el botón de inicio de
 *  la barra de tareas. */
export function CabeceraSitio({ marca, menu }: { marca: ReactNode; menu: string[] }) {
  return (
    <div className={styles.sitioCabecera}>
      <p className={styles.brand}>{marca}</p>
      <nav className={styles.sitioMenu} aria-hidden>
        {menu.map((entrada) => (
          <span key={entrada}>{entrada}</span>
        ))}
      </nav>
    </div>
  )
}

/** La letra pequeña que un sitio pone bajo su formulario. En las páginas falsas
 *  hace además de coartada, que es exactamente su papel en las de verdad. */
export function AvisoSitio({ children }: { children: ReactNode }) {
  return <p className={styles.pageAviso}>{children}</p>
}

export function PieSitio({ texto, enlaces }: { texto?: ReactNode; enlaces?: string[] }) {
  if (!texto && !enlaces) return null

  return (
    <div className={styles.sitioPie}>
      {texto && <p className={styles.pageFooter}>{texto}</p>}
      {enlaces && (
        <p className={styles.sitioPieEnlaces} aria-hidden>
          {enlaces.map((entrada) => (
            <span key={entrada}>{entrada}</span>
          ))}
        </p>
      )}
    </div>
  )
}

/** El pie de siempre: aviso legal, contacto y ayuda. Se repite en casi todos
 *  los sitios simulados, reales y falsos, porque se repite en los de verdad. */
export const ENLACES_PIE = ['Aviso de privacidad', 'Términos de uso', 'Ayuda']
