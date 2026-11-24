import { ChevronRight, Globe, Landmark, Search, ShoppingBag } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './DeviceScreen.module.css'

// Pantalla de "Nueva pestaña" del navegador del teléfono. La usan tanto los
// escenarios donde elegir el sitio es la decisión (DeviceScreen) como el
// relleno de AppRelleno, para que el navegador se vea igual en todos lados.

export interface SitioFrecuente {
  texto: string
  detalle?: string
  goto?: string
  label?: string
}

// Todas las filas llevan icono: si solo una lo tuviera delataría cuál decide.
function SitioIcono({ texto }: { texto: string }): ReactNode {
  if (texto.startsWith('Buscar')) {
    return (
      <span className={`${styles.navSitioIcono} ${styles.navSitioBusqueda}`} aria-hidden>
        <Search className={styles.navSitioGlifo} strokeWidth={2.25} />
      </span>
    )
  }
  if (texto.startsWith('elcomercio')) {
    return (
      <span className={`${styles.navSitioIcono} ${styles.navSitioDiario}`} aria-hidden>
        EC
      </span>
    )
  }
  if (texto.startsWith('banco')) {
    return (
      <span className={`${styles.navSitioIcono} ${styles.navSitioBanco}`} aria-hidden>
        <Landmark className={styles.navSitioGlifo} strokeWidth={2} />
      </span>
    )
  }
  if (texto.includes('.gob.ec')) {
    return (
      <span className={`${styles.navSitioIcono} ${styles.navSitioGobierno}`} aria-hidden>
        <svg viewBox="0 0 24 24" className={styles.navSitioBandera}>
          <path d="M2 21 8 3h4L6 21z" fill="#f5b700" />
          <path d="M8 21 14 3h4l-6 18z" fill="#1d4ed8" />
          <path d="M14 21 20 3h4l-6 18z" fill="#dc2626" />
        </svg>
      </span>
    )
  }
  if (texto.startsWith('laganga')) {
    return (
      <span className={`${styles.navSitioIcono} ${styles.navSitioTienda}`} aria-hidden>
        <ShoppingBag className={styles.navSitioGlifo} strokeWidth={2} />
      </span>
    )
  }
  return (
    <span className={`${styles.navSitioIcono} ${styles.navSitioGenerico}`} aria-hidden>
      <Globe className={styles.navSitioGlifo} strokeWidth={2} />
    </span>
  )
}

export default function InicioNavegador({
  sitios,
  titulo = 'Nueva pestaña',
}: {
  sitios: SitioFrecuente[]
  titulo?: string
}) {
  return (
    <div className={styles.navInicio}>
      <h2 className={styles.navInicioTitulo}>{titulo}</h2>
      <div className={styles.navInicioBarra} aria-hidden>
        <Search className={styles.navInicioLupa} strokeWidth={2} />
        <span>Buscar o escribir dirección</span>
      </div>
      <p className={styles.navInicioSeccion}>Sitios frecuentes</p>
      <ul className={styles.navInicioLista}>
        {sitios.map((sitio) => (
          <li key={sitio.texto}>
            {/* Los sitios sin goto se pulsan igual (mismo realce) para no delatar el que decide. */}
            <button
              type="button"
              className={styles.navSitio}
              data-hotspot-goto={sitio.goto}
              data-hotspot-label={sitio.label}
              data-filler-option={sitio.goto ? undefined : ''}
            >
              <SitioIcono texto={sitio.texto} />
              <span className={styles.navSitioTextos}>
                <span className={styles.navSitioNombre}>{sitio.texto}</span>
                {sitio.detalle && <span className={styles.navSitioDetalle}>{sitio.detalle}</span>}
              </span>
              <ChevronRight aria-hidden className={styles.navSitioFlecha} strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
