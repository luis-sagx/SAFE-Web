import { useEffect } from 'react'
import { useLocation } from 'react-router'

export const SITE_TITLE = 'SAFE-Web · Aprende a reconocer fraudes digitales'

/// Rutas públicas que vale la pena indexar, con su título. El resto (panel,
/// escenarios, admin, recuperación de contraseña, verificación de un
/// certificado concreto) lleva noindex: detrás de login no hay nada que un
/// buscador deba mostrar, y un código de certificado no debe aparecer en
/// resultados de búsqueda. No se listan en robots.txt a propósito: ese
/// archivo es público y nombrar rutas privadas ahí solo le da el mapa a
/// quien lo lea.
const PUBLIC_TITLES: Record<string, string> = {
  '/': SITE_TITLE,
  '/login': 'Iniciar sesión · SAFE-Web',
  '/registro': 'Crear cuenta · SAFE-Web',
  '/politica-de-datos': 'Política de datos · SAFE-Web',
  '/terminos': 'Términos de uso · SAFE-Web',
}

function robotsMeta(): HTMLMetaElement {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'robots'
    document.head.append(meta)
  }
  return meta
}

/// Título de la pestaña y directiva para buscadores según la ruta. Google
/// ejecuta el JavaScript de la SPA, así que lee el noindex puesto aquí.
export default function PageMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = PUBLIC_TITLES[pathname]
    document.title = title ?? 'SAFE-Web'
    robotsMeta().content = title ? 'index, follow' : 'noindex, nofollow'
  }, [pathname])

  return null
}
