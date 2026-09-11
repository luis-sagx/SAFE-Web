import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

// La página falsa de un escenario lleva exactamente lo mismo que la real
// (menú, aviso, pie): un kit de phishing clona el sitio entero, y dejarla
// desnuda enseñaría que se reconoce por el acabado, no por la dirección.

// Todo decorativo: nada de esto responde al clic.
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

// En las páginas falsas hace de coartada, igual que en las de verdad.
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

// Se repite en casi todos los sitios simulados porque se repite en los reales.
export const ENLACES_PIE = ['Aviso de privacidad', 'Términos de uso', 'Ayuda']
