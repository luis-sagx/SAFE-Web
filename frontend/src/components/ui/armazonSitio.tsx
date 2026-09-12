import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

// La página falsa de un escenario lleva exactamente lo mismo que la real
// (menú, aviso, pie): un kit de phishing clona el sitio entero, y dejarla
// desnuda enseñaría que se reconoce por el acabado, no por la dirección.

// Todo decorativo: nada de esto responde al clic.
export function SiteHeader({ marca: brand, menu }: { marca: ReactNode; menu: string[] }) {
  return (
    <div className={styles.sitioCabecera}>
      <p className={styles.brand}>{brand}</p>
      <nav className={styles.sitioMenu} aria-hidden>
        {menu.map((entry) => (
          <span key={entry}>{entry}</span>
        ))}
      </nav>
    </div>
  )
}

// En las páginas falsas hace de coartada, igual que en las de verdad.
export function SiteNotice({ children }: { children: ReactNode }) {
  return <p className={styles.pageAviso}>{children}</p>
}

export function SiteFooter({ texto: text, enlaces: links }: { texto?: ReactNode; enlaces?: string[] }) {
  if (!text && !links) return null

  return (
    <div className={styles.sitioPie}>
      {text && <p className={styles.pageFooter}>{text}</p>}
      {links && (
        <p className={styles.sitioPieEnlaces} aria-hidden>
          {links.map((entry) => (
            <span key={entry}>{entry}</span>
          ))}
        </p>
      )}
    </div>
  )
}

// Se repite en casi todos los sitios simulados porque se repite en los reales.
export const FOOTER_LINKS = ['Aviso de privacidad', 'Términos de uso', 'Ayuda']
